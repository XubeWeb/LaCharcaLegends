const REVERSO_URL = 'https://res.cloudinary.com/dylxuavy3/image/upload/f_auto,q_auto/v1778669883/REVERSO_cd5ul3';

const ELEM_ICON = {
  Tierra: '🌿', Agua: '💧', Fuego: '🔥', Aire: '💨',
  Místico: '🌑', Objeto: '🎒', Lugar: '🏛️', Efecto: '✨', Especial: '⭐'
};

function getImgUrl(carta) {
  if (carta.cloudinary_url) return carta.cloudinary_url;
  return `imgs/${carta.codigo}.png`;
}

function getImgEl(carta, isModal = false) {
  const wrap = document.createElement('div');
  wrap.className = isModal ? 'modal-img-wrap' : 'card-img-wrap';

  const img = document.createElement('img');
  img.src = getImgUrl(carta);
  img.alt = carta.nombre;
  img.loading = 'lazy';
  img.onerror = function() {
    this.style.display = 'none';
    const ph = document.createElement('div');
    ph.className = isModal ? 'modal-img-placeholder' : 'card-img-placeholder';
    ph.innerHTML = `<span>${ELEM_ICON[carta.elemento] || '🐸'}</span><span>${carta.nombre}</span>`;
    wrap.appendChild(ph);
  };
  wrap.appendChild(img);

  if (!isModal) {
    const bar = document.createElement('div');
    bar.className = 'card-elem-bar';
    wrap.appendChild(bar);
  }

  return wrap;
}

// ─── State ───────────────────────────────────────────────────────
let allCartas = [];
let filterTipo = 'all';
let filterElem = 'all';
let filterSearch = '';

function filterCartas() {
  return allCartas.filter(c => {
    if (filterTipo !== 'all' && c.tipo !== filterTipo) return false;
    if (filterElem !== 'all') {
      if (c.elemento !== filterElem && c.tipo !== filterElem) return false;
    }
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const haystack = [c.nombre, c.descripcion, c.hab1_nombre, c.hab1_desc, c.hab2_nombre, c.hab2_desc].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function getElemLabel(carta) {
  if (carta.tipo === 'Personaje') return carta.elemento;
  return carta.tipo;
}

// ─── Card flip ────────────────────────────────────────────────────
function buildFlipCard(carta, index) {
  // Outer wrapper: sets perspective and handles stacking context
  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';
  wrapper.style.animationDelay = `${Math.min(index * 0.03, 0.5)}s`;
  wrapper.dataset.elem = carta.elemento || carta.tipo;

  // The scene that flips
  const scene = document.createElement('div');
  scene.className = 'card-scene';

  // ── Cara delantera ──
  const front = document.createElement('div');
  front.className = 'card-face card-front';

  const elemLabel = getElemLabel(carta);
  front.appendChild(getImgEl(carta));

  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `
    <div class="card-tipo">${ELEM_ICON[elemLabel] || ''} ${carta.tipo}${elemLabel !== carta.tipo ? ' · ' + elemLabel : ''}</div>
    <div class="card-nombre">${carta.nombre}</div>
    <div class="card-desc">${carta.descripcion || '—'}</div>
    ${carta.ps != null ? `
    <div class="card-stats">
      <div class="stat-badge">❤️ <span class="s-val">${carta.ps}</span></div>
      ${carta.ad != null ? `<div class="stat-badge">⚔️ <span class="s-val">${carta.ad}</span></div>` : ''}
    </div>` : ''}
  `;
  front.appendChild(body);
  front.addEventListener('click', () => openModal(carta));

  // ── Cara trasera (reverso) ──
  const back = document.createElement('div');
  back.className = 'card-face card-back';

  const backImg = document.createElement('img');
  backImg.src = REVERSO_URL;
  backImg.alt = 'Reverso';
  backImg.loading = 'lazy';
  back.appendChild(backImg);

  scene.appendChild(front);
  scene.appendChild(back);
  wrapper.appendChild(scene);

  // Botón de flip
  const flipBtn = document.createElement('button');
  flipBtn.className = 'flip-btn';
  flipBtn.title = 'Girar carta';
  flipBtn.innerHTML = '↻';
  flipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('flipped');
  });
  wrapper.appendChild(flipBtn);

  return wrapper;
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const filtered = filterCartas();
  const info = document.getElementById('results-info');

  info.textContent = filtered.length === allCartas.length
    ? `${allCartas.length} cartas`
    : `${filtered.length} de ${allCartas.length} cartas`;

  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><div class="e-icon">🐸</div><p>Ninguna carta encontrada con esos filtros.</p></div>';
    return;
  }

  filtered.forEach((carta, i) => {
    grid.appendChild(buildFlipCard(carta, i));
  });
}

