/**
 * Set by proxy.ts on requests that arrived through a store's custom domain
 * (value: the store handle), so pages build links without the /store/<handle>
 * prefix. Stripped from every other request.
 */
export const STORE_DOMAIN_HEADER = "x-avokarto-store-domain";
