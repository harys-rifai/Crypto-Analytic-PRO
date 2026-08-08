import { useState } from "react";
import { Building2, Coins, TrendingUp, Circle } from "lucide-react";

interface AssetImageProps {
  src?: string | null;
  alt: string;
  symbol?: string;
  type?: "stock" | "gold" | "fund" | "crypto";
  className?: string;
}

export function AssetImage({
  src,
  alt,
  symbol,
  type = "stock",
  className = "w-8 h-8 rounded-full object-cover",
}: AssetImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    const Icon = type === "gold" ? Coins : type === "fund" ? TrendingUp : type === "crypto" ? Circle : Building2;
    const fallbackClass = className.includes("w-full") ? className.replace("object-cover", "") : className.replace("object-cover", "");
    return (
      <div className={`${fallbackClass} bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
