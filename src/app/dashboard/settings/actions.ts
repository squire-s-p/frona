"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { put, del } from "@vercel/blob";

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Ви не авторизовані" };

    const name = formData.get("name") as string;
    if (!name || name.trim().length < 2) {
      return { error: "Ім'я занадто коротке" };
    }

    const targetHourlyRate = Number(formData.get("targetHourlyRate") || 0);
    
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          name: name.trim(),
          targetHourlyRate: targetHourlyRate
        },
      });
    } catch (dbError) {
      console.warn("Could not update targetHourlyRate, updating only name:", dbError);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          name: name.trim()
        },
      });
    }

    revalidatePath("/dashboard", "layout");
    return { success: "Профіль оновлено успішно!" };
  } catch (error) {
    console.error("Settings error:", error);
    return { error: "Сталася помилка при збереженні" };
  }
}

export async function uploadAvatarAction(formData: FormData) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Ви не авторизовані" };

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) {
      return { error: "Файл не вибрано" };
    }

    if (!file.type.startsWith("image/")) {
      return { error: "Файл повинен бути зображенням" };
    }
    
    // Max 5 MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { error: "Файл занадто великий (макс. 5 МБ)" };
    }

    // Delete old avatar if it was on Vercel Blob
    const oldUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });
    if (oldUser?.image?.includes("public.blob.vercel-storage.com")) {
      try {
        await del(oldUser.image);
      } catch (e) {
        console.warn("Could not delete old blob:", e);
      }
    }

    const filename = `avatars/${session.user.id}-${Date.now()}${path.extname(file.name) || ".jpg"}`;
    const blob = await put(filename, file, { 
      access: 'public',
      addRandomSuffix: true 
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Фото оновлено успішно!", url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Помилка при завантаженні фото" };
  }
}

export async function deleteAvatarAction() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Ви не авторизовані" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    if (user?.image?.includes("public.blob.vercel-storage.com")) {
      try {
        await del(user.image);
      } catch (e) {
        console.warn("Could not delete blob:", e);
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    revalidatePath("/dashboard", "layout");
    return { success: "Фото успішно видалено!" };
  } catch (error) {
    console.error("Delete avatar error:", error);
    return { error: "Помилка при видаленні фото" };
  }
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Ви не авторизовані" };

    const currentPassword = formData.get("currentPassword") as string | null;
    const newPassword = formData.get("newPassword") as string;

    if (!newPassword) return { error: "Введіть новий пароль" };
    if (newPassword.length < 6) return { error: "Новий пароль має містити щонайменше 6 символів" };

    const pass = await prisma.userPassword.findUnique({
      where: { userId: session.user.id },
    });

    // Якщо пароля немає (значить це Google-вхід) — просто створюємо його без перевірки старого
    if (!pass) {
      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.userPassword.create({
        data: {
          userId: session.user.id,
          passwordHash: newHash,
        }
      });
      return { success: "Пароль успішно створено!" };
    }

    // Якщо пароль вже є, обов'язково перевіряємо старий
    if (!currentPassword) return { error: "Введіть поточний пароль" };

    const isValid = await bcrypt.compare(currentPassword, pass.passwordHash);
    if (!isValid) return { error: "Поточний пароль невірний." };

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.userPassword.update({
      where: { userId: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: "Пароль успішно змінено!" };
  } catch (error) {
    console.error("Password update error:", error);
    return { error: "Сталася помилка при зміні пароля." };
  }
}

export async function exportDataAction() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    // Fetch all related entities for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: true,
        clients: true,
        tasks: true,
        transactions: true,
        financeAccounts: true,
      }
    });

    return { success: true, data: user };
  } catch (error) {
    console.error(error);
    return { error: "Не вдалося отримати дані" };
  }
}

export async function hardResetDataAction() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    const userId = session.user.id;

    // Deleting child records using Prisma relations
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.task.deleteMany({ where: { userId } }),
      prisma.project.deleteMany({ where: { userId } }),
      prisma.client.deleteMany({ where: { userId } }),
      prisma.financeAccount.deleteMany({ where: { userId } }),
      // Bank references
      prisma.bankAccount.deleteMany({ where: { userId } }),
    ]);

    revalidatePath("/dashboard");
    return { success: "Всі дані успішно очищено (Hard Reset)" };
  } catch (error) {
    console.error(error);
    return { error: "Помилка під час очищення даних" };
  }
}

export async function deleteAccountAction() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    // First, complete wipe
    await hardResetDataAction();

    // Then delete accounts, passwords, and finally the user
    const userId = session.user.id;
    await prisma.$transaction([
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.userPassword.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    
  } catch (error) {
    console.error(error);
    return { error: "Помилка при видаленні акаунта" };
  }

    // Next.js redirect must be outside try/catch if it's caught
  // Auth signout is usually done client-side, but destroying the db user invalidates the session
  redirect("/");
}

export async function disconnectGoogleAction() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    await prisma.account.deleteMany({
      where: { userId: session.user.id, provider: "google" },
    });
    
    revalidatePath("/dashboard/settings");
    return { success: "Інтеграцію з Google успішно відключено." };
  } catch (error) {
    console.error(error);
    return { error: "Помилка при відключенні Google акаунта" };
  }
}

export async function revokeDeviceSessionAction(sessionId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    await prisma.deviceSession.deleteMany({
      where: {
        id: sessionId,
        userId: session.user.id
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: "Сесію успішно завершено." };
  } catch(error) {
    console.error(error);
    return { error: "Не вдалося завершити сесію." };
  }
}

export async function revokeAllOtherDeviceSessionsAction(currentSessionId: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { error: "Unauthorized" };
    
    await prisma.deviceSession.deleteMany({
      where: {
        userId: session.user.id,
        id: { not: currentSessionId }
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: "Всі інші сесії успішно завершено." };
  } catch(error) {
    console.error(error);
    return { error: "Не вдалося завершити сесії." };
  }
}
