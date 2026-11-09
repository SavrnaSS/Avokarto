export function isInternalHref(href: string | undefined | null): href is string {
  return typeof href === "string" && href.startsWith("/");
}

export function isPathActive(
  pathname: string | undefined | null,
  href: string | undefined | null,
): boolean {
  if (typeof pathname !== "string" || !isInternalHref(href)) return false;

  if (pathname === href) return true;
  if (href === "/") return pathname === "/";
  if (pathname.startsWith(`${href}/`)) return true;

  const getBasePath = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    return parts.length > 1 ? "/" + parts.slice(0, -1).join("/") : "/" + parts.join("/");
  };

  const pathnameBase = getBasePath(pathname);
  const hrefBase = getBasePath(href);

  if (pathnameBase === hrefBase && href.split("/").filter(Boolean).length > 1) {
    return true;
  }

  return false;
}

