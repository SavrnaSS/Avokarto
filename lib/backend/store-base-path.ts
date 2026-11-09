import { headers } from "next/headers";
import { STORE_DOMAIN_HEADER } from "@/lib/storeDomainHeader";

/**
 * Where a store's pages live for the current request: "" on its own custom
 * domain (shop.brand.com/<product>), "/store/<handle>" on Avokarto.
 */
export async function storeBasePath(handle: string) {
	const domainHandle = (await headers()).get(STORE_DOMAIN_HEADER);
	return domainHandle === handle ? "" : `/store/${handle}`;
}
