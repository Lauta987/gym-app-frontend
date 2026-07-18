import {
  saveAndApplyGymTheme,
  type GymTheme,
} from "./theme";

export interface PublicGym extends GymTheme {
  _id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
}

interface PublicGymResponse {
  message: string;
  gym: PublicGym;
}

function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL
    ?.trim()
    .replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("VITE_API_URL no está configurado");
  }

  return apiUrl;
}

function updateMetaThemeColor(color: string) {
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }

  meta.content = color;
}

function updateManifest(slug: string) {
  const apiUrl = getApiBaseUrl();

  let manifestLink =
    document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]'
    );

  if (!manifestLink) {
    manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    document.head.appendChild(manifestLink);
  }

  manifestLink.id = "app-manifest";
  manifestLink.crossOrigin = "anonymous";
  manifestLink.href =
    `${apiUrl}/public/gyms/${encodeURIComponent(slug)}` +
    "/manifest.webmanifest";
}

function updateAppIcons(gym: PublicGym) {
  if (!gym.logoUrl) return;

  let appleIcon =
    document.querySelector<HTMLLinkElement>(
      'link[rel="apple-touch-icon"]'
    );

  if (!appleIcon) {
    appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    document.head.appendChild(appleIcon);
  }

  appleIcon.href = gym.logoUrl;

  let favicon =
    document.querySelector<HTMLLinkElement>(
      'link[rel~="icon"]'
    );

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.href = gym.logoUrl;
}

export async function loadPublicGym(
  slug: string
): Promise<PublicGym> {
  const apiUrl = getApiBaseUrl();
  const normalizedSlug = slug.trim().toLowerCase();

  const response = await fetch(
    `${apiUrl}/public/gyms/${encodeURIComponent(normalizedSlug)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo obtener el gimnasio");
  }

  const data = (await response.json()) as PublicGymResponse;

  return data.gym;
}

export async function configureGymPwa(
  slug: string
): Promise<PublicGym> {
  const gym = await loadPublicGym(slug);

  saveAndApplyGymTheme(gym);

  localStorage.setItem("gymSlug", gym.slug);

  document.title = gym.name;

  updateMetaThemeColor(gym.primaryColor);
  updateManifest(gym.slug);
  updateAppIcons(gym);

  return gym;
}

export function getGymSlugFromCurrentPath(): string | null {
  const match = window.location.pathname.match(
    /^\/gym\/([^/]+)\/?$/
  );

  return match ? decodeURIComponent(match[1]) : null;
}

export async function configureGymPwaFromCurrentPath() {
  const slug = getGymSlugFromCurrentPath();

  if (!slug) {
    return null;
  }

  return configureGymPwa(slug);
} 