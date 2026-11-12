const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const phaseNames = { idle: '等待你的第一个发现', denature: '变性 · 双链分开', anneal: '退火 · 引物寻找位置', extend: '延伸 · 复制新的 DNA', done: '完成 · 去看看结果吧' };

function tubeSvg(index, active, phase, note) {
  const colors = ['#7bbdd3', '#79c8c0', '#a7cf91', '#e9cf7b', '#ecae78', '#e8978c'];
  const color = colors[index % colors.length];
  const id = `tube-${index}`;
  return `<svg viewBox="0 0 90 180" aria-hidden="true" class="tube-art">
    <defs><linearGradient id="${id}-glass" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".91"/><stop offset=".45" stop-color="#dbf4ee" stop-opacity=".38"/><stop offset="1" stop-color="#a4c8c5" stop-opacity=".75"/></linearGradient><linearGradient id="${id}-liquid" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}" stop-opacity=".8"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
    ${active ? '<ellipse cx="45" cy="157" rx="36" ry="11" fill="#f9e294" opacity=".85"/>' : ''}
    <path d="M22 38H68V111Q67 128 49 151Q45 157 41 151Q23 128 22 111Z" fill="url(#${id}-glass)" stroke="${note ? '#344b47' : '#86aaa5'}" stroke-width="${note ? '3' : '2'}"/>
    <path d="M25 89Q45 84 65 89V111Q62 128 45 147Q28 128 25 111Z" fill="url(#${id}-liquid)"/>
    <ellipse cx="45" cy="89" rx="20" ry="4" fill="${color}" opacity=".65"/>
    <path d="M29 48V102" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <g class="tube-dna ${phase === 'denature' ? 'is-separated' : ''}" fill="none" stroke-linecap="round" stroke-width="3"><path d="M37 103Q54 110 37 118Q30 123 43 131" stroke="#315d65"/><path d="M52 103Q35 110 52 118Q59 123 46 131" stroke="#fff5d9"/><path d="M39 107H50M37 117H52M40 126H50" stroke="#fff5d9" stroke-width="2"/></g>
    <rect x="16" y="24" width="58" height="19" rx="5" fill="${color}" stroke="${note ? '#344b47' : '#6d9996'}" stroke-width="${note ? '3' : '1.5'}"/>
    <ellipse cx="45" cy="25" rx="29" ry="6" fill="${color}" stroke="${note ? '#344b47' : '#6d9996'}" stroke-width="${note ? '3' : '1.5'}"/>
    <path d="M23 31V37M29 32V38M61 32V38M67 31V37" stroke="#fff" opacity=".45" stroke-width="2"/>
    <text x="45" y="77" fill="#355452" font-size="16" font-weight="800" text-anchor="middle">${String(index + 1).padStart(2, '0')}</text>
    ${phase === 'extend' ? '<g class="tube-spark" fill="#fff8cf"><path d="m69 67 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z"/></g>' : ''}
  </svg>`;
}

