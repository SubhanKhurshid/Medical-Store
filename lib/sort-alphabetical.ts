/**
 * Case-insensitive string compare for stable alphabetical UI lists.
 */
export function compareLocaleStr(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const sa = (a ?? "").trim();
  const sb = (b ?? "").trim();
  return sa.localeCompare(sb, undefined, { sensitivity: "base", numeric: true });
}

/** Shallow copy sorted by string key from each row. */
export function sortByLocaleKey<T>(
  items: readonly T[],
  getLabel: (item: T) => string | null | undefined,
): T[] {
  return [...items].sort((x, y) => compareLocaleStr(getLabel(x), getLabel(y)));
}
