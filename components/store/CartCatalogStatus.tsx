"use client";

import Link from "next/link";
import { useHydratedStore } from "@/context/store";
import { useCartCatalog } from "./CartCatalogProvider";

export default function CartCatalogStatus() {
  const hasItems = useHydratedStore((state) => state.cartProducts.length > 0, false);
  const { loading, error, issues, refresh } = useCartCatalog();
  if (!hasItems) return null;
  if (error) return (
    <div role="alert" className="mb--16 rounded-2 bg-warning-subtle p-3">
      <p className="mb--8">We couldn’t verify the latest prices and availability.</p>
      <button type="button" className="btn btn-outline-dark" onClick={() => void refresh()}>Try again</button>
    </div>
  );
  if (loading) return <p role="status" className="mb--12">Checking prices and availability…</p>;
  if (!issues.length) return null;
  return (
    <div role="alert" className="mb--16 rounded-2 bg-warning-subtle p-3">
      {issues.map((issue) => <p className="mb--8" key={issue}>{issue}</p>)}
      <Link href="/cart">Review cart</Link>
    </div>
  );
}
