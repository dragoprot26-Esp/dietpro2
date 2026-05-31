// ================================================
// DietPro - Página Pública del Local
// /local/:slug — productos, ofertas, contacto
// ================================================

const PublicPage = (() => {

  let _data = null; // { config, products, offers }

  // ── Bootstrap para cuando la URL es /local/slug ──────────────
  async function boot() {
    const slug = _getSlug();
    if (!slug) { _renderError('URL inválida'); return; }

    document.title = 'Cargando...';
    document.body.innerHTML = _loadingHTML();

    // Cargar datos públicos desde Supabase (sin autenticación)
    const SUPABASE_URL = window.__SUPABASE_URL__ || 'https://upoexzjltapiuijhszzk.supabase.co';
    const SUPABASE_KEY = window.__SUPABASE_KEY__ || '';

    try {
      // 1. Configuración del local
      const cfgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/diet_config?public_slug=eq.${encodeURIComponent(slug)}&select=*`,
        { headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' } }
      );
      const cfgArr = await cfgRes.json();
      if (!cfgArr.length) { _renderError('Local no encontrado'); return; }
      const cfg = cfgArr[0];
      const tenantId = cfg.tenant_id;

      // 2. Productos activos
      const prodRes = await fetch(
        `${SUPABASE_URL}/rest/v1/products?tenant_id=eq.${tenantId}&active=eq.true&select=*&order=name.asc`,
        { headers: { 'apikey': SUPABASE_KEY } }
      );
      const products = await prodRes.json();

      // 3. Ofertas activas y no vencidas
      const now = new Date().toISOString();
      const offRes = await fetch(
        `${SUPABASE_URL}/rest/v1/offers?tenant_id=eq.${tenantId}&active=eq.true&or=(expires_at.is.null,expires_at.gt.${now})&select=*,products(name,image_url)`,
        { headers: { 'apikey': SUPABASE_KEY } }
      );
      const offers = await offRes.json();

      _data = { config: cfg, products, offers };
      _renderPage();
    } catch(e) {
      console.error(e);
      _renderError('Error al cargar. Intentá más tarde.');
    }
  }

  function _getSlug() {
    const m = location.pathname.match(/\/local\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  // ── Loading splash ────────────────────────────────────────────
  function _loadingHTML() {
    return `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;
                  background:#0d0d0d;color:#fff;font-family:sans-serif;flex-direction:column;gap:1rem;">
        <div style="font-size:2.5rem;">🥦</div>
        <p style="opacity:.7;">Cargando...</p>
      </div>`;
  }

  // ── Error ─────────────────────────────────────────────────────
  function _renderError(msg) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;
                  background:#0d0d0d;color:#fff;font-family:sans-serif;flex-direction:column;gap:1rem;">
        <div style="font-size:2.5rem;">❌</div>
        <p>${msg}</p>
        <a href="/" style="color:#2ECC71;">← Volver al inicio</a>
      </div>`;
  }

  // ── Render página pública ─────────────────────────────────────
  function _renderPage() {
    const { config: cfg, products, offers } = _data;
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    document.title = `${cfg.name || 'Mi Dietética'} — Productos y Ofertas`;
    document.body.innerHTML = `
      <div id="pub-app">
        <!-- HEADER -->
        <header class="pub-header">
          ${cfg.logo_url ? `<img src="${cfg.logo_url}" class="pub-logo" alt="logo">` : '<div class="pub-logo-placeholder">🥦</div>'}
          <div class="pub-header-info">
            <h1>${_esc(cfg.name||'Mi Dietética')}</h1>
            ${cfg.address ? `<p>📍 ${_esc(cfg.address)}</p>` : ''}
          </div>
          <div class="pub-contact-btns">
            ${cfg.whatsapp ? `<a href="https://wa.me/${cfg.whatsapp.replace(/\D/g,'')}" target="_blank" class="pub-btn pub-btn-wa">📱 WhatsApp</a>` : ''}
            ${cfg.email    ? `<a href="mailto:${_esc(cfg.email)}" class="pub-btn pub-btn-em">✉️ Email</a>` : ''}
          </div>
        </header>

        <!-- OFERTAS -->
        ${offers.length ? `
        <section class="pub-section">
          <h2>🏷️ Ofertas</h2>
          <div class="pub-offers-grid">
            ${offers.map(o => `
              <div class="pub-offer-card">
                ${o.products?.image_url ? `<img src="${o.products.image_url}" alt="" class="pub-offer-img">` : '<div class="pub-offer-img-ph">🥦</div>'}
                <div class="pub-offer-body">
                  <strong>${_esc(o.products?.name||'Producto')}</strong>
                  ${o.label ? `<span class="pub-offer-label">${_esc(o.label)}</span>` : ''}
                  <span class="pub-offer-price">$${Number(o.offer_price).toLocaleString('es-AR')}</span>
                  ${o.expires_at ? `<span class="pub-offer-exp">Hasta ${_fmtDate(o.expires_at)}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </section>` : ''}

        <!-- BUSCADOR Y FILTROS -->
        <section class="pub-section">
          <h2>🛒 Productos</h2>
          <div class="pub-search-row">
            <input id="pub-search" type="text" placeholder="Buscar producto..." oninput="PublicPage.search()" class="pub-search">
          </div>
          ${categories.length > 1 ? `
          <div class="pub-cats" id="pub-cats">
            <button class="pub-cat active" onclick="PublicPage.filterCat('',this)">Todos</button>
            ${categories.map(c=>`<button class="pub-cat" onclick="PublicPage.filterCat('${_esc(c)}',this)">${_esc(c)}</button>`).join('')}
          </div>` : ''}
          <div id="pub-products" class="pub-products-grid">
            ${_renderProducts(products)}
          </div>
          <p id="pub-empty" style="display:none;text-align:center;opacity:.6;padding:2rem;">Sin resultados</p>
        </section>

        <!-- FOOTER -->
        <footer class="pub-footer">
          <p>Powered by <strong>DietPro</strong> 🥦 — <a href="https://cyc-admin.vercel.app" target="_blank">CyC Ecosystem</a></p>
        </footer>
      </div>
    `;

    _injectStyles();
  }

  function _renderProducts(products) {
    if (!products.length) return '';
    return products.map(p => `
      <div class="pub-prod-card" data-name="${_esc(p.name)}" data-cat="${_esc(p.category||'')}">
        ${p.image_url ? `<img src="${p.image_url}" alt="" class="pub-prod-img">` : '<div class="pub-prod-img-ph">📦</div>'}
        <div class="pub-prod-body">
          <strong>${_esc(p.name)}</strong>
          ${p.brand ? `<span class="pub-prod-brand">${_esc(p.brand)}</span>` : ''}
          ${p.category ? `<span class="pub-prod-cat">${_esc(p.category)}</span>` : ''}
          <span class="pub-prod-price">$${Number(p.price).toLocaleString('es-AR')}</span>
          ${p.stock <= 0 ? '<span class="pub-prod-stock-out">Sin stock</span>' : ''}
        </div>
      </div>
    `).join('');
  }

  // ── Búsqueda y filtros ────────────────────────────────────────
  let _activeCat = '';

  function search() {
    _applyFilters();
  }

  function filterCat(cat, btn) {
    _activeCat = cat;
    document.querySelectorAll('.pub-cat').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    _applyFilters();
  }

  function _applyFilters() {
    const q = (document.getElementById('pub-search')?.value||'').toLowerCase();
    const cards = document.querySelectorAll('.pub-prod-card');
    let visible = 0;
    cards.forEach(card => {
      const name = (card.dataset.name||'').toLowerCase();
      const cat  = (card.dataset.cat||'').toLowerCase();
      const matchQ = !q || name.includes(q);
      const matchC = !_activeCat || cat === _activeCat.toLowerCase();
      card.style.display = (matchQ && matchC) ? '' : 'none';
      if (matchQ && matchC) visible++;
    });
    const empty = document.getElementById('pub-empty');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  }

  // ── Estilos inyectados ────────────────────────────────────────
  function _injectStyles() {
    const css = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0d0d0d; color: #f0f0f0; min-height: 100vh; }
      a { color: #2ECC71; }
      #pub-app { max-width: 900px; margin: 0 auto; padding: 0 1rem 4rem; }

      /* HEADER */
      .pub-header { display:flex; align-items:center; gap:1rem; padding:1.25rem 0; border-bottom:1px solid #222; flex-wrap:wrap; }
      .pub-logo { width:70px; height:70px; object-fit:cover; border-radius:50%; }
      .pub-logo-placeholder { width:70px; height:70px; border-radius:50%; background:#1a1a1a; display:flex; align-items:center; justify-content:center; font-size:2rem; }
      .pub-header-info { flex:1; }
      .pub-header-info h1 { font-size:1.5rem; color:#2ECC71; }
      .pub-header-info p  { font-size:.85rem; opacity:.7; margin-top:.25rem; }
      .pub-contact-btns { display:flex; gap:.5rem; flex-wrap:wrap; }
      .pub-btn { padding:.5rem 1rem; border-radius:8px; text-decoration:none; font-size:.85rem; font-weight:600; }
      .pub-btn-wa { background:#25D366; color:#000; }
      .pub-btn-em { background:#333; color:#fff; }

      /* SECTION */
      .pub-section { margin-top:2rem; }
      .pub-section h2 { font-size:1.1rem; margin-bottom:1rem; color:#2ECC71; border-left:3px solid #2ECC71; padding-left:.75rem; }

      /* OFERTAS */
      .pub-offers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:1rem; }
      .pub-offer-card { background:#1a1a1a; border:1px solid #2ECC71; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
      .pub-offer-img { width:100%; height:120px; object-fit:cover; }
      .pub-offer-img-ph { width:100%; height:100px; display:flex; align-items:center; justify-content:center; font-size:2rem; background:#111; }
      .pub-offer-body { padding:.75rem; display:flex; flex-direction:column; gap:.35rem; }
      .pub-offer-label { font-size:.75rem; background:#2ECC71; color:#000; padding:.2rem .5rem; border-radius:4px; width:fit-content; }
      .pub-offer-price { font-size:1.2rem; font-weight:700; color:#2ECC71; }
      .pub-offer-exp  { font-size:.75rem; opacity:.6; }

      /* SEARCH */
      .pub-search-row { margin-bottom:1rem; }
      .pub-search { width:100%; padding:.65rem 1rem; border-radius:10px; border:1px solid #333; background:#1a1a1a; color:#f0f0f0; font-size:.95rem; }
      .pub-search:focus { outline:none; border-color:#2ECC71; }
      .pub-cats { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1rem; }
      .pub-cat { padding:.35rem .85rem; border-radius:20px; border:1px solid #333; background:transparent; color:#f0f0f0; cursor:pointer; font-size:.82rem; }
      .pub-cat.active { background:#2ECC71; color:#000; border-color:#2ECC71; font-weight:600; }

      /* PRODUCTOS */
      .pub-products-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:.75rem; }
      .pub-prod-card { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; overflow:hidden; display:flex; flex-direction:column; transition:border-color .2s; }
      .pub-prod-card:hover { border-color:#2ECC71; }
      .pub-prod-img { width:100%; height:100px; object-fit:cover; }
      .pub-prod-img-ph { width:100%; height:80px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; background:#111; }
      .pub-prod-body { padding:.6rem; display:flex; flex-direction:column; gap:.25rem; }
      .pub-prod-body strong { font-size:.9rem; line-height:1.3; }
      .pub-prod-brand { font-size:.75rem; opacity:.6; }
      .pub-prod-cat  { font-size:.7rem; background:#222; padding:.15rem .4rem; border-radius:4px; width:fit-content; }
      .pub-prod-price { font-size:1rem; font-weight:700; color:#2ECC71; margin-top:.25rem; }
      .pub-prod-stock-out { font-size:.75rem; color:#e74c3c; }

      /* FOOTER */
      .pub-footer { text-align:center; padding:2rem 0 1rem; opacity:.5; font-size:.8rem; margin-top:3rem; border-top:1px solid #222; }

      @media (max-width:500px) {
        .pub-header { flex-direction:column; text-align:center; }
        .pub-contact-btns { justify-content:center; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Utilidades ────────────────────────────────────────────────
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
  }

  return { boot, search, filterCat };
})();
