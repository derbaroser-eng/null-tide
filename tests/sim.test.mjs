import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const fresh = () => { const { api } = loadGame(); return { api, S: api.S }; };

test('RNG is deterministic for a seed and differs across seeds', () => {
  const { api } = fresh();
  const a = api.makeRng('TIDE-7F3K');
  const b = api.makeRng('TIDE-7F3K');
  const c = api.makeRng('TIDE-2Q8M');
  const seqA = Array.from({ length: 5 }, () => a());
  assert.deepEqual(seqA, Array.from({ length: 5 }, () => b()));
  assert.notDeepEqual(seqA, Array.from({ length: 5 }, () => c()));
  for (const v of seqA) assert.ok(v >= 0 && v < 1, 'rng must be in [0,1)');
});

test('randSeed() yields TIDE- plus 4 unambiguous chars', () => {
  const { api } = fresh();
  const seen = new Set();
  for (let i = 0; i < 50; i++) {
    const s = api.randSeed();
    assert.match(s, /^TIDE-[A-Z2-9]{4}$/);
    seen.add(s);
  }
  assert.ok(seen.size > 1, 'randSeed should vary');
});

test('newCity(seed) is fully deterministic', () => {
  const A = fresh(); const B = fresh();
  A.api.newCity('TIDE-DEMO'); B.api.newCity('TIDE-DEMO');
  assert.equal(A.S.cityName, B.S.cityName);
  assert.equal(JSON.stringify(A.S.districts.map(d => d.x)), JSON.stringify(B.S.districts.map(d => d.x)));
  assert.equal(JSON.stringify(A.S.objectDeck.map(o => o.id)), JSON.stringify(B.S.objectDeck.map(o => o.id)));
  assert.equal(A.S.cycle, 1);
  assert.equal(A.S.delivered.length, 0);
});
test('newCity resets a finished run', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-RST1');
  S.delivered.push({ obj: 'x' });
  S.stain = 3; S.cycle = 7; S.ended = true;
  api.newCity('TIDE-RST1');
  assert.equal(S.cycle, 1);
  assert.equal(S.delivered.length, 0);
  assert.equal(S.stain, 0);
  assert.equal(S.ended, false);
});

test('data tables are well-formed', () => {
  const { api } = fresh();
  assert.equal(api.OBJECTS.length, 14);
  assert.equal(new Set(api.OBJECTS.map(o => o.id)).size, 14);
  for (const o of api.OBJECTS) {
    assert.ok(api.ECHO_LABEL[o.echo], 'unknown echo ' + o.echo);
    assert.ok(o.name && o.name.length > 0);
  }
  assert.equal(api.DISTRICTS.length, 5);
  assert.equal(new Set(api.DISTRICTS.map(d => d.id)).size, 5);
  for (const d of api.DISTRICTS) {
    assert.ok(api.ECHO_LABEL[d.loves]);
    assert.ok(api.ECHO_LABEL[d.likes]);
  }
  assert.equal(api.EULOGIES.length, 15);
  assert.equal(api.FALLBACK_EULOGIES.length, 9);
  const all = [...api.EULOGIES, ...api.FALLBACK_EULOGIES];
  assert.equal(new Set(all.map(e => e.title)).size, 24, 'titles must be unique');
  for (const e of all) assert.ok(e.poem.includes('\n'), 'poem must be multi-line');
});

test('echoScore: loves=3, likes=2, otherwise 1', () => {
  const { api } = fresh();
  const docks = { def: api.DISTRICTS.find(d => d.id === 'docks') };
  assert.equal(api.echoScore(api.OBJECTS.find(o => o.id === 'net'), docks), 3);
  assert.equal(api.echoScore(api.OBJECTS.find(o => o.id === 'shoe'), docks), 2);
  assert.equal(api.echoScore(api.OBJECTS.find(o => o.id === 'medal'), docks), 1);
});
test('deliver: loved gift raises reverence and locks a trait on the second echo', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-ECHO');
  const chapel = S.districts.find(d => d.def.id === 'chapel');
  const rev0 = chapel.rev;
  api.pickup(api.OBJECTS.find(o => o.id === 'icon'));
  api.deliver(chapel);
  assert.equal(chapel.echoes.sacred, 1);
  assert.equal(chapel.trait, null);
  assert.ok(chapel.rev > rev0, 'reverence should rise');
  api.pickup(api.OBJECTS.find(o => o.id === 'book'));
  api.deliver(chapel);
  assert.equal(chapel.echoes.sacred, 2);
  assert.equal(chapel.trait, 'Reverent');
  assert.equal(S.delivered.length, 2);
  assert.equal(S.delivered[0].district, 'Chapel Hill');
});

