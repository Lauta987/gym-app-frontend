function normalizeExerciseNumber(
  value: number | string
): string {
  const normalized = String(value)
    .replace(/[^0-9A-Za-z]/g, "")
    .slice(0, 3);

  return normalized || "1";
}

/**
 * Genera una imagen SVG con el número del ejercicio.
 *
 * El SVG tiene fondo transparente porque el color del recuadro
 * se controla desde CSS con --gym-secondary.
 */
export function createExerciseNumberImage(
  value: number | string
): string {
  const number = normalizeExerciseNumber(value);

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="100"
      height="100"
    >
      <text
        x="50"
        y="53"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#ffffff"
        font-family="Georgia, Times New Roman, serif"
        font-size="58"
        font-weight="700"
      >
        ${number}
      </text>
    </svg>
  `;

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg)
  );
}

/**
 * Sustituye una imagen que no pudo cargarse por la imagen
 * numérica correspondiente.
 */
export function replaceWithExerciseNumberImage(
  image: HTMLImageElement,
  value: number | string
): void {
  if (image.dataset.numberFallback === "true") {
    return;
  }

  image.dataset.numberFallback = "true";
  image.classList.add("is-number-placeholder");
  image.src = createExerciseNumberImage(value);
}  