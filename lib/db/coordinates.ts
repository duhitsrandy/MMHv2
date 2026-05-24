export function coerceCoordinate(value: number | string): string {
  return String(value);
}

export function parseCoordinate(value: string): number {
  return Number(value);
}
