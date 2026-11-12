import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, ENZYMES, SAMPLES, normalizeSettings, simulateExperiment } from '../model.js';

const free = settings => simulateExperiment({ ...DEFAULT_SETTINGS, mode: 'free', ...settings }).runs[0];
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≈ ${b}`);

test('defaults and metadata provide the public interface', () => {
  assert.deepEqual(normalizeSettings({}), DEFAULT_SETTINGS);
  for (const [id, sample] of Object.entries(SAMPLES)) {
    assert.equal(sample.id, id); assert.ok(sample.label); assert.ok(sample.description);
  }
  for (const [id, enzyme] of Object.entries(ENZYMES)) {
    assert.equal(enzyme.id, id); assert.ok(enzyme.label); assert.ok(enzyme.description);
  }
  const result = simulateExperiment();
  assert.equal(typeof result.modelVersion, 'string');
  assert.equal(result.runs.length, 6);
  assert.deepEqual(result.runs.map(r => r.temperature), [50, 54, 58, 62, 66, 70]);
  assert.equal(free({}).points.length, DEFAULT_SETTINGS.cycles + 1);
});

test('invalid imports fail rather than coercing, clamping or accepting extra fields', () => {
  for (const raw of [null, [], 'settings', 4, new Date(), { mode: 'other' }, { sample: 'unknown' },
    { enzyme: 'unknown' }, { cycles: 30.1 }, { cycles: 46 }, { cycles: -1 }, { template: -1 },
    { template: 10001 }, { temperature: '60' }, { temperature: NaN }, { temperature: Infinity },
    { temperature: 81 }, { primerTm: 44 }, { length: 99 }, { length: 5001 }, { length: 600.5 },
    { seed: -1 }, { seed: 4294967296 }, { seed: 1.5 }, { gradientMin: 65, gradientMax: 65 },
    { gradientMin: 70, gradientMax: 50 }, { unexpected: true }]) {
    assert.throws(() => normalizeSettings(raw));
  }
  assert.equal(normalizeSettings({ seed: 0 }).seed, 0);
  assert.equal(normalizeSettings({ seed: 4294967295 }).seed, 4294967295);
});

test('same settings and seed reproduce all points and simulated gel bands', () => {
  const settings = { ...DEFAULT_SETTINGS, seed: 0 };
  assert.deepEqual(simulateExperiment(settings), simulateExperiment(JSON.parse(JSON.stringify(settings))));
  assert.notDeepEqual(simulateExperiment(settings).runs, simulateExperiment({ ...settings, seed: 1 }).runs);
  assert.deepEqual(settings, { ...DEFAULT_SETTINGS, seed: 0 }, 'input was not mutated');
});

test('a gradient tube equals a free-mode run at that exact temperature', () => {
  const gradient = simulateExperiment({ ...DEFAULT_SETTINGS, gradientMin: 51.2, gradientMax: 68.1 });
  assert.equal(gradient.runs.length, 6);
  for (const run of gradient.runs) {
    assert.deepEqual(run, free({ temperature: run.temperature }));
  }
});

test('cycle zero has no newly amplified products', () => {
  const run = free({ cycles: 0 });
  assert.deepEqual(run.points, [{ cycle: 0, target: 0, offTarget: 0, dimer: 0, total: 0 }]);
  assert.equal(run.total, 0); assert.equal(run.purity, 0);
  assert.ok(run.bands.every(band => band.amount === 0));
});

test('no template yields no target or off-target; template-independent dimers remain possible', () => {
  const run = free({ template: 0, temperature: 45, cycles: 40 });
  assert.equal(run.target, 0); assert.equal(run.offTarget, 0);
  assert.ok(run.dimer > 0.1);
  assert.equal(run.purity, 0);
});

test('clean samples do not invent non-specific products', () => {
  const run = free({ sample: 'clean', temperature: 45, cycles: 45 });
  assert.equal(run.offTarget, 0);
  assert.ok(run.bands.every(band => band.kind !== 'offTarget'));
});

test('lower temperatures expose predefined weak sites; excessive temperature suppresses target', () => {
  const cool = free({ temperature: 50 });
  const middle = free({ temperature: 60 });
  const hot = free({ temperature: 76 });
  assert.ok(cool.offTarget > middle.offTarget * 20);
  assert.ok(middle.purity > cool.purity);
  assert.ok(hot.target < middle.target * 0.01);
});

test('more cycles enter a bounded plateau rather than unlimited doubling', () => {
  const run = free({ sample: 'clean', temperature: 56, cycles: 45 });
  const p = run.points;
  assert.ok(p[35].total > p[25].total);
  assert.ok(p[45].total - p[40].total < p[30].total - p[25].total);
  assert.ok(p[45].total <= 100);
  assert.ok(p[45].total > 90);
});

test('enzyme profiles change behavior without making Q5 the universal yield winner', () => {
  const taq = free({ enzyme: 'taq', sample: 'clean', temperature: 50 });
  const q5 = free({ enzyme: 'q5', sample: 'clean', temperature: 50 });
  assert.ok(taq.target > q5.target);
  const mixedTaq = free({ enzyme: 'taq', temperature: 50 });
  const mixedHot = free({ enzyme: 'hot', temperature: 50 });
  assert.ok(mixedHot.purity > mixedTaq.purity);
  assert.ok(mixedHot.offTarget > 0, 'hot-start does not guarantee zero off-target');
});

test('changing annealing temperature or cycles does not change product sizes', () => {
  const a = free({ temperature: 45, cycles: 20, length: 850 });
  const b = free({ temperature: 75, cycles: 40, length: 850 });
  assert.deepEqual(a.bands.map(band => [band.kind, band.length]), b.bands.map(band => [band.kind, band.length]));
  assert.equal(a.bands.find(band => band.kind === 'target').length, 850);
});

test('amounts, fractions and gel bands remain consistent across parameter extremes', () => {
  for (const sample of Object.keys(SAMPLES)) for (const enzyme of Object.keys(ENZYMES)) {
    for (const temperature of [40, 60, 80]) for (const template of [0, 3, 10000]) {
      const run = free({ sample, enzyme, temperature, template, cycles: 45, length: 5000, seed: 4294967295 });
      for (const p of run.points) {
        for (const key of ['target', 'offTarget', 'dimer', 'total']) {
          assert.ok(Number.isFinite(p[key]) && p[key] >= 0 && p[key] <= 100 + 1e-9);
        }
        near(p.total, p.target + p.offTarget + p.dimer);
      }
      assert.ok(run.purity >= 0 && run.purity <= 1);
      near(run.total, run.bands.reduce((n, b) => n + b.amount, 0));
      for (const kind of ['target', 'offTarget', 'dimer']) {
        near(run[kind], run.bands.filter(b => b.kind === kind).reduce((n, b) => n + b.amount, 0));
      }
      near(run.total ? run.target / run.total : 0, run.purity);
      assert.ok(run.explanation.every(line => typeof line === 'string' && line.length > 0));
    }
  }
});
