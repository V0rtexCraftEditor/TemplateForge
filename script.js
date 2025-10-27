/* TemplateForge v7 — cumple puntos 1–10:
   1 Drag+Resize (secciones y cards)
   2 Paleta ampliada (swatches, degradados, tipografías, bold/italic)
   3 Hovers de botones (5 presets) se reflejan en export
   4 Detección de solapes y fuera de lienzo en rojo
   5 Imágenes con uploader + Previsualizar (iframe)
   6 Ayuda (“i”) + comentario por bloque exportado como <!-- -->
   7 Cards editables (texto, color por card, peso)
   8 Navbar con botones (texto|enlace)
   9 Iconos (estrella, check, corazón, flecha)
   10 IDs/Anclas y enlaces #id desde botones/navbar
*/
(function(){
  const el = (s, r=document) => r.querySelector(s);
  const els = (s, r=document) => Array.from(r.querySelectorAll(s));

  const state = {
    siteTitle: 'Mi Sitio',
    theme: 'neutral',
    fonts: 'system',
    fontWeight: '400',
    fontItalic: false,
    brandColor: '#0d6efd',
    gradientClass: 'gradient-0',
    globalNote: '',
    blocks: [],
    selected: null,
    preview: 'desktop',
    snap: true,
    exportMode: 'plain',
    stacked: false,
    btnHover: 'none'
  };

  const SWATCHES = ['#0d6efd','#6610f2','#6f42c1','#d63384','#dc3545','#fd7e14','#ffc107','#198754','#20c997','#0dcaf0','#343a40','#6c757d','#0ea5e9','#22c55e','#eab308','#ef4444','#a855f7','#14b8a6'];
  const GRADIENTS = ['gradient-0','gradient-1','gradient-2','gradient-3'];

  const COMPONENTS = [
    {kind:'navbar', label:'Navbar', help:'Barra superior con enlaces.'},
    {kind:'hero', label:'Hero', help:'Sección destacada inicial.'},
    {kind:'heading', label:'Heading', help:'Encabezado de sección.'},
    {kind:'paragraph', label:'Paragraph', help:'Texto de párrafo.'},
    {kind:'button', label:'Button', help:'Botón de acción (enlaza a #id).'},
    {kind:'image', label:'Image', help:'Imagen subida en el inspector.'},
    {kind:'section', label:'Section', help:'Contenedor genérico con ID.'},
    {kind:'cards3', label:'Cards x3', help:'Tres tarjetas editables (color y peso).'},
    {kind:'grid3', label:'Grid 3', help:'Tres elementos en rejilla.'},
    {kind:'features3', label:'Features (3)', help:'Tres ventajas con icono.'},
    {kind:'faq', label:'FAQs', help:'Preguntas frecuentes.'},
    {kind:'timeline', label:'Timeline', help:'Hitos en el tiempo.'},
    {kind:'pricing', label:'Pricing', help:'Planes de precios x3.'},
    {kind:'footer', label:'Footer', help:'Pie de página.'}
  ];

  // DOM refs
  const canvas = el('#canvas');
  const siteTitle = el('#siteTitle');
  const globalNote = el('#globalNote');
  const theme = el('#theme');
  const fonts = el('#fonts');
  const fontWeight = el('#fontWeight');
  const fontItalic = el('#fontItalic');
  const btnClear = el('#btnClear');
  const btnExportHTML = el('#btnExportHTML');
  const btnExportZIP = el('#btnExportZIP');
  const btnWireframe = el('#btnWireframe');
  const btnSave = el('#btnSave');
  const btnLoad = el('#btnLoad');
  const pvMobile = el('#pvMobile'), pvTablet = el('#pvTablet'), pvDesktop = el('#pvDesktop');
  const toggleSnap = el('#toggleSnap');
  const toggleStack = el('#toggleStack');
  const exportModeSel = el('#exportMode');
  const btnHoverSel = el('#btnHover');
  const swatches = el('#swatches');
  const gradients = el('#gradients');
  const warningsBox = el('#warnings');
  const componentsList = el('#componentsList');

  const btnLivePreview = el('#btnLivePreview');
  const previewModalEl = el('#previewModal');
  const previewFrame = el('#previewFrame');

  // Inspector
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
  const insAnchor = el('#insAnchor');
  const insIcon = el('#insIcon');
  const navbarButtonsWrap = el('#navbarButtonsWrap');
  const navbarButtons = el('#navbarButtons');
  const imageUploaderWrap = el('#imageUploaderWrap');
  const imageUploader = el('#imageUploader');
  const cardsOptions = el('#cardsOptions');
  const cardsTexts = el('#cardsTexts');
  const card1bg = el('#card1bg');
  const card2bg = el('#card2bg');
  const card3bg = el('#card3bg');
  const cardsWeight = el('#cardsWeight');

  const FONT_SETS = {
    'system': { title:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', body:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' },
    'montserrat-merriweather': { title:"'Montserrat',system-ui", body:"'Merriweather',Georgia,serif" },
    'poppins-inter': { title:"'Poppins',system-ui", body:"'Inter',system-ui" },
  };

  // UI init
  SWATCHES.forEach(hex => {
    const b = document.createElement('button');
    b.type='button'; b.className='btn btn-sm'; b.style.background=hex; b.title=hex;
    b.style.width='28px'; b.style.height='28px'; b.style.border='1px solid #e1e1e1';
    b.addEventListener('click', ()=>{ state.brandColor=hex; document.documentElement.style.setProperty('--brand', hex); draw(); });
    swatches.appendChild(b);
  });
  GRADIENTS.forEach((g,i)=>{
    const d = document.createElement('button');
    d.type='button'; d.className='btn btn-sm btn-outline-secondary'; d.textContent='Grad '+i;
    d.addEventListener('click', ()=>{ canvas.classList.remove(...GRADIENTS); canvas.classList.add(g); state.gradientClass=g; });
    gradients.appendChild(d);
  });

  componentsList.innerHTML = COMPONENTS.map(c=>`
    <div class="d-flex gap-2">
      <button class="btn btn-outline-primary flex-grow-1 add-block" data-kind="${c.kind}">${c.label}</button>
      <span class="badge bg-info align-self-center" data-bs-toggle="tooltip" title="${c.help}">i</span>
    </div>`).join('');
  els('[data-bs-toggle="tooltip"]').forEach(t => new bootstrap.Tooltip(t));

  function applyTheme(){
    document.body.classList.remove('theme-mint','theme-forest','theme-magenta','theme-neutral');
    document.body.classList.add('theme-' + state.theme);
    const f = FONT_SETS[state.fonts] || FONT_SETS.system;
    document.documentElement.style.setProperty('--title-font', f.title);
    document.documentElement.style.setProperty('--body-font', f.body);
    document.documentElement.style.setProperty('--brand', state.brandColor || '#0d6efd');
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
    const base = { x: 40, y: 40, w: 260, h: 80, text: '', bg: null, note:'', anchor:'', icon:'' };
    const map = {
      navbar: { x: 10, y: 10, w: 700, h: 56, text: 'Navbar', note:'Barra superior con enlaces.', navbar:{buttons:[{t:'Inicio',href:'#'}]} },
      hero: { x: 20, y: 80, w: 560, h: 160, text: 'Hero / cabecera', note: 'Sección destacada inicial.' },
      heading: { h: 60, text:'Título principal', note:'Encabezado de sección.' },
      paragraph: { h: 100, text:'Párrafo de ejemplo.', note:'Texto descriptivo.' },
      button: { w: 180, h: 48, text:'Llamada a la acción', note:'Botón que enlaza a un ID/Ancla.' },
      image: { w: 260, h: 160, text:'IMG', note:'Imagen cargada desde el inspector.' },
      section: { w: 320, h: 160, text:'Sección', note:'Contenedor con ID/Ancla.' },
      cards3: { w: 560, h: 220, text: 'Card A|Card B|Card C', note:'Tres tarjetas editables.', cards:{bgs:['#ffffff','#ffffff','#ffffff'], weight:'400'} },
      grid3: { w: 560, h: 200, text: 'Elemento 1|Elemento 2|Elemento 3', note:'Grid de 3 columnas.' },
      features3: { w: 560, h: 180, text: 'Rápido|Responsivo|Accesible', note:'Tres ventajas con icono.' },
      faq: { w: 560, h: 220, text: '¿Pregunta 1?|Respuesta 1.|¿Pregunta 2?|Respuesta 2.|¿Pregunta 3?|Respuesta 3.', note:'Preguntas frecuentes.' },
      timeline: { w: 560, h: 220, text: 'Inicio|Fase 1|Lanzamiento', note:'Hitos temporales.' },
      pricing: { w: 560, h: 240, text: 'Básico 9€|Pro 19€|Plus 29€', note:'Comparativa de planes.' },
      footer: { w: 560, h: 80, text: '© 2025 Mi Sitio — Todos los derechos reservados.', note:'Pie de página.' }
    };
    const b = { id: uid(), kind, ...base, ...(map[kind] || {}) };
    state.blocks.push(b);
    drawBlock(b);
    select(b.id);
  }

  function draw(){
    canvas.innerHTML = '<div class="grid"></div>';
    state.blocks.forEach(drawBlock);
    checkOverlapsDebounced();
  }

  function iconHTML(name){
    if(!name) return '';
    const m = { star:'★', check:'✔', heart:'❤', arrow:'➜' };
    return `<span class="me-1">${m[name]||''}</span>`;
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
    }
    if (b.bg) d.style.background = b.bg;

    d.innerHTML = renderBlockInner(b);

    const rh = document.createElement('div');
    rh.className = 'resize-handle';
    d.appendChild(rh);
    enableDrag(d);
    enableResize(d, rh);

    canvas.appendChild(d);

    d.addEventListener('mousedown', (e) => { if(e.target===rh) return; select(b.id); });
    d.addEventListener('touchstart', () => select(b.id), {passive:true});
  }

  function renderBlockInner(b){
    if (b.kind==='image' && b.imageData) {
      return `<img src="${b.imageData}" alt="Imagen" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:.375rem;">`;
    }
    if (b.kind==='cards3'){
      const parts = (b.text||'').split('|');
      const bgs = b.cards?.bgs || ['#fff','#fff','#fff'];
      const fw = b.cards?.weight || '400';
      const ic = iconHTML(b.icon);
      return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}">
        <div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4">
            <div class="h-100 border rounded p-2" style="background:${bgs[i]};font-weight:${fw}">${ic}${escapeHtml(parts[i]||('Card '+(i+1)))}</div>
          </div>`).join('')}
        </div>
      </div>`;
    }
    switch(b.kind){
      case 'navbar': {
        const links = (b.navbar?.buttons||[]).map(btn=>`<a href="${escapeHtml(btn.href||'#')}">${escapeHtml(btn.t||'Link')}</a>`).join('');
        return `<div class="d-flex w-100 justify-content-between align-items-center">
          <div class="fw-bold">${escapeHtml(state.siteTitle || 'Mi Sitio')}</div>
          <div class="navlinks">${links||''}</div>
        </div>`;
      }
      case 'hero': return `<div class="p-2"><h1 class="h3">${escapeHtml(state.siteTitle || 'Mi Sitio')}</h1><p class="mb-0">${escapeHtml(b.text)}</p></div>`;
      case 'heading': return `<div class="fs-3 fw-bold" style="font-weight:${state.fontWeight};${state.fontItalic?'font-style:italic;':''}">${escapeHtml(b.text)}</div>`;
      case 'paragraph': return `<div style="font-weight:${state.fontWeight};${state.fontItalic?'font-style:italic;':''}">${escapeHtml(b.text)}</div>`;
      case 'button': return `<a href="#" class="btn btn-success btn-sm">${iconHTML(b.icon)}${escapeHtml(b.text)}</a>`;
      case 'image': return `<div class="w-100 h-100 d-flex align-items-center justify-content-center text-muted"><span>Imagen</span></div>`;
      case 'section': return `<div class="p-2"><div class="fw-semibold" style="font-weight:${state.fontWeight};${state.fontItalic?'font-style:italic;':''}">${iconHTML(b.icon)}${escapeHtml(b.text)}</div></div>`;
      case 'grid3': {
        const parts = (b.text||'').split('|');
        return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}"><div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 bg-light rounded p-2 text-center" style="font-weight:${state.fontWeight}">${iconHTML(b.icon)}${escapeHtml(parts[i]||('Elemento '+(i+1)))}</div></div>`).join('')}
        </div></div>`;
      }
      case 'features3': {
        const feats = (b.text||'').split('|');
        const ic = iconHTML(b.icon)||'<span class="ico">★</span>';
        return `<div class="p-2 w-100 ${state.stacked?'':'h-100 overflow-auto'}"><div class="row g-2 ${state.stacked?'':'h-100'}">
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 border rounded p-2" style="font-weight:${state.fontWeight}">
            <div class="d-flex align-items-center mb-2"><span class="badge bg-primary me-2">${ic}</span><strong>${escapeHtml(feats[i]||('Feature '+(i+1)))}</strong></div>
            <div class="small text-muted">Descripción breve.</div>
          </div></div>`).join('')}
        </div></div>`;
      }
      case 'faq': {
        const parts = (b.text||'').split('|'); const items=[];
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
          ${[0,1,2].map(i => `<div class="col-4"><div class="h-100 border rounded p-2 text-center" style="font-weight:${state.fontWeight}">
            <div class="fw-bold mb-1">${escapeHtml((plans[i]||'Plan').split(' ')[0]||('Plan '+(i+1)))}</div>
            <div class="display-6">${escapeHtml((plans[i]||'').split(' ')[1]||'9€')}</div>
            <a class="btn btn-sm btn-primary mt-2" href="#">Elegir</a>
