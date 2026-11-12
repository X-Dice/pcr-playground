import { DEFAULT_SETTINGS, SAMPLES, ENZYMES, normalizeSettings, simulateExperiment } from './model.js';
import { renderScene } from './scene.js';
import { renderAmplification, renderTemperature, renderGel, purityLabel, escapeHtml as esc } from './charts.js';
import { csvData, configurationData, parseConfiguration, download, downloadPng } from './exports.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='pcr-playground-v1';
const state={draft:{...DEFAULT_SETTINGS},result:null,selected:0,history:[],compare:[],theme:'toy',reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,running:false,phase:'idle',cycle:0,pending:null,elapsed:0,timer:null,context:'已载入示例；运行后会保存到实验记录。',invalid:false};
const settingNames={sample:'虚拟样本',enzyme:'聚合酶',mode:'模式',temperature:'退火温度',gradientMin:'梯度起点',gradientMax:'梯度终点',cycles:'循环数',template:'初始模板量',length:'目标片段长度',primerTm:'引物参考 Tm',seed:'随机种子'};
const fmt=n=>n===0?'0':n<0.01?'<0.01':n.toFixed(2);
const labels=v=>SAMPLES[v]?.label||ENZYMES[v]?.label||({gradient:'温度梯度',free:'自由探索'}[v])||v;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,draft:state.draft,theme:state.theme,reduce:state.reduce,history:state.history.map(({id,date,settings,modelVersion})=>({id,date,settings,modelVersion}))}));}catch{toast('浏览器无法保存记录。你仍可以导出配置文件。');}}
function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return;const d=JSON.parse(raw);if(d.version!==1)return;state.draft=normalizeSettings(d.draft);state.theme=d.theme==='notebook'?'notebook':'toy';state.reduce=Boolean(d.reduce);if(Array.isArray(d.history))state.history=d.history.slice(0,20).flatMap(r=>{try{if(typeof r.id!=='string'||typeof r.date!=='string'||!Number.isFinite(Date.parse(r.date)))return [];return [{id:r.id.slice(0,80),date:r.date,settings:normalizeSettings(r.settings),modelVersion:String(r.modelVersion||'')}];}catch{return [];}});}catch{toast('旧的本地记录无法读取，已载入示例。');}}
function enzymeButtons(){
  $('#enzyme-options').innerHTML=Object.entries(ENZYMES).map(([key,e])=>`<button type="button" class="enzyme-option ${key===state.draft.enzyme?'active':''}" data-enzyme="${esc(key)}" aria-pressed="${key===state.draft.enzyme}"><span class="enzyme-bottle" aria-hidden="true"></span><span><strong>${esc(e.label)}</strong><small>${key==='taq'?'经典扩增':key==='hot'?'热启动保护':'高保真复制'}</small></span></button>`).join('');
}
function populateControls(){
  for(const el of $$('[data-key]')){const value=state.draft[el.dataset.key];if(value!==undefined)el.value=value;}
  $('#reduce-motion').checked=state.reduce;document.body.dataset.theme=state.theme;$('#theme-toggle').textContent=state.theme==='toy'?'切换漫画手账':'切换玩具实验室';
  state.invalid=false;enzymeButtons();updateControls();
}
function updateControls(){
  const d=state.draft;$('#gradient-fields').hidden=d.mode!=='gradient';$('#free-fields').hidden=d.mode!=='free';
  for(const el of $$('[data-mode]')){el.setAttribute('aria-pressed',String(el.dataset.mode===d.mode));el.classList.toggle('active',el.dataset.mode===d.mode);}
  $('#cycles-value').textContent=`${d.cycles} 轮`;$('#temperature-value').textContent=`${d.temperature} °C`;
  $('#sample-hint').textContent=SAMPLES[d.sample].description;$('#enzyme-hint').textContent=ENZYMES[d.enzyme].description;
  for(const el of $$('[data-enzyme]')){el.classList.toggle('active',el.dataset.enzyme===d.enzyme);el.setAttribute('aria-pressed',String(el.dataset.enzyme===d.enzyme));}
  const dirty=state.result&&!same(state.draft,state.result.settings);
  $('#status').textContent=state.running?'实验正在运行，设置暂时锁定。':state.invalid?'请检查输入范围，设置尚未应用。':dirty?'设置已更改。运行后，结果才会更新。':'当前图表与这组设置一致。';
  $('#status').classList.toggle('dirty',Boolean(dirty));$('#run').disabled=state.running||state.invalid;$('#repeat').disabled=state.running||state.invalid;
  if(state.result)$('#result-context').textContent=dirty?'下方显示上一次计算结果；当前新设置尚未运行。':state.context;
}
function drawScene(){
  const r=state.running?state.pending:state.result;
  $('#scene').innerHTML=renderScene({temperatures:r.runs.map(q=>q.temperature),selected:Math.min(state.selected,r.runs.length-1),phase:state.phase,cycle:state.cycle,cycles:r.settings.cycles,enzymeLabel:ENZYMES[r.settings.enzyme].label,temperature:r.runs[Math.min(state.selected,r.runs.length-1)].temperature,theme:state.theme});
  $('#scene-caption').textContent=state.running?'正在观察分子们的工作…':state.phase==='done'?'实验完成 · 点击试管看看结果':'预览实验台 · 图示对应下方已计算结果';
}
function selectRun(index){if(state.running)return;const active=document.activeElement,container=active?.closest('#run-selector, #temperature-chart, #gel-chart, #scene')?.id,kind=active?.matches('[data-tube]')?'tube':'run';state.selected=Math.max(0,Math.min(state.result.runs.length-1,Number(index)));drawScene();drawResults();if(container)$(`#${container} [data-${kind}="${state.selected}"]`)?.focus({preventScroll:true});}
function drawResults(){
  const result=state.result,run=result.runs[state.selected],s=result.settings;
  $('#result-subtitle').textContent=`${labels(s.sample)} · ${labels(s.enzyme)} · ${s.cycles} 个循环 · 目标 ${s.length} bp`;
  $('#run-selector').innerHTML=result.runs.map((r,i)=>`<button type="button" data-run="${i}" class="run-chip ${i===state.selected?'active':''}" aria-pressed="${i===state.selected}"><small>第 ${i+1} 管</small><strong>${r.temperature}°C</strong></button>`).join('');
  $('#amplification-chart').innerHTML=renderAmplification(result.runs,state.selected);$('#temperature-chart').innerHTML=renderTemperature(result.runs,state.selected);$('#gel-chart').innerHTML=renderGel(result.runs,state.selected,s.length);
  $('#selected-temperature').textContent=`${run.temperature}°C · 第 ${state.selected+1} 管`;
  $('#metrics').innerHTML=[['目标相对产量',fmt(run.target),'target'],['目标产物占比',run.total<0.1?'—':purityLabel(run),'purity'],['非特异产物',fmt(run.offTarget),'off'],['引物二聚体',fmt(run.dimer),'dimer']].map(([name,value,kind])=>`<div class="metric metric-${kind}"><span>${name}</span><strong>${value}</strong>${kind==='purity'&&run.total<0.1?'<small>产物过少，暂不显示占比</small>':''}</div>`).join('');
  $('#explanation').innerHTML=`<span class="explanation-label">这一轮，观察到了什么？</span><ul>${run.explanation.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`;
  updateControls();
}
function runSummary(result){const best=result.runs.reduce((a,b)=>b.target>a.target?b:a,result.runs[0]);return `${best.temperature}°C 目标相对量 ${fmt(best.target)} · 占比 ${purityLabel(best)}`;}
function drawHistory(){
  $('#history-count').textContent=`${state.history.length} / 20 次`;
  $('#history-list').innerHTML=state.history.length?state.history.map((h,i)=>{const r=simulateExperiment(h.settings),date=new Date(h.date).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});return `<article class="history-item ${state.compare.includes(h.id)?'selected':''}"><div class="history-number">${String(state.history.length-i).padStart(2,'0')}</div><button class="history-open" type="button" data-history="${esc(h.id)}"><strong>${esc(labels(h.settings.mode))} · ${esc(labels(h.settings.enzyme))} · ${h.settings.cycles} 轮</strong><span>${esc(runSummary(r))}</span><small>${esc(date)} · 点击恢复设置与结果${h.modelVersion!==r.modelVersion?' · 已按当前模型重算':''}</small></button><label class="compare-check"><input type="checkbox" data-compare="${esc(h.id)}" ${state.compare.includes(h.id)?'checked':''}> 比较</label></article>`;}).join(''):'<div class="empty-state"><span aria-hidden="true">✎</span><strong>第一条研究笔记，等你来写。</strong><p>点击“运行实验”，完成后会自动保存在这里。</p></div>';
  drawComparison();
}
function drawComparison(){
  const histories=state.compare.map(id=>state.history.find(h=>h.id===id)).filter(Boolean);
  if(histories.length<2){$('#comparison').innerHTML=histories.length?'<p>再勾选一次实验，就可以并排比较。</p>':'';return;}
  const [a,b]=histories.map(h=>simulateExperiment(h.settings));
  const differences=Object.keys(settingNames).filter(k=>a.settings[k]!==b.settings[k]);
  const row=(label,x,y)=>`<tr><th scope="row">${esc(label)}</th><td>${esc(x)}</td><td>${esc(y)}</td></tr>`;
  const nearestB=temp=>b.runs.reduce((p,q)=>Math.abs(q.temperature-temp)<Math.abs(p.temperature-temp)?q:p,b.runs[0]);
  $('#comparison').innerHTML=`<h3>两次实验，哪里不同？</h3><div class="comparison-scroll"><table><thead><tr><th>改变的参数</th><th>实验 A</th><th>实验 B</th></tr></thead><tbody>${differences.length?differences.map(k=>row(settingNames[k],labels(a.settings[k]),labels(b.settings[k]))).join(''):row('设置','完全相同','完全相同')}</tbody></table><table><thead><tr><th>A 温度 / B 最近温度</th><th>A 目标量 / 占比</th><th>B 目标量 / 占比</th></tr></thead><tbody>${a.runs.map(q=>{const z=nearestB(q.temperature);return row(`${q.temperature}°C / ${z.temperature}°C`,`${fmt(q.target)} / ${purityLabel(q)}`,`${fmt(z.target)} / ${purityLabel(z)}`);}).join('')}</tbody></table></div><p class="hint">比较按当前模型重算，并使用相同产量尺度。改变多个参数时，无法把差异只归因于其中一个因素。随机种子变化代表模型重复。</p>`;
}
function setLocked(value){for(const el of $$('#controls input, #controls select, #controls button, [data-mode]'))el.disabled=value;$('#skip').hidden=!value;updateControls();}
function finish(){
  if(!state.running)return;clearTimeout(state.timer);state.result=state.pending;state.pending=null;state.running=false;state.phase='done';state.cycle=state.result.settings.cycles;state.selected=Math.min(state.selected,state.result.runs.length-1);
  state.history.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),settings:{...state.result.settings},modelVersion:state.result.modelVersion});state.history=state.history.slice(0,20);state.compare=state.compare.filter(id=>state.history.some(h=>h.id===id));state.context='实验已完成并保存在当前浏览器；图表均来自本次模拟。';
  setLocked(false);drawScene();drawResults();drawHistory();save();$('#phase-text').textContent='实验完成！点击试管、曲线或泳道，查看同一组结果。';toast('实验完成，已添加到实验记录。');
}
function start(){
  if(state.running||state.invalid)return;
  try{state.draft=normalizeSettings(state.draft);state.pending=simulateExperiment(state.draft);}catch(e){toast(`设置有误：${e.message}`);return;}
  state.running=true;state.phase='denature';state.cycle=0;state.elapsed=0;setLocked(true);drawScene();
  if(state.reduce||state.pending.settings.cycles===0){finish();return;}
  const phaseNames={denature:'变性 Denaturation · DNA 双链分开',anneal:'退火 Annealing · 引物寻找结合位点',extend:'延伸 Extension · 聚合酶复制 DNA'};
  function tick(){if(!state.running)return;const step=state.elapsed++,cycle=Math.floor(step/3)+1;if(cycle>state.pending.settings.cycles){finish();return;}state.phase=['denature','anneal','extend'][step%3];state.cycle=cycle;$('#phase-text').textContent=`第 ${cycle} / ${state.pending.settings.cycles} 轮 · ${phaseNames[state.phase]}`;drawScene();state.timer=setTimeout(tick,130/Number($('#speed').value));}tick();
}
$('#controls').addEventListener('submit',e=>{e.preventDefault();start();});
$('#controls').addEventListener('input',e=>{
  const key=e.target.dataset.key;if(!key)return;
  const numeric=!['sample','enzyme','mode'].includes(key),value=numeric?Number(e.target.value):e.target.value;
  if(numeric&&(e.target.value===''||!e.target.checkValidity())){state.invalid=true;updateControls();return;}
  for(const el of $$(`[data-key="${key}"]`))el.value=value;
  try{const next={...state.draft};for(const el of $$('#controls [name][data-key]')){if(el.value===''||!el.checkValidity())throw new Error('请检查输入范围。');next[el.dataset.key]=el.dataset.key==='sample'?el.value:Number(el.value);}if(key==='sample')next.template=value==='low'?3:100;state.draft=normalizeSettings(next);state.invalid=false;if(key==='sample')$('[data-key="template"]').value=state.draft.template;updateControls();save();}catch(err){state.invalid=true;updateControls();$('#status').textContent=err.message;}
});
document.addEventListener('click',e=>{
  const mode=e.target.closest('[data-mode]'),enzyme=e.target.closest('[data-enzyme]'),run=e.target.closest('[data-run]'),tube=e.target.closest('[data-tube]'),history=e.target.closest('[data-history]');
  if(mode&&!state.running){state.draft.mode=mode.dataset.mode;updateControls();save();}
  if(enzyme&&!state.running){state.draft.enzyme=enzyme.dataset.enzyme;updateControls();save();}
  if(run)selectRun(run.dataset.run);if(tube)selectRun(tube.dataset.tube);
  if(history&&!state.running){const h=state.history.find(h=>h.id===history.dataset.history);state.draft={...h.settings};state.result=simulateExperiment(state.draft);state.selected=0;state.phase='done';state.cycle=h.settings.cycles;state.context=h.modelVersion===state.result.modelVersion?'已恢复这次实验的设置与结果。':'历史设置已恢复；结果按当前模型版本重新计算。';populateControls();drawScene();drawResults();save();toast('已恢复实验；你可以修改一个变量再运行。');}
});
document.addEventListener('keydown',e=>{const run=e.target.closest('[data-run]');if(run&&['Enter',' '].includes(e.key)){e.preventDefault();selectRun(run.dataset.run);}});
$('#history-list').addEventListener('change',e=>{const id=e.target.dataset.compare;if(!id)return;if(e.target.checked){if(state.compare.length>=2){e.target.checked=false;toast('一次比较两条实验记录。');return;}state.compare.push(id);}else state.compare=state.compare.filter(v=>v!==id);drawHistory();$$('[data-compare]').find(el=>el.dataset.compare===id)?.focus({preventScroll:true});});
$('#theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='toy'?'notebook':'toy';document.body.dataset.theme=state.theme;$('#theme-toggle').textContent=state.theme==='toy'?'切换漫画手账':'切换玩具实验室';drawScene();save();});
$('#reduce-motion').addEventListener('change',e=>{state.reduce=e.target.checked;document.body.classList.toggle('reduce-motion',state.reduce);if(state.reduce&&state.running)finish();save();});
$('#skip').addEventListener('click',finish);
$('#repeat').addEventListener('click',()=>{state.draft.seed=(state.draft.seed+7919)>>>0;populateControls();save();start();});
$('#export-csv').addEventListener('click',()=>download(csvData(state.result),'text/csv;charset=utf-8','PCR-Playground-教学模拟.csv'));
$('#export-json').addEventListener('click',()=>download(configurationData(state.result.settings,state.result.modelVersion),'application/json','PCR-Playground.pcr.json'));
$('#export-png').addEventListener('click',async()=>{const el=$('#export-png');el.disabled=true;try{await downloadPng(state.result,state.selected);toast('已导出带参数摘要的教学模拟结果图。');}catch(e){toast(`图片导出失败：${e.message}`);}finally{el.disabled=false;}});
$('#import-json').addEventListener('click',()=>{if(state.running){toast('请等本轮完成后再打开配置。');return;}$('#file-input').click();});
$('#file-input').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw new Error('文件超过 100 KB');const d=parseConfiguration(await file.text());state.draft=d;state.result=simulateExperiment(d);state.selected=0;state.phase='done';state.cycle=d.cycles;state.context='已打开配置并按当前模型计算结果；运行后加入实验记录。';populateControls();drawScene();drawResults();save();toast('配置已打开，结果已按该种子重建。');}catch(err){toast(`无法打开：${err.message}`);}finally{e.target.value='';}});

load();state.result=simulateExperiment(state.draft);if(state.history.length)state.context='已恢复上次保存的设置；结果按当前模型计算。';populateControls();document.body.classList.toggle('reduce-motion',state.reduce);drawScene();drawResults();drawHistory();
