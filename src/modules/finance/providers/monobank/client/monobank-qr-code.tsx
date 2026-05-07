"use client";

import React from "react";
import Image from "next/image";

interface MonobankQRCodeProps {
  qrDataUrl: string;
  deeplink: string;
  className?: string;
}

export function MonobankQRCode({ qrDataUrl, deeplink, className }: MonobankQRCodeProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deeplink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may not be available
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-center">
        <Image
          src={qrDataUrl}
          alt="Monobank QR код авторизації"
          width={224}
          height={224}
          className="rounded-xl"
          unoptimized
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={deeplink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Відкрити в додатку Monobank
        </a>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {copied ? "Скопійовано!" : "Копіювати посилання"}
        </button>
      </div>
    </div>
  );
}
