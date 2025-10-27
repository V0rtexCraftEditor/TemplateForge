/* v5 — Presets + all previous features (Tailwind/Bootstrap/plain export, stacked mode, comments) */
(function(){
  const el = (s, r=document) => r.querySelector(s);
  const els = (s, r=document) => Array.from(r.querySelectorAll(s));

  // State
  const state = {
    siteTitle: 'Mi Sitio',
    theme: 'neutral',
    fonts: 'system',
    globalNote: '',
    blocks: [], // {id, kind, x,y,w,h, text, bg, note}
    selected: null,
    preview: 'desktop',
    snap: true,
    exportMode: 'plain', // 'plain' | 'bootstrap' | 'tailwind'
    stacked: false
  };

  // Built-in presets
  const BUILTIN_PRESETS = {
    saas: {
      name: 'Landing SaaS',
      stacked: true,
      exportMode: 'tailwind',
      theme: 'mint',
      fonts: 'poppins-inter',
      globalNote: 'Landing para producto SaaS con propuesta de valor, features, precios y FAQ.',
      blocks: [
        {kind:'navbar', text:'', note:'Barra superior con el nombre del producto.'},
        {kind:'hero', text:'Plataforma para gestionar tu negocio online con automatizaciones y analíticas.', note:'Hero con H1 y subtítulo que explica el valor.'},
        {kind:'features3', text:'Automatiza|Escala|Mide', note:'Tres beneficios principales con iconos.'},
        {kind:'pricing', text:'Básico 9€|Pro 19€|Plus 29€', note:'Tabla de planes con CTA.'},
        {kind:'faq', text:'¿Hay prueba gratis?|Sí, 14 días.|¿Puedo cancelar?|Sí, cuando quieras.|¿Soporte?|Correo y chat.', note:'Preguntas frecuentes principales.'},
        {kind:'footer', text:'© 2025 TuSaaS Inc. Todos los derechos reservados.', note:'Pie con derechos/links.'}
      ]
    },
    portfolio: {
      name: 'Portfolio',
      stacked: true,
      exportMode: 'tailwind',
      theme: 'forest',
      fonts: 'montserrat-merriweather',
      globalNote: 'Portfolio personal con trabajos, testimonio y FAQ.',
      blocks: [
        {kind:'navbar', text:'', note:'Nombre o marca personal.'},
        {kind:'hero', text:'Diseñador/a web y frontend. Transformo ideas en sitios rápidos y bonitos.', note:'Hero con claim profesional.'},
        {kind:'grid3', text:'Proyecto A|Proyecto B|Proyecto C', note:'Mosaico de trabajos.'},
        {kind:'section', text:'Testimonio de un cliente satisfecho destacando resultados.', note:'Bloque testimonial sencillo.'},
        {kind:'faq', text:'¿Servicios?|Diseño UI, desarrollo web.|¿Plazos?|Dependen del alcance.|¿Presupuesto?|Envío propuesta detallada.', note:'FAQ para dudas comunes.'},
        {kind:'footer', text:'© 2025 Tu Nombre — Portfolio.', note:'Pie con autor y año.'}
      ]
    },
    onepage: {
      name: 'One-page',
      stacked: true,
      exportMode: 'plain',
      theme: 'neutral',
      fonts: 'system',
      globalNote: 'One-page informativa con secciones lineales y timeline.',
      blocks: [
        {kind:'navbar', text:'', note:'Barra de navegación simple.'},
        {kind:'hero', text:'Presentación breve del sitio/negocio.', note:'Hero inicial.'},
        {kind:'section', text:'Sección de servicios o características principales.', note:'Bloque informativo 1.'},
        {kind:'section', text:'Sección de valor diferencial y beneficios.', note:'Bloque informativo 2.'},
        {kind:'timeline', text:'Inicio|Crecimiento|Hoy', note:'Línea temporal con hitos.'},
        {kind:'footer', text:'© 2025 Mi Empresa.', note:'Pie de página.'}
      ]
    }
  };

  const canvas = el('#canvas');
  const siteTitle = el('#siteTitle');
  const globalNote = el('#globalNote');
  const theme = el('#theme');
  const fonts = el('#fonts');
  const btnClear = el('#btnClear');
  const btnExportHTML = el('#btnExportHTML');
  const btnExportZIP = el('#btnExportZIP');
  const btnWireframe = el('#btnWireframe');
  const btnSave = el('#btnSave');
  const btnLoad = el('#btnLoad');
  const btnDup = el('#btnDuplicate');
  const btnDel = el('#btnDelete');
  const pvMobile = el('#pvMobile'), pvTablet = el('#pvTablet'), pvDesktop = el('#pvDesktop');
  const toggleSnap = el('#toggleSnap');
  const toggleStack = el('#toggleStack');
  const exportModeSel = el('#exportMode');
  // Presets UI
  const presetsModal = el('#presetsModal');
  const btnSavePreset = el('#btnSavePreset');
  const btnLoadPreset = el('#btnLoadPreset');

  // Inspector fields
  const noSel = el('#noSelection');
  const form = el('#inspector');
  const insKind = el('#insKind');
  const insId = el('#insId');
  const insText = el('#insText');
  const insNote = el('#insNote');
  const insX = el('#insX');
  const insY = el('#insY');
  const insW = el('#insW');
  const insH = el('#insH');
  const insBg = el('#insBg');
  const insToFront = el('#insToFront');
  const insUp = el('#insUp');
  const insDown = el('#insDown');
  const posRow = el('#posRow');

  // Fonts map
  const FONT_SETS = {
    'system': { title: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', body:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' },
    'montserrat-merriweather': { title: "'Montserrat',system-ui", body:"'Merriweather',Georgia,serif" },
    'poppins-inter': { title: "'Poppins',system-ui", body:"'Inter',system-ui" },
  };

  // Helpers
  const uid = () => Math.random().toString(36).slice(2,9);
  const snap = (v) => state.snap ? Math.round(v / 10) * 10 : v;

  function applyTheme(){
    document.body.classList.remove('theme-mint','theme-forest','theme-magenta','theme-neutral');
    document.body.classList.add('theme-' + state.theme);
    const fonts = FONT_SETS[state.fonts] || FONT_SETS.system;
    document.documentElement.style.setProperty('--title-font', fonts.title);
    document.documentElement.style.setProperty('--body-font', fonts.body);
  }

  function setPreview(mode){
    state.preview = mode;
    canvas.classList.remove('mobile','tablet','desktop');
    canvas.classList.add(mode);
    [pvMobile,pvTablet,pvDesktop].forEach(b => b.classList.remove('active'));
    ({mobile:pvMobile, tablet:pvTablet, desktop:pvDesktop}[mode]).classList.add('active');
  }

  function setStacked(on){
    state.stacked = on;
    canvas.classList.toggle('stacked', on);
    posRow.classList.toggle('d-none', on);
    insUp.classList.toggle('d-none', !on);
    insDown.classList.toggle('d-none', !on);
    draw();
  }

  function addBlock(kind){
    const base = { x: 40, y: 40, w: 260, h: 80, text: '', bg: null, note:'' };
    const map = {
      navbar: { x: 10, y: 10, w: 560, h: 56, text: 'Navbar', note: 'Barra de navegación con el título del sitio.' },
      hero: { x: 20, y: 80, w: 560, h: 160, text: 'Hero / cabecera', note: 'Sección destacada inicial con título y subtítulo.' },
      heading: { h: 60, text:'Título principal', note:'Encabezado para separar secciones.' },
      paragraph: { h: 100, text:'Párrafo de ejemplo. Escribe aquí tu texto.', note:'Texto descriptivo de la sección.' },
      button: { w: 160, h: 44, text:'Llamada a la acción', note:'Botón para llevar al usuario a la acción.' },
      image: { w: 220, h: 140, text:'IMG', note:'Espacio reservado para una imagen.' },
      section: { w: 320, h: 160, text:'Sección', note:'Contenedor genérico de contenido.' },
      cards3: { w: 560, h: 220, text: 'Card A|Card B|Card C', note:'Tres tarjetas con contenido breve.' },
      grid3: { w: 560, h: 200, text: 'Elemento 1|Elemento 2|Elemento 3', note:'Grid de tres columnas.' },
      features3: { w: 560, h: 180, text: 'Rápido|Responsivo|Accesible', note:'Lista de tres ventajas o características.' },
      faq: { w: 560, h: 220, text: '¿Pregunta 1?|Respuesta 1.|¿Pregunta 2?|Respuesta 2.|¿Pregunta 3?|Respuesta 3.', note:'Preguntas frecuentes en formato desplegable.' },
      timeline: { w: 560, h: 220, text: 'Inicio|Fase 1|Lanzamiento', note:'Hitos en orden temporal.' },
      pricing: { w: 560, h: 240, text: 'Básico 9€|Pro 19€|Plus 29€', note:'Comparativa de planes y precios.' },
      footer: { w: 560, h: 80, text: '© 2025 Mi Sitio — Todos los derechos reservados.', note:'Pie de página con derechos/links.' }
    };
    const cfg = { ...base, ...(map[kind] || {}) };
    const b = { id: uid(), kind, ...cfg };
    state.blocks.push(b);
    drawBlock(b);
    select(b.id);
  }

  function applyPresetKey(key){
    const p = BUILTIN_PRESETS[key]; if(!p) return;
    state.blocks = [];
    state.siteTitle = state.siteTitle || 'Mi Sitio';
    state.theme = p.theme || 'neutral';
    state.fonts = p.fonts || 'system';
    state.globalNote = p.globalNote || '';
    state.exportMode = p.exportMode || 'plain';
    state.stacked = !!p.stacked;
    // generar bloques
    for(const item of p.blocks){
      const b = { id: uid(), x:40, y:40, w:560, h:100, bg:null, ...item };
      state.blocks.push(b);
    }
    // UI y render
    el('#theme').value = state.theme;
    el('#fonts').value = state.fonts;
    el('#globalNote').value = state.globalNote;
    el('#exportMode').value = state.exportMode;
    el('#toggleStack').checked = state.stacked;
    applyTheme();
    setStacked(state.stacked);
    draw();
    // cerrar modal si existe
    const modal = bootstrap.Modal.getOrCreateInstance(presetsModal);
    modal.hide();
  }

  function draw(){
    canvas.innerHTML = '<div class="grid"></div>';
    state.blocks.forEach(drawBlock);
  }

  function drawBlock(b){
    const d = document.createElement('div');
    d.className = 'block ' + b.kind + (state.selected===b.id?' selected':'');
    d.dataset.id = b.id;

    if (!state.stacked) {
      d.style.left = b.x + 'px';
      d.style.top = b.y + 'px';
      d.style.width = b.w + 'px';
      d.style.height = b.h + 'px';
    } else {
      d.style.width = 'auto';
      d.style.height = 'auto';
    }
    if (b.bg) d.style.background = b.bg;

    d.innerHTML = renderBlockInner(b);
    canvas.appendChild(d);

    if (!state.stacked) enableDrag(d);
    d.addEventListener('mousedown', () => select(b.id));
    d.addEventListener('touchstart', () => select(b.id), {passive:true});
  }

  function renderBlockInner(b){
    switch(b.kind){
      case 'navbar': return `<div class="fw-bold">${escapeHtml(state.siteTitle || 'Mi Sitio')}</div>`;
      case 'hero': return `<div class="p-2"><h1 class="h3">${escapeHtml(state.siteTitle || 'Mi Sitio')}</h1><p class="mb-0">${escapeHtml(b.text)}</p></div>`;
      case 'heading': return `<div class="fs-3 fw-bold">${escapeHtml(b.text)}</div>`;
      case 'paragraph': return `<div>${escapeHtml(b.text)}</div>`;
      case 'button': return `<a href="#" class="btn btn-success btn-sm">${escapeHtml(b.text)}</a>`;
      case 'image': return `<div class="w-100 h-100 d-flex align-items-center justify-content-center text-muted"><span>Imagen</span></div>`;
      case 'section': return `<div class="p-2"><div class="fw-semibold">${escapeHtml(b.text)}</div></div>`;
      case 'cards3': {
        const parts = (b.text||'').split('|');
        return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}"><div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 border rounded p-2">${escapeHtml(parts[i]||('Card '+(i+1)))}</div></div>`).join('')}
        </div></div>`;
      }
      case 'grid3': {
        const parts = (b.text||'').split('|');
        return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}"><div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 bg-light rounded p-2 text-center">${escapeHtml(parts[i]||('Elemento '+(i+1)))}</div></div>`).join('')}
        </div></div>`;
      }
      case 'features3': {
        const feats = (b.text||'').split('|');
        return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}"><div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 border rounded p-2">
            <div class="d-flex align-items-center mb-2"><span class="badge bg-primary me-2">★</span><strong>${escapeHtml(feats[i]||('Feature '+(i+1)))}</strong></div>
            <div class="small text-muted">Descripción breve.</div>
          </div></div>`).join('')}
        </div></div>`;
      }
      case 'faq': {
        const parts = (b.text||'').split('|');
        const items = [];
        for (let i=0;i<parts.length;i+=2){
          const q = parts[i] || `Pregunta ${i/2+1}?`;
          const a = parts[i+1] || `Respuesta ${i/2+1}.`;
          items.push(`<details><summary>${escapeHtml(q)}</summary><div class="mt-1">${escapeHtml(a)}</div></details>`);
        }
        return `<div class="p-2">${items.join('')}</div>`;
      }
      case 'timeline': {
        const items = (b.text||'').split('|').map(s=>`<div class="item">${escapeHtml(s)}</div>`).join('');
        return `<div class="p-2">${items}</div>`;
      }
      case 'pricing': {
        const plans = (b.text||'').split('|');
        return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}"><div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 border rounded p-2 text-center">
            <div class="fw-bold mb-1">${escapeHtml((plans[i]||'Plan').split(' ')[0]||('Plan '+(i+1)))}</div>
            <div class="display-6">${escapeHtml((plans[i]||'').split(' ')[1]||'9€')}</div>
            <a class="btn btn-sm btn-primary mt-2" href="#">Elegir</a>
          </div></div>`).join('')}
        </div></div>`;
      }
      case 'footer': return `<div class="p-2 small text-muted text-center">${escapeHtml(b.text)}</div>`;
    }
    return '';
  }

  function enableDrag(node){
    let startX=0,startY=0,origX=0,origY=0;
    function onDown(e){
      const isTouch = e.type.startsWith('touch');
      const pt = isTouch ? e.touches[0] : e;
      startX = pt.clientX; startY = pt.clientY;
      const id = node.dataset.id;
      const b = state.blocks.find(x => x.id===id);
      if(!b) return;
      origX = b.x; origY = b.y;
      document.addEventListener(isTouch?'touchmove':'mousemove', onMove, {passive:false});
      document.addEventListener(isTouch?'touchend':'mouseup', onUp, {once:true});
      e.preventDefault();
    }
    function onMove(e){
      const isTouch = e.type.startsWith('touch');
      const pt = isTouch ? e.touches[0] : e;
      const id = node.dataset.id;
      const b = state.blocks.find(x => x.id===id);
      if(!b) return;
      const dx = pt.clientX - startX;
      const dy = pt.clientY - startY;
      b.x = snap(origX + dx);
      b.y = snap(origY + dy);
      node.style.left = b.x + 'px';
      node.style.top  = b.y + 'px';
      if(!isTouch) e.preventDefault();
      updateInspectorIfSelected();
    }
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
    }
    node.addEventListener('mousedown', onDown);
    node.addEventListener('touchstart', onDown, {passive:false});
  }

  function select(id){
    state.selected = id;
    els('.block', canvas).forEach(n => n.classList.toggle('selected', n.dataset.id===id));
    updateInspector();
  }

  function updateInspector(){
    const b = state.blocks.find(x => x.id===state.selected);
    const stacked = state.stacked;
    if(!b){ form.classList.add('d-none'); noSel.classList.remove('d-none'); return; }
    noSel.classList.add('d-none'); form.classList.remove('d-none');
    insKind.textContent = b.kind; insId.textContent = b.id;
    insText.value = b.text || '';
    insNote.value = b.note || '';
    insX.value = b.x; insY.value = b.y; insW.value = b.w; insH.value = b.h;
    insBg.value = rgbToHex(getComputedStyleColor(b.bg) || '#ffffff');
    posRow.classList.toggle('d-none', stacked);
    insUp.classList.toggle('d-none', !stacked);
    insDown.classList.toggle('d-none', !stacked);
  }
  function updateInspectorIfSelected(){
    const b = state.blocks.find(x => x.id===state.selected);
    if(!b) return;
    insX.value = b.x; insY.value = b.y;
  }

  // Inspector events
  insText.addEventListener('input', () => { const b = current(); if(!b) return; b.text = insText.value; redraw(b.id); });
  insNote.addEventListener('input', () => { const b = current(); if(!b) return; b.note = insNote.value; });
  [insX,insY,insW,insH].forEach(inp => inp.addEventListener('input', () => {
    const b = current(); if(!b) return;
    b.x = parseInt(insX.value||'0',10);
    b.y = parseInt(insY.value||'0',10);
    b.w = parseInt(insW.value||'0',10);
    b.h = parseInt(insH.value||'0',10);
    redraw(b.id);
  }));
  insBg.addEventListener('input', () => { const b = current(); if(!b) return; b.bg = insBg.value; redraw(b.id); });
  insToFront.addEventListener('click', () => { const b = current(); if(!b) return; toFront(b.id); });
  insUp.addEventListener('click', () => { moveSelected(-1); });
  insDown.addEventListener('click', () => { moveSelected(1); });

  function moveSelected(delta){
    const id = state.selected; if(!id) return;
    const i = state.blocks.findIndex(x=>x.id===id); if(i<0) return;
    const j = i + delta;
    if (j < 0 || j >= state.blocks.length) return;
    const [b] = state.blocks.splice(i,1);
    state.blocks.splice(j,0,b);
    draw(); select(id);
  }

  btnDup.addEventListener('click', () => {
    const b = current(); if(!b) return;
    const copy = JSON.parse(JSON.stringify(b)); copy.id = uid();
    if (!state.stacked) { copy.x += 20; copy.y += 20; }
    state.blocks.push(copy); draw(); select(copy.id);
  });
  btnDel.addEventListener('click', () => {
    const b = current(); if(!b) return;
    state.blocks = state.blocks.filter(x => x.id!==b.id); state.selected=null; draw(); updateInspector();
  });

  function toFront(id){
    const idx = state.blocks.findIndex(x=>x.id===id);
    if(idx<0) return;
    const b = state.blocks.splice(idx,1)[0];
    state.blocks.push(b); draw(); select(id);
  }

  // Palette controls
  siteTitle.addEventListener('input', () => { state.siteTitle = siteTitle.value; refreshTitles(); });
  globalNote.addEventListener('input', () => { state.globalNote = globalNote.value; });
  theme.addEventListener('change', () => { state.theme = theme.value; applyTheme(); });
  fonts.addEventListener('change', () => { state.fonts = fonts.value; applyTheme(); });
  [pvMobile,pvTablet,pvDesktop].forEach(btn => btn.addEventListener('click', () => setPreview(btn.dataset.size)));
  toggleSnap.addEventListener('change', () => { state.snap = toggleSnap.checked; });
  toggleStack.addEventListener('change', () => { setStacked(toggleStack.checked); });
  exportModeSel.addEventListener('change', () => { state.exportMode = exportModeSel.value; });

  function refreshTitles(){
    ['navbar','hero'].forEach(kind => {
      els('.block.'+kind, canvas).forEach(node => node.innerHTML = renderBlockInner(blockById(node.dataset.id)));
    });
  }
  function blockById(id){ return state.blocks.find(x => x.id===id); }

  // Add block buttons
  els('.add-block').forEach(btn => btn.addEventListener('click', () => addBlock(btn.dataset.kind)));

  btnClear.addEventListener('click', () => { state.blocks = []; draw(); state.selected = null; updateInspector(); });

  // Export single HTML (Tailwind uses CDN)
  btnExportHTML.addEventListener('click', () => {
    const {html, css} = generateFiles();
    let out = html;
    if (state.exportMode !== 'tailwind') {
      out = html.replace('<link rel="stylesheet" href="style.css">', `<style>\\n${css}\\n</style>`);
    }
    const blob = new Blob([out], {type:'text/html;charset=utf-8'});
    saveAs(blob, 'template.html');
  });

  // Export ZIP
  btnExportZIP.addEventListener('click', async () => {
    const {html, css} = generateFiles();
    const zip = new JSZip();
    zip.file('index.html', html);
    if (state.exportMode !== 'tailwind') {
      zip.file('style.css', css);
    }
    const content = await zip.generateAsync({type:'blob'});
    saveAs(content, 'template.zip');
  });

  // Save project (.templateforge)
  btnSave.addEventListener('click', () => {
    const proj = JSON.stringify(state, null, 2);
    const blob = new Blob([proj], {type:'application/json'});
    saveAs(blob, 'project.templateforge');
  });

  // Load project
  btnLoad.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    const txt = await file.text();
    try {
      const obj = JSON.parse(txt);
      Object.assign(state, {siteTitle:'Mi Sitio', theme:'neutral', fonts:'system', blocks:[], selected:null, snap:true, stacked:false, exportMode:'plain', globalNote:''}, obj);
      siteTitle.value = state.siteTitle; theme.value = state.theme; fonts.value = state.fonts; globalNote.value = state.globalNote || '';
      toggleSnap.checked = state.snap ?? true;
      toggleStack.checked = !!state.stacked;
      exportModeSel.value = state.exportMode || 'plain';
      applyTheme(); setPreview(state.preview || 'desktop'); setStacked(state.stacked); draw(); updateInspector();
    } catch(err){ alert('Proyecto no válido.'); }
  });

  // Wireframe download (SVG)
  btnWireframe.addEventListener('click', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.clientWidth}" height="${canvas.clientHeight}">
      <foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(canvas)}</foreignObject>
    </svg>`;
    const blob = new Blob([svg], {type:'image/svg+xml;charset=utf-8'});
    saveAs(blob, 'wireframe.svg');
  });

  // Presets: apply builtin
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-preset]');
    if (!btn) return;
    const key = btn.getAttribute('data-preset');
    applyPresetKey(key);
  });

  // Presets: save current as .presetforge
  btnSavePreset.addEventListener('click', () => {
    const preset = {
      name: 'Mi preset',
      stacked: state.stacked,
      exportMode: state.exportMode,
      theme: state.theme,
      fonts: state.fonts,
      globalNote: state.globalNote,
      blocks: state.blocks.map(({id, ...rest}) => rest) // sin id
    };
    const blob = new Blob([JSON.stringify(preset, null, 2)], {type:'application/json'});
    saveAs(blob, 'my-preset.presetforge');
  });

  // Presets: load from file
  btnLoadPreset.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    const txt = await file.text();
    try {
      const p = JSON.parse(txt);
      // normalizar y aplicar
      state.blocks = [];
      state.theme = p.theme || 'neutral';
      state.fonts = p.fonts || 'system';
      state.globalNote = p.globalNote || '';
      state.exportMode = p.exportMode || 'plain';
      state.stacked = !!p.stacked;
      for(const item of (p.blocks||[])){
        const b = { id: uid(), x: item.x??40, y: item.y??40, w: item.w??560, h: item.h??100, bg: item.bg??null, kind:item.kind, text:item.text||'', note:item.note||'' };
        state.blocks.push(b);
      }
      el('#theme').value = state.theme;
      el('#fonts').value = state.fonts;
      el('#globalNote').value = state.globalNote;
      el('#exportMode').value = state.exportMode;
      el('#toggleStack').checked = state.stacked;
      applyTheme();
      setStacked(state.stacked);
      draw();
      const modal = bootstrap.Modal.getOrCreateInstance(presetsModal);
      modal.hide();
    } catch(err){ alert('Preset no válido.'); }
  });

  // Generate files for export (with comments; Tailwind mapping)
  function generateFiles(){
    const mode = state.exportMode;
    const css = (mode === 'tailwind') ? '' : exportedCSS();
    const body = (mode === 'tailwind') ? exportedBodyTailwindWithComments() : exportedBodyWithComments();
    const topComment = state.globalNote ? `\\n<!-- ${escapeHtml(state.globalNote)} -->\\n` : '';
    const headLinks = (() => {
      if (mode === 'bootstrap') return '\\n  <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css\">';
      if (mode === 'tailwind') return '\\n  <script src=\"https://cdn.tailwindcss.com\"></script>';
      return '';
    })();
    const html = `<!DOCTYPE html>
