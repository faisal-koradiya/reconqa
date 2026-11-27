import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, YamlError } from '../plugins/reconqa/scripts/lib/yaml-lite.mjs';

const v = (s) => parse(s).value;

test('scalars', () => {
  assert.deepEqual(v('a: 1\nb: 2.5\nc: true\nd: false\ne: null\nf: ~\ng: hello world\nh:'), {
    a: 1, b: 2.5, c: true, d: false, e: null, f: null, g: 'hello world', h: null,
  });
  assert.deepEqual(v('a: yes\nb: no\nc: 0x10\nd: 1.2.3'), { a: 'yes', b: 'no', c: '0x10', d: '1.2.3' });
});

test('quoted strings and comments', () => {
  assert.deepEqual(v(`a: "x # y"   # real comment\nb: 'it''s'\nc: "tab\\tnew\\nq\\"" \nd: url#frag`), {
    a: 'x # y', b: "it's", c: 'tab\tnew\nq"', d: 'url#frag',
  });
  assert.deepEqual(v('# only comment\n\na: 1 # c'), { a: 1 });
});

test('urls and colons inside values', () => {
  assert.deepEqual(v('url: http://localhost:3000/a?b=c\nt: "12:30"\nk: a:b'), { url: 'http://localhost:3000/a?b=c', t: '12:30', k: 'a:b' });
});

test('nested maps and lists', () => {
  const doc = `
app:
  envs:
    - name: local
      writes: true
    - name: qa
  tags:
  - a
  - b
list:
  - - x
    - y
  -
    k: v
`;
  assert.deepEqual(v(doc), {
    app: { envs: [{ name: 'local', writes: true }, { name: 'qa' }], tags: ['a', 'b'] },
    list: [['x', 'y'], { k: 'v' }],
  });
});

test('flow collections', () => {
  assert.deepEqual(v('a: [1, two, "th,ree", [x], {k: v}]\nb: {x: 1, y: [a, b], "q k": z}\nc: []\nd: {}\ne: [a, b,]'), {
    a: [1, 'two', 'th,ree', ['x'], { k: 'v' }], b: { x: 1, y: ['a', 'b'], 'q k': 'z' }, c: [], d: {}, e: ['a', 'b'],
  });
});

test('block scalars', () => {
  const doc = 'a: |\n  one\n  two\n\nb: >\n  folded\n  text\n\n  para\nc: |-\n  strip\nd: x\n';
  assert.deepEqual(v(doc), { a: 'one\ntwo\n', b: 'folded text\npara\n', c: 'strip', d: 'x' });
});

test('line numbers per path', () => {
  const { lines } = parse('a: 1\nb:\n  c: [x, y]\n  d:\n    - e: 1\n');
  assert.equal(lines['/a'], 1);
  assert.equal(lines['/b/c'], 3);
  assert.equal(lines['/b/c/1'], 3);
  assert.equal(lines['/b/d/0/e'], 5);
});

test('leading document marker and empty document', () => {
  assert.deepEqual(v('---\na: 1'), { a: 1 });
  assert.equal(v(''), null);
  assert.equal(v('# nothing\n'), null);
});

function throwsAt(src, line, re) {
  assert.throws(() => parse(src), (e) => e instanceof YamlError && e.line === line && re.test(e.message));
}

test('clear errors with line numbers', () => {
  throwsAt('a: 1\n\tb: 2', 2, /tabs/);
  throwsAt('a: 1\na: 2', 2, /duplicate key "a"/);
  throwsAt('a: &x 1', 1, /anchors/);
  throwsAt('a: *x', 1, /aliases/);
  throwsAt('a: !!str 1', 1, /tags/);
  throwsAt('a: "open', 1, /closing quote/);
  throwsAt('a: [1, 2', 1, /expected "," or "\]"/);
  throwsAt('a:\n  b: 1\n    c: 2', 3, /indentation/);
  throwsAt('a: 1\n---\nb: 2', 2, /multiple documents/);
  throwsAt('just text', 1, /expected "key: value"/);
  throwsAt('  a: 1', 1, /column 1/);
});
