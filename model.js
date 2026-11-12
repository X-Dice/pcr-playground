/**
 * An explicitly uncalibrated teaching model. All amounts use one fixed 0–100
 * relative mass scale, shared by all experiments; none is ng/µL or probability.
 * See docs/MODEL.md for the assumptions and chosen demonstration parameters.
 */
export const MODEL_VERSION = '1.0.0-teaching';

const deepFreeze = object => {
  Object.values(object).forEach(value => {
    if (value && typeof value === 'object') deepFreeze(value);
  });
  return Object.freeze(object);
};

export const DEFAULT_SETTINGS = Object.freeze({
  mode: 'gradient', sample: 'mixed', enzyme: 'taq', temperature: 60,
  gradientMin: 50, gradientMax: 70, cycles: 30, template: 100,
  length: 600, primerTm: 62, seed: 12345,
});

export const SAMPLES = deepFreeze({
  clean: {
    id: 'clean', label: '干净模板',
    description: '未设非特异位点的教学样本；少量二聚体仍可能形成。',
    offTargets: [], dimerPropensity: 0.12,
  },
  mixed: {
    id: 'mixed', label: '复杂模板',
    description: '含两处预设的弱结合位点，可观察低温时的非特异扩增。',
    offTargets: [
      { length: 300, relativeCopies: 0.48, tmOffset: -7 },
      { length: 1000, relativeCopies: 0.12, tmOffset: -10 },
    ],
    dimerPropensity: 0.8,
  },
  low: {
    id: 'low', label: '低模板挑战',
    description: '用少量模板探索扩增延迟；模板加入量可在进阶设置调整，二聚体可与目标竞争。',
    offTargets: [], dimerPropensity: 0.55,
  },
});

export const ENZYMES = deepFreeze({
  taq: {
    id: 'taq', label: '普通 Taq',
    description: '经典扩增教学配置；低温下预设的非特异产物更容易参与竞争。',
    efficiency: 0.84, annealingOffset: 1.5,
    offSeedFactor: 1, dimerSeedFactor: 1, lengthScale: 3800,
  },
  hot: {
    id: 'hot', label: '热启动型',
    description: '模拟热启动减少反应准备阶段的非特异启动；仍需合适的退火条件。',
    efficiency: 0.82, annealingOffset: 1.5,
    offSeedFactor: 0.16, dimerSeedFactor: 0.12, lengthScale: 3800,
  },
  q5: {
    id: 'q5', label: 'Q5 高保真型',
    description: '用于认识酶与缓冲体系的差异；高保真不等于所有条件下产量最高，胶图不能显示复制错误率。',
    efficiency: 0.79, annealingOffset: 3.5,
    offSeedFactor: 1, dimerSeedFactor: 1, lengthScale: 6200,
  },
});

const ENUMS = {
  mode: ['gradient', 'free'],
  sample: Object.keys(SAMPLES),
  enzyme: Object.keys(ENZYMES),
};
const RANGES = {
  temperature: [40, 80], gradientMin: [40, 80], gradientMax: [40, 80],
  cycles: [0, 45, true], template: [0, 10000], length: [100, 5000, true],
  primerTm: [45, 80], seed: [0, 4294967295, true],
};

/** Validate a plain settings object; missing fields inherit documented defaults. */
export function normalizeSettings(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) {
    throw new TypeError('设置必须是普通对象');
  }
  for (const key of Object.keys(raw)) {
    if (!Object.hasOwn(DEFAULT_SETTINGS, key)) throw new TypeError(`未知设置字段：${key}`);
  }
  const settings = { ...DEFAULT_SETTINGS, ...raw };
  for (const [key, values] of Object.entries(ENUMS)) {
    if (!values.includes(settings[key])) throw new RangeError(`${key} 的选项无效`);
  }
  for (const [key, [min, max, integer]] of Object.entries(RANGES)) {
    const value = settings[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max ||
        (integer && !Number.isInteger(value))) {
      throw new RangeError(`${key} 必须是 ${min}–${max} 之间的${integer ? '整数' : '数值'}`);
    }
  }
  if (settings.gradientMin >= settings.gradientMax) {
    throw new RangeError('梯度最低温度必须小于最高温度');
  }
  return settings;
}

