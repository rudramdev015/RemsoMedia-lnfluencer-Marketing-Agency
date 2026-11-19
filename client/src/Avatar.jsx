import { useId } from 'react';

/* Flat vector person illustration, fully driven by props so it can be edited from the admin panel. */
export default function Avatar({ skin = '#d9a07a', hair = '#15110f', top = '#2e9c86', style = 'short', extras = '', bg = ['#0b5545', '#04372f'], size = '100%' }) {
  const id = useId().replace(/:/g, '');
  const ex = String(extras).split(',').map((x) => x.trim());
  const shade = 'rgba(0,0,0,.12)';
  return (
    <svg viewBox="0 0 200 220" width={size} height={size} role="img" aria-hidden style={{ display: 'block' }}>
      <defs>
        <linearGradient id={'bg' + id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={bg[0]} /><stop offset="1" stopColor={bg[1]} /></linearGradient>
        <linearGradient id={'tp' + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={top} stopOpacity=".78" /></linearGradient>
      </defs>
      <rect width="200" height="220" fill={`url(#bg${id})`} />
      <circle cx="160" cy="46" r="54" fill="rgba(255,255,255,.07)" />
      <circle cx="30" cy="190" r="40" fill="rgba(243,197,69,.14)" />

      {/* long hair behind */}
      {style === 'long' && <path d="M52 92c-6 40-4 78 14 96h68c18-18 20-56 14-96-4-34-30-52-48-52s-44 18-48 52z" fill={hair} />}
      {style === 'curly' && <g fill={hair}>{[[52, 84], [62, 62], [82, 50], [104, 46], [126, 52], [144, 68], [150, 92], [44, 108], [156, 112]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="22" />)}</g>}

      {/* shoulders */}
      <path d="M22 220c0-40 34-62 78-62s78 22 78 62z" fill={`url(#tp${id})`} />
      <path d="M78 158c4 14 40 14 44 0l-6-6H84z" fill={shade} />
      {/* neck */}
      <rect x="86" y="128" width="28" height="34" rx="12" fill={skin} />
      <path d="M86 146c8 8 20 8 28 0v-10H86z" fill={shade} />

      {/* head */}
      <ellipse cx="100" cy="98" rx="38" ry="44" fill={skin} />
      <ellipse cx="62" cy="102" rx="6" ry="9" fill={skin} />
      <ellipse cx="138" cy="102" rx="6" ry="9" fill={skin} />

      {/* hair front */}
      {style === 'short' && <path d="M60 94c-4-34 14-54 40-54s46 20 40 54c-6-16-14-26-24-30-16 6-38 8-56 30z" fill={hair} />}
      {style === 'cap' && (<g><path d="M58 88c0-30 18-46 42-46s42 16 42 46z" fill={top === '#e08a1e' ? '#1f3b4d' : '#e08a1e'} /><path d="M58 86h96c6 0 8 6 2 8l-40 4H58z" fill={top === '#e08a1e' ? '#16303f' : '#c47410'} /></g>)}
      {style === 'bun' && (<g fill={hair}><circle cx="100" cy="34" r="17" /><path d="M60 96c-6-36 12-56 40-56s46 20 40 56c-6-18-16-28-26-32-14 8-38 8-54 32z" /></g>)}
      {style === 'long' && <path d="M60 98c-6-38 12-58 40-58s46 20 40 58c-4-20-14-34-24-38-12 8-40 12-56 38z" fill={hair} />}
      {style === 'curly' && <path d="M62 90c4-24 20-34 38-34s34 10 38 34c-12-14-26-20-38-20S74 76 62 90z" fill={hair} />}

      {/* face */}
      <ellipse cx="84" cy="100" rx="4" ry="5" fill="#2b1a14" /><ellipse cx="116" cy="100" rx="4" ry="5" fill="#2b1a14" />
      <circle cx="85.500" cy="98.500" r="1.400" fill="#fff" /><circle cx="117.500" cy="98.500" r="1.400" fill="#fff" />
      <path d="M72 88q12-7 22-1M106 87q10-6 22 1" stroke={hair} strokeWidth="3.500" strokeLinecap="round" fill="none" />
      <path d="M99 104q-4 10 2 12" stroke="rgba(0,0,0,.22)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M86 122q14 12 28 0" stroke="#7a2e2e" strokeWidth="3.500" strokeLinecap="round" fill="none" />
      <ellipse cx="74" cy="114" rx="7" ry="4.500" fill="rgba(224,82,122,.22)" /><ellipse cx="126" cy="114" rx="7" ry="4.500" fill="rgba(224,82,122,.22)" />

      {ex.includes('beard') && <path d="M64 108c2 26 18 40 36 40s34-14 36-40c-6 10-14 12-20 10q-16-8-32 0c-6 2-14 0-20-10z" fill={hair} opacity=".92" />}
      {ex.includes('beard') && <path d="M88 124q12 8 24 0" stroke="#e9d0c0" strokeWidth="3" strokeLinecap="round" fill="none" />}
      {ex.includes('bindi') && <circle cx="100" cy="82" r="3.200" fill="#d6204a" />}
      {ex.includes('glasses') && (<g fill="rgba(255,255,255,.15)" stroke="#111" strokeWidth="3"><rect x="68" y="90" width="27" height="20" rx="8" /><rect x="105" y="90" width="27" height="20" rx="8" /><path d="M95 98h10" fill="none" /></g>)}
    </svg>
  );
}
