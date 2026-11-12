import { createReportSvg } from './charts.js';
import { normalizeSettings } from './model.js';
export function csvData(result){
  const header=['model_version','mode','sample','enzyme','seed','initial_template_relative','target_length_bp','primer_tm_c','annealing_c','cycle','target_relative','off_target_relative','dimer_relative','total_relative'];
  const rows=result.runs.flatMap(run=>run.points.map(p=>[result.modelVersion,result.settings.mode,result.settings.sample,result.settings.enzyme,result.settings.seed,result.settings.template,result.settings.length,result.settings.primerTm,run.temperature,p.cycle,p.target,p.offTarget,p.dimer,p.total]));
  const quote=x=>'"'+String(x).replaceAll('"','""')+'"';
  return '\uFEFF'+[header,...rows].map(row=>row.map(quote).join(',')).join('\r\n');
}
export function configurationData(settings,modelVersion){return JSON.stringify({schema:'pcr-playground',version:1,modelVersion,settings:normalizeSettings(settings)},null,2);}
export function parseConfiguration(source){
  if(typeof source!=='string'||source.length>100000)throw new Error('配置文件过大，最多支持 100 KB。');
  const data=JSON.parse(source);
  if(!data||data.schema!=='pcr-playground'||data.version!==1||!data.settings)throw new Error('不是受支持的 PCR Playground 配置文件。');
  return normalizeSettings(data.settings);
}
export function download(data,type,name){const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export async function downloadPng(result,selected){
  const data=createReportSvg(result,selected),url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'}));
  try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=2160;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建绘图画布');ctx.drawImage(img,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('图片生成失败');download(blob,'image/png','PCR-Playground-教学模拟.png');}finally{URL.revokeObjectURL(url);}
}
