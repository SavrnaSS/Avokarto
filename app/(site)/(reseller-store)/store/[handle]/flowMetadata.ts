import type { Metadata } from "next";
import { getPublicStoreBranding } from "@/lib/backend/resellers";
import { pageMetadata } from "@/lib/seo";

/** Cart / checkout / confirmation pages: titled with the store's name, never indexed. */
export async function storeFlowMetadata(handle: string, title: string, description: string): Promise<Metadata> {
  const store = await getPublicStoreBranding(handle);
  return {
    ...pageMetadata({ title, description, noindex: true }),
    title: { absolute: store ? `${title} | ${store.name}` : title },
  };
}
