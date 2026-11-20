// tests/harness.mjs - headless DOM/canvas/audio stub + loader for game.js
// Lets the real game.js run under Node with no browser, so the simulation core
// can be exercised deterministically. No network, no timers that keep the
// process alive.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.resolve(HERE, '..', 'game.js');

function makeCtx() {
  const target = {};
  return new Proxy(target, {
    get(t, p) {
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern')
        return () => ({ addColorStop() {} });
      if (p === 'measureText') return () => ({ width: 0 });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p in t) return t[p];
      return () => {};
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

const CTX = makeCtx();
const RECT = { x: 0, y: 0, left: 0, top: 0, width: 960, height: 600, right: 960, bottom: 600 };

function makeEl(id) {
  const classes = new Set();
  const el = {
    id, textContent: '', innerHTML: '', value: '', checked: false,
    style: {}, width: 0, height: 0, clientWidth: 960, clientHeight: 600, _t: null,
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (c, f) => { const on = f === undefined ? !classes.has(c) : !!f; on ? classes.add(c) : classes.delete(c); return on; },
      contains: (c) => classes.has(c),
    },
    addEventListener() {}, removeEventListener() {}, setPointerCapture() {}, releasePointerCapture() {},
    getContext: () => CTX,
    getBoundingClientRect: () => ({ ...RECT }),
    appendChild() {}, removeChild() {}, click() {}, focus() {}, blur() {},
    toDataURL: () => 'data:image/png;base64,',
  };
  el.parentElement = { getBoundingClientRect: () => ({ ...RECT }) };
  return el;
}

export function loadGame() {
  const els = {};
  const get = (id) => els[id] || (els[id] = makeEl(id));
  const document = {
    getElementById: get,
    addEventListener() {}, removeEventListener() {},
    createElement: () => makeEl('dynamic'),
    body: makeEl('body'),
    documentElement: makeEl('html'),
    hidden: false,
  };
  const storage = {};
  const sandbox = {
    document,
    window: { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {},
              AudioContext: undefined, webkitAudioContext: undefined },
    navigator: { clipboard: { writeText: async () => {} } },
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
    },
    performance: { now: () => 0, timeOrigin: 0 },
    fetch: async () => { throw new Error('offline harness: network disabled'); },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    console, Math, JSON, Date, Array, Object, String, Number, Boolean, RegExp,
    Error, TypeError, Uint8Array, Uint8ClampedArray, Float32Array, Map, Set,
    Promise, Symbol, parseInt, parseFloat, isNaN, isFinite,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(GAME, 'utf8'), sandbox, { filename: 'game.js' });
  if (!sandbox.window.__NT) throw new Error('game.js did not expose the window.__NT test seam');
  return { api: sandbox.window.__NT, els, document, sandbox };
}
