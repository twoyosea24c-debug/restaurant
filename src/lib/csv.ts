export function csvEscape(value: unknown) {
  const text = value instanceof Date ? value.toLocaleString("ja-JP") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows: unknown[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
}
