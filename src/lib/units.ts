export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function displayWeight(
  kg: number,
  units: 'kg' | 'lb',
  digits = 1,
): string {
  const value = units === 'kg' ? kg : kgToLb(kg);
  if (!Number.isFinite(value)) return '';
  return value.toFixed(digits).replace(/\.0$/, '');
}

export function parseWeightToKg(input: string, units: 'kg' | 'lb'): number {
  const v = parseFloat(input);
  if (!Number.isFinite(v)) return 0;
  return units === 'kg' ? v : lbToKg(v);
}