test('deliver: misunderstood gift raises dread', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-DRED');
  const docks = S.districts.find(d => d.def.id === 'docks');
  const dr0 = docks.dread;
  api.pickup(api.OBJECTS.find(o => o.id === 'medal'));
  api.deliver(docks);
  assert.ok(docks.dread > dr0, 'dread should rise');
  assert.equal(docks.trait, null);
});

test('computeEulogy: exact trait pair selects the matching eulogy', () => {
  const A = fresh(); A.api.newCity('TIDE-EUL1');
  A.S.districts.forEach(d => { d.trait = 'Tender'; });
  const r = A.api.computeEulogy();
  assert.equal(JSON.stringify(r.traits), JSON.stringify(['Tender', 'Tender', 'Tender', 'Tender', 'Tender']));
  assert.equal(r.pick.title, 'SHE WHO RETURNED SHOES');
  // computeEulogy scans EULOGIES greedily (first need-set fully present wins),
  // so this uses a pair that no earlier entry can satisfy.
  const B = fresh(); B.api.newCity('TIDE-EUL2');
  B.S.districts[0].trait = 'Festival';
  B.S.districts[1].trait = 'Militarist';
  assert.equal(B.api.computeEulogy().pick.title, 'THE DRUM-TIDE');
});
test('computeEulogy: no traits falls back to a fallback eulogy', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-EUL3');
  const r = api.computeEulogy();
  assert.equal(r.traits.length, 0);
  assert.ok(api.FALLBACK_EULOGIES.includes(r.pick));
});

test('resolveOmen: storm choice a calms, b frightens, and the tide advances', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-OMEN');
  S.cycle = 2; S.phase = 'omen';
  S.omen = api.OMENS.find(o => o.id === 'storm');
  const rev0 = S.reverence;
  const drBefore = S.districts.map(d => d.dread);
  api.resolveOmen('a');
  assert.ok(S.reverence > rev0, 'holding the sea should raise reverence');
  assert.ok(S.districts.every((d, i) => d.dread < drBefore[i]), 'holding the sea should lower dread');
  assert.equal(S.cycle, 3);
  assert.equal(S.phase, 'recede');
  S.phase = 'omen'; S.cycle = 3; S.omen = api.OMENS.find(o => o.id === 'storm');
  const dr1 = S.districts.map(d => d.dread);
  api.resolveOmen('b');
  assert.ok(S.districts.every((d, i) => d.dread > dr1[i]), 'letting the storm take should raise dread');
  assert.equal(S.cycle, 4);
});

test('endRun: records the eulogy and is idempotent', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-END1');
  S.districts.forEach(d => { d.trait = 'Festival'; });
  api.endRun();
  assert.equal(S.screen, 'end');
  assert.equal(S.ended, true);
  assert.equal(S.endStats.pick.title, 'THE BRASS-LAUGHING TIDE');
  S.districts.forEach(d => { d.trait = 'Tender'; });
  api.endRun();
  assert.equal(S.endStats.pick.title, 'THE BRASS-LAUGHING TIDE', 'second endRun must be a no-op');
});

test('spawnExposed: one object on tide 1, two afterwards', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-SPAW');
  S.cycle = 1; api.spawnExposed();
  assert.equal(S.exposed.length, 1);
  S.cycle = 4; api.spawnExposed();
  assert.equal(S.exposed.length, 2);
});

test('integration: a full 10-tide run ends with a real eulogy', () => {
  const { api, S } = fresh();
  api.startGame('TIDE-FULL');
  assert.equal(S.seed, 'TIDE-FULL');
  assert.equal(S.screen, 'play');
  let steps = 0;
  while (S.screen === 'play' && steps < 40000) {
    if (S.phase === 'omen') api.resolveOmen('a');
    else api.update(0.05);
    steps++;
  }
  assert.equal(S.screen, 'end', 'run should finish (phase=' + S.phase + ', steps=' + steps + ')');
  assert.ok(steps < 40000, 'run should terminate without hanging');
  assert.ok(S.endStats.pick.title.length > 0);
  assert.ok(api.EULOGIES.includes(S.endStats.pick) || api.FALLBACK_EULOGIES.includes(S.endStats.pick));
  assert.equal(S.cycle, 10);
});

test('every authored eulogy is reachable', () => {
  const { api, S } = fresh();
  api.newCity('TIDE-REACH');
  const seen = new Set();
  for (const e of api.EULOGIES) {
    S.districts.forEach((d, i) => { d.trait = e.need[i] || null; });
    const got = api.computeEulogy().pick.title;
    assert.equal(got, e.title, 'eulogy ' + e.title + ' should be reachable');
    seen.add(got);
  }
  assert.equal(seen.size, api.EULOGIES.length);
});
