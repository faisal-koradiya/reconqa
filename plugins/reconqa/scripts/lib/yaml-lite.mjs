// yaml-lite: a small, dependency-free parser for the YAML subset ReconQA config uses.
//
// Supported: block mappings and sequences, flow [..] and {..}, plain / 'single' / "double" quoted
// scalars, numbers, true/false, null/~, comments, block scalars (| and >, with - or + chomping).
// Not supported (clear error instead): anchors (&), aliases (*), tags (!), multiple documents,
// complex keys (?), tabs in indentation.
//
// parse(text) returns { value, lines } where `lines` maps a JSON-pointer-like path
// ("/cases/format") to the 1-based line number it came from, so errors can point to a line.

const MAX_DEPTH = 64;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function checkKey(key, lineNo) {
  if (FORBIDDEN_KEYS.has(key)) throw new YamlError(`the key "${key}" is not allowed`, lineNo);
}

export class YamlError extends Error {
  constructor(message, line) {
    super(line ? `line ${line}: ${message}` : message);
    this.line = line;
  }
}

export function parse(text) {
  const p = new Parser(text);
  return p.parseDocument();
}

class Parser {
  constructor(text) {
    this.raw = String(text).replace(/\r\n?/g, '\n').split('\n');
    this.lines = this.raw.map((raw, i) => ({ no: i + 1, raw, override: null }));
    this.i = 0;
    this.pathLines = {};
    this.depth = 0;
  }

  // ---- line helpers -------------------------------------------------------

  info(idx) {
    const l = this.lines[idx];
    const src = l.override ?? { indent: leadingSpaces(l.raw), text: l.raw.trimStart() };
    if (l.override === null && /^ *\t/.test(l.raw)) {
      throw new YamlError('tabs are not allowed for indentation; use spaces', l.no);
    }
    return { no: l.no, indent: src.indent, text: stripComment(src.text).trimEnd() };
  }

  // Index of the next line that has content (not blank, not only a comment), or -1.
  nextSig(from = this.i) {
    for (let k = from; k < this.lines.length; k++) {
      const { text } = this.info(k);
      if (text !== '') return k;
    }
    return -1;
  }

  // ---- document -----------------------------------------------------------

  parseDocument() {
    let k = this.nextSig();
    if (k !== -1 && this.info(k).text === '---') {
      this.i = k + 1;
      k = this.nextSig();
    }
    if (k === -1) return { value: null, lines: this.pathLines };
    const first = this.info(k);
    if (first.indent !== 0) throw new YamlError('the document must start at column 1', first.no);
    this.i = k;
    const value = this.parseBlock(0, '');
    const rest = this.nextSig();
    if (rest !== -1) {
      const r = this.info(rest);
      if (r.text === '---' || r.text === '...') throw new YamlError('multiple documents are not supported', r.no);
      throw new YamlError('unexpected content (check the indentation)', r.no);
    }
    return { value, lines: this.pathLines };
  }

  parseBlock(indent, path) {
    const k = this.nextSig();
    const { text, no } = this.info(k);
    if (++this.depth > MAX_DEPTH) throw new YamlError(`nesting is deeper than ${MAX_DEPTH} levels`, no);
    try {
      return isSeqItem(text) ? this.parseSequence(indent, path) : this.parseMapping(indent, path);
    } finally {
      this.depth--;
    }
  }

  // ---- mappings -----------------------------------------------------------

