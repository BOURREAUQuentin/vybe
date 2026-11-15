// Comparaison de textes saisis (fonctions pures).

/** Minuscules sans accents, pour comparer une saisie à un nom (« beyonce » ↔ « Beyoncé »). */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Vrai si chaque mot de la saisie se trouve dans le nom, sans tenir compte des accents, de la
 * casse ni des tirets (« saint etienne » trouve « Saint-Étienne »).
 */
export function matchesQuery(name: string, query: string): boolean {
  const words = normalizeText(query).split(/[^a-z0-9]+/).filter(Boolean);
  const target = normalizeText(name).replace(/[^a-z0-9]+/g, ' ');
  return words.every((word) => target.includes(word));
}
