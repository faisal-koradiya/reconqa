// schema-lite: validates a value against the JSON Schema subset ReconQA uses.
// Keywords: type, enum, properties, required, additionalProperties, items, minItems,
// minLength, maxLength, minimum, pattern. Unknown keywords (description, title, $id, ...) are ignored.
// Returns a list of { path, message }; path is JSON-pointer-like ("/cases/format").

export function validate(schema, value, path = '') {
  const errors = [];
  walk(schema, value, path, errors);
  return errors;
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v; // string, number, boolean, object
}

function typeMatches(expected, actual) {
  if (expected === actual) return true;
  return expected === 'number' && actual === 'integer';
}

function walk(schema, value, path, errors) {
  if (!schema || typeof schema !== 'object') return;
  const where = pretty(path);

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = typeOf(value);
    if (!types.some((t) => typeMatches(t, actual))) {
      errors.push({ path, message: `${where} should be ${types.join(' or ')}, but is ${actual === 'integer' ? 'a number' : actual}` });
      return;
    }
  }
  if (value === null) return;

  if (schema.enum && !schema.enum.some((e) => e === value)) {
    errors.push({ path, message: `${where} must be one of: ${schema.enum.map(String).join(', ')} (got "${value}")` });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, message: `${where} must not be empty` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, message: `${where} is longer than ${schema.maxLength} characters` });
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({ path, message: `${where} has an invalid format (expected to match ${schema.pattern})` });
    }
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path, message: `${where} must be at least ${schema.minimum}` });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({ path, message: `${where} needs at least ${schema.minItems} item(s)` });
    }
    if (schema.items) value.forEach((item, i) => walk(schema.items, item, `${path}/${i}`, errors));
  }
  if (typeOf(value) === 'object') {
    for (const req of schema.required ?? []) {
      if (!Object.hasOwn(value, req)) errors.push({ path, message: `${where} is missing "${req}"` });
    }
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(value)) {
      const childPath = `${path}/${k}`;
      if (Object.hasOwn(props, k)) walk(props[k], v, childPath, errors);
      else if (schema.additionalProperties === false) {
        const hint = closest(k, Object.keys(props));
        errors.push({ path: childPath, message: `unknown key "${k}" in ${path ? where : 'the config'}${hint ? ` (did you mean "${hint}"?)` : ''}` });
      } else if (typeof schema.additionalProperties === 'object') {
        walk(schema.additionalProperties, v, childPath, errors);
      }
    }
  }
}

function closest(word, options) {
  let best = null, bestD = Infinity;
  for (const o of options) {
    const d = distance(word.toLowerCase(), o.toLowerCase());
    if (d < bestD) { bestD = d; best = o; }
  }
  return bestD <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// "/cases/rules/0/text" -> "cases.rules[0].text"
export function pretty(path) {
  if (!path) return 'config';
  return path.split('/').slice(1).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((acc, p) => (/^\d+$/.test(p) ? `${acc}[${p}]` : acc ? `${acc}.${p}` : p), '');
}