  parseMapping(indent, path) {
    const obj = {};
    for (;;) {
      const k = this.nextSig();
      if (k === -1) break;
      const ln = this.info(k);
      if (ln.indent < indent) break;
      if (ln.indent > indent) throw new YamlError('unexpected indentation', ln.no);
      if (isSeqItem(ln.text)) throw new YamlError('a list item cannot appear here; expected "key: value"', ln.no);
      if (ln.text === '---' || ln.text === '...') throw new YamlError('multiple documents are not supported', ln.no);
      checkUnsupported(ln.text, ln.no);

      const colon = findMappingColon(ln.text);
      if (colon === -1) throw new YamlError(`expected "key: value" but found "${ln.text}"`, ln.no);
      const key = parseKey(ln.text.slice(0, colon).trim(), ln.no);
      checkKey(key, ln.no);
      if (Object.prototype.hasOwnProperty.call(obj, key)) throw new YamlError(`duplicate key "${key}"`, ln.no);
      const childPath = `${path}/${escapePath(key)}`;
      this.pathLines[childPath] = ln.no;
      const rest = ln.text.slice(colon + 1).trim();
      this.i = k + 1;

      if (rest === '') {
        const n = this.nextSig();
        if (n === -1) { obj[key] = null; continue; }
        const nx = this.info(n);
        if (nx.indent > indent) obj[key] = this.parseBlock(nx.indent, childPath);
        else if (nx.indent === indent && isSeqItem(nx.text)) obj[key] = this.parseSequence(indent, childPath);
        else obj[key] = null;
      } else if (/^[|>][-+]?$/.test(rest)) {
        obj[key] = this.parseBlockScalar(rest, indent);
      } else {
        obj[key] = parseInline(rest, ln.no, childPath, this.pathLines);
      }
    }
    return obj;
  }

  // ---- sequences ----------------------------------------------------------

