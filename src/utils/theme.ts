export interface GymTheme {
  _id?: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "gymTheme";

const DEFAULT_PRIMARY_COLOR = "#dc2626";
const DEFAULT_SECONDARY_COLOR = "#111111";
const DEFAULT_BACKGROUND_COLOR = "#f5efe5";

function isValidHexColor(
  color?: string
): color is string {
  if (!color) {
    return false;
  }

  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function setBackgroundColor(
  backgroundColor: string
) {
  document.documentElement.style.backgroundColor =
    backgroundColor;

  document.body.style.backgroundColor =
    backgroundColor;

  const root =
    document.getElementById("root");

  if (root) {
    root.style.backgroundColor =
      backgroundColor;
  }
}

export function applyGymTheme(
  gym?: GymTheme | null
) {
  const primaryColor = isValidHexColor(
    gym?.primaryColor
  )
    ? gym.primaryColor
    : DEFAULT_PRIMARY_COLOR;

  const secondaryColor = isValidHexColor(
    gym?.secondaryColor
  )
    ? gym.secondaryColor
    : DEFAULT_SECONDARY_COLOR;

  const backgroundColor = isValidHexColor(
    gym?.backgroundColor
  )
    ? gym.backgroundColor
    : DEFAULT_BACKGROUND_COLOR;

  document.documentElement.style.setProperty(
    "--gym-primary",
    primaryColor
  );

  document.documentElement.style.setProperty(
    "--gym-secondary",
    secondaryColor
  );

  document.documentElement.style.setProperty(
    "--gym-background",
    backgroundColor
  );

  setBackgroundColor(backgroundColor);
}

export function saveAndApplyGymTheme(
  gym?: GymTheme | null
) {
  if (!gym) {
    clearGymTheme();
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(gym)
  );

  applyGymTheme(gym);
}

export function loadStoredGymTheme() {
  const storedTheme =
    localStorage.getItem(STORAGE_KEY);

  if (!storedTheme) {
    applyGymTheme(null);
    return;
  }

  try {
    const gym =
      JSON.parse(storedTheme) as GymTheme;

    applyGymTheme(gym);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    applyGymTheme(null);
  }
}

export function getStoredGymTheme():
  | GymTheme
  | null {
  const storedTheme =
    localStorage.getItem(STORAGE_KEY);

  if (!storedTheme) {
    return null;
  }

  try {
    return JSON.parse(
      storedTheme
    ) as GymTheme;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearGymTheme() {
  localStorage.removeItem(STORAGE_KEY);
  applyGymTheme(null);
} 