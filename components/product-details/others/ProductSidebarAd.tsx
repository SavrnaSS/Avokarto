"use client";

import Image from "next/image";
import Link from "next/link";
import { useAdvertisement } from "@/hooks/use-advertisement";

/**
 * Replaces the old hardcoded "single-prd-banner-a-01.webp" stock ad image
 * that used to render unconditionally on every product page. This renders
 * nothing until an admin actually adds a banner in /admin/advertisements,
 * and updates live (no refresh) as banners are added, edited, or turned off.
 */
export default function ProductSidebarAd() {
  const { advertisement } = useAdvertisement();

  if (!advertisement) {
    return null;
  }

  const image = (
    <Image
      alt={advertisement.title}
      className="w-100"
      src={advertisement.imageUrl}
      width={1696}
      height={727}
    />
  );

  return (
    <div className="rbt-block-banner-img mt--32">
      {advertisement.linkUrl ? (
        <Link href={advertisement.linkUrl}>{image}</Link>
      ) : (
        image
      )}
    </div>
  );
}
