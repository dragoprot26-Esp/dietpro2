// ================================================
// DietPro - Vista: Stock y Movimientos
// ================================================

const Stock = (() => {

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function _fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  // ── Render ────────────────────────────────────────────────────
  function render() {
    return `
      <div class="view-header">
        <h2>📦 Stock</h2>
        <button class="btn btn-primary btn-sm" onclick="Stock.openAdjModal()">± Ajustar stock</button>
      </div>

      <!-- Alertas rápidas -->
      <div id="stock-alerts"></div>

      <!-- Filtro y listado -->
      <div class="search-bar" style="margin-bottom:1rem;">
        <input type="text" id="stock-search" placeholder="Buscar producto..." oninput="Stock.filter()" class="input-full">
      </div>

      <div id="stock-table-wrap" class="table-wrap">
        <p style="opacity:.5;text-align:center;padding:2rem;">Cargando...</p>
      </div>

      <!-- Movimientos recientes -->
      <section class="card" style="margin-top:1.5rem;">
        <h3 style="margin:0 0 1rem;font-size:1rem;">🕒 Últimos movimientos</h3>
        <div id="stock-movements">
          <p style="opacity:.5;text-align:center;">Cargando...</p>
        </div>
      </section>

      <!-- MODAL AJUSTE -->
      <div id="adj-modal" class="modal-backdrop" style="display:none;" onclick="if(event.target===this)Stock.closeAdjModal()">
        <div class="modal" style="max-width:400px;">
          <div class="modal-header">
            <h3>± Ajustar Stock</h3>
            <button class="modal-close" onclick="Stock.closeAdjModal()">✕</button>
          </div>
          <div class="modal-body">
            <label>Producto
              <select id="adj-product"></select>
            </label>
            <label>Tipo de movimiento
              <select id="adj-type">
                <option value="in">➕ Entrada</option>
                <option value="out">➖ Salida</option>
                <option value="adjust">🔧 Ajuste manual</option>
              </select>
            </label>
            <label>Cantidad
              <input id="adj-qty" type="number" min="0" step="1" value="1" placeholder="0">
            </label>
            <label>Motivo
              <input id="adj-reason" type="text" placeholder="Compra, devolución, inventario...">
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="Stock.closeAdjModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="Stock.saveAdj()">Confirmar</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Init ──────────────────────────────────────────────────────
  async function init() {
    await Store.loadProducts();
    await Store.loadStockMovements();
    _renderTable();
    _renderAlerts();
    _renderMovements();
  }

  // ── Tabla de stock ────────────────────────────────────────────
  let _filter = '';

  function filter() {
    _filter = (document.getElementById('stock-search')?.value||'').toLowerCase();
    _renderTable();
  }

  function _renderTable() {
    const products = Store.get().products || [];
    const wrap = document.getElementById('stock-table-wrap');
    if (!wrap) return;

    const filtered = products.filter(p =>
      p.name?.toLowerCase().includes(_filter) || p.brand?.toLowerCase().includes(_filter)
    );

    if (!filtered.length) {
      wrap.innerHTML = '<p style="text-align:center;opacity:.5;padding:2rem;">Sin productos</p>';
      return;
    }

    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align:center;">Stock</th>
            <th style="text-align:center;">Mín.</th>
            <th style="text-align:center;">Estado</th>
            <th style="text-align:center;">Venc.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(p => {
            const low = p.stock <= p.min_stock;
            const out = p.stock <= 0;
            const exp = p.expiry_date ? _daysToExpiry(p.expiry_date) : null;
            const expWarn = exp !== null && exp <= 7;
            const expOut  = exp !== null && exp <= 0;
            return `
              <tr class="${out?'row-danger':low?'row-warn':''}">
                <td>
                  <strong>${esc(p.name)}</strong>
                  ${p.brand?`<br><small style="opacity:.6">${esc(p.brand)}</small>`:''}
                </td>
                <td style="text-align:center;font-weight:700;font-size:1.1rem;color:${out?'var(--danger)':low?'var(--warning)':'var(--primary)'}">
                  ${p.stock}
                </td>
                <td style="text-align:center;opacity:.7">${p.min_stock}</td>
                <td style="text-align:center;">
                  ${out  ? '<span class="badge badge-danger">Sin stock</span>'  :
                    low  ? '<span class="badge badge-warn">Stock bajo</span>'   :
                           '<span class="badge badge-ok">OK</span>'}
                </td>
                <td style="text-align:center;font-size:.8rem;">
                  ${p.expiry_date
                    ? `<span style="color:${expOut?'var(--danger)':expWarn?'var(--warning)':'inherit'}">${_fmtShortDate(p.expiry_date)}</span>`
                    : '—'}
                </td>
                <td style="text-align:center;">
                  <button class="btn btn-sm btn-secondary" onclick="Stock.quickAdj('${p.id}','${esc(p.name)}')">±</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // ── Alertas ───────────────────────────────────────────────────
  function _renderAlerts() {
    const products = Store.get().products || [];
    const low = products.filter(p => p.stock <= p.min_stock);
    const expiring = products.filter(p => p.expiry_date && _daysToExpiry(p.expiry_date) <= 7 && _daysToExpiry(p.expiry_date) > 0);
    const expired  = products.filter(p => p.expiry_date && _daysToExpiry(p.expiry_date) <= 0);

    let html = '';
    if (expired.length)   html += `<div class="alert alert-danger">❌ ${expired.length} producto(s) vencido(s): ${expired.map(p=>esc(p.name)).join(', ')}</div>`;
    if (expiring.length)  html += `<div class="alert alert-warn">⚠️ ${expiring.length} producto(s) por vencer (≤7 días): ${expiring.map(p=>esc(p.name)).join(', ')}</div>`;
    if (low.length)       html += `<div class="alert alert-warn">📉 ${low.length} producto(s) con stock bajo</div>`;
    if (!html)            html  = `<div class="alert alert-ok">✅ Stock en buen estado</div>`;

    const el = document.getElementById('stock-alerts');
    if (el) el.innerHTML = html;
  }

  // ── Movimientos ───────────────────────────────────────────────
  function _renderMovements() {
    const movs = Store.get().stockMovements || [];
    const el = document.getElementById('stock-movements');
    if (!el) return;

    if (!movs.length) {
      el.innerHTML = '<p style="opacity:.5;text-align:center;">Sin movimientos registrados</p>';
      return;
    }

    const typeLabels = { in:'Entrada', out:'Salida', adjust:'Ajuste', sale:'Venta' };
    const typeColors = { in:'var(--primary)', out:'var(--danger)', adjust:'var(--warning)', sale:'var(--info)' };

    el.innerHTML = `
      <div class="movements-list">
        ${movs.slice(0,50).map(m => `
          <div class="movement-row">
            <span style="color:${typeColors[m.type]||'inherit'};font-weight:600;">${typeLabels[m.type]||m.type}</span>
            <span>${esc(m.products?.name||m.product_id)}</span>
            <span style="font-weight:700;">${m.type==='out'||m.type==='sale'?'-':'+'} ${m.quantity}</span>
            <span style="opacity:.6;font-size:.8rem;">${esc(m.reason||'')}</span>
            <span style="opacity:.5;font-size:.75rem;">${_fmtDate(m.created_at)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Ajuste de stock ───────────────────────────────────────────
  function openAdjModal(productId = '', productName = '') {
    const products = Store.get().products || [];
    const sel = document.getElementById('adj-product');
    if (sel) {
      sel.innerHTML = products.map(p =>
        `<option value="${p.id}" ${p.id===productId?'selected':''}>${esc(p.name)}</option>`
      ).join('');
    }
    document.getElementById('adj-qty').value    = '1';
    document.getElementById('adj-reason').value = '';
    document.getElementById('adj-modal').style.display = 'flex';
  }

  function closeAdjModal() {
    document.getElementById('adj-modal').style.display = 'none';
  }

  function quickAdj(productId, name) {
    openAdjModal(productId, name);
  }

  async function saveAdj() {
    const productId = document.getElementById('adj-product').value;
    const type      = document.getElementById('adj-type').value;
    const qty       = parseInt(document.getElementById('adj-qty').value) || 0;
    const reason    = document.getElementById('adj-reason').value.trim();

    if (!productId) { App.toast('Seleccioná un producto','error'); return; }
    if (qty <= 0)   { App.toast('La cantidad debe ser mayor a 0','error'); return; }

    const ok = await Store.adjustStock(productId, type, qty, reason);
    if (ok) {
      closeAdjModal();
      App.toast('✅ Stock actualizado');
      await Store.loadProducts();
      await Store.loadStockMovements();
      _renderTable();
      _renderAlerts();
      _renderMovements();
    } else {
      App.toast('Error al ajustar stock','error');
    }
  }

  // ── Helpers de fecha ──────────────────────────────────────────
  function _daysToExpiry(iso) {
    const diff = new Date(iso) - new Date();
    return Math.floor(diff / 86400000);
  }

  function _fmtShortDate(iso) {
    return new Date(iso).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'});
  }

  return { render, init, filter, openAdjModal, closeAdjModal, quickAdj, saveAdj };
})();
