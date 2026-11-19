import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GOLD = 0xf3c545, TEAL = 0x2e9c86;

/* Shared boilerplate: renderer, resize, pause offscreen, cleanup. */
function useScene(build) {
  const host = useRef(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { return; } // no WebGL → CSS background still shows
    const small = window.innerWidth < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    const api = build({ THREE, scene, camera, renderer, mouse, small, el });

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      api.resize?.(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onMove = (e) => { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -((e.clientY / window.innerHeight) * 2 - 1); };
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true, raf;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      mouse.sx += (mouse.x - mouse.sx) * 0.05;
      mouse.sy += (mouse.y - mouse.sy) * 0.05;
      api.frame(clock.getElapsedTime(), mouse);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        o.geometry?.dispose();
        const m = o.material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose(); x.dispose(); });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return host;
}

/* ───────── Hero: gold logo coin, rings, crystals, particle field ───────── */
export function HeroScene({ logo }) {
  const host = useScene(({ THREE, scene, camera, small }) => {
    camera.position.set(0, 0, 9);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const l1 = new THREE.PointLight(GOLD, 120, 30); l1.position.set(4, 4, 6); scene.add(l1);
    const l2 = new THREE.PointLight(TEAL, 140, 30); l2.position.set(-5, -3, 5); scene.add(l2);
    const l3 = new THREE.DirectionalLight(0xffffff, 1.4); l3.position.set(0, 2, 8); scene.add(l3);

    const root = new THREE.Group(); scene.add(root);
    const coin = new THREE.Group(); root.add(coin);

    const tex = new THREE.TextureLoader().load(logo || '/logo.png');
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.78, 1.78, 0.24, 96).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd9a21b, metalness: 1, roughness: 0.22 })
    );
    coin.add(rim);
    const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.15, transparent: true });
    const front = new THREE.Mesh(new THREE.CircleGeometry(1.76, 96), faceMat); front.position.z = 0.125;
    const back = new THREE.Mesh(new THREE.CircleGeometry(1.76, 96), faceMat); back.position.z = -0.125; back.rotation.y = Math.PI;
    coin.add(front, back);

    const rings = [];
    [[2.5, 0.025, GOLD, 0.35], [3.1, 0.018, TEAL, -0.28], [3.7, 0.012, 0xffffff, 0.2]].forEach(([r, t, c, s], i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 160), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 }));
      m.rotation.set(1.1 + i * 0.5, i * 0.7, 0); m.userData.s = s; root.add(m); rings.push(m);
    });

    const crystals = [];
    const geos = [new THREE.IcosahedronGeometry(0.34, 0), new THREE.OctahedronGeometry(0.36, 0), new THREE.TetrahedronGeometry(0.4, 0)];
    for (let i = 0; i < 9; i++) {
      const g = geos[i % 3];
      const mesh = new THREE.Mesh(g, i % 2
        ? new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.2, flatShading: true })
        : new THREE.MeshStandardMaterial({ color: TEAL, metalness: 0.6, roughness: 0.25, flatShading: true }));
      const a = (i / 9) * Math.PI * 2, r = 3.2 + (i % 3) * 0.7;
      mesh.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, (i % 4) - 1.5);
      mesh.userData = { a, r, sp: 0.15 + (i % 4) * 0.06, ph: i };
      root.add(mesh); crystals.push(mesh);
    }

    const N = small ? 500 : 1400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 30; pos[i * 3 + 1] = (Math.random() - 0.5) * 18; pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 3; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffe9a8, size: 0.045, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(pts);

    const place = (w) => { root.position.x = w > 900 ? 1.6 : 0; root.position.y = w > 900 ? 0 : -1.4; root.scale.setScalar(w > 900 ? 1.3 : 0.7); };
    return {
      resize: (w) => place(w),
      frame: (t, m) => {
        const sc = window.scrollY / Math.max(window.innerHeight, 1);
        coin.rotation.y = t * 0.5 + m.sx * 0.7;
        coin.rotation.x = -m.sy * 0.4 + Math.sin(t * 0.8) * 0.08;
        coin.position.y = Math.sin(t * 1.1) * 0.18;
        rings.forEach((r) => { r.rotation.z += 0.004 * Math.sign(r.userData.s) + r.userData.s * 0.002; r.rotation.x += 0.0015; });
        crystals.forEach((c) => {
          const u = c.userData, a = u.a + t * u.sp;
          c.position.x = Math.cos(a) * u.r; c.position.y = Math.sin(a) * u.r * 0.7 + Math.sin(t + u.ph) * 0.3;
          c.rotation.x += 0.012; c.rotation.y += 0.016;
        });
        pts.rotation.y = t * 0.02 + m.sx * 0.12; pts.rotation.x = m.sy * 0.06; pts.position.y = sc * 2.5;
        root.rotation.y = m.sx * 0.18; root.rotation.x = -m.sy * 0.1 + sc * 0.4;
        root.position.z = -sc * 3;
      }
    };
  });
  return <div className="three-hero" ref={host} aria-hidden />;
}

