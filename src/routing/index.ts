export function tenantFromHostname(hostname: string, rootDomain: string): string | undefined {
  const cleanHost = hostname.toLowerCase().replace(/^www\./, "");
  const cleanRoot = rootDomain.toLowerCase().replace(/^www\./, "");
  if (!cleanHost.endsWith(cleanRoot)) return undefined;
  const sub = cleanHost.slice(0, cleanHost.length - cleanRoot.length).replace(/\.$/, "");
  if (!sub || sub === "app" || sub === "api") return undefined;
  return sub;
}

export function buildAppUrl(input: { appDomain: string; tenantSlug?: string; path?: string; protocol?: "http" | "https" }) {
  const protocol = input.protocol ?? "https";
  const host = input.tenantSlug ? `${input.tenantSlug}.${input.appDomain}` : input.appDomain;
  const path = input.path?.startsWith("/") ? input.path : `/${input.path ?? ""}`;
  return `${protocol}://${host}${path}`;
}
