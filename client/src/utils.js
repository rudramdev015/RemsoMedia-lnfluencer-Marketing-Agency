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
