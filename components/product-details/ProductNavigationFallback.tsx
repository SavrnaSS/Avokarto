"use client";

import { useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import BreadCrumb from "@/components/product-details/BreadCrumb";
import DetailsFashion from "@/components/product-details/details/DetailsFashion";
import DataBoundary from "@/components/common/loading/DataBoundary";
import { PageLoading } from "@/components/common/loading/LoadingSkeleton";
import {
  getPendingProductRouteId,
  getPrimedProduct,
  subscribeProductNavigationCache,
} from "@/lib/productNavigation";
import type { Product } from "@/types";

const ProductNavigationFallbackDeferred = dynamic(
  () => import("./ProductNavigationFallbackDeferred"),
  { ssr: false },
);

export default function ProductNavigationFallback({
  routeId,
  staticProduct,
  complete = false,
  unavailable = false,
}: {
  routeId?: string;
  staticProduct?: Product;
  complete?: boolean;
  unavailable?: boolean;
}) {
  const getSnapshot = useCallback(() => {
    const targetRouteId = routeId ?? getPendingProductRouteId();
    return targetRouteId ? getPrimedProduct(targetRouteId) : null;
  }, [routeId]);
  const primedProduct = useSyncExternalStore(
    subscribeProductNavigationCache,
    getSnapshot,
    () => null,
  );
  const product = primedProduct ?? staticProduct;

  if (!product && unavailable) {
    return (
      <DataBoundary
        loading={false}
        error="Unable to load this product."
        ready={false}
        onRetry={() => window.location.reload()}
        layout="detail"
        label="Loading product"
      >
        {null}
      </DataBoundary>
    );
  }

  if (!product) return <PageLoading detail />;

  return (
    <>
      <BreadCrumb
        product={product}
        products={[product]}
        detailsPageUrl="/product"
      />
      <DetailsFashion product={product} />
      {complete ? (
        <ProductNavigationFallbackDeferred product={product} />
      ) : null}
    </>
  );
}
