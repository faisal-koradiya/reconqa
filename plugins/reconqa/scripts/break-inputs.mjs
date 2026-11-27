#!/usr/bin/env node
// Extreme mode input catalogue: odd, long and wrong values a robust form or API must survive.
//   node break-inputs.mjs [--project <dir>]   prints the catalogue as JSON
// Fixed list on purpose: the model uses only these (plus the atlas limits ±1), never invents its
// own attack strings. Values use the test-data prefix where a name is expected.
import { load } from './lib/kit.mjs';

export function catalogue(prefix = 'reconqa') {
  return {
    note: 'Use one value per attempt. Long values: type or send the repeat as written. On Android only plain ASCII can be typed.',
    text: [
      { id: 'empty', value: '' }, { id: 'spaces', value: '   ' }, { id: 'padded', value: `  ${prefix} padded  ` },
      { id: 'long-256', value: 'x'.repeat(256), repeat: 'x × 256' }, { id: 'long-5000', value: null, repeat: 'x × 5000' },
      { id: 'apostrophe', value: `${prefix} O'Brien` }, { id: 'quotes', value: `${prefix} "quoted"` },
      { id: 'html', value: `${prefix} <b>bold</b>` }, { id: 'script-tag', value: `${prefix} <script>alert(1)</script>`, why: 'is it shown as text, not run?' },
      { id: 'sql-like', value: `${prefix}' OR '1'='1`, why: 'is it stored as text, without a server error?' },
      { id: 'percent', value: `${prefix} 100% %s %n` }, { id: 'backslash', value: `${prefix} a\\b` }, { id: 'path', value: '../../etc' },
      { id: 'null-word', value: 'null' }, { id: 'undefined-word', value: 'undefined' },
      { id: 'emoji', value: `${prefix} 😀👍`, nonAscii: true }, { id: 'accents', value: `${prefix} Zoë Ångström`, nonAscii: true },
      { id: 'right-to-left', value: `${prefix} مرحبا`, nonAscii: true }, { id: 'chinese', value: `${prefix} 测试`, nonAscii: true },
      { id: 'zero-width', value: `${prefix}​`, nonAscii: true, why: 'looks empty-ish: is it treated as filled?' },
      { id: 'newline', value: `${prefix}\nsecond line`, nonAscii: true },
    ],
    number: ['0', '-1', '-0', '0.1', '1.005', '1e3', '1e309', '99999999999999999999', 'NaN', 'Infinity', '1,000', ' 5 ', '٣'].map((value) => ({ value })),
    email: [`${prefix}@example.test`, `${prefix}+tag@example.test`, `${prefix}@example`, `${prefix}@@example.test`, `${prefix}.@example.test`, `${prefix}@example.test `, `${'a'.repeat(65)}@example.test`].map((value) => ({ value })),
    date: ['2026-02-29', '2024-02-29', '1900-01-01', '9999-12-31', '2026-13-01', '31/12/2026', ''].map((value) => ({ value })),
    api_types: [{ value: 'string instead of number' }, { value: 123, for: 'string fields' }, { value: true }, { value: null }, { value: [] }, { value: {} }],
    actions: ['submit twice quickly', 'repeat the same create 3 times', 'back during save', 'reload during save', 'change a field after its error appeared', 'leave and come back', 'Android: rotate is not offered; use the monkey tool'],
  };
}

if (process.argv[1]?.endsWith('break-inputs.mjs')) {
  const i = process.argv.indexOf('--project');
  let prefix = 'reconqa';
  try { prefix = load(i > 0 ? process.argv[i + 1] : '.').config?.app?.test_data?.prefix ?? prefix; } catch { /* defaults */ }
  console.log(JSON.stringify(catalogue(prefix), null, 2));
}