// A small reproducible generator; no Math.random(), network or mutable globals.
function randomSource(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const binding = (effectiveTm, temperature) => 1 / (1 + Math.exp((temperature - effectiveTm) / 1.8));
const lengthFactor = (length, scale) => Math.exp(-Math.max(0, length - 600) / scale);

function explain(settings, temperature, run) {
  const lines = [];
  if (settings.template === 0) {
    lines.push('没有加入目标模板，因此目标扩增量为 0；引物二聚体仍可能形成。');
  } else if (settings.cycles === 0) {
    lines.push('尚未进行扩增循环；初始模板不计入新增 PCR 产物。');
  } else if (temperature > settings.primerTm + 4) {
    lines.push('退火温度高于本例的引物参考区间，模型中的目标结合效率下降。');
  } else if (temperature < settings.primerTm - 6) {
    lines.push(settings.sample === 'mixed'
      ? '较低退火温度允许预设的弱结合位点参与扩增，杂带会与目标竞争试剂。'
      : '较低退火温度仍可扩增目标；本样本没有预设非特异位点，不会凭空生成杂带。');
  } else {
    lines.push('该温度处于本教学配置的主要结合区间；适宜温度也会随酶和样本改变。');
  }
  if (run.total < 0.1 && settings.cycles > 0) {
    lines.push('本次新增产物很少；较高的目标占比也不代表已得到足够产物。');
  } else if (run.total > 90) {
    lines.push('反应接近有限容量，继续增加循环带来的产量增益已减小。');
  } else if (settings.cycles >= 35 && run.offTarget + run.dimer > 0.1) {
    lines.push('更多循环也会扩增已有副产物；目标产物占比不会自动提高。');
  } else {
    lines.push('目标产量与目标占比分别显示；总产量较高时也可能包含副产物。');
  }
  if (settings.enzyme === 'hot') lines.push('热启动配置减少早期非特异启动量，但不会消除所有杂带。');
  if (settings.enzyme === 'q5') lines.push('高保真描述复制准确性；本胶图没有测量或预测序列错误。');
  lines.push('结果是未经真实数据校准的教学模拟，相对量不能换算成实际浓度。');
  return lines;
}

function simulateRun(settings, temperature, disturbances) {
  const sample = SAMPLES[settings.sample];
  const enzyme = ENZYMES[settings.enzyme];
  const targetSeed = settings.template * 1e-7 * settings.length / 600;
  const species = [
    {
      kind: 'target', length: settings.length, amount: 0,
      source: targetSeed,
      efficiency: enzyme.efficiency * lengthFactor(settings.length, enzyme.lengthScale) *
        binding(settings.primerTm + enzyme.annealingOffset, temperature),
    },
    ...sample.offTargets.map(off => ({
      kind: 'offTarget', length: off.length, amount: 0,
      source: settings.template * 1e-7 * off.relativeCopies * off.length / 600 * enzyme.offSeedFactor,
      efficiency: enzyme.efficiency * lengthFactor(off.length, enzyme.lengthScale) *
        binding(settings.primerTm + off.tmOffset + enzyme.annealingOffset, temperature),
    })),
    {
      kind: 'dimer', length: 70, amount: 0,
      source: 6e-6 * sample.dimerPropensity * enzyme.dimerSeedFactor *
        binding(settings.primerTm - 9, temperature),
      efficiency: Math.min(0.95, enzyme.efficiency * 1.06) *
        binding(settings.primerTm - 10 + enzyme.annealingOffset, temperature),
    },
  ];

  const snapshot = cycle => {
    const target = species[0].amount;
    const offTarget = species.filter(s => s.kind === 'offTarget').reduce((n, s) => n + s.amount, 0);
    const dimer = species.at(-1).amount;
    return { cycle, target, offTarget, dimer, total: target + offTarget + dimer };
  };
  const points = [snapshot(0)];

  for (let cycle = 1; cycle <= settings.cycles; cycle++) {
    const previousTotal = points.at(-1).total;
    const remaining = Math.max(0, 100 - previousTotal);
    const availability = remaining / 100;
    const noise = disturbances[cycle - 1];
    const proposals = species.map(s => {
      const jitter = noise[s.kind];
      // The source is a template-equivalent initiation term, not existing amplicon.
      return (s.amount + s.source) * s.efficiency * jitter * availability;
    });
    const demand = proposals.reduce((n, v) => n + v, 0);
    const allocation = demand > remaining ? remaining / demand : 1;
    species.forEach((s, index) => { s.amount += proposals[index] * allocation; });
    points.push(snapshot(cycle));
  }

  const last = points.at(-1);
  const run = {
    temperature, points,
    bands: species.map(({ kind, length, amount }) => ({ kind, length, amount })),
    target: last.target, offTarget: last.offTarget, dimer: last.dimer, total: last.total,
    purity: last.total > 0 ? Math.min(1, last.target / last.total) : 0,
  };
  run.explanation = explain(settings, temperature, run);
  return run;
}

export function simulateExperiment(raw = DEFAULT_SETTINGS) {
  const settings = normalizeSettings(raw);
  const random = randomSource(settings.seed);
  // Precompute once, even for temperature gradients. Equivalent cycles in all
  // tubes share disturbances; changing temperature cannot reshuffle the noise.
  const disturbances = Array.from({ length: settings.cycles }, () => ({
    target: 0.94 + random() * 0.12,
    offTarget: 0.94 + random() * 0.12,
    dimer: 0.94 + random() * 0.12,
  }));
  const temperatures = settings.mode === 'gradient'
    ? Array.from({ length: 6 }, (_, index) =>
      Number((settings.gradientMin + (settings.gradientMax - settings.gradientMin) * index / 5).toFixed(6)))
    : [settings.temperature];
  return {
    modelVersion: MODEL_VERSION, settings,
    runs: temperatures.map(temperature => simulateRun(settings, temperature, disturbances)),
  };
}
