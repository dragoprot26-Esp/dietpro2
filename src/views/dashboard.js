// ============================================================
// DietPro — Dashboard
// ============================================================
const DashboardView = (() => {

  async function render() {
    const el = document.getElementById('view-dashboard');
    el.innerHTML = '<div class="loading-row"><div class="mini-spinner"></div> Cargando panel…</div>';

    const data = await Store.getDashboardData();
    const { todaySales, todayTotal, topProducts, catTotals, alerts, products } = data;
    const user = Store.get('user');

    const stockBadge = alerts.lowStock.length > 0
      ? `<span class="badge badge-red">${alerts.lowStock.length} bajo stock</span>` : '';
    const expiryBadge = alerts.expiring.length > 0
      ? `<span class="badge badge-orange">${alerts.expiring.length} por vencer</span>` : '';
    const expiredBadge = alerts.expired.length > 0
      ? `<span class="badge badge-red">${alerts.expired.length} vencidos</span>` : '';

    el.innerHTML = `
      <div class="view-header">
        <div>
          <div class="view-title">📊 Panel</div>
          <div class="view-subtitle">Hola, ${user?.name || 'Admin'} 👋</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          ${stockBadge}${expiryBadge}${expiredBadge}
        </div>
      </div>

      ${alerts.lowStock.length || alerts.expiring.length || alerts.expired.length ? `
      <div style="padding:0 16px 8px;">
        ${alerts.expired.length ? `<div class="alert-strip danger">🚨 ${alerts.expired.length} producto(s) VENCIDO(S) en stock</div>` : ''}
        ${alerts.expiring.length ? `<div class="alert-strip warning">⚠️ ${alerts.expiring.length} producto(s) por vencer esta semana</div>` : ''}
        ${alerts.lowStock.length ? `<div class="alert-strip warning">📉 ${alerts.lowStock.length} producto(s) con stock bajo</div>` : ''}
      </div>` : ''}

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Ventas hoy</div>
          <div class="stat-value">${todaySales.length}</div>
          <div class="stat-sub">transacciones</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Recaudado hoy</div>
          <div class="stat-value">$${todayTotal.toLocaleString('es-AR')}</div>
          <div class="stat-sub">total del día</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Productos</div>
          <div class="stat-value">${products.length}</div>
          <div class="stat-sub">en stock activo</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ofertas activas</div>
          <div class="stat-value">${(Store.get('offers') || []).filter(o => o.active).length}</div>
          <div class="stat-sub">publicadas</div>
        </div>
      </div>

      ${topProducts.length > 0 ? `
      <div style="padding:0 16px 16px;">
        <div class="card">
          <div style="font-size:14px;font-weight:700;margin-bottom:14px;">🏆 Más vendidos (7 días)</div>
          ${topProducts.map((p, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--primary-15);color:var(--primary);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${i+1}</div>
              <div style="flex:1;font-size:13px;">${p.name}</div>
              <div class="badge badge-green">${p.qty} ud.</div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      ${alerts.lowStock.length > 0 ? `
      <div style="padding:0 16px 16px;">
        <div class="card">
          <div style="font-size:14px;font-weight:700;margin-bottom:14px;color:var(--danger);">📉 Stock bajo</div>
          ${alerts.lowStock.slice(0,5).map(p => `
            <div class="item-row">
              <div class="item-icon" style="background:rgba(231,76,60,0.1);">📦</div>
              <div class="item-info">
                <div class="item-name">${p.name}</div>
                <div class="item-sub">${p.brand || 'Sin marca'}</div>
              </div>
              <div class="item-right">
                <div class="item-price" style="color:var(--danger);">${p.stock} ud.</div>
                <div class="item-stock">mín: ${p.min_stock}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      ${alerts.expiring.length > 0 ? `
      <div style="padding:0 16px 16px;">
        <div class="card">
          <div style="font-size:14px;font-weight:700;margin-bottom:14px;color:var(--warning);">⏰ Por vencer</div>
          ${alerts.expiring.slice(0,5).map(p => {
            const days = Math.ceil((new Date(p.expiry_date) - new Date()) / 86400000);
            return `<div class="item-row">
              <div class="item-icon" style="background:rgba(243,156,18,0.1);">🗓️</div>
              <div class="item-info">
                <div class="item-name">${p.name}</div>
                <div class="item-sub">${p.brand || ''}</div>
              </div>
              <div class="item-right">
                <span class="badge badge-orange">${days}d</span>
                <div class="item-stock">${new Date(p.expiry_date).toLocaleDateString('es-AR')}</div>
              </div>
            </div>`;}).join('')}
        </div>
      </div>` : ''}
    `;
  }

  return { render };
})();
