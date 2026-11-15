export function parseReceiptTotal(value: string): number | null {
  const input = value.trim();
  if (!input) return null;
  if (!/^\d{1,9}([.,]\d{1,2})?$/.test(input)) {
    throw new Error("Inserisci un importo valido, ad esempio 64,80");
  }
  const [euros, decimals = ""] = input.replace(",", ".").split(".");
  return Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
}

export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);

export function monthlyTotal(receipts: Array<{ archived_at: string; total_cents: number | null }>, now = new Date()) {
  return receipts.reduce((sum, receipt) => {
    const date = new Date(receipt.archived_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
      ? sum + (receipt.total_cents ?? 0) : sum;
  }, 0);
}