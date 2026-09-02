/** Myanmar Kyat only — whole kyat, no decimals. */
export function formatMmk(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
  return `${amount} Ks`;
}
