import Wishlist from "@/components/store/Wishlist";
import Breadcrumb from "@/components/common/other-components/Breadcrumb";

import type { Metadata } from "next";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Upper bound on ids read from a shared link (keeps URLs and lookups sane).
const MAX_SHARED_ITEMS = 60;

type SearchParams = Promise<{ items?: string | string[] }>;

function parseSharedIds(items: string | string[] | undefined) {
  const raw = Array.isArray(items) ? items.join(",") : (items ?? "");
  return [
    ...new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => UUID_PATTERN.test(id)),
    ),
  ].slice(0, MAX_SHARED_ITEMS);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const shared = parseSharedIds((await searchParams).items).length > 0;

  return shared
    ? {
        title: "Shared Wishlist",
        description: "A wishlist of pet costumes, gear, and seasonal finds shared with you.",
        // Personal lists shouldn't end up in search results.
        robots: { index: false, follow: true },
      }
    : {
        title: "Wishlist",
        description:
          "Your saved pet costumes, gear, and seasonal finds, with live prices and stock.",
        robots: { index: false, follow: true },
      };
}

export default async function page({ searchParams }: { searchParams: SearchParams }) {
  const sharedIds = parseSharedIds((await searchParams).items);

  return (
    <>
      <Breadcrumb
        title={sharedIds.length ? "Shared Wishlist" : "Wishlist"}
        subtitle="Products"
      />
      <Wishlist sharedIds={sharedIds.length ? sharedIds : undefined} />
    </>
  );
}