// ─── Modal ───────────────────────────────────────────────────────
function openModal(carta) {
  const overlay = document.getElementById('modal-overlay');
  const inner = document.getElementById('modal-inner');
  const elemLabel = getElemLabel(carta);

  const habs = [];
  if (carta.hab1_nombre) habs.push({ n: carta.hab1_nombre, d: carta.hab1_desc });
  if (carta.hab2_nombre) habs.push({ n: carta.hab2_nombre, d: carta.hab2_desc });

  inner.innerHTML = '';

  const cssElem = (carta.elemento || carta.tipo || '').toLowerCase()
    .replace(/[íì]/g,'i').replace(/[éè]/g,'e').replace(/[áà]/g,'a')
    .replace(/[óò]/g,'o').replace(/[úù]/g,'u');

  inner.style.setProperty('--c-elem', `var(--${cssElem}, var(--accent))`);

  const layout = document.createElement('div');
  layout.className = 'modal-layout';

  layout.appendChild(getImgEl(carta, true));

  const info = document.createElement('div');
  info.className = 'modal-info';
  info.innerHTML = `
    <div class="modal-elem-line">${ELEM_ICON[elemLabel] || ''} ${carta.tipo}${elemLabel !== carta.tipo ? ' · ' + elemLabel : ''}</div>
    <div class="modal-nombre">${carta.nombre}</div>
    <div class="modal-codigo">${carta.codigo}</div>
    <div class="modal-desc">${carta.descripcion || '—'}</div>
    ${carta.ps != null ? `
    <div class="modal-stats">
      <div class="modal-stat"><div class="ms-val">${carta.ps}</div><div class="ms-lbl">❤️ Vida</div></div>
      ${carta.ad != null ? `<div class="modal-stat"><div class="ms-val">${carta.ad}</div><div class="ms-lbl">⚔️ Ataque</div></div>` : ''}
    </div>` : ''}
    <div class="modal-habs">
      ${habs.map(h => `
        <div class="hab-block">
          <div class="hab-nombre">${h.n}</div>
          <div class="hab-desc">${h.d}</div>
        </div>`).join('')}
    </div>
  `;
  layout.appendChild(info);
  inner.appendChild(layout);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Init ─────────────────────────────────────────────────────────
async function init() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '<div class="loading-state">Invocando cartas del Valle Hundido...</div>';

  const res = await fetch('cartas.json');
  allCartas = await res.json();

  // Stats header
  const statsEl = document.getElementById('header-stats');
  const tipos = {};
  allCartas.forEach(c => { tipos[c.tipo] = (tipos[c.tipo] || 0) + 1; });
  statsEl.innerHTML = [
    { l: 'Cartas', n: allCartas.length },
    { l: 'Personajes', n: tipos['Personaje'] || 0 },
    { l: 'Objetos', n: tipos['Objeto'] || 0 },
    { l: 'Lugares', n: tipos['Lugar'] || 0 },
  ].map(s => `<div class="stat"><div class="stat-n">${s.n}</div><div class="stat-l">${s.l}</div></div>`).join('');

  renderGrid();

  document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const value = btn.dataset.value;
      if (filter === 'tipo') {
        filterTipo = value;
        document.querySelectorAll('[data-filter="tipo"]').forEach(b => b.classList.remove('active'));
      } else {
        filterElem = value;
        document.querySelectorAll('[data-filter="elemento"]').forEach(b => b.classList.remove('active'));
      }
      btn.classList.add('active');
      renderGrid();
    });
  });

  document.getElementById('search').addEventListener('input', e => {
    filterSearch = e.target.value.trim();
    renderGrid();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

init();