export function renderScene({ temperatures = [50, 54, 58, 62, 66, 70], selected = 0, phase = 'idle', cycle = 0, cycles = 30, enzymeLabel = '标准聚合酶', temperature = 60, theme = 'toy' } = {}) {
  const note = theme === 'notebook';
  const ink = note ? '#344b47' : '#466365';
  const machine = note ? '#f7dda1' : 'url(#pcr-body)';
  const label = phaseNames[phase] || phaseNames.idle;
  const selectedTemp = Number.isFinite(temperatures[selected]) ? temperatures[selected] : temperature;
  const tubes = temperatures.map((temp, i) => `<button type="button" class="scene-tube ${i === selected ? 'is-selected' : ''}" data-tube="${i}" aria-pressed="${i === selected}" aria-label="选择第 ${i + 1} 管，退火温度 ${esc(temp)} 摄氏度" style="--tube-i:${i}">${tubeSvg(i, i === selected, phase, note)}<span class="tube-temperature">${esc(temp)}<small>°C</small></span></button>`).join('');
  return `<div class="illustrated-bench is-${esc(phase)}" data-scene-theme="${note ? 'notebook' : 'toy'}">
  <svg class="bench-illustration" viewBox="0 0 1000 650" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="pcr-wall" x1="500" y1="0" x2="500" y2="650" gradientUnits="userSpaceOnUse"><stop stop-color="#f2ede0"/><stop offset=".7" stop-color="#f9f3e9"/><stop offset="1" stop-color="#efe2cb"/></linearGradient>
      <linearGradient id="pcr-body" x1="440" y1="330" x2="800" y2="510" gradientUnits="userSpaceOnUse"><stop stop-color="#a0d7c9"/><stop offset=".6" stop-color="#76b9ae"/><stop offset="1" stop-color="#55968e"/></linearGradient>
      <linearGradient id="pcr-lid" x1="430" y1="85" x2="760" y2="280" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".48" stop-color="#b6e1df" stop-opacity=".32"/><stop offset="1" stop-color="#81bfc0" stop-opacity=".56"/></linearGradient>
      <linearGradient id="pcr-bench" x1="500" y1="450" x2="500" y2="620" gradientUnits="userSpaceOnUse"><stop stop-color="#f5dfbd"/><stop offset="1" stop-color="#dfbd8d"/></linearGradient>
      <linearGradient id="pcr-coral" x1="150" y1="260" x2="230" y2="380" gradientUnits="userSpaceOnUse"><stop stop-color="#f7b794"/><stop offset="1" stop-color="#db886e"/></linearGradient>
      <linearGradient id="pcr-screen" x1="520" y1="350" x2="710" y2="450" gradientUnits="userSpaceOnUse"><stop stop-color="#355e59"/><stop offset="1" stop-color="#21423f"/></linearGradient>
      <pattern id="pcr-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" stroke="#86b2b0" stroke-opacity=".2" stroke-width="1"/></pattern>
      <pattern id="pcr-speckle" width="53" height="41" patternUnits="userSpaceOnUse"><circle cx="4" cy="11" r=".8" fill="#816b4d" opacity=".12"/><circle cx="30" cy="31" r=".7" fill="#816b4d" opacity=".1"/></pattern>
      <filter id="pcr-shadow" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#715b35" flood-opacity=".15"/></filter>
      <filter id="pcr-smallshadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="2" dy="5" stdDeviation="3" flood-color="#715b35" flood-opacity=".16"/></filter>
    </defs>
    <rect width="1000" height="650" fill="${note ? '#faf6e8' : 'url(#pcr-wall)'}"/>
    ${note ? '<rect width="1000" height="650" fill="url(#pcr-grid)"/><path d="M32 0V650" stroke="#df8d79" stroke-opacity=".5" stroke-width="2"/>' : '<path d="M0 181H1000M0 346H1000" stroke="#ded7c7" stroke-width="2"/><path d="M235 0V181M580 0V181M920 0V181M65 181V346M405 181V346M750 181V346" stroke="#e2dbcd" stroke-width="2"/>'}
    <rect width="1000" height="650" fill="url(#pcr-speckle)"/>
    <path d="M0 481 1000 445V650H0Z" fill="${note ? '#e9d7b7' : 'url(#pcr-bench)'}"/>
    <path d="m0 481 1000-36" stroke="${note ? ink : '#d1ae7e'}" stroke-width="${note ? '3' : '2'}"/>
    <path d="m0 590 1000-40" stroke="#c8a478" stroke-opacity=".3" stroke-width="2"/>
    <ellipse cx="625" cy="501" rx="268" ry="37" fill="#826e51" opacity=".14"/>
    <!-- A small wall shelf, bottles and a hand-written reminder. -->
    <g transform="translate(55 54) rotate(-5 100 70)" filter="url(#pcr-smallshadow)">
      <path d="M0 6 182 0 190 141 6 147Z" fill="${note ? '#fff4a5' : '#f7dfa2'}" stroke="${note ? ink : '#dec58b'}" stroke-width="${note ? '2' : '1'}"/>
      <path d="m54-6 76-4 2 22-74 5Z" fill="#e0bba6" opacity=".68"/>
      <text x="22" y="42" fill="#6c6850" font-size="12" font-weight="600" letter-spacing="2">TODAY'S QUESTION</text>
      <text x="21" y="76" fill="#3e5b55" font-size="19" font-weight="800">温度差一点，</text>
      <text x="21" y="105" fill="#3e5b55" font-size="19" font-weight="800">结果会怎样？</text>
      <path d="m20 119 127-3" stroke="#dc947a" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(55 267)" stroke="${ink}" stroke-width="${note ? '2.8' : '1.5'}">
      <path d="m-2 119 248-6 16 17-250 10Z" fill="#d5a880"/><path d="m12 140 250-10v13L12 153Z" fill="#bb8967"/>
      <g transform="translate(18 6)"><rect x="5" y="16" width="54" height="92" rx="12" fill="#d8e8e1"/><rect x="13" width="38" height="24" rx="5" fill="#7ab9b4"/><path d="M17 39V88" stroke="#fff" stroke-width="4" opacity=".7"/><rect x="10" y="51" width="45" height="36" rx="3" fill="#fff9eb" stroke="none"/><text x="32" y="67" fill="#4e6b63" stroke="none" text-anchor="middle" font-size="10" font-weight="800">dNTP</text><path d="m26 76 5-5 5 5-5 5Z" fill="#eab16c" stroke="none"/></g>
      <g transform="translate(91 -9)"><rect x="5" y="20" width="62" height="105" rx="13" fill="${note ? '#edaa94' : 'url(#pcr-coral)'}"/><rect x="15" width="42" height="27" rx="5" fill="#d68c76"/><path d="M18 45V101" stroke="#ffe6d8" stroke-width="5" opacity=".6"/><rect x="10" y="61" width="52" height="37" rx="3" fill="#fff5df" stroke="none"/><text x="36" y="77" fill="#7f5749" stroke="none" text-anchor="middle" font-size="10" font-weight="800">ENZYME</text><text x="36" y="90" fill="#9d7460" stroke="none" text-anchor="middle" font-size="8">KEEP COOL</text></g>
      <g transform="translate(174 14)"><path d="M11 20H45V47L59 99Q61 107 51 108H5Q-4 107-1 99L11 47Z" fill="#d8e7eb"/><path d="M4 76H53L59 99Q61 107 51 108H5Q-4 107-1 99Z" fill="#9dc7d5" stroke="none"/><rect x="8" y="12" width="40" height="14" rx="3" fill="#7b9da8"/><text x="29" y="91" fill="#31586a" stroke="none" text-anchor="middle" font-size="12" font-weight="800">H₂O</text></g>
    </g>
    <!-- Cutaway PCR machine: open translucent lid, deep rack and tactile controls. -->
    <g stroke="${ink}" stroke-width="${note ? '3' : '1.8'}" stroke-linejoin="round" filter="${note ? 'none' : 'url(#pcr-shadow)'}">
      <path d="m359 278 87 70v164l-87-68Z" fill="${note ? '#e6b97c' : '#5f9f95'}"/>
      <path d="m446 348 400-26v141q0 20-21 24l-379 30Z" fill="${machine}"/>
      <path d="m359 278 400-28 87 72-400 26Z" fill="${note ? '#fff1cd' : '#c8e5d9'}"/>
      <path d="m393 283 354-22 65 50-353 23Z" fill="${note ? '#a2b5a0' : '#527f75'}"/>
      <path d="m414 287 321-19 49 37-321 20Z" fill="${note ? '#d8e6cc' : '#bed7c5'}"/>
      <path d="m398 270 31-171q3-18 22-17l337 20q21 2 17 24l-34 150Z" fill="${note ? '#d9ece6' : 'url(#pcr-lid)'}" stroke="${note ? ink : '#89b3ad'}" stroke-width="${note ? '3' : '4'}"/>
      <path d="m418 250 27-141 333 19-30 127Z" stroke="${note ? ink : '#fff'}" stroke-width="${note ? '2' : '3'}" opacity=".7"/>
      <path d="m462 103 238 15-32 125-235-4Z" fill="#fff" opacity="${note ? '.14' : '.3'}" stroke="none"/>
      <path d="m464 109 22 1-29 128-22-1Z" fill="#fff" opacity=".45" stroke="none"/>
      <path d="m401 273 24 17M749 277l26 16" stroke="#64847b" stroke-width="8" stroke-linecap="round"/>
      <path d="m463 359 363-24" stroke="#e2f0df" stroke-width="4" opacity=".6"/>
      <path d="m371 390 54 43M371 402l54 43M371 414l54 43" stroke="#3f7b73" stroke-width="4" stroke-linecap="round" opacity=".6"/>
      <path d="m478 381 202-14q13-1 13 12v61q0 12-13 13l-202 16q-12 1-12-12v-64q0-11 12-12Z" fill="${note ? '#eaf0d9' : 'url(#pcr-screen)'}"/>
      <path d="m481 392 18-1" stroke="${note ? '#669263' : '#b7e0b6'}" stroke-width="3"/>
      <text x="508" y="395" fill="${note ? ink : '#b4d9bd'}" stroke="none" font-size="11" letter-spacing="1.5">ANNEALING SET</text>
      <text x="484" y="433" fill="${note ? '#3a6653' : '#e1f2ce'}" stroke="none" font-family="ui-monospace,SFMono-Regular,monospace" font-size="35" font-weight="600">${Number(selectedTemp).toFixed(1)}<tspan font-size="20"> °C</tspan></text>
      <text x="486" y="454" fill="${note ? ink : '#b4d9bd'}" stroke="none" font-size="10">CYCLE ${esc(cycle)} / ${esc(cycles)}</text>
      <ellipse cx="757" cy="398" rx="31" ry="33" fill="${note ? '#fcf0d5' : '#e9e6d6'}"/>
      <ellipse cx="757" cy="394" rx="25" ry="27" fill="${note ? '#fff8e8' : '#faf4e4'}"/>
      <path d="m757 376v11" stroke="#c78364" stroke-width="4" stroke-linecap="round"/>
      <path d="m730 359-4-6M743 351l-1-7M759 349v-7M775 352l3-6M788 360l5-5" stroke="#3d7167" stroke-width="2"/>
      <rect x="731" y="447" width="55" height="13" rx="6" fill="${phase === 'idle' ? '#e6dcc2' : phase === 'done' ? '#e7dc8a' : '#f5c88f'}"/>
      <circle cx="741" cy="453" r="3" fill="${phase === 'idle' ? '#92a593' : '#cc7a4f'}" stroke="none" class="machine-light"/>
      <text x="802" y="380" fill="#2f655b" font-size="10" stroke="none" font-weight="800" transform="rotate(-4 802 380)">PCR</text>
      <path d="m463 490 352-27" stroke="#3d8076" stroke-width="3" opacity=".65"/>
      <path d="m474 517v10h30v-12M785 492v10h27v-13" fill="#476b60"/>
    </g>
    <!-- A DNA companion, a tiny primer, and the bench notebook. -->
    <g class="dna-companion" transform="translate(95 431)" stroke="${ink}" stroke-width="${note ? '3' : '2'}" stroke-linecap="round">
      <ellipse cx="65" cy="143" rx="62" ry="11" fill="#9f8864" opacity=".18" stroke="none"/>
      <path d="M33 2C107 18 10 55 88 83C134 105 12 117 67 143" stroke="#eaa489" stroke-width="18"/>
      <path d="M92 2C18 18 115 55 37 83C-9 105 113 117 58 143" stroke="#8cbdb8" stroke-width="18"/>
      <path d="M40 11H84M44 44H81M40 76H85M31 109H86M51 135H74" stroke="#f9e3a5" stroke-width="7"/>
      <rect x="21" y="51" width="38" height="25" rx="10" fill="#fff8de"/><rect x="64" y="51" width="38" height="25" rx="10" fill="#fff8de"/><path d="M59 59h5"/>
      <circle cx="42" cy="64" r="4" fill="${ink}" stroke="none"/><circle cx="81" cy="64" r="4" fill="${ink}" stroke="none"/>
      <path d="M54 86q9 8 18-1"/><path d="M24 91 3 82M99 88l22-18"/><path d="m118 71 5-9m-3 8 9-3"/>
      <path d="m47 140-12 8m39-8 12 7"/>
    </g>
    <g transform="translate(842 55) rotate(9 64 50)" stroke="${ink}" stroke-width="${note ? '2.5' : '1.5'}">
      <rect x="-4" width="118" height="115" rx="${note ? '0' : '5'}" fill="#e0e6cc"/>
      <path d="m24-6 58 2-3 19-57-2Z" fill="#d3b89b" opacity=".65" stroke="none"/>
      <path d="M20 39Q45 19 65 41T95 40" stroke="#de987b" stroke-width="9" stroke-linecap="round"/><path d="m32 30 4 12M48 32l-2 13M64 41l-4 9" stroke="#fff2ce" stroke-width="3"/>
      <text x="19" y="76" fill="#526757" stroke="none" font-size="12" font-weight="700">小引物，大作用。</text><path d="m24 88 62 3" stroke="#90aa8a" stroke-width="2"/>
    </g>
    <g transform="translate(793 522) rotate(-8 82 40)" stroke="${ink}" stroke-width="${note ? '2.5' : '1.2'}">
      <path d="M0 10 132 0 173 51 35 69Z" fill="#cfaf83"/>
      <path d="M4 3 130-7 168 46 37 60Z" fill="#fff8e6"/>
      <path d="m83-2 34 51" stroke="#bcbda7"/>
      <path d="m20 13 54-4m-47 15 54-4m-45 16 52-4m14-11 38-3m-32 14 36-3" stroke="#b5c2b1" stroke-width="2"/>
      <path d="m89 5 12 7 6-10" stroke="#da9c7e" stroke-width="3"/>
    </g>
    <g transform="translate(888 378) rotate(11)" stroke="${ink}" stroke-width="${note ? '2.5' : '1.5'}"><path d="M0 0H25V66L15 94H10L0 66Z" fill="#f4d6a6"/><rect x="-3" y="-17" width="31" height="24" rx="7" fill="#e1a080"/><path d="M9 92v29h7V92" fill="#cee1d8"/><path d="M12 122v21" stroke-width="3"/><path d="M7 21h11M7 29h11M7 37h11" stroke="#b59671"/></g>
    <path d="m286 448 22 7-16 14m16-14-48 39" stroke="#bc8b65" stroke-width="3" stroke-linecap="round"/>
    <text x="235" y="526" fill="#917858" font-size="12" transform="rotate(-8 235 526)">one variable at a time.</text>
    ${note ? '<path d="M347 532q70 15 141-1m341-35 28-5M331 253l-8-16m15 7-2-19" stroke="#536b5d" stroke-width="3" stroke-linecap="round"/><text x="565" y="594" fill="#7b6d4d" font-size="18" transform="rotate(-3 565 594)">观察 → 比较 → 再试一次！</text>' : '<g fill="#f9e7b9"><path d="m303 209 5-14 5 14 14 5-14 5-5 14-5-14-14-5Z"/><path d="m878 208 4-10 4 10 10 4-10 4-4 10-4-10-10-4Z"/></g>'}
  </svg>
  <div class="scene-tubes" aria-label="选择梯度试管">${tubes}</div>
  <div class="scene-phase-pill"><span class="phase-dot"></span>${esc(label)}</div>
  <div class="scene-enzyme-label"><span>本轮酶配置</span><strong>${esc(enzymeLabel)}</strong></div>
  </div>`;
}