/* ───────── Network globe: nodes, connections and travelling signals ───────── */
export function NetworkSphere() {
  const host = useScene(({ THREE, scene, camera, small }) => {
    camera.position.set(0, 0, 8);
    const g = new THREE.Group(); scene.add(g);
    const N = small ? 150 : 260, R = 2.6, P = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (1 + Math.sqrt(5)) * i;
      P.push(new THREE.Vector3(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R));
    }
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(P);
    const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ color: GOLD, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(nodes);

    const edges = [], seg = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (P[i].distanceTo(P[j]) < 0.78) { seg.push(P[i], P[j]); edges.push([i, j]); }
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.35 })));

    const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 40, 28), new THREE.MeshBasicMaterial({ color: 0x063f34, transparent: true, opacity: 0.55 }));
    g.add(shell);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 40, 28), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.06, side: THREE.BackSide }));
    g.add(halo);

    const S = 26, sig = [];
    const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(S * 3), 3));
    const sPts = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(sPts);
    for (let i = 0; i < S; i++) sig.push({ e: edges[(Math.random() * edges.length) | 0], t: Math.random(), v: 0.004 + Math.random() * 0.01 });

    return {
      frame: (t, m) => {
        g.rotation.y = t * 0.12 + m.sx * 0.4; g.rotation.x = 0.25 - m.sy * 0.25;
        const arr = sGeo.attributes.position.array;
        sig.forEach((s, i) => {
          s.t += s.v;
          if (s.t > 1) { s.t = 0; s.e = edges[(Math.random() * edges.length) | 0]; }
          const a = P[s.e[0]], b = P[s.e[1]];
          arr[i * 3] = a.x + (b.x - a.x) * s.t; arr[i * 3 + 1] = a.y + (b.y - a.y) * s.t; arr[i * 3 + 2] = a.z + (b.z - a.z) * s.t;
        });
        sGeo.attributes.position.needsUpdate = true;
        halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.02);
      }
    };
  });
  return <div className="three-net" ref={host} aria-hidden />;
}

/* ───────── Connect scene: brands → Remso → the right creators ───────── */
export function ConnectScene() {
  const host = useScene(({ THREE, scene, camera, small }) => {
    camera.position.set(0, 0, 12);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(3, 5, 8); scene.add(dl);
    const pl = new THREE.PointLight(GOLD, 80, 30); pl.position.set(0, 0, 4); scene.add(pl);
    const g = new THREE.Group(); scene.add(g);

    // brands (cubes)
    const brands = [];
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xf6f3ec, metalness: 0.3, roughness: 0.35 }));
      m.position.set(-5.2 + (i % 2) * 0.5, (i - 2) * 1.5, (i % 3) * 0.4 - 0.4);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: GOLD })));
      g.add(m); brands.push(m);
    }

    // hub
    const hub = new THREE.Group(); g.add(hub);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.2, flatShading: true }));
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.03, 12, 100), new THREE.MeshBasicMaterial({ color: TEAL }));
    hub.add(core, wire, ring);

    // creators (cloud)
    const creators = [], N = small ? 22 : 34;
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - 2 * Math.random()), th = Math.random() * Math.PI * 2, r = 1 + Math.random() * 1.9;
      const chosen = i < 6;
      const m = new THREE.Mesh(new THREE.SphereGeometry(chosen ? 0.2 : 0.11, 20, 16), new THREE.MeshStandardMaterial({ color: chosen ? GOLD : 0x6f8f86, emissive: chosen ? GOLD : 0x000000, emissiveIntensity: chosen ? 0.7 : 0, metalness: 0.3, roughness: 0.4 }));
      m.position.set(5 + Math.sin(phi) * Math.cos(th) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(th) * r);
      m.userData = { chosen, base: m.position.clone(), ph: Math.random() * 6 };
      g.add(m); creators.push(m);
    }
    const shell = new THREE.Mesh(new THREE.SphereGeometry(3.1, 32, 24), new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.09 }));
    shell.position.x = 5; g.add(shell);

    // paths
    const paths = [];
    const addPath = (a, b, color) => {
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })));
      paths.push({ a, b, color });
    };
    brands.forEach((b) => addPath(b.position, hub.position, TEAL));
    creators.filter((c) => c.userData.chosen).forEach((c) => addPath(hub.position, c.position, GOLD));
    const per = 3, total = paths.length * per;
    const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    const dots = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(dots);

    const fit = (w) => { const k = Math.min(1, w / 900); camera.position.z = 12 / Math.max(k, 0.42) ; };
    return {
      resize: fit,
      frame: (t, m) => {
        g.rotation.y = m.sx * 0.25 + Math.sin(t * 0.3) * 0.08; g.rotation.x = -m.sy * 0.12;
        brands.forEach((b, i) => { b.rotation.x = t * 0.4 + i; b.rotation.y = t * 0.5; b.position.y += Math.sin(t + i) * 0.002; });
        hub.rotation.y = t * 0.5; hub.rotation.x = t * 0.2; ring.rotation.x = t * 0.6; wire.rotation.z = -t * 0.3;
        hub.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
        creators.forEach((c) => { const u = c.userData; c.position.y = u.base.y + Math.sin(t + u.ph) * 0.12; if (u.chosen) c.scale.setScalar(1 + Math.sin(t * 3 + u.ph) * 0.18); });
        shell.rotation.y = t * 0.1;
        const arr = dGeo.attributes.position.array;
        paths.forEach((p, i) => {
          for (let k = 0; k < per; k++) {
            const f = (t * 0.35 + k / per + i * 0.13) % 1, o = (i * per + k) * 3;
            arr[o] = p.a.x + (p.b.x - p.a.x) * f; arr[o + 1] = p.a.y + (p.b.y - p.a.y) * f; arr[o + 2] = p.a.z + (p.b.z - p.a.z) * f;
          }
        });
        dGeo.attributes.position.needsUpdate = true;
      }
    };
  });
  return <div className="three-connect" ref={host} aria-hidden />;
}


