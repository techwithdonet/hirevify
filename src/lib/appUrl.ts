const DEPLOYED_APP_URL = "https://hirevify.vercel.app";

export function getPasswordResetRedirectUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (!isLocalhost) {
      return origin;
    }
  }

  return DEPLOYED_APP_URL;
}
