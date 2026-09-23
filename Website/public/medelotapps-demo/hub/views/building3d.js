/* ============================================================
   Gebouwen — signature view: the building you cannot walk to.

   The hero asset is the Kathedraal van de Peel, blown up in
   September 1944. Scanning the church that stands there now would
   show visitors something they can see through the window; a
   reconstruction shows them the only thing they can't.

   Two viewer tiers, chosen per building by what its entity carries:

     entity.model     -> a GLB, orbited in three.js
     entity.turntable -> an ordered ring of photos, dragged to spin

   The turntable needs no 3D pipeline and no GPU, so the app ships
   before every model is finished — and the same widget later works
   for museum objects like the gouden helm. A building with neither
   simply falls back to the shared media strip.

   three.js is loaded by dynamic import() the first time a model is
   actually opened, so nothing pays for it on the home screen.
   ============================================================ */
(function () {
    // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "building3d." prefix. Looked up lazily rather than resolved once, because the
  // visitor can switch language between renders. TEXT.<name> still yields a
  // string, so every call site — including the ones that wrap it in api.t() —
  // is unchanged.
  const TEXT = new Proxy({}, { get: (_, name) => window.ui('building3d.' + String(name)) });

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  const thisYear = new Date().getFullYear();
  const isGone = entity => entity.period && entity.period.to != null && entity.period.to < thisYear;

  // ---------- Tier 2: photo turntable ----------
  // No WebGL, no model, no risk. Drag horizontally to step through an ordered
  // ring of photographs.
  function buildTurntable(entity, api) {
    const frames = (entity.turntable || []).filter(f => f.url);
    if (frames.length < 2) return null;

    const wrap = el(`<div class="b3-viewer b3-turntable">
      <div class="b3-frame"></div>
      <div class="b3-hint">${api.t(TEXT.turntable)}</div>
    </div>`);
    const frame = wrap.querySelector('.b3-frame');

    // Preload so spinning doesn't flicker on first pass.
    frames.forEach(f => { const img = new Image(); img.src = f.url; });

    let index = 0;
    const show = i => {
      index = ((i % frames.length) + frames.length) % frames.length;
      frame.style.backgroundImage = window.cssUrl(frames[index].url);
    };
    show(0);

    let dragging = false, startX = 0, startIndex = 0;
    wrap.addEventListener('pointerdown', e => {
      dragging = true; wrap.setPointerCapture(e.pointerId);
      startX = e.clientX; startIndex = index;
    });
    wrap.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = wrap.getBoundingClientRect();
      // A full drag across the widget is exactly one revolution.
      show(startIndex + Math.round(((e.clientX - startX) / r.width) * frames.length));
    });
    const stop = () => { dragging = false; };
    wrap.addEventListener('pointerup', stop);
    wrap.addEventListener('pointercancel', stop);

    return wrap;
  }

  // ---------- Tier 1: three.js model ----------
  let threeModules = null;
  async function loadThree() {
    if (!threeModules) {
      const [THREE, gltf, orbit] = await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/controls/OrbitControls.js'),
      ]);
      threeModules = { THREE, GLTFLoader: gltf.GLTFLoader, OrbitControls: orbit.OrbitControls };
    }
    return threeModules;
  }

  function buildModelViewer(entity, api) {
    const wrap = el(`<div class="b3-viewer b3-model js-dispose">
      <div class="b3-canvas"></div>
      <div class="b3-status">${api.t(TEXT.loading)}</div>
      <button class="b3-reset">${iconSvg('rotate')}<span>${api.t(TEXT.reset)}</span></button>
      <div class="b3-hint">${api.t(TEXT.dragHint)}</div>
    </div>`);

    const canvasBox = wrap.querySelector('.b3-canvas');
    const status = wrap.querySelector('.b3-status');
    const resetBtn = wrap.querySelector('.b3-reset');
    resetBtn.style.display = 'none';

    let disposed = false;
    let cleanup = () => {};
    // The detail overlay is thrown away on close; when it goes, so must the
    // render loop and the WebGL context, or an afternoon of visitors opening
    // buildings leaks contexts until the driver refuses to give out more.
    wrap.addEventListener('view-dispose', () => { disposed = true; cleanup(); });

    loadThree().then(({ THREE, GLTFLoader, OrbitControls }) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      canvasBox.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);

      // Overcast-daylight lighting: neutral, legible, and it doesn't editorialise
      // a building we only know from black-and-white photographs.
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8272, 2.2));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(4, 8, 6);
      scene.add(sun);

      // Orbit only — no free-fly camera, nowhere to get lost, and the ground
      // can't be walked under.
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI / 2 - 0.02;
      controls.rotateSpeed = 0.6;

      let home = null;

      new GLTFLoader().load(
        entity.model,
        gltf => {
          if (disposed) return;
          const root = gltf.scene;

          // Frame whatever came out of the modelling tool: centre it on the
          // origin and back the camera off to fit, rather than trusting the
          // asset's own scale or pivot.
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const centre = box.getCenter(new THREE.Vector3());
          root.position.sub(centre);
          root.position.y += size.y / 2;
          scene.add(root);

          const radius = Math.max(size.x, size.y, size.z) || 1;
          const distance = radius * 1.9;
          camera.position.set(distance * 0.75, radius * 0.75, distance * 0.75);
          controls.target.set(0, size.y * 0.45, 0);
          controls.minDistance = radius * 0.7;
          controls.maxDistance = radius * 3.5;
          controls.update();
          home = { pos: camera.position.clone(), target: controls.target.clone() };

          status.remove();
          resetBtn.style.display = '';
        },
        undefined,
        () => { if (!disposed) status.textContent = api.t(TEXT.failed); },
      );

      resetBtn.addEventListener('click', () => {
        if (!home) return;
        camera.position.copy(home.pos);
        controls.target.copy(home.target);
        controls.update();
      });

      function resize() {
        const w = canvasBox.clientWidth, h = canvasBox.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      const observer = new ResizeObserver(resize);
      observer.observe(canvasBox);
      resize();

      let frame = 0;
      (function loop() {
        if (disposed) return;
        frame = requestAnimationFrame(loop);
        controls.update();
        renderer.render(scene, camera);
      })();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        scene.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach(m => {
              Object.values(m).forEach(v => { if (v && v.isTexture) v.dispose(); });
              m.dispose();
            });
          }
        });
        renderer.dispose();
        renderer.forceContextLoss();
      };
    }).catch(() => {
      if (!disposed) status.textContent = api.t(TEXT.failed);
    });

    return wrap;
  }

  // ---------- Detail module ----------
  window.buildBuildingViewer = function buildBuildingViewer(entity, api) {
    const viewer = entity.model ? buildModelViewer(entity, api) : buildTurntable(entity, api);

    // No model and no turntable: show nothing at all.
    //
    // There used to be an "de 3D-reconstructie wordt nog gemaakt" panel here,
    // as an honest empty state. That reasoning holds for a gap a visitor would
    // otherwise notice — but almost none of these buildings will ever get a
    // model, so the panel was a promise on twenty-odd places rather than a note
    // about one, and it took a screen of room above the cross-links to say so.
    // A place with no 3D simply has no 3D section now.
    if (!viewer) {
      return null;
    }

    const wrap = el(`<div class="b3-extra"></div>`);
    wrap.appendChild(el(
      `<div class="coll-section-label">${api.t(entity.model ? TEXT.model3d : TEXT.turntable)}</div>`));
    wrap.appendChild(viewer);
    return wrap;
  };

})();
