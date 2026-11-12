import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, simulateExperiment } from '../model.js';
import { configurationData, parseConfiguration, csvData } from '../exports.js';
import { createReportSvg, bandY } from '../charts.js';

test('a saved experiment configuration reproduces the complete seeded result',()=>{
  const before=simulateExperiment({...DEFAULT_SETTINGS,seed:937,cycles:12});
  const loaded=parseConfiguration(configurationData(before.settings,before.modelVersion));
  assert.deepEqual(simulateExperiment(loaded),before);
});
test('configuration imports reject unrelated, oversized and out-of-range files',()=>{
  assert.throws(()=>parseConfiguration('{"schema":"other","version":1}'));
  assert.throws(()=>parseConfiguration(' '.repeat(100001)));
  assert.throws(()=>parseConfiguration(JSON.stringify({schema:'pcr-playground',version:1,settings:{...DEFAULT_SETTINGS,cycles:999}})));
});
test('CSV contains every cycle of every run including the same terminal amounts as charts',()=>{
  const result=simulateExperiment({...DEFAULT_SETTINGS,cycles:5});
  const rows=csvData(result).replace(/^\uFEFF/,'').split('\r\n');
  assert.equal(rows.length,1+result.runs.length*6);
  const terminal=rows[6].split(',').map(x=>x.replace(/^"|"$/g,''));
  assert.equal(Number(terminal[10]),result.runs[0].target);
  assert.equal(Number(terminal[13]),result.runs[0].total);
});
test('reports retain simulation labels and settings; band position depends only on length',()=>{
  const result=simulateExperiment(DEFAULT_SETTINGS);
  const report=createReportSvg({...result,modelVersion:'<unsafe&version>'});
  assert.ok(report.includes('教学模拟'));
  assert.ok(report.includes(`Seed ${result.settings.seed}`));
  assert.ok(report.includes('&lt;unsafe&amp;version&gt;'));
  assert.ok(!report.includes('<unsafe&version>'));
  assert.ok(bandY(100)>bandY(1000));
});
