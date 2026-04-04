export type UiCsp = {
  resourceDomains?: string[];
  connectDomains?: string[];
  frameDomains?: string[];
  baseUriDomains?: string[];
};

export const defaultCsp = () =>
  "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' data:; connect-src 'none';";

const formatDomains = (domains: string[] | undefined) =>
  domains && domains.length > 0 ? ` ${domains.join(" ")}` : "";

export const buildCspHeader = (csp?: UiCsp) => {
  if (!csp) return defaultCsp();
  return [
    "default-src 'none'",
    `script-src 'self' 'unsafe-inline'${formatDomains(csp.resourceDomains)}`,
    `style-src 'self' 'unsafe-inline'${formatDomains(csp.resourceDomains)}`,
    `font-src 'self'${formatDomains(csp.resourceDomains)}`,
    `img-src 'self' data:${formatDomains(csp.resourceDomains)}`,
    `media-src 'self' data:${formatDomains(csp.resourceDomains)}`,
    `connect-src 'self'${formatDomains(csp.connectDomains)}`,
    `frame-src${formatDomains(csp.frameDomains) || " 'none'"}`,
    `base-uri${formatDomains(csp.baseUriDomains) || " 'self'"}`,
  ].join("; ");
};
