// Small RFC 4180 CSV reader: quoted fields, doubled quotes, newlines inside quotes, CRLF.
// parseCsv(text) -> array of rows (arrays of strings). Each row also has .line (1-based start line).
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false, line = 1, rowLine = 1, i = 0;
  const s = text.replace(/^﻿/, '');
  const endField = () => { row.push(field); field = ''; };
  const endRow = () => { endField(); row.line = rowLine; if (!(row.length === 1 && row[0] === '')) rows.push(row); row = []; };
  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      if (c === '\n') line++;
      field += c; i++; continue;
    }
    if (c === '"' && field === '') { quoted = true; i++; continue; }
    if (c === ',') { endField(); i++; continue; }
    if (c === '\r' && s[i + 1] === '\n') { i++; continue; }
    if (c === '\n') { endRow(); line++; rowLine = line; i++; continue; }
    field += c; i++;
  }
  if (quoted) throw new Error(`unclosed quote in the row starting on line ${rowLine}`);
  if (field !== '' || row.length) endRow();
  return rows;
}

// Rows as objects keyed by the header row (header names trimmed and lower-cased).
export function csvRecords(text) {
  const [head, ...rows] = parseCsv(text);
  if (!head) return { header: [], records: [] };
  const header = head.map((h) => h.trim().toLowerCase());
  return { header, records: rows.map((r, n) => ({ row: n + 1, line: r.line, values: Object.fromEntries(header.map((h, k) => [h, r[k] ?? ''])) })) };
}

// Column names test-management exports use (CSV from spreadsheets, TestRail, Xray, Zephyr and others).
export const COLUMN_NAMES = {
  id: ['id', 'case id', 'test id', 'test case id', 'tc id', 'key', 'case', 'issue key', 'test key'],
  title: ['title', 'summary', 'name', 'test case', 'test name', 'case title'],
  step: ['step', 'steps', 'action', 'step action', 'test step', 'step description', 'steps (step)'],
  expected: ['expected', 'expected result', 'expected results', 'step expected result', 'expected outcome', 'steps (expected result)'],
  preconditions: ['preconditions', 'precondition', 'pre-conditions', 'prerequisites'],
  area: ['area', 'section', 'component', 'components', 'module', 'feature', 'folder'],
  priority: ['priority'],
};

// Which header holds each kind of column (first match by the list order above), or null.
export function mapColumns(header) {
  const out = {};
  for (const [k, names] of Object.entries(COLUMN_NAMES)) out[k] = names.find((n) => header.includes(n)) ?? null;
  return out;
}
