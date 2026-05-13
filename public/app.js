const FIGMA_TOKEN = window.FIGMA_TOKEN;
const FIGMA_FILE  = 'qKQ2XYf2Ije482td6ximdz';

const ELEM_ICON = {
  Tierra: '🌿', Agua: '💧', Fuego: '🔥', Aire: '💨',
  Místico: '🌑', Objeto: '🎒', Lugar: '🏛️', Efecto: '✨', Especial: '⭐'
};

// Image cache: node_id -> url
const imgCache = {};
const imgRequests = {};

async function fetchFigmaImages(nodeIds) {
  const toFetch = nodeIds.filter(id => id && !imgCache[id] && !imgRequests[id]);
  if (!toFetch.length) return;

  const chunks = [];
  for (let i = 0; i < toFetch.length; i += 50) chunks.push(toFetch.slice(i, i + 50));

  for (const chunk of chunks) {
    const ids = chunk.map(id => id.replace('-', ':')).join(',');
    const promise = fetch(
      `https://api.figma.com/v1/images/${FIGMA_FILE}?ids=${encodeURIComponent(ids)}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': FIGMA_TOKEN } }
    )
    .then(r => r.json())
    .then(data => {
      if (data.images) {
        for (const [nodeId, url] of Object.entries(data.images)) {
          const key = nodeId.replace(':', '-');
          imgCache[key] = url;
          delete imgRequests[key];
          document.querySelectorAll(`[data-node="${key}"]`).forEach(el => {
            if (url) {
              el.src = url;
              el.style.display = 'block';
              el.parentElement.querySelector('.card-img-placeholder')?.remove();
              el.parentElement.querySelector('.modal-img-placeholder')?.remove();
            }
          });
        }
      }
    })
    .catch(err => console.warn('Figma image fetch error:', err));

    chunk.forEach(id => { imgRequests[id] = promise; });
    await promise;
  }
}

function getImgEl(nodeId, isModal = false) {
  const wrap = document.createElement('div');
  wrap.className = isModal ? 'modal-img-wrap' : 'card-img-wrap';

  if (nodeId && imgCache[nodeId]) {
    const img = document.createElement('img');
    img.src = imgCache[nodeId];
    img.dataset.node = nodeId;
    img.alt = 'Carta';
    wrap.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = isModal ? 'modal-img-placeholder' : 'card-img-placeholder';
    placeholder.innerHTML = `<span>🐸</span><span>cargando...</span>`;
    wrap.appendChild(placeholder);

    if (nodeId) {
      const img = document.createElement('img');
      img.dataset.node = nodeId;
      img.alt = 'Carta';
      img.style.display = 'none';
      wrap.appendChild(img);
    }
  }

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

  const nodeIds = filtered.map(c => c.figma_node_id_url).filter(Boolean);
  fetchFigmaImages(nodeIds);

  filtered.forEach((carta, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.elem = carta.elemento || carta.tipo;
    card.style.animationDelay = `${Math.min(i * 0.03, 0.5)}s`;

    const elemLabel = getElemLabel(carta);
    const nodeId = carta.figma_node_id_url;

    card.appendChild(getImgEl(nodeId));

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
    card.appendChild(body);
    card.addEventListener('click', () => openModal(carta));
    grid.appendChild(card);
  });
}

// ─── Modal ───────────────────────────────────────────────────────
function openModal(carta) {
  const overlay = document.getElementById('modal-overlay');
  const inner = document.getElementById('modal-inner');
  const elemLabel = getElemLabel(carta);
  const nodeId = carta.figma_node_id_url;

  if (nodeId) fetchFigmaImages([nodeId]);

  const habs = [];
  if (carta.hab1_nombre) habs.push({ n: carta.hab1_nombre, d: carta.hab1_desc });
  if (carta.hab2_nombre) habs.push({ n: carta.hab2_nombre, d: carta.hab2_desc });

  inner.innerHTML = '';

  const cssElem = (carta.elemento || carta.tipo || '').toLowerCase()
    .replace('í','i').replace('é','e').replace('á','a').replace('ó','o').replace('ú','u');

  inner.style.setProperty('--c-elem', `var(--${cssElem}, var(--accent))`);

  const layout = document.createElement('div');
  layout.className = 'modal-layout';

  layout.appendChild(getImgEl(nodeId, true));

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

  // Prefetch primeras 30
  const firstIds = allCartas.slice(0, 30).map(c => c.figma_node_id_url).filter(Boolean);
  fetchFigmaImages(firstIds);

  // Filtros tipo
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
