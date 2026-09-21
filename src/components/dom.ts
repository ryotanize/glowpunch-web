/** Elements are required by the tool template; fail early on template regressions. */
export function requiredElement<T extends HTMLElement>(id: string, type: { new (...args: never[]): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Required element missing or invalid: ${id}`);
  return element;
}

export function canvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable in this browser.');
  return context;
}
