import {
  saveAndApplyGymTheme,
  type GymTheme,
} from "./theme";

export interface PublicGym extends GymTheme {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  updatedAt?: string;
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
    throw new Error(
      "VITE_API_URL no está configurado"
    );
  }

  return apiUrl;
}

function getGymVersion(
  gym: PublicGym
): string {
  if (!gym.updatedAt) {
    return "6";
  }

  const timestamp = new Date(
    gym.updatedAt
  ).getTime();

  return Number.isNaN(timestamp)
    ? "6"
    : timestamp.toString();
}

function addCacheVersion(
  url: string,
  version: string
): string {
  const separator = url.includes("?")
    ? "&"
    : "?";

  return (
    `${url}${separator}` +
    `pwaVersion=${version}`
  );
}

function updateMetaThemeColor(
  color: string
) {
  let meta =
    document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";

    document.head.appendChild(meta);
  }

  meta.content = color;
}

function updateApplicationName(
  name: string
) {
  let applicationName =
    document.querySelector<HTMLMetaElement>(
      'meta[name="application-name"]'
    );

  if (!applicationName) {
    applicationName =
      document.createElement("meta");

    applicationName.name =
      "application-name";

    document.head.appendChild(
      applicationName
    );
  }

  applicationName.content = name;

  let appleTitle =
    document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );

  if (!appleTitle) {
    appleTitle =
      document.createElement("meta");

    appleTitle.name =
      "apple-mobile-web-app-title";

    document.head.appendChild(
      appleTitle
    );
  }

  appleTitle.content = name;
}

function updateManifest(
  slug: string,
  version: string
) {
  const apiUrl = getApiBaseUrl();

  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel="manifest"]'
    )
    .forEach((link) => {
      link.remove();
    });

  const manifestLink =
    document.createElement("link");

  manifestLink.id = "app-manifest";
  manifestLink.rel = "manifest";
  manifestLink.crossOrigin = "anonymous";

  manifestLink.href =
    `${apiUrl}/public/gyms/` +
    `${encodeURIComponent(slug)}` +
    `/manifest.webmanifest?v=${version}`;

  document.head.appendChild(
    manifestLink
  );
}

function updateAppIcons(
  logoUrl: string,
  version: string
) {
  const iconUrl = addCacheVersion(
    logoUrl,
    version
  );

  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel~="icon"]'
    )
    .forEach((link) => {
      link.remove();
    });

  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel="apple-touch-icon"]'
    )
    .forEach((link) => {
      link.remove();
    });

  const favicon =
    document.createElement("link");

  favicon.id = "app-favicon";
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = iconUrl;

  document.head.appendChild(favicon);

  /*
   * Principalmente utilizado por iPhone y iPad
   * al agregar la web a la pantalla de inicio.
   */
  const appleIcon =
    document.createElement("link");

  appleIcon.id = "apple-touch-icon";
  appleIcon.rel = "apple-touch-icon";
  appleIcon.href = iconUrl;

  document.head.appendChild(appleIcon);
}

export async function loadPublicGym(
  slug: string
): Promise<PublicGym> {
  const apiUrl = getApiBaseUrl();

  const normalizedSlug = slug
    .trim()
    .toLowerCase();

  const response = await fetch(
    `${apiUrl}/public/gyms/` +
      encodeURIComponent(normalizedSlug),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "El gimnasio no fue encontrado"
      );
    }

    throw new Error(
      "No se pudo obtener el gimnasio"
    );
  }

  const data =
    (await response.json()) as PublicGymResponse;

  return data.gym;
}

export async function configureGymPwa(
  slug: string
): Promise<PublicGym> {
  const gym = await loadPublicGym(slug);

  const version = getGymVersion(gym);

  saveAndApplyGymTheme(gym);

  localStorage.setItem(
    "gymSlug",
    gym.slug
  );

  document.title = gym.name;

  updateMetaThemeColor(
    gym.primaryColor || "#111111"
  );

  updateApplicationName(gym.name);

  updateManifest(
    gym.slug,
    version
  );

  if (gym.logoUrl) {
    updateAppIcons(
      gym.logoUrl,
      version
    );
  }

  return gym;
}

export function getGymSlugFromCurrentPath():
  | string
  | null {
  /*
   * Ejemplo:
   * /gym/gym-shark
   */
  const routeMatch =
    window.location.pathname.match(
      /^\/gym\/([^/]+)(?:\/|$)/
    );

  if (routeMatch) {
    try {
      return decodeURIComponent(
        routeMatch[1]
      )
        .trim()
        .toLowerCase();
    } catch {
      return routeMatch[1]
        .trim()
        .toLowerCase();
    }
  }

  /*
   * Ejemplo:
   * /my-routine?gym=gym-shark
   */
  const querySlug =
    new URLSearchParams(
      window.location.search
    ).get("gym");

  if (querySlug) {
    return querySlug
      .trim()
      .toLowerCase();
  }

  /*
   * Se utiliza cuando el alumno ya inició sesión
   * y navega por la aplicación.
   */
  const storedSlug =
    localStorage.getItem("gymSlug");

  if (!storedSlug) {
    return null;
  }

  return storedSlug
    .trim()
    .toLowerCase();
}

export async function configureGymPwaFromCurrentPath() {
  const slug =
    getGymSlugFromCurrentPath();

  if (!slug) {
    return null;
  }

  return configureGymPwa(slug);
} 