export interface GymTheme {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const DEFAULT_PRIMARY_COLOR = "#dc2626";
const DEFAULT_SECONDARY_COLOR = "#111111";

function isValidHexColor(color?: string): color is string {
  if (!color) return false;

  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function applyGymTheme(gym?: GymTheme | null) {
  const primaryColor = isValidHexColor(gym?.primaryColor)
    ? gym.primaryColor
    : DEFAULT_PRIMARY_COLOR;

  const secondaryColor = isValidHexColor(gym?.secondaryColor)
    ? gym.secondaryColor
    : DEFAULT_SECONDARY_COLOR;

  document.documentElement.style.setProperty(
    "--gym-primary",
    primaryColor
  );

  document.documentElement.style.setProperty(
    "--gym-secondary",
    secondaryColor
  );
}

export function saveAndApplyGymTheme(gym?: GymTheme | null) {
  if (!gym) {
    localStorage.removeItem("gym");
    applyGymTheme(null);
    return;
  }

  localStorage.setItem("gym", JSON.stringify(gym));
  applyGymTheme(gym);
}

export function loadStoredGymTheme() {
  const gymStorage = localStorage.getItem("gym");

  if (!gymStorage) {
    applyGymTheme(null);
    return;
  }

  try {
    const gym = JSON.parse(gymStorage) as GymTheme;
    applyGymTheme(gym);
  } catch {
    localStorage.removeItem("gym");
    applyGymTheme(null);
  }
}

export function clearGymTheme() {
  localStorage.removeItem("gym");
  applyGymTheme(null);
} 