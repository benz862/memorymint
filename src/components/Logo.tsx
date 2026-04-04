import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /** Height in px. Width scales automatically from intrinsic aspect ratio. Default: 85 */
  height?: number;
  /** Wrap in a link to homepage. Default: true */
  linked?: boolean;
  className?: string;
}

export default function Logo({ height = 85, linked = true, className }: LogoProps) {
  const img = (
    // Use width=0 height=0 + CSS to let Next.js auto-size to the intrinsic
    // aspect ratio while fixing only the display height.
    <Image
      src="/MemoryMint_Logo.png"
      alt="MemoryMint"
      width={0}
      height={0}
      sizes="300px"
      priority
      className={className}
      style={{
        height: `${height}px`,
        width: "auto",
        display: "block",
        objectFit: "contain",
      }}
    />
  );

  return linked ? (
    <Link href="/" aria-label="MemoryMint — Home" style={{ display: "inline-flex", alignItems: "center" }}>
      {img}
    </Link>
  ) : img;
}