<html lang="es" class="${mode==='tailwind'?'':'exported'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(state.siteTitle || 'Mi Sitio')}</title>${topComment}
  <link rel="stylesheet" href="style.css">${headLinks}
</head>
<body class="theme-${state.theme}" style="--title-font:${FONT_SETS[state.fonts]?.title||FONT_SETS.system.title};--body-font:${FONT_SETS[state.fonts]?.body||FONT_SETS.system.body}">
  ${body}
</body>
</html>`;
    return {html, css};
  }

  function exportedCSS(){
    return `:root{--brand:#17b897;--brand-2:#7cd4c2;--bg:#fffdf8;--ink:#162a2a;--title-font:${FONT_SETS[state.fonts]?.title||FONT_SETS.system.title};--body-font:${FONT_SETS[state.fonts]?.body||FONT_SETS.system.body}}
.theme-mint{--brand:#17b897;--brand-2:#7cd4c2;--bg:#fffdf8;--ink:#162a2a}
.theme-forest{--brand:#0b5d1e;--brand-2:#174d2c;--bg:#fafaf7;--ink:#0e1b12}
.theme-magenta{--brand:#ff3da4;--brand-2:#ff8a00;--bg:#fff9ff;--ink:#1a0b1a}
.theme-neutral{--brand:#495057;--brand-2:#212529;--bg:#ffffff;--ink:#212529}
body{background:var(--bg);color:var(--ink);font-family:var(--body-font)}
h1,h2,h3{font-family:var(--title-font)}
.btn{display:inline-block;padding:.75rem 1.25rem;background:var(--brand);color:#fff;border-radius:.5rem;text-decoration:none}
.imgbox{background:#e9ecef;border-radius:.5rem;display:flex;align-items:center;justify-content:center;color:#6c757d}
.section{padding:2rem;border:1px dashed #ccc;border-radius:.75rem;background:#fff}
.navbar{background:var(--brand);color:white;padding:1rem;border-radius:.5rem}
main{max-width:960px;margin:2rem auto;padding:0 1rem}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.cardx{border:1px solid #e5e7eb;border-radius:.75rem;padding:1rem;background:#fff}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.testimonial{border-left:4px solid var(--brand);background:#fff;padding:1rem;border-radius:.5rem}
.pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.pricing .plan{border:1px solid #e5e7eb;border-radius:.75rem;padding:1rem;background:#fff}
footer{color:#fff;background:var(--brand-2);padding:1.25rem;border-radius:.5rem}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.feature{background:#fff;border:1px solid #e5e7eb;border-radius:.75rem;padding:1rem}
.feature .ico{width:32px;height:32px;border-radius:50%;background:var(--brand);display:inline-block;margin-right:.5rem}
.faq{border:1px solid #e5e7eb;border-radius:.75rem;background:#fff;padding:1rem}
.faq details{border-bottom:1px solid #eef;padding:.5rem 0}
.timeline{border-left:3px solid var(--brand);padding-left:1rem}
.timeline .item{position:relative;margin:.5rem 0}
.timeline .item::before{content:'';position:absolute;left:-14px;top:.3rem;width:10px;height:10px;border-radius:50%;background:var(--brand)}`;
  }

  function exportedBodyWithComments(){
    let out = '<main>\\n';
    for(const b of state.blocks){
      const note = b.note ? `\\n  <!-- ${escapeHtml(b.note)} -->\\n` : '\\n';
      switch(b.kind){
        case 'navbar':
          out += `${note}  <nav class="navbar">${escapeHtml(state.siteTitle || 'Mi Sitio')}</nav>\\n`; break;
        case 'hero':
          out += `${note}  <section class="section"><h1>${escapeHtml(state.siteTitle || 'Mi Sitio')}</h1><p>${escapeHtml(b.text||'')}</p></section>\\n`; break;
        case 'heading':
          out += `${note}  <h1>${escapeHtml(b.text||'')}</h1>\\n`; break;
        case 'paragraph':
          out += `${note}  <p>${escapeHtml(b.text||'')}</p>\\n`; break;
        case 'button':
          out += `${note}  <a class="btn" href="#">${escapeHtml(b.text||'')}</a>\\n`; break;
        case 'image':
          out += `${note}  <div class="imgbox" style="height:160px;">IMG</div>\\n`; break;
        case 'section':
          out += `${note}  <section class="section">${escapeHtml(b.text||'')}</section>\\n`; break;
        case 'cards3': {
          const parts = (b.text||'').split('|');
          out += `${note}  <div class="cards">` + [0,1,2].map(i => `<div class="cardx">${escapeHtml(parts[i]||('Card '+(i+1)))}</div>`).join('') + `</div>\\n`; break;
        }
        case 'grid3': {
          const parts = (b.text||'').split('|');
          out += `${note}  <div class="grid3">` + [0,1,2].map(i => `<div class="cardx text-center">${escapeHtml(parts[i]||('Elemento '+(i+1)))}</div>`).join('') + `</div>\\n`; break;
        }
        case 'features3': {
          const feats = (b.text||'').split('|');
          out += `${note}  <div class="features">` + [0,1,2].map(i => `<div class="feature"><span class="ico"></span><strong>${escapeHtml(feats[i]||('Feature '+(i+1)))}</strong><div class="small text-muted">Descripción.</div></div>`).join('') + `</div>\\n`; break;
        }
        case 'faq': {
          const parts = (b.text||'').split('|');
          out += `${note}`;
          for (let i=0;i<parts.length;i+=2){
            const q = parts[i] || `Pregunta ${i/2+1}?`;
            const a = parts[i+1] || `Respuesta ${i/2+1}.`;
            out += `  <div class="faq"><details><summary>${escapeHtml(q)}</summary><div class="mt-1">${escapeHtml(a)}</div></details></div>\\n`;
          }
          break;
        }
        case 'timeline': {
          const items = (b.text||'').split('|').map(s=>`<div class="item">${escapeHtml(s)}</div>`).join('');
          out += `${note}  <div class="timeline">${items}</div>\\n`; break;
        }
        case 'pricing': {
          const plans = (b.text||'').split('|');
          out += `${note}  <div class="pricing">` + [0,1,2].map(i => {
            const p = plans[i]||'';
            const [name, price] = p.split(' ');
            return `<div class="plan"><div class="fw-bold mb-1">${escapeHtml(name||('Plan '+(i+1)))}</div><div class="display-6">${escapeHtml(price||'9€')}</div><a class="btn" href="#">Elegir</a></div>`;
          }).join('') + `</div>\\n`; break;
        }
        case 'footer':
          out += `${note}  <footer>${escapeHtml(b.text||'')}</footer>\\n`; break;
      }
    }
    out += '</main>';
    return out;
  }

  // Tailwind body
  function exportedBodyTailwindWithComments(){
    let out = '<main class="max-w-5xl mx-auto px-4 my-8">\\n';
    for(const b of state.blocks){
      const note = b.note ? `\\n  <!-- ${escapeHtml(b.note)} -->\\n` : '\\n';
      switch(b.kind){
        case 'navbar':
          out += `${note}  <nav class="bg-blue-600 text-white rounded-md p-4 mb-6 font-semibold">${escapeHtml(state.siteTitle || 'Mi Sitio')}</nav>\\n`; break;
        case 'hero':
          out += `${note}  <section class="rounded-lg border border-dashed border-gray-300 bg-white p-6 mb-6"><h1 class="text-3xl font-bold mb-2">${escapeHtml(state.siteTitle || 'Mi Sitio')}</h1><p class="text-gray-600">${escapeHtml(b.text||'')}</p></section>\\n`; break;
        case 'heading':
          out += `${note}  <h1 class="text-3xl font-bold mb-4">${escapeHtml(b.text||'')}</h1>\\n`; break;
        case 'paragraph':
          out += `${note}  <p class="mb-4 text-gray-800">${escapeHtml(b.text||'')}</p>\\n`; break;
        case 'button':
          out += `${note}  <a class="inline-block bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition mb-4" href="#">${escapeHtml(b.text||'')}</a>\\n`; break;
        case 'image':
          out += `${note}  <div class="bg-gray-200 rounded-md h-40 flex items-center justify-center text-gray-500 mb-6">IMG</div>\\n`; break;
        case 'section':
          out += `${note}  <section class="rounded-lg border border-dashed border-gray-300 bg-white p-6 mb-6">${escapeHtml(b.text||'')}</section>\\n`; break;
        case 'cards3': {
          const parts = (b.text||'').split('|');
          out += `${note}  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">` + [0,1,2].map(i => `<div class="rounded-lg border border-gray-200 bg-white p-4">${escapeHtml(parts[i]||('Card '+(i+1)))}</div>`).join('') + `</div>\\n`; break;
        }
        case 'grid3': {
          const parts = (b.text||'').split('|');
          out += `${note}  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">` + [0,1,2].map(i => `<div class="rounded-lg bg-gray-50 p-4 text-center">${escapeHtml(parts[i]||('Elemento '+(i+1)))}</div>`).join('') + `</div>\\n`; break;
        }
        case 'features3': {
          const feats = (b.text||'').split('|');
          out += `${note}  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">` + [0,1,2].map(i => `<div class="rounded-lg border border-gray-200 bg-white p-4"><div class="flex items-center mb-2"><span class="inline-flex w-8 h-8 rounded-full bg-blue-600 mr-2"></span><strong>${escapeHtml(feats[i]||('Feature '+(i+1)))}</strong></div><div class="text-sm text-gray-600">Descripción breve.</div></div>`).join('') + `</div>\\n`; break;
        }
        case 'faq': {
          const parts = (b.text||'').split('|');
          out += `${note}  <div class="rounded-lg border border-gray-200 bg-white p-4 mb-6">\\n`;
          for (let i=0;i<parts.length;i+=2){
            const q = parts[i] || `Pregunta ${i/2+1}?`;
            const a = parts[i+1] || `Respuesta ${i/2+1}.`;
            out += `    <details class="border-b border-gray-100 py-2"><summary class="cursor-pointer font-medium">${escapeHtml(q)}</summary><div class="mt-1 text-sm text-gray-700">${escapeHtml(a)}</div></details>\\n`;
          }
          out += `  </div>\\n`; break;
        }
        case 'timeline': {
          const items = (b.text||'').split('|').map(s=>`<div class="relative pl-5 my-1 before:content-[''] before:absolute before:left-0 before:top-2 before:w-2.5 before:h-2.5 before:rounded-full before:bg-blue-600"><span>${escapeHtml(s)}</span></div>`).join('');
          out += `${note}  <div class="border-l-4 border-blue-600 pl-4 mb-6">${items}</div>\\n`; break;
        }
        case 'pricing': {
          const plans = (b.text||'').split('|');
          out += `${note}  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">` + [0,1,2].map(i => {
            const p = plans[i]||'';
            const [name, price] = p.split(' ');
            return `<div class="rounded-lg border border-gray-200 bg-white p-4 text-center"><div class="font-bold mb-1">${escapeHtml(name||('Plan '+(i+1)))}</div><div class="text-4xl">${escapeHtml(price||'9€')}</div><a class="inline-block mt-2 bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-700">Elegir</a></div>`;
          }).join('') + `</div>\\n`; break;
        }
        case 'footer':
          out += `${note}  <footer class="rounded-md bg-gray-800 text-white p-4 text-center mb-6">${escapeHtml(b.text||'')}</footer>\\n`; break;
      }
    }
    out += '</main>';
    return out;
  }

  function rgbToHex(v){
    if(!v) return '#ffffff';
    if(/^#/.test(v)) return v;
    const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if(!m) return '#ffffff';
    return '#' + [m[1],m[2],m[3]].map(n => ('0'+parseInt(n,10).toString(16)).slice(-2)).join('');
  }
  function getComputedStyleColor(bg){ return bg || null; }
  function escapeHtml(s=''){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Init
  siteTitle.value = state.siteTitle;
  theme.value = state.theme;
  fonts.value = state.fonts;
  globalNote.value = state.globalNote;
  toggleSnap.checked = state.snap;
  toggleStack.checked = state.stacked;
  exportModeSel.value = state.exportMode;
  applyTheme();
  setPreview(state.preview);
  setStacked(state.stacked);
  draw();

  // keyboard nudges (desktop use)
  window.addEventListener('keydown', (e) => {
    const b = current(); if(!b || state.stacked) return;
    const step = e.shiftKey ? 10 : 1;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      if(e.key==='ArrowLeft') b.x -= step;
      if(e.key==='ArrowRight') b.x += step;
      if(e.key==='ArrowUp') b.y -= step;
      if(e.key==='ArrowDown') b.y += step;
      redraw(b.id);
      e.preventDefault();
    }
    if(e.key==='Delete' || e.key==='Backspace'){
      state.blocks = state.blocks.filter(x=>x.id!==b.id); state.selected=null; draw(); updateInspector();
    }
  });

  function current(){ return state.blocks.find(x => x.id===state.selected) || null; }
  function redraw(id){
    const node = els('.block', canvas).find(n => n.dataset.id===id);
    if(!node) return;
    const b = state.blocks.find(x=>x.id===id);
    if (!state.stacked) {
      node.style.left = b.x + 'px'; node.style.top = b.y + 'px';
      node.style.width = b.w + 'px'; node.style.height = b.h + 'px';
    }
    node.style.background = b.bg || '';
    node.innerHTML = renderBlockInner(b);
  }
})();