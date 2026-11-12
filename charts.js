export const COLORS = { target: '#168e86', offTarget: '#d17a39', dimer: '#9c6bb1', purity: '#536cad' };
export const purityLabel = run => run.total < 0.1 ? '—（产物过少）' : `${(run.purity*100).toFixed(1)}%`;
export const escapeHtml = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f = n => Number(n).toFixed(2);
const svg = (w,h,title,body) => `<svg xmlns="http://www.w3.org/2000/svg" class="plot-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(title)}"><title>${escapeHtml(title)}</title><rect width="${w}" height="${h}" rx="12" fill="#fffdf8"/>${body}</svg>`;
const text = (x,y,t,extra='') => `<text x="${f(x)}" y="${f(y)}" font-family="system-ui, sans-serif" font-size="11" ${extra.includes('fill=')?'':'fill="#566566"'} ${extra}>${escapeHtml(t)}</text>`;
function axes(w,h,xMax,xLabel){
  const l=48,r=w-32,t=25,b=h-38;
  let out='';
  for(let n=0;n<=100;n+=25){const y=b-(b-t)*n/100;out+=`<path d="M${l} ${f(y)}H${r}" stroke="#e5e7e0" stroke-dasharray="3 4"/>`+text(l-9,y+4,n,'text-anchor="end"');}
  out+=`<path d="M${l} ${t}V${b}H${r}" fill="none" stroke="#a6b4ac"/>`;
  for(let n=0;n<=4;n++){const x=l+(r-l)*n/4;out+=text(x,b+18,Math.round(xMax*n/4),'text-anchor="middle"');}
  out+=text(r,b+33,xLabel,'text-anchor="end"');
  return {out,l,r,t,b};
}
export function renderAmplification(runs,selected=0){
  const w=540,h=275,run=runs[selected],max=Math.max(run.points.at(-1).cycle,1),a=axes(w,h,max,'循环数');
  let out=a.out+text(a.l,13,'新增产物 · 相对量（统一尺度）');
  for(const [key,dash] of [['target',''],['offTarget','7 4'],['dimer','2 4']]){
    const d=run.points.map((p,i)=>`${i?'L':'M'}${f(a.l+(a.r-a.l)*p.cycle/max)} ${f(a.b-(a.b-a.t)*p[key]/100)}`).join(' ');
    out+=`<path d="${d}" fill="none" stroke="${COLORS[key]}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:''} stroke-linecap="round"/>`;
  }
  return svg(w,h,`${run.temperature}°C 的模拟产物随循环数变化；相对量0到100`,out);
}
export function renderTemperature(runs,selected=0){
  const w=540,h=275,l=48,r=492,t=26,b=237;
  const min=runs.length===1?runs[0].temperature-2:runs[0].temperature,max=runs.length===1?runs[0].temperature+2:runs.at(-1).temperature;
  const x=v=>l+(r-l)*(v-min)/(max-min||1),y=v=>b-(b-t)*v/100;
  let out=text(l,13,'相对产量')+text(r,13,'目标占比 %','text-anchor="end"');
  for(let n=0;n<=100;n+=25)out+=`<path d="M${l} ${y(n)}H${r}" stroke="#e5e7e0" stroke-dasharray="3 4"/>`+text(l-9,y(n)+4,n,'text-anchor="end"')+text(r+9,y(n)+4,n);
  for(const [key,color,dash] of [['target',COLORS.target,''],['purity',COLORS.purity,'6 4']]){
    let continuing=false;const segments=runs.map(q=>{if(key==='purity'&&q.total<0.1){continuing=false;return '';}const command=continuing?'L':'M';continuing=true;return `${command}${f(x(q.temperature))} ${f(y(key==='purity'?q.purity*100:q.target))}`;}).join(' ');out+=`<path d="${segments}" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="${dash}"/>`;
  }
  runs.forEach((q,i)=>{out+=`<g data-run="${i}" role="button" tabindex="0" aria-label="选择 ${q.temperature}°C 结果"><title>${q.temperature}°C：目标相对量 ${q.target.toFixed(2)}，目标占比 ${purityLabel(q)}</title><rect x="${f(x(q.temperature)-15)}" y="${t}" width="30" height="${b-t}" rx="10" fill="${i===selected?'#e7eee4':'transparent'}" opacity="0.55"/><circle cx="${f(x(q.temperature))}" cy="${f(y(q.target))}" r="${i===selected?6:4}" fill="${COLORS.target}"/>${q.total>=0.1?`<circle cx="${f(x(q.temperature))}" cy="${f(y(q.purity*100))}" r="4" fill="#fffdf8" stroke="${COLORS.purity}" stroke-width="2"/>`:''}</g>`+text(x(q.temperature),b+19,`${q.temperature}°`,'text-anchor="middle"');});
  out+=text(r,b+33,'退火温度 °C','text-anchor="end"');
  out+=text(l+10,t+20,runs.length===1?'自由探索：保存多次实验，可在下方比较。':'总产物不足 0.1 时隐藏占比（教学显示阈值）');
  return svg(w,h,'退火温度与目标相对产量及目标占比；点击数据点选择结果组',out);
}
export function bandY(length){return 62+(Math.log10(6500)-Math.log10(length))/(Math.log10(6500)-Math.log10(50))*192;}
export function renderGel(runs,selected=0,targetLength=600){
  const w=540,h=290,l=87,laneW=Math.min(48,326/(runs.length+1)),step=326/(runs.length+1);
  let out=`<defs><filter id="gelGlow"><feGaussianBlur stdDeviation="2"/></filter></defs><rect x="24" y="12" width="491" height="255" rx="16" fill="#173940"/><rect x="37" y="46" width="465" height="209" rx="8" fill="#102c34"/>`;
  const ladder=[100,250,500,1000,2000,5000];
  out+=text(l,33,'Ladder','text-anchor="middle" fill="#d4e5df"');
  for(const bp of ladder){const y=bandY(bp);out+=`<rect x="${l-laneW/2}" y="${f(y-2)}" width="${laneW}" height="4" rx="2" fill="#92e9c2" opacity="${bp===500||bp===1000?.95:.6}"/>`+text(58,y+4,bp,'text-anchor="end" fill="#a5c1bf"');}
  const targetY=bandY(targetLength);
  out+=`<path d="M${l+step-30} ${f(targetY)}H481" stroke="#d9b77b" stroke-dasharray="3 5" opacity=".5"/>`;
  runs.forEach((run,i)=>{const x=l+step*(i+1);out+=`<g data-run="${i}" role="button" tabindex="0" aria-label="选择泳道 ${i+1}，${run.temperature}°C"><title>${run.temperature}°C，模拟目标 ${targetLength} bp</title><rect x="${f(x-step/2+2)}" y="45" width="${f(step-4)}" height="211" rx="7" fill="${i===selected?'#7dd4bd':'#6b989b'}" opacity="${i===selected?'.13':'.035'}"/><rect x="${f(x-laneW/2)}" y="49" width="${laneW}" height="5" rx="2" fill="#08222a"/>`+text(x,33,`${run.temperature}°`,'text-anchor="middle" fill="#e5eadd"');
    for(const band of run.bands){if(band.amount<0.0005)continue;const y=bandY(band.length),opacity=Math.min(.98,1-Math.exp(-band.amount/12)),height=band.kind==='dimer'?3:4;out+=`<rect x="${f(x-laneW/2-1)}" y="${f(y-3)}" width="${laneW+2}" height="6" rx="3" fill="#72e7c0" opacity="${f(opacity*.5)}" filter="url(#gelGlow)"/><rect x="${f(x-laneW/2)}" y="${f(y-height/2)}" width="${laneW}" height="${height}" rx="2" fill="#b1ffd7" opacity="${f(opacity)}"/>`;}
    out+='</g>';});
  out+=text(35,281,'bp · 同一曝光 · 教学模拟胶图')+text(504,281,`虚线：目标 ${targetLength} bp`,'text-anchor="end"');
  return svg(w,h,'教学模拟电泳胶图；全部条带使用统一荧光颜色与显示曝光',out);
}
export function createReportSvg(result,selected=0){
  const s=result.settings,run=result.runs[selected];
  const place=(str,x,y,width,height)=>str.replace('<svg ',`<svg x="${x}" y="${y}" width="${width}" height="${height}" `);
  const font='font-family="system-ui, sans-serif"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1080" viewBox="0 0 1200 1080"><rect width="1200" height="1080" fill="#f5efe1"/><g ${font} fill="#25494a"><text x="40" y="60" font-size="30" font-weight="700">PCR Playground｜实验结果</text><text x="40" y="93" font-size="16">教学模拟 · 相对量 · 非实测 qPCR · 未经真实实验数据校准</text><text x="40" y="132" font-size="15">模式 ${s.mode==='gradient'?'温度梯度':'自由探索'} / 样本 ${escapeHtml(s.sample)} / 酶 ${escapeHtml(s.enzyme)} / ${s.cycles} cycles / 目标 ${s.length} bp</text><text x="40" y="160" font-size="15">模板 ${s.template} / 引物参考 Tm ${s.primerTm}°C / Seed ${s.seed} / 模型 ${escapeHtml(result.modelVersion)}</text><text x="40" y="201" font-size="18">选中 ${run.temperature}°C：目标相对量 ${run.target.toFixed(3)}；目标占比 ${escapeHtml(purityLabel(run))}</text></g>${place(renderAmplification(result.runs,selected),30,225,560,295)}${place(renderGel(result.runs,selected,s.length),610,225,560,300)}${place(renderTemperature(result.runs,selected),30,550,560,295)}<g ${font} fill="#34585a"><text x="645" y="582" font-size="20" font-weight="700">本轮参数与终点产物</text>${result.runs.map((q,i)=>`<text x="645" y="${620+i*29}" font-size="15">${q.temperature}°C · 目标 ${q.target.toFixed(2)} · 非特异 ${q.offTarget.toFixed(2)} · 二聚体 ${q.dimer.toFixed(2)}</text>`).join('')}<text x="40" y="535" font-size="13">绿实线：目标 / 橙虚线：非特异 / 紫点线：二聚体</text><text x="40" y="872" font-size="13">绿实线：目标相对量 / 蓝虚线：目标占比</text><text x="40" y="930" font-size="15">统一模型计算，保留各组相对量的可比性；目标占比按模拟 DNA 量计算。</text><text x="40" y="961" font-size="15">模拟胶图受显示曝光与检测阈值影响；条带不用于确认序列正确。</text><text x="40" y="1020" font-size="13">PCR Playground · MIT · 原创矢量绘图</text></g></svg>`;
}
