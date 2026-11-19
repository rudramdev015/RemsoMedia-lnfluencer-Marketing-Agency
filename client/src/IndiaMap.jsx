import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import map from './indiaMap.json';
import Avatar from './Avatar.jsx';

const REGIONS = {
  South: { color: '#f3c545', states: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Puducherry', 'Lakshadweep'] },
  North: { color: '#37b89d', states: ['Jammu and Kashmir', 'Ladakh', 'Himachal Pradesh', 'Punjab', 'Haryana', 'Delhi', 'Uttarakhand', 'Uttar Pradesh', 'Rajasthan', 'Chandigarh'] },
  East: { color: '#ff8a65', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'] },
  'North East': { color: '#e0527a', states: ['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim'] },
  'West & Central': { color: '#7aa7ff', states: ['Maharashtra', 'Gujarat', 'Goa', 'Madhya Pradesh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu'] }
};
const regionOf = (state) => Object.keys(REGIONS).find((r) => REGIONS[r].states.includes(state)) || 'West & Central';
const HUB = 'Nagpur';
const ARC_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Guwahati', 'Patna', 'Kochi', 'Chandigarh', 'Pune', 'Bhubaneswar', 'Kota', 'Indore', 'Surat', 'Bhopal'];

export default function IndiaMap({ c }) {
  const d = c.creators;
  const [active, setActive] = useState(null);
  const [hover, setHover] = useState(null);
  const hub = map.cities[HUB];
  const pins = useMemo(() => (c.topCreators?.items || []).filter((x) => x.city && map.cities[x.city]).map((x) => ({ ...x, pos: map.cities[x.city] })), [c.topCreators]);
  const noteByRegion = Object.fromEntries((d.regions || []).map((r) => [r.name, r.note]));
  noteByRegion['West & Central'] = 'Maharashtra, Gujarat, Goa, Madhya Pradesh, Chhattisgarh';
  const shown = hover ? regionOf(hover) : active;

  return (
    <section id="map" className="sec india">
      <div className="aurora a2" />
      <div className="wrap india-in">
        <div className="india-copy">
          <span className="eyebrow">Pan-India reach</span>
          <h2>Creators in every corner of India.</h2>
          <p>{d.text}</p>
          <div className="india-count"><b>10,000+</b><span>creators · every state · every language</span></div>

          <div className="regions" role="tablist" aria-label="Filter by region">
            <button className={!active ? 'on' : ''} onClick={() => setActive(null)}>All India</button>
            {Object.keys(REGIONS).map((r) => (
              <button key={r} className={active === r ? 'on' : ''} style={{ '--rc': REGIONS[r].color }} onClick={() => setActive(active === r ? null : r)} onMouseEnter={() => setHover(REGIONS[r].states[0])} onMouseLeave={() => setHover(null)}>
                <i />{r}
              </button>
            ))}
          </div>
          <motion.div key={shown || 'all'} className="region-info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <b>{shown || 'All of India'}</b>
            <span>{shown ? noteByRegion[shown] : 'Hindi · English · Tamil · Telugu · Kannada · Malayalam · Bengali · Marathi · Gujarati · Punjabi · Odia · Assamese and more'}</span>
          </motion.div>
          <a className="btn btn-gold" href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Find creators for your state <span>→</span></a>
        </div>

        <div className="india-map">
          <svg viewBox={`0 0 ${map.w} ${map.h}`} role="img" aria-label="Map of India showing our creator network">
            <defs>
              <radialGradient id="mapglow" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#2e9c86" stopOpacity=".35" /><stop offset="1" stopColor="#2e9c86" stopOpacity="0" /></radialGradient>
              <clipPath id="pinclip"><circle cx="18" cy="18" r="17" /></clipPath>
            </defs>
            <rect width={map.w} height={map.h} fill="url(#mapglow)" />
            <g>
              {map.states.map((s, i) => {
                const r = regionOf(s.name), col = REGIONS[r].color, dim = shown && shown !== r;
                return (
                  <motion.path key={s.name} d={s.d} fill={col} stroke={col} strokeWidth=".8" strokeLinejoin="round"
                    initial={{ opacity: 0 }} whileInView={{ opacity: dim ? 0.16 : 0.9 }} animate={{ opacity: dim ? 0.16 : 0.9 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: dim ? 0 : (i % 12) * 0.03 }}
                    className="st" onMouseEnter={() => setHover(s.name)} onMouseLeave={() => setHover(null)} onClick={() => setActive(active === r ? null : r)} />
                );
              })}
            </g>
            <path d={map.borders} fill="none" stroke="#04372f" strokeWidth="1" strokeLinejoin="round" pointerEvents="none" />

            {/* network arcs from the hub */}
            <g fill="none" pointerEvents="none">
              {ARC_CITIES.filter((n) => map.cities[n]).map((n, i) => {
                const [x, y] = map.cities[n], mx = (hub[0] + x) / 2, my = (hub[1] + y) / 2 - 40;
                return <path key={n} className="arc" style={{ animationDelay: (i * 0.35) + 's' }} d={`M${hub[0]} ${hub[1]} Q${mx} ${my} ${x} ${y}`} stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" strokeDasharray="4 6" />;
              })}
            </g>
            {ARC_CITIES.filter((n) => map.cities[n]).map((n, i) => (
              <g key={n} transform={`translate(${map.cities[n][0]} ${map.cities[n][1]})`} pointerEvents="none">
                <circle className="pulse-ring" r="4" style={{ animationDelay: (i * 0.25) + 's' }} />
                <circle r="3.2" fill="#fff" stroke="#04372f" strokeWidth="1" />
              </g>
            ))}
            <g transform={`translate(${hub[0]} ${hub[1]})`} pointerEvents="none">
              <circle className="pulse-ring hubring" r="10" />
              <circle r="14" fill="#04372f" stroke="#f3c545" strokeWidth="2" />
              <image href={c.brand.logo} x="-11" y="-11" width="22" height="22" />
            </g>

            {pins.map((p, i) => (
              <motion.g key={p.handle} transform={`translate(${p.pos[0] - 18} ${p.pos[1] - 40})`} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}>
                <circle cx="18" cy="18" r="19" fill="#f3c545" />
                <g clipPath="url(#pinclip)"><Avatar {...p} size={36} /></g>
              </motion.g>
            ))}
          </svg>
          <div className="map-tip" aria-live="polite">{hover ? <><b>{hover}</b><span>{regionOf(hover)}</span></> : <span>Hover or tap a state</span>}</div>
        </div>
      </div>
    </section>
  );
}
