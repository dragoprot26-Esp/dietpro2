// ============================================================
// DietPro — Productos + Escaner
// ============================================================
const ProductsView = (() => {
  let _filter = '';
  let _cat = 'all';
  let _editId = null;

  async function render() {
    const el = document.getElementById('view-products');
    const products = Store.get('products') || [];
    const cats = _getCategories();
    const filtered = _applyFilter(products);
    const user = Store.get('user');

    el.innerHTML = `
      <div class="view-header">
        <div>
          <div class="view-title">📦 Productos</div>
          <div class="view-subtitle">${products.length} en stock</div>
        </div>
        <button class="btn btn-green btn-sm" onclick="ProductsView.openForm()">+ Nuevo</button>
      </div>

      <!-- Búsqueda -->
      <div style="padding:0 16px 10px;">
        <input class="form-input" type="search" placeholder="🔍 Buscar por nombre, marca o código…"
          oninput="ProductsView.search(this.value)"
          value="${_filter}" style="font-size:14px;">
      </div>

      <!-- Filtros categoría -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding:0 16px 12px;scrollbar-width:none;">
        ${['all', ...cats].map(c => `
          <button class="chip ${_cat===c?'active-cat':''}"
            style="${_cat===c?'background:var(--primary);color:#0f1117;':''}"
            onclick="ProductsView.setCat('${c}')">
            ${c === 'all' ? 'Todos' : c}
          </button>`).join('')}
      </div>

      <!-- Lista -->
      <div class="item-list">
        ${filtered.length === 0
          ? '<div class="loading-row">Sin productos que coincidan</div>'
          : filtered.map(p => _renderProduct(p)).join('')
        }
      </div>

      <!-- FAB scanner -->
      <button class="fab" onclick="ProductsView.openScanner()" title="Escanear">📷</button>

      <!-- Modal nuevo/editar -->
      <div class="modal-backdrop" id="product-modal">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-title" id="product-modal-title">Nuevo producto</div>
          <div id="product-form-content"></div>
        </div>
      </div>
    `;
  }

  function _renderProduct(p) {
    const stockClass = p.stock < p.min_stock ? 'badge-red' : p.stock < p.min_stock * 2 ? 'badge-orange' : 'badge-green';
    const expiry = p.expiry_date ? new Date(p.expiry_date) : null;
    const expiryStr = expiry ? expiry.toLocaleDateString('es-AR') : '—';
    const expired = expiry && expiry < new Date();
    return `
      <div class="item-row" onclick="ProductsView.openForm('${p.id}')">
        <div class="item-icon">${p.image_url ? `<img src="${p.image_url}" style="width:40px;height:40px;border-radius:10px;object-fit:cover;">` : '📦'}</div>
        <div class="item-info">
          <div class="item-name">${p.name}</div>
          <div class="item-sub">${p.brand || ''} ${p.category ? '· '+p.category : ''}</div>
          ${p.expiry_date ? `<div class="item-sub" style="${expired?'color:var(--danger)':''}">${expired?'⚠️ Vencido ':'Vence: '}${expiryStr}</div>` : ''}
        </div>
        <div class="item-right">
          <div class="item-price">$${Number(p.price).toLocaleString('es-AR')}</div>
          <span class="badge ${stockClass}">${p.stock} ud.</span>
        </div>
      </div>`;
  }

  function _applyFilter(products) {
    let list = products;
    if (_cat !== 'all') list = list.filter(p => p.category === _cat);
    if (_filter) {
      const q = _filter.toLowerCase();
      list = list.filter(p =>
        (p.name||'').toLowerCase().includes(q) ||
        (p.brand||'').toLowerCase().includes(q) ||
        (p.barcode||'').includes(q)
      );
    }
    return list;
  }

  function _getCategories() {
    const cfg = Store.get('config');
    if (cfg?.categories && Array.isArray(cfg.categories)) return cfg.categories;
    return ['Secos','Frescos','Bebidas','Limpieza','Otros'];
  }

  function search(val) { _filter = val; render(); }
  function setCat(cat) { _cat = cat; render(); }

  function openScanner() {
    Scanner.open(async code => {
      App.toast('Buscando código: ' + code);
      const cached = await Store.lookupBarcode(code);
      openForm(null, code, cached);
    }, 'barcode');
  }

  async function openForm(productId = null, barcode = '', cached = null) {
    _editId = productId;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const cats = _getCategories();

    let p = { name:'', brand:'', barcode: barcode||'', category: cats[0]||'Otros', price:'', stock:'', min_stock:'5', expiry_date:'' };

    if (productId) {
      const found = (Store.get('products')||[]).find(x => x.id === productId);
      if (found) p = { ...found };
      title.textContent = 'Editar producto';
    } else {
      title.textContent = 'Nuevo producto';
      if (cached) { p.name = cached.name; p.brand = cached.brand || ''; }
    }

    document.getElementById('product-form-content').innerHTML = `
      <div class="form-group">
        <label class="form-label">Código de barras / QR</label>
        <div style="display:flex;gap:8px;">
          <input class="form-input" id="pf-barcode" value="${p.barcode||''}" placeholder="opcional" style="flex:1;">
          <button class="btn btn-ghost btn-sm" onclick="ProductsView.scanFromForm()">📷</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="form-input" id="pf-name" value="${p.name||''}" placeholder="Ej: Avena Quaker 500g" required>
      </div>
      <div class="form-group">
        <label class="form-label">Marca</label>
        <input class="form-input" id="pf-brand" value="${p.brand||''}" placeholder="Ej: Quaker">
      </div>
      <div class="form-group">
        <label class="form-label">Categoría</label>
        <select class="form-input" id="pf-cat">
          ${cats.map(c => `<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="form-group">
          <label class="form-label">Precio $</label>
          <input class="form-input" id="pf-price" type="number" step="0.01" min="0" value="${p.price||''}" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label">Stock inicial</label>
          <input class="form-input" id="pf-stock" type="number" min="0" value="${p.stock||''}" placeholder="0">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="form-group">
          <label class="form-label">Stock mínimo</label>
          <input class="form-input" id="pf-min" type="number" min="0" value="${p.min_stock||5}" placeholder="5">
        </div>
        <div class="form-group">
          <label class="form-label">Vencimiento</label>
          <input class="form-input" id="pf-exp" type="date" value="${p.expiry_date||''}">
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button class="btn btn-green" style="flex:1;" onclick="ProductsView.save()">
          ${productId ? 'Guardar cambios' : 'Agregar producto'}
        </button>
        ${productId ? `<button class="btn btn-danger btn-sm" onclick="ProductsView.remove('${productId}')">🗑️</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="ProductsView.closeModal()">Cancelar</button>
      </div>
      <div id="pf-error" style="color:var(--danger);font-size:13px;margin-top:8px;display:none;"></div>
    `;

    modal.classList.add('open');
    setTimeout(() => document.getElementById('pf-name')?.focus(), 300);
  }

  function scanFromForm() {
    Scanner.open(async code => {
      const barInput = document.getElementById('pf-barcode');
      if (barInput) barInput.value = code;
      const cached = await Store.lookupBarcode(code);
      if (cached) {
        const nameIn = document.getElementById('pf-name');
        const brandIn = document.getElementById('pf-brand');
        if (nameIn && !nameIn.value) nameIn.value = cached.name;
        if (brandIn && !brandIn.value) brandIn.value = cached.brand || '';
        App.toast('Producto encontrado en base: ' + cached.name);
      } else {
        App.toast('Código leído. Completá los datos.');
      }
    }, 'barcode');
  }

  async function save() {
    const name  = document.getElementById('pf-name')?.value?.trim();
    const price = parseFloat(document.getElementById('pf-price')?.value || 0);
    const stock = parseInt(document.getElementById('pf-stock')?.value || 0);
    const min   = parseInt(document.getElementById('pf-min')?.value || 5);
    const brand = document.getElementById('pf-brand')?.value?.trim();
    const cat   = document.getElementById('pf-cat')?.value;
    const bar   = document.getElementById('pf-barcode')?.value?.trim();
    const exp   = document.getElementById('pf-exp')?.value;
    const errEl = document.getElementById('pf-error');

    if (!name) { if (errEl) { errEl.textContent='El nombre es obligatorio'; errEl.style.display='block'; } return; }

    const data = { name, brand, barcode: bar||null, category: cat, price, stock, min_stock: min, expiry_date: exp||null };

    try {
      if (_editId) {
        await Store.updateProduct(_editId, data);
        App.toast('Producto actualizado ✓');
      } else {
        await Store.saveProduct(data);
        App.toast('Producto agregado ✓');
      }
      closeModal();
      render();
    } catch(err) {
      if (errEl) { errEl.textContent = 'Error al guardar: ' + err.message; errEl.style.display='block'; }
    }
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    await Store.deleteProduct(id);
    closeModal();
    App.toast('Producto eliminado');
    render();
  }

  function closeModal() {
    document.getElementById('product-modal')?.classList.remove('open');
    _editId = null;
  }

  return { render, search, setCat, openForm, openScanner, scanFromForm, save, remove, closeModal };
})();
