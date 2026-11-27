// F0 safety base: app driver tool maps (deny by default), device shell writes, app.target.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, load, checkTarget } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';
import { loadAppMaps, checkAppMap, driverPrefixes } from '../plugins/reconqa/scripts/lib/app-maps.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAKE = join(ROOT, 'tests/fixtures/app-adapters');
function project(kit = 'version: 1\n') {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-drv-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), kit);
  compile(dir);
  return dir;
}
const call = (tool_name, tool_input = {}) => ({ tool_name, tool_input });
const d = (dir, input, opts = {}) => decide(input, { projectDir: dir, ...opts });

test('playwright map: listed tools pass, risky ones ask, unlisted and unsafe ones are denied', () => {
  const dir = project();
  for (const op of ['browser_navigate', 'browser_snapshot', 'browser_click', 'browser_take_screenshot']) {
    assert.equal(d(dir, call(`mcp__playwright__${op}`)).decision, 'none', op);
  }
  for (const op of ['browser_evaluate', 'browser_file_upload', 'browser_route', 'browser_cookie_set']) {
    const r = d(dir, call(`mcp__playwright__${op}`));
    assert.equal(r.decision, 'ask', op);
    assert.match(r.reason, /ReconQA/);
  }
  assert.equal(d(dir, call('mcp__playwright__browser_run_code_unsafe')).decision, 'deny');
  const r = d(dir, call('mcp__playwright__browser_teleport'));
  assert.equal(r.decision, 'deny');
  assert.match(r.reason, /not in the playwright tool map/);
});

test('a configured server_prefix is checked too, and the default prefix stays checked', () => {
  const dir = project('version: 1\ncapabilities:\n  app_driver:\n    tool: playwright\n    server_prefix: mcp__pw__\n');
  assert.equal(d(dir, call('mcp__pw__browser_click')).decision, 'none');
  assert.equal(d(dir, call('mcp__pw__browser_teleport')).decision, 'deny');
  assert.equal(d(dir, call('mcp__playwright__browser_teleport')).decision, 'deny');
  // A longer, different server name is not mistaken for the driver.
  assert.equal(d(dir, call('mcp__pw2__anything')).decision, 'none');
});

test('fake driver: the gate loads every map in the folder and denies by default', () => {
  const dir = project();
  const o = { appAdapterDir: FAKE };
  assert.equal(d(dir, call('mcp__fakedev__screen_read'), o).decision, 'none');
  assert.equal(d(dir, call('mcp__fakedev__tap'), o).decision, 'none');
  const ask = d(dir, call('mcp__fakedev__install_app'), o);
  assert.equal(ask.decision, 'ask');
  assert.match(ask.reason, /installs an app/);
  const deny = d(dir, call('mcp__fakedev__factory_reset'), o);
  assert.equal(deny.decision, 'deny');
  assert.match(deny.reason, /wipes the device/);
  assert.equal(d(dir, call('mcp__fakedev__swipe'), o).decision, 'deny');
  // Tools of other servers are not touched by driver maps.
  assert.equal(d(dir, call('mcp__other__swipe'), o).decision, 'none');
});

test('a malformed map makes the gate fail closed (throws), and the checker names the problem', () => {
  const bad = mkdtempSync(join(tmpdir(), 'reconqa-badmap-'));
  writeFileSync(join(bad, 'broken.json'), JSON.stringify({ default_prefix: 'mcp__b__', target: 'web', allow: ['x'], ask: ['x'], deny: [] }));
  const dir = project();
  assert.throws(() => decide(call('mcp__b__x'), { projectDir: dir, appAdapterDir: bad }), /in both/);
  assert.deepEqual(checkAppMap('ok', { default_prefix: 'mcp__ok__', target: 'web', allow: [], ask: [], deny: [] }), []);
  assert.ok(checkAppMap('p', { default_prefix: 'playwright', target: 'web', allow: [], ask: [], deny: [] }).length);
  assert.ok(checkAppMap('t', { default_prefix: 'mcp__t__', target: 'fridge', allow: [], ask: [], deny: [] }).length);
  assert.ok(checkAppMap('l', { default_prefix: 'mcp__l__', target: 'web', allow: 'x', ask: [], deny: [] }).length);
});

test('the shipped maps are well formed and the longest prefix wins', () => {
  const maps = loadAppMaps();
  assert.ok(maps.playwright);
  assert.equal(maps.playwright.target, 'web');
  const list = driverPrefixes({ a: { default_prefix: 'mcp__a__' }, b: { default_prefix: 'mcp__a__x__' } });
  assert.equal(list[0].prefix, 'mcp__a__x__');
});

