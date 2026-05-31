// ============================================================
// DietPro — Ofertas
// ============================================================
const OffersView = (() => {

  async function render() {
    const el = document.getElementById('view-offers');
    const offers = await Store.loadOffers();
    const products = Store.get('products') || [];
    const cfg = Store.get('config') || {};
    const maxOffers = cfg.max_offers || 50;
    const activeOffers = offers.filter(o => o.active);

    el.innerHTML = `
      <div class="view-header">
        <div>
          <div class="view-title">🏷️ Ofertas</div>
          <div class="view-subtitle">${activeOffers.length}/${maxOffers} activas</div>
        </div>
        ${activeOffers.length < maxOffers
          ? '<button class="btn btn-green btn-sm" onclick="OffersView.openForm()">+ Nueva</button>'
          : `<span class="badge badge-orange">Límite plan</span>`}
      </div>

      <div class="item-list">
        ${offers.length === 0
          ? '<div class="loading-row">Sin ofertas cargadas todavía</div>'
          : offers.map(o => {
            const prod = products.find(p => p.id === o.product_id);
            const expired = o.expires_at && new Date(o.expires_at) < new Date();
            return `
              <div class="item-row">
                <div class="item-icon" style="background:var(--primary-15);">🏷️</div>
                <div class="item-info">
                  <div class="item-name">${prod?.name || '(producto eliminado)'}</div>
                  <div class="item-sub">${o.label || ''} ${o.expires_at ? '· vence '+new Date(o.expires_at).toLocaleDateString('es-AR') : ''}</div>
                  ${expired ? '<span class="badge badge-red">Vencida</span>' : ''}
                </div>
                <div class="item-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                  <div class="item-price">$${Number(o.offer_price).toLocaleString('es-AR')}</div>
                  ${prod?.price ? `<div style="font-size:11px;color:var(--text-2);text-decoration:line-through;">$${Number(prod.price).toLocaleString('es-AR')}</div>` : ''}
                  <div style="display:flex;gap:6px;">
                    <label class="toggle" style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                      <input type="checkbox" ${o.active?'checked':''} onchange="OffersView.toggle('${o.id}', this.checked)"
                        style="accent-color:var(--primary);width:16px;height:16px;">
                      <span style="font-size:11px;">${o.active?'Activa':'Inactiva'}</span>
                    </label>
                    <button class="btn btn-danger btn-sm" onclick="OffersView.remove('${o.id}')">🗑️</button>
                  </div>
                </div>
              </div>`;}).join('')}
      </div>

      <!-- Modal -->
      <div class="modal-backdrop" id="offer-modal">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-title">Nueva oferta</div>
          <div id="offer-form"></div>
        </div>
      </div>
    `;
  }

  function openForm() {
    const products = Store.get('products') || [];
    document.getElementById('offer-form').innerHTML = `
      <div class="form-group">
        <label class="form-label">Producto *</label>
        <select class="form-input" id="of-product">
          <option value="">— Seleccioná un producto —</option>
          ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name}${p.brand?' ('+p.brand+')':''} — $${Number(p.price).toLocaleString('es-AR')}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Precio de oferta $</label>
        <input class="form-input" id="of-price" type="number" step="0.01" min="0" placeholder="0.00">
      </div>
      <div class="form-group">
        <label class="form-label">Etiqueta (ej: 2x1, 30% OFF)</label>
        <input class="form-input" id="of-label" placeholder="opcional">
      </div>
      <div class="form-group">
        <label class="form-label">Vence el (opcional)</label>
        <input class="form-input" id="of-exp" type="date">
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-ghost" onclick="document.getElementById('offer-modal').classList.remove('open')">Cancelar</button>
        <button class="btn btn-green" style="flex:1;" onclick="OffersView.save()">Publicar oferta</button>
      </div>
    `;
    document.getElementById('offer-modal').classList.add('open');
  }

  async function save() {
    const productId  = document.getElementById('of-product')?.value;
    const offerPrice = parseFloat(document.getElementById('of-price')?.value || 0);
    const label      = document.getElementById('of-label')?.value?.trim();
    const exp        = document.getElementById('of-exp')?.value;

    if (!productId || !offerPrice) { App.toast('Seleccioná producto y precio'); return; }

    await Store.saveOffer({ product_id: productId, offer_price: offerPrice, label, expires_at: exp||null, active: true });
    document.getElementById('offer-modal').classList.remove('open');
    App.toast('Oferta publicada ✓');
    render();
  }

  async function toggle(id, active) {
    await Store.toggleOffer(id, active);
    App.toast(active ? 'Oferta activada' : 'Oferta desactivada');
    render();
  }

  async function remove(id) {
    if (!confirm('¿Eliminar esta oferta?')) return;
    await Store.deleteOffer(id);
    App.toast('Oferta eliminada');
    render();
  }

  return { render, openForm, save, toggle, remove };
})();
