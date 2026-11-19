import { lazy, Suspense, useEffect, useState } from 'react';
import Site from './Site.jsx';

const Admin = lazy(() => import('./Admin.jsx'));

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  if (path.startsWith('/admin'))
    return (
      <Suspense fallback={<div className="admin-loading">Loading…</div>}>
        <Admin />
      </Suspense>
    );
  return <Site />;
}