test('device writes through the shell are denied', () => {
  const dir = project();
  for (const command of [
    'adb install app.apk', 'adb -s emulator-5554 install -r app.apk', 'adb uninstall com.example', 'adb push f /sdcard/',
    'adb shell input tap 10 10', 'adb shell pm clear com.example', 'adb reboot', 'adb root', 'adb exec-out screencap -p',
    'mosquitto_pub -t home/lamp -m on', 'mosquitto_rr -t a -e b -m x', 'mqtt pub -t a -m b', 'mqttx pub -t a -m b',
    'echo AT > /dev/ttyUSB0', 'printf x >> /dev/ttyACM0', 'echo x | tee /dev/ttyS1', 'echo x | tee -a /dev/cu.usbserial-10',
    'dd if=fw.bin of=/dev/ttyUSB0', 'picocom -b 115200 /dev/ttyUSB0', 'screen /dev/ttyACM0 9600', 'cu -l /dev/ttyS0',
    'socat - /dev/ttyUSB0,raw', 'stty -F /dev/ttyUSB0 115200', 'echo x > COM3', 'mode COM3 BAUD=9600',
    '$p = New-Object System.IO.Ports.SerialPort COM3; $p.Write("x")',
  ]) {
    const r = d(dir, call('Bash', { command }));
    assert.equal(r.decision, 'deny', command);
  }
  assert.match(d(dir, call('Bash', { command: 'adb install a.apk' })).reason, /device/);
  assert.equal(d(dir, call('PowerShell', { command: 'echo x > COM4' })).decision, 'deny');
});

test('device reads and harmless commands pass', () => {
  const dir = project();
  for (const command of ['adb devices', 'adb get-state', 'adb version', 'mosquitto_sub -t a -C 1',
    'cat /dev/ttyUSB0', 'ls /dev/cu.usbserial-10', 'echo hi > /dev/null', 'echo hi > /dev/tty', 'ls /dev/tty*']) {
    assert.equal(d(dir, call('Bash', { command })).decision, 'none', command);
  }
});

test('app.target: web is the default and passes; planned targets are refused with a clear message', () => {
  assert.equal(load(project()).config.app.target, 'web');
  const r = load(project('version: 1\napp:\n  target: serial\n'));
  assert.equal(r.config, null);
  assert.match(r.errors.map((e) => e.message).join('\n'), /planned but not available yet/);
  const unknown = load(project('version: 1\napp:\n  target: fridge\n'));
  assert.equal(unknown.config, null);
});

test('app.target must match the app driver map target', () => {
  const out = [];
  checkTarget({ app: { target: 'web' }, capabilities: { app_driver: { tool: 'fakedev' } } }, out, FAKE);
  assert.match(out[0].message, /drives android, but app.target is web/);
  const none = [];
  checkTarget({ app: { target: 'web' }, capabilities: { app_driver: { tool: 'none' } } }, none, FAKE);
  assert.deepEqual(none, []);
  const missing = [];
  checkTarget({ app: { target: 'web' }, capabilities: { app_driver: { tool: 'ghost' } } }, missing, FAKE);
  assert.match(missing[0].message, /no tool map/);
});

test('when the config is invalid, driver tools are blocked like every MCP tool', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-drv-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: android\n');
  assert.equal(compile(dir).written, null);
  assert.equal(d(dir, call('mcp__playwright__browser_click')).decision, 'deny');
});

test('driver choice: your own Chrome (Claude in Chrome) has a checked map; other names need a map', () => {
  const dir = project('version: 1\ncapabilities:\n  app_driver:\n    tool: claude-in-chrome\n');
  assert.equal(load(dir).config.capabilities.app_driver.tool, 'claude-in-chrome');
  assert.equal(d(dir, call('mcp__claude-in-chrome__navigate')).decision, 'none');
  assert.equal(d(dir, call('mcp__claude-in-chrome__computer', { action: 'left_click' })).decision, 'none');
  assert.equal(d(dir, call('mcp__claude-in-chrome__javascript_tool')).decision, 'ask');
  assert.equal(d(dir, call('mcp__claude-in-chrome__browser_batch')).decision, 'ask');
  assert.equal(d(dir, call('mcp__claude-in-chrome__new_unknown_tool')).decision, 'deny');
  const other = load(project('version: 1\ncapabilities:\n  app_driver:\n    tool: my-driver\n'));
  assert.equal(other.config, null);
  assert.match(other.errors[0].message, /no tool map for app driver "my-driver".*android-adb, claude-in-chrome, http-api, playwright/);
});
