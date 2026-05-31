// ============================================================
// DietPro — Ventas / Caja
// ============================================================
const SalesView = (() => {
  let _cart = [];

  async function render() {
    const el = document.getElementById('view-sales');
    const today = new Date().toISOString().slice(0,10);
    const sales = await Store.loadSales(today + 'T00:00:00Z');
    const totalHoy = sales.reduce((a,s) => a + Number(s.total), 0);

    el.innerHTML = `
      <div class="view-header">
        <div>
          <div class="view-title">💰 Ventas</div>
          <div class="view-subtitle">Hoy: $${totalHoy.toLocaleString('es-AR')}</div>
        </div>
        <button class="btn btn-green btn-sm" onclick="SalesView.openScanner()">📷 Escanear</button>
      </div>

      <!-- Carrito -->
      <div style="padding:0 16px 10px;">
        <div class="card">
          <div style="font-size:14px;font-weight:700;margin-bottom:10px;">🛒 Carrito actual</div>
          <div id="cart-items">
            ${_cart.length === 0
              ? '<div style="color:var(--text-2);font-size:13px;text-align:center;padding:16px;">Escaneá un producto para comenzar</div>'
              : _cart.map((item, i) => `
                <div class="item-row">
                  <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-sub">$${Number(item.price).toLocaleString('es-AR')} × ${item.qty}</div>
                  </div>
                  <div class="item-right" style="display:flex;align-items:center;gap:8px;">
                    <div class="item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</div>
                    <button class="btn btn-danger btn-sm" onclick="SalesView.removeItem(${i})">✕</button>
                  </div>
                </div>`).join('')}
          </div>
          ${_cart.length > 0 ? `
          <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:8px;">
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;">
              <span>Total</span>
              <span style="color:var(--primary);">$${_cart.reduce((a,i)=>a+i.price*i.qty,0).toLocaleString('es-AR')}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button class="btn btn-ghost btn-sm" onclick="SalesView.clearCart()">Limpiar</button>
              <button class="btn btn-green" style="flex:1;" onclick="SalesView.checkout()">💳 Cobrar</button>
            </div>
          </div>` : ''}
        </div>
      </div>

      <!-- Historial del día -->
      <div style="padding:0 16px 80px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">📋 Ventas de hoy (${sales.length})</div>
        ${sales.length === 0
          ? '<div style="color:var(--text-2);font-size:13px;">Sin ventas registradas hoy</div>'
          : sales.map(s => `
            <div class="card" style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:13px;font-weight:600;">${new Date(s.created_at).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style="font-size:12px;color:var(--text-2);">${s.seller_name || ''} · ${_payLabel(s.payment_method)}</div>
                  <div style="font-size:11px;color:var(--text-2);margin-top:2px;">${(s.items||[]).length} item(s)</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:16px;font-weight:700;color:var(--primary);">$${Number(s.total).toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>`).join('')}
      </div>

      <!-- Modal pago -->
      <div class="modal-backdrop" id="checkout-modal">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-title">💳 Confirmar cobro</div>
          <div id="checkout-content"></div>
        </div>
      </div>
    `;
  }

  function _payLabel(m) {
    return {cash:'Efectivo',transfer:'Transferencia',mercadopago:'Mercado Pago',other:'Otro'}[m]||m;
  }

  function openScanner() {
    Scanner.open(async code => {
      const products = Store.get('products') || [];
      let prod = products.find(p => p.barcode === code);
      if (!prod) {
        const cached = await Store.lookupBarcode(code);
        if (cached) {
          prod = products.find(p => p.name === cached.name);
        }
      }
      if (!prod) {
        App.toast('Producto no encontrado. Código: ' + code);
        return;
      }
      _addToCart(prod);
    }, 'barcode');
  }

  function _addToCart(prod) {
    const existing = _cart.find(i => i.product_id === prod.id);
    if (existing) {
      if (existing.qty >= prod.stock) { App.toast('Sin stock suficiente'); return; }
      existing.qty++;
    } else {
      if (prod.stock <= 0) { App.toast('Producto sin stock'); return; }
      _cart.push({ product_id: prod.id, name: prod.name, price: Number(prod.price), qty: 1, category: prod.category });
    }
    App.toast(prod.name + ' agregado al carrito');
    render();
  }

  function removeItem(i) { _cart.splice(i, 1); render(); }
  function clearCart()   { _cart = []; render(); }

  function checkout() {
    if (_cart.length === 0) return;
    const total = _cart.reduce((a,i) => a + i.price * i.qty, 0);
    const cfg = Store.get('config');

    document.getElementById('checkout-content').innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-size:22px;font-weight:800;color:var(--primary);text-align:center;">$${total.toLocaleString('es-AR')}</div>
        <div style="font-size:13px;color:var(--text-2);text-align:center;">${_cart.length} producto(s)</div>
      </div>
      <div class="form-group">
        <label class="form-label">Método de pago</label>
        <select class="form-input" id="pay-method">
          <option value="cash">💵 Efectivo</option>
          <option value="transfer">🏦 Transferencia</option>
          <option value="mercadopago">📱 Mercado Pago</option>
          <option value="other">Otro</option>
        </select>
      </div>
      ${cfg?.mp_link ? `<div id="mp-link-row" style="display:none;margin-bottom:12px;">
        <a href="${cfg.mp_link}" target="_blank" class="btn btn-green" style="width:100%;justify-content:center;text-decoration:none;">
          Abrir link de Mercado Pago
        </a></div>` : ''}
      <div class="form-group">
        <label class="form-label">Nota (opcional)</label>
        <input class="form-input" id="pay-notes" placeholder="Ej: cliente frecuente">
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-ghost" onclick="document.getElementById('checkout-modal').classList.remove('open')">Cancelar</button>
        <button class="btn btn-green" style="flex:1;" onclick="SalesView.confirmSale()">✅ Confirmar venta</button>
      </div>
    `;

    document.getElementById('checkout-modal').classList.add('open');

    // Mostrar link MP cuando corresponde
    const sel = document.getElementById('pay-method');
    if (sel) sel.addEventListener('change', () => {
      const mpRow = document.getElementById('mp-link-row');
      if (mpRow) mpRow.style.display = sel.value === 'mercadopago' ? 'block' : 'none';
    });
  }

  async function confirmSale() {
    const method = document.getElementById('pay-method')?.value || 'cash';
    const notes  = document.getElementById('pay-notes')?.value || '';
    const total  = _cart.reduce((a,i) => a + i.price * i.qty, 0);

    try {
      await Store.registerSale(_cart, total, method, notes);
      document.getElementById('checkout-modal').classList.remove('open');
      _cart = [];
      App.toast('Venta registrada ✅');
      render();
    } catch(err) {
      App.toast('Error al registrar: ' + err.message);
    }
  }

  return { render, openScanner, removeItem, clearCart, checkout, confirmSale };
})();
