// ============================================================
// DietPro — Store (estado global + Supabase)
// ============================================================
const SB_URL = 'https://upoexzjltapiuijhszzk.supabase.co';
const SB_KEY = 'sb_publishable_Ll8-8exzAJBQYqC4YQdflg_7qvjjakP';

const Store = (() => {
  // Estado global
  let _state = {
    tenant:        null,   // codigo de licencia (DIET-xxx)
    user:          null,   // { name, username, role: admin|collaborator }
    config:        null,   // diet_config row
    products:      [],
    offers:        [],
    notifications: [],
    unreadCount:   0,
    theme:         'dark-green',
  };

  // Supabase helper
  async function sb(table, params = '', method = 'GET', body = null) {
    const headers = {
      'apikey':        SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
    };
    if (_state.tenant) headers['x-app-tenant'] = _state.tenant;

    const url = SB_URL + '/rest/v1/' + table + (params ? '?' + params : '');
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error('SB ' + res.status + ': ' + err);
    }
    if (method === 'DELETE' || res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // RPC para set tenant
  async function setTenantCtx(tenantId) {
    await fetch(SB_URL + '/rest/v1/rpc/set_config', {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'app.tenant_id', value: tenantId })
    }).catch(() => {});
  }

  return {
    get: (key) => _state[key],
    getState: () => _state,

    setTenant(tenantId) {
      _state.tenant = tenantId;
      setTenantCtx(tenantId);
    },

    setUser(user) { _state.user = user; },
    setConfig(cfg) {
      _state.config = cfg;
      if (cfg?.theme) this.applyTheme(cfg.theme, cfg.theme_accent);
    },

    applyTheme(theme, accent) {
      _state.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'custom' && accent) {
        document.documentElement.style.setProperty('--custom-accent', accent);
        // Darken accent
        document.documentElement.style.setProperty('--custom-accent-d', accent);
        document.documentElement.style.setProperty('--custom-accent-15', accent + '26');
      }
      try { localStorage.setItem('dp_theme', theme); if (accent) localStorage.setItem('dp_accent', accent); } catch(e){}
    },

    reset() {
      _state = { tenant: null, user: null, config: null, products: [], offers: [], notifications: [], unreadCount: 0, theme: 'dark-green' };
    },

    // ── LICENCIA ─────────────────────────────────────────────
    async checkLicense(code) {
      const rows = await sb('licencias', 'codigo=eq.' + encodeURIComponent(code) + '&select=*&limit=1');
      if (!rows || rows.length === 0) return null;
      const lic = rows[0];
      if (!lic.activa) return null;
      if (lic.fecha_vencimiento && new Date(lic.fecha_vencimiento) < new Date()) return null;
      if (!lic.app_id || lic.app_id !== 'DIET') return null;
      return lic;
    },

    // ── CONFIG ───────────────────────────────────────────────
    async loadConfig() {
      const rows = await sb('diet_config', 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&limit=1');
      if (rows && rows.length > 0) {
        _state.config = rows[0];
        this.applyTheme(rows[0].theme || 'dark-green', rows[0].theme_accent);
      }
      return _state.config;
    },

    async saveConfig(data) {
      const existing = _state.config;
      if (existing) {
        await sb('diet_config', 'tenant_id=eq.' + encodeURIComponent(_state.tenant), 'PATCH', data);
      } else {
        await sb('diet_config', '', 'POST', { tenant_id: _state.tenant, ...data });
      }
      _state.config = { ..._state.config, ...data };
    },

    // ── PRODUCTS ─────────────────────────────────────────────
    async loadProducts() {
      const rows = await sb('products', 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&active=eq.true&order=name.asc');
      _state.products = rows || [];
      return _state.products;
    },

    async saveProduct(data) {
      const row = await sb('products', '', 'POST', { tenant_id: _state.tenant, ...data });
      // Actualizar barcode_cache si tiene codigo
      if (data.barcode && data.name) {
        sb('barcode_cache', '', 'POST', {
          barcode: data.barcode, name: data.name,
          brand: data.brand || null, category: data.category || null
        }).catch(() => {});
      }
      await this.loadProducts();
      return row;
    },

    async updateProduct(id, data) {
      const old = _state.products.find(p => p.id === id);
      if (old && data.price && old.price !== data.price) {
        sb('price_history', '', 'POST', {
          product_id: id, tenant_id: _state.tenant,
          old_price: old.price, new_price: data.price,
          changed_by: _state.user?.username
        }).catch(() => {});
      }
      await sb('products', 'id=eq.' + id + '&tenant_id=eq.' + encodeURIComponent(_state.tenant), 'PATCH', { ...data, updated_at: new Date().toISOString() });
      await this.loadProducts();
    },

    async deleteProduct(id) {
      await sb('products', 'id=eq.' + id + '&tenant_id=eq.' + encodeURIComponent(_state.tenant), 'PATCH', { active: false });
      await this.loadProducts();
    },

    async lookupBarcode(code) {
      const rows = await sb('barcode_cache', 'barcode=eq.' + encodeURIComponent(code) + '&limit=1');
      return (rows && rows.length > 0) ? rows[0] : null;
    },

    // ── STOCK ────────────────────────────────────────────────
    async adjustStock(productId, type, quantity, reason) {
      await sb('stock_movements', '', 'POST', {
        product_id: productId, tenant_id: _state.tenant,
        type, quantity, reason, seller_id: _state.user?.username
      });
      // Actualizar stock en products
      const p = _state.products.find(x => x.id === productId);
      if (p) {
        const delta = (type === 'in' || type === 'return') ? quantity : -Math.abs(quantity);
        const newStock = Math.max(0, p.stock + delta);
        await this.updateProduct(productId, { stock: newStock });
      }
    },

    async loadStockMovements(productId = null) {
      let q = 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&order=created_at.desc&limit=100';
      if (productId) q += '&product_id=eq.' + productId;
      return await sb('stock_movements', q) || [];
    },

    // ── SALES ────────────────────────────────────────────────
    async registerSale(items, total, paymentMethod, notes) {
      const sale = await sb('sales', '', 'POST', {
        tenant_id: _state.tenant, items, total,
        payment_method: paymentMethod,
        seller_id: _state.user?.username,
        seller_name: _state.user?.name,
        notes
      });
      // Descontar stock de cada item
      for (const item of items) {
        await this.adjustStock(item.product_id, 'out', item.qty, 'venta');
      }
      return sale;
    },

    async loadSales(dateFrom = null) {
      let q = 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&cancelled=eq.false&order=created_at.desc&limit=200';
      if (dateFrom) q += '&created_at=gte.' + dateFrom;
      return await sb('sales', q) || [];
    },

    // ── OFFERS ───────────────────────────────────────────────
    async loadOffers() {
      const rows = await sb('offers', 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&order=created_at.desc');
      _state.offers = rows || [];
      return _state.offers;
    },

    async saveOffer(data) {
      await sb('offers', '', 'POST', { tenant_id: _state.tenant, ...data });
      await this.loadOffers();
    },

    async toggleOffer(id, active) {
      await sb('offers', 'id=eq.' + id + '&tenant_id=eq.' + encodeURIComponent(_state.tenant), 'PATCH', { active });
      await this.loadOffers();
    },

    async deleteOffer(id) {
      await sb('offers', 'id=eq.' + id + '&tenant_id=eq.' + encodeURIComponent(_state.tenant), 'DELETE');
      await this.loadOffers();
    },

    // ── COLLABORATORS ────────────────────────────────────────
    async loadCollaborators() {
      return await sb('collaborators', 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&order=name.asc') || [];
    },

    async saveCollaborator(data) {
      const row = await sb('collaborators', '', 'POST', { tenant_id: _state.tenant, ...data });
      return row;
    },

    async updateCollaborator(id, data) {
      await sb('collaborators', 'id=eq.' + id + '&tenant_id=eq.' + encodeURIComponent(_state.tenant), 'PATCH', data);
    },

    async verifyCollaborator(tenantId, username, password) {
      const rows = await sb('collaborators', 'tenant_id=eq.' + encodeURIComponent(tenantId) + '&username=eq.' + encodeURIComponent(username) + '&active=eq.true&limit=1');
      if (!rows || rows.length === 0) return null;
      if (rows[0].password_plain !== password) return null;
      return rows[0];
    },

    // ── NOTIFICATIONS ────────────────────────────────────────
    async loadNotifications() {
      const rows = await sb('notifications', 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&order=created_at.desc&limit=50') || [];
      _state.notifications = rows;
      _state.unreadCount = rows.filter(n => !n.read).length;
      this._updateBadge();
      return rows;
    },

    async markNotifRead(id) {
      await sb('notifications', 'id=eq.' + id + '&tenant_id=eq.' + encodeURIComponent(_state.tenant), 'PATCH', { read: true });
      const n = _state.notifications.find(x => x.id === id);
      if (n) { n.read = true; _state.unreadCount = Math.max(0, _state.unreadCount - 1); }
      this._updateBadge();
    },

    async markAllRead() {
      await sb('notifications', 'tenant_id=eq.' + encodeURIComponent(_state.tenant) + '&read=eq.false', 'PATCH', { read: true });
      _state.notifications.forEach(n => n.read = true);
      _state.unreadCount = 0;
      this._updateBadge();
    },

    _updateBadge() {
      const badge = document.getElementById('bell-badge');
      if (!badge) return;
      if (_state.unreadCount > 0) {
        badge.textContent = _state.unreadCount > 9 ? '9+' : _state.unreadCount;
        badge.classList.add('visible');
      } else {
        badge.classList.remove('visible');
      }
    },

    subscribeNotifications(callback) {
      // Supabase Realtime (polling fallback si no hay WS)
      let interval = setInterval(async () => {
        await this.loadNotifications();
        if (callback) callback(_state.notifications);
      }, 30000); // poll cada 30s
      return () => clearInterval(interval);
    },

    // ── DASHBOARD DATA ───────────────────────────────────────
    async getDashboardData() {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const weekAgo = new Date(today - 7 * 86400000).toISOString();

      const [sales, products, alerts] = await Promise.all([
        this.loadSales(weekAgo),
        this.loadProducts(),
        this.getAlerts(),
      ]);

      // Ventas de hoy
      const todaySales = sales.filter(s => s.created_at.slice(0, 10) === todayStr);
      const todayTotal = todaySales.reduce((a, s) => a + Number(s.total), 0);

      // Top productos
      const itemCounts = {};
      sales.forEach(s => {
        (s.items || []).forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
        });
      });
      const topProducts = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, qty]) => ({ name, qty }));

      // Ventas por categoría
      const catTotals = {};
      sales.forEach(s => {
        (s.items || []).forEach(item => {
          const cat = item.category || 'Otros';
          catTotals[cat] = (catTotals[cat] || 0) + item.qty;
        });
      });

      return { todaySales, todayTotal, topProducts, catTotals, alerts, products };
    },

    async getAlerts() {
      const products = _state.products.length ? _state.products : await this.loadProducts();
      const today = new Date();
      const alertDays = _state.config?.expiry_alert_days || 7;
      const soon = new Date(today.getTime() + alertDays * 86400000);

      const lowStock = products.filter(p => p.stock < p.min_stock && p.stock >= 0);
      const expiring = products.filter(p => {
        if (!p.expiry_date) return false;
        const exp = new Date(p.expiry_date);
        return exp <= soon && exp >= today;
      });
      const expired = products.filter(p => p.expiry_date && new Date(p.expiry_date) < today);

      return { lowStock, expiring, expired };
    }
  };
})();