/* ───────── Views skyline: a living 3D bar city that surges like a view counter ───────── */
export function ViewsScene() {
  const host = useScene(({ THREE, scene, camera, small }) => {
    camera.position.set(0, 8.5, 15);
    camera.lookAt(0, 1.2, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(6, 12, 8); scene.add(key);
    const glow = new THREE.PointLight(GOLD, 160, 40); glow.position.set(0, 6, 0); scene.add(glow);
    const rim = new THREE.PointLight(TEAL, 140, 40); rim.position.set(-9, 3, -6); scene.add(rim);

    const N = small ? 9 : 15, gap = 1.12, half = ((N - 1) * gap) / 2;
    const geo = new THREE.BoxGeometry(0.82, 1, 0.82); geo.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ metalness: 0.45, roughness: 0.3 }), N * N);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * N * 3), 3);
    const grp = new THREE.Group(); grp.add(mesh); scene.add(grp);
    const dummy = new THREE.Object3D(), col = new THREE.Color(), low = new THREE.Color(0x0b5545), mid = new THREE.Color(TEAL), hi = new THREE.Color(GOLD);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(half * 1.9, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x063f34, transparent: true, opacity: 0.55 }));
    floor.position.y = -0.02; grp.add(floor);
    const rings = [0, 1, 2].map((i) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(half * (1.25 + i * 0.28), 0.03, 10, 140).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: i % 2 ? TEAL : GOLD, transparent: true, opacity: 0.55 - i * 0.12 }));
      r.position.y = 0.05; grp.add(r); return r;
    });
    const P = small ? 140 : 360, pp = new Float32Array(P * 3), sp = new Float32Array(P);
    for (let i = 0; i < P; i++) { pp[i * 3] = (Math.random() - 0.5) * half * 2.4; pp[i * 3 + 1] = Math.random() * 9; pp[i * 3 + 2] = (Math.random() - 0.5) * half * 2.4; sp[i] = 0.5 + Math.random(); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffe9a8, size: 0.09, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    grp.add(pts);

    const fit = (w) => { camera.position.set(0, w < 700 ? 11 : 9.5, w < 700 ? 20 : 19); camera.lookAt(0, 1.2, 0); };
    return {
      resize: fit,
      frame: (t, m) => {
        const rise = Math.min(1, t / 2.2);
        let i = 0;
        for (let x = 0; x < N; x++) for (let z = 0; z < N; z++, i++) {
          const px = x * gap - half, pz = z * gap - half, d = Math.hypot(px, pz), fall = Math.max(0, 1 - d / (half * 1.45));
          const h = (0.25 + (Math.sin(d * 0.95 - t * 2.1) + 1) * 1.9 * fall + fall * 1.3) * rise;
          dummy.position.set(px, 0, pz); dummy.scale.set(1, Math.max(h, 0.05), 1); dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          const k = Math.min(1, h / 4.6);
          col.copy(low).lerp(mid, Math.min(1, k * 2)).lerp(hi, Math.max(0, k * 2 - 1));
          mesh.setColorAt(i, col);
        }
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
        grp.rotation.y = t * 0.16 + m.sx * 0.5; grp.rotation.x = m.sy * 0.06;
        rings.forEach((r, n) => { r.rotation.z = t * (0.1 + n * 0.05); r.position.y = 0.05 + Math.sin(t * 1.4 + n) * 0.08; });
        const a = pg.attributes.position.array;
        for (let n = 0; n < P; n++) { a[n * 3 + 1] += sp[n] * 0.025; if (a[n * 3 + 1] > 9) a[n * 3 + 1] = 0; }
        pg.attributes.position.needsUpdate = true;
        glow.intensity = 150 + Math.sin(t * 2) * 25;
      }
    };
  });
  return <div className="three-views" ref={host} aria-hidden />;
}
