export const sortCases = (items, how) => {
  const list = [...items];
  if (how === 'impact') list.sort((a, b) => (b.metric || 0) - (a.metric || 0));
  else if (how === 'az') list.sort((a, b) => a.brand.localeCompare(b.brand));
  return list;
};

export const filterCreators = (items, q, sort) => {
  const t = String(q || '').trim().toLowerCase();
  const list = items.filter((x) => !t || x.name.toLowerCase().includes(t) || x.handle.toLowerCase().includes(t));
  if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
  return list;
};

/* illustrative reach model: views = creators x average views; clicks and orders follow the given rates (percent) */
export const simulate = (counts, tiers, ctr = 1.5, cvr = 2) => {
  const views = tiers.reduce((sum, t, i) => sum + Math.max(0, Number(counts[i]) || 0) * (Number(t.avgViews) || 0), 0);
  const clicks = Math.round(views * (ctr / 100));
  const orders = Math.round(clicks * (cvr / 100));
  const creators = counts.reduce((a, b) => a + (Number(b) || 0), 0);
  return { views, clicks, orders, creators };
};
export const compact = (n) => (n >= 1e7 ? (n / 1e7).toFixed(1) + ' Cr' : n >= 1e5 ? (n / 1e5).toFixed(1) + ' L' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n));