  parseSequence(indent, path) {
    const arr = [];
    for (;;) {
      const k = this.nextSig();
      if (k === -1) break;
      const ln = this.info(k);
      if (ln.indent < indent) break;
      if (ln.indent > indent) throw new YamlError('unexpected indentation', ln.no);
      if (!isSeqItem(ln.text)) break;
      checkUnsupported(ln.text, ln.no);

      const itemPath = `${path}/${arr.length}`;
      this.pathLines[itemPath] = ln.no;
      const content = ln.text === '-' ? '' : ln.text.slice(2).trimStart();
      const offset = ln.text.length - content.length;

      if (content === '') {
        this.i = k + 1;
        const n = this.nextSig();
        if (n === -1 || this.info(n).indent <= indent) arr.push(null);
        else arr.push(this.parseBlock(this.info(n).indent, itemPath));
      } else if (isSeqItem(content) || (findMappingColon(content) !== -1 && !/^[[{"']/.test(content))) {
        // "- key: value" or "- - x": re-read this line as a nested block starting at the content column.
        this.lines[k].override = { indent: indent + offset, text: content };
        this.i = k;
        arr.push(this.parseBlock(indent + offset, itemPath));
      } else if (/^[|>][-+]?$/.test(content)) {
        this.i = k + 1;
        arr.push(this.parseBlockScalar(content, indent));
      } else {
        this.i = k + 1;
        arr.push(parseInline(content, ln.no, itemPath, this.pathLines));
      }
    }
    return arr;
  }

  // ---- block scalars ------------------------------------------------------

  parseBlockScalar(header, parentIndent) {
    const folded = header[0] === '>';
    const chomp = header[1] || '';
    const body = [];
    let blockIndent = -1;
    let k = this.i;
    for (; k < this.lines.length; k++) {
      const raw = this.lines[k].raw;
      if (raw.trim() === '') { body.push(''); continue; }
      const ind = leadingSpaces(raw);
      if (blockIndent === -1) {
        if (ind <= parentIndent) break;
        blockIndent = ind;
      }
      if (ind < blockIndent) break;
      body.push(raw.slice(blockIndent));
    }
    // Trailing blank lines belong to chomping, not to the next key.
    let end = body.length;
    while (end > 0 && body[end - 1] === '') end--;
    const trailing = body.length - end;
    const kept = body.slice(0, end);
    this.i = k;
    if (kept.length === 0) return '';
    let text;
    if (folded) {
      // Lines are joined with spaces; a blank line becomes a line break; indented lines keep their breaks.
      text = kept[0];
      for (let j = 1; j < kept.length; j++) {
        const line = kept[j], prev = kept[j - 1];
        if (line === '') text += '\n';
        else if (prev === '' || /^\s/.test(line) || /^\s/.test(prev)) text += (prev === '' ? '' : '\n') + line;
        else text += ' ' + line;
      }
    } else {
      text = kept.join('\n');
    }
    if (chomp === '+') text += '\n'.repeat(trailing + 1);
    else if (chomp !== '-') text += '\n';
    return text;
  }
}

// ---- inline values (scalars and flow collections) --------------------------

function parseInline(src, lineNo, path, pathLines) {
  src = src.trim();
  checkUnsupported(src, lineNo);
  if (src[0] === '[' || src[0] === '{') {
    const fp = new FlowParser(src, lineNo, path, pathLines);
    const v = fp.value(path);
    fp.ws();
    if (fp.pos !== src.length) throw new YamlError(`unexpected text after a closing bracket: "${src.slice(fp.pos)}"`, lineNo);
    return v;
  }
  if (src[0] === '"' || src[0] === "'") {
    const { value, end } = readQuoted(src, 0, lineNo);
    if (src.slice(end).trim() !== '') throw new YamlError(`unexpected text after a quoted string: "${src.slice(end).trim()}"`, lineNo);
    return value;
  }
  return resolvePlain(src);
}

class FlowParser {
  constructor(src, lineNo, path, pathLines) {
    this.s = src; this.pos = 0; this.no = lineNo; this.pathLines = pathLines; this.depth = 0; void path;
  }
  ws() { while (this.pos < this.s.length && /\s/.test(this.s[this.pos])) this.pos++; }
  err(msg) { return new YamlError(msg, this.no); }
  value(path) {
    this.ws();
    const c = this.s[this.pos];
    if (c === '[' || c === '{') {
      if (++this.depth > MAX_DEPTH) throw this.err(`nesting is deeper than ${MAX_DEPTH} levels`);
      try { return c === '[' ? this.seq(path) : this.map(path); } finally { this.depth--; }
    }
    if (c === '"' || c === "'") {
      const { value, end } = readQuoted(this.s, this.pos, this.no);
      this.pos = end;
      return value;
    }
    const start = this.pos;
    while (this.pos < this.s.length && !',]}'.includes(this.s[this.pos])) {
      if (this.s[this.pos] === ':' && /[\s,\]}]/.test(this.s[this.pos + 1] ?? ' ')) break;
      this.pos++;
    }
    const plain = this.s.slice(start, this.pos).trim();
    if (plain === '') throw this.err('missing value in a [ ] or { } list');
    return resolvePlain(plain);
  }
  seq(path) {
    this.pos++; const arr = [];
    this.ws();
    if (this.s[this.pos] === ']') { this.pos++; return arr; }
    for (;;) {
      const p = `${path}/${arr.length}`;
      this.pathLines[p] = this.no;
      arr.push(this.value(p));
      this.ws();
      const c = this.s[this.pos];
      if (c === ',') { this.pos++; this.ws(); if (this.s[this.pos] === ']') { this.pos++; return arr; } continue; }
      if (c === ']') { this.pos++; return arr; }
      throw this.err('expected "," or "]" in a [ ] list');
    }
  }
  map(path) {
    this.pos++; const obj = {};
    this.ws();
    if (this.s[this.pos] === '}') { this.pos++; return obj; }
    for (;;) {
      this.ws();
      let key;
      const c = this.s[this.pos];
      if (c === '"' || c === "'") {
        const q = readQuoted(this.s, this.pos, this.no); key = q.value; this.pos = q.end;
      } else {
        const start = this.pos;
        while (this.pos < this.s.length && this.s[this.pos] !== ':' && !',}'.includes(this.s[this.pos])) this.pos++;
        key = this.s.slice(start, this.pos).trim();
      }
      this.ws();
      if (this.s[this.pos] !== ':') throw this.err(`expected ":" after "${key}" in a { } map`);
      this.pos++;
      if (key === '') throw this.err('empty key in a { } map');
      checkKey(key, this.no);
      if (Object.prototype.hasOwnProperty.call(obj, key)) throw this.err(`duplicate key "${key}"`);
      const p = `${path}/${escapePath(key)}`;
      this.pathLines[p] = this.no;
      obj[key] = this.value(p);
      this.ws();
      const d = this.s[this.pos];
      if (d === ',') { this.pos++; this.ws(); if (this.s[this.pos] === '}') { this.pos++; return obj; } continue; }
      if (d === '}') { this.pos++; return obj; }
      throw this.err('expected "," or "}" in a { } map');
    }
  }
}

// ---- small helpers ---------------------------------------------------------

function leadingSpaces(s) {
  let n = 0;
  while (n < s.length && s[n] === ' ') n++;
  return n;
}

function isSeqItem(text) {
  return text === '-' || text.startsWith('- ');
}

// Remove a trailing comment: '#' at the start or after whitespace, outside quotes.
function stripComment(text) {
  let q = null;
  for (let j = 0; j < text.length; j++) {
    const c = text[j];
    if (q) {
      if (q === '"' && c === '\\') { j++; continue; }
      if (c === q) {
        if (q === "'" && text[j + 1] === "'") { j++; continue; }
        q = null;
      }
      continue;
    }
    if ((c === '"' || c === "'") && (j === 0 || /[\s[{,:-]/.test(text[j - 1]))) { q = c; continue; }
    if (c === '#' && (j === 0 || /\s/.test(text[j - 1]))) return text.slice(0, j);
  }
  return text;
}

// Position of the ':' that separates key and value (followed by space or end), outside quotes/brackets.
function findMappingColon(text) {
  let q = null, depth = 0;
  for (let j = 0; j < text.length; j++) {
    const c = text[j];
    if (q) {
      if (q === '"' && c === '\\') { j++; continue; }
      if (c === q) q = null;
      continue;
    }
    if ((c === '"' || c === "'") && j === 0) { q = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === ':' && depth === 0 && (j + 1 === text.length || text[j + 1] === ' ')) return j;
  }
  return -1;
}

function parseKey(src, lineNo) {
  if (src === '') throw new YamlError('empty key', lineNo);
  if (src[0] === '"' || src[0] === "'") {
    const { value, end } = readQuoted(src, 0, lineNo);
    if (end !== src.length) throw new YamlError(`invalid key ${src}`, lineNo);
    return value;
  }
  if (src.startsWith('?')) throw new YamlError('complex keys ("?") are not supported', lineNo);
  return src;
}

function readQuoted(s, start, lineNo) {
  const q = s[start];
  let out = '';
  let j = start + 1;
  for (; j < s.length; j++) {
    const c = s[j];
    if (q === "'") {
      if (c === "'") {
        if (s[j + 1] === "'") { out += "'"; j++; continue; }
        return { value: out, end: j + 1 };
      }
      out += c;
    } else {
      if (c === '\\') {
        const e = s[++j];
        const map = { n: '\n', t: '\t', '"': '"', '\\': '\\', '/': '/', r: '\r', '0': '\0' };
        if (e in map) out += map[e];
        else if (e === 'u') {
          const hex = s.slice(j + 1, j + 5);
          if (!/^[0-9A-Fa-f]{4}$/.test(hex)) throw new YamlError('invalid \\u escape (needs 4 hex digits)', lineNo);
          out += String.fromCharCode(parseInt(hex, 16)); j += 4;
        }
        else throw new YamlError(`unknown escape "\\${e}" in a double-quoted string`, lineNo);
        continue;
      }
      if (c === '"') return { value: out, end: j + 1 };
      out += c;
    }
  }
  throw new YamlError('missing closing quote (strings must close on the same line)', lineNo);
}

function resolvePlain(s) {
  if (s === '' || s === '~' || s === 'null' || s === 'Null' || s === 'NULL') return null;
  if (s === 'true' || s === 'True' || s === 'TRUE') return true;
  if (s === 'false' || s === 'False' || s === 'FALSE') return false;
  if (/^[-+]?\d+$/.test(s)) return Number.parseInt(s, 10);
  if (/^[-+]?(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?$/.test(s)) return Number.parseFloat(s);
  return s;
}

function checkUnsupported(text, lineNo) {
  const t = text.startsWith('- ') ? text.slice(2).trimStart() : text;
  const colon = findMappingColon(t);
  const value = colon === -1 ? t : t.slice(colon + 1).trim();
  if (/^&\S/.test(value) || /^&\S/.test(t)) throw new YamlError('anchors (&) are not supported', lineNo);
  if (/^\*\S/.test(value)) throw new YamlError('aliases (*) are not supported', lineNo);
  if (/^!\S/.test(value) || /^!\S/.test(t)) throw new YamlError('tags (!) are not supported', lineNo);
}

function escapePath(key) {
  return String(key).replace(/~/g, '~0').replace(/\//g, '~1');
}
