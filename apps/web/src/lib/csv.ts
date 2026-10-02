/** Build and download a CSV in the browser. Values are quoted safely. */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number | null>>): void {
  const esc = (v: string | number | null) => {
    if (v === null) return '';
    const s = String(v);
    // Neutralise spreadsheet formula injection (=, +, -, @ at start).
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
