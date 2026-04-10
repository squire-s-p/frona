"use client";

import { User } from "lucide-react";
import ClientCard from "./client-card";

type ClientRow = {
  id: string;
  name: string;
  activeProjects: number;
  totalProjects: number;
  createdAt: Date;
};

export default function ClientsGrid({ clients }: { clients: ClientRow[] }) {
  if (!clients.length) {
    return (
      <div className="rounded-2xl border bg-card/50 p-12 text-center backdrop-blur-sm shadow-sm flex-1 flex flex-col items-center justify-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20 rotate-3">
          <User className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Клієнтів не знайдено</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-[240px] mx-auto leading-relaxed">
          Спробуйте за іншим запитом або створіть нового клієнта.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 scrollbar-hide">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-1">
        {clients.map((c) => (
          <ClientCard
            key={c.id}
            id={c.id}
            name={c.name}
            activeProjects={c.activeProjects}
            totalProjects={c.totalProjects}
            createdAt={c.createdAt}
          />
        ))}
      </div>
    </div>
  );
}
