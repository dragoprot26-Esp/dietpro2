// ================================================
// DietPro - Vista: Configuración
// Temas, Colaboradores, Config tienda, QR local
// ================================================

const Settings = (() => {

  // ── Render principal ──────────────────────────────────────────
  function render() {
    const s   = Store.get();
    const cfg = s.config || {};
    const plan = s.plan || 'basico';
    const collabMax = cfg.max_collaborators ?? 2;

    return `
      <div class="view-header">
        <h2>⚙️ Configuración</h2>
      </div>

      <!-- DATOS DE LA TIENDA -->
      <section class="card" style="margin-bottom:1rem;">
        <h3 style="margin:0 0 1rem;font-size:1rem;">🏪 Datos del Local</h3>
        <div class="form-grid">
          <label>Nombre del local
            <input id="cfg-name" type="text" value="${esc(cfg.name||'')}" placeholder="Mi Dietética">
          </label>
          <label>WhatsApp (con código país)
            <input id="cfg-wa" type="tel" value="${esc(cfg.whatsapp||'')}" placeholder="+5491155550000">
          </label>
          <label>Email de contacto
            <input id="cfg-email" type="email" value="${esc(cfg.email||'')}" placeholder="info@milocal.com">
          </label>
          <label>Dirección
            <input id="cfg-addr" type="text" value="${esc(cfg.address||'')}" placeholder="Av. Siempre Viva 123">
          </label>
          <label>Link Mercado Pago (checkout)
            <input id="cfg-mp" type="url" value="${esc(cfg.mp_link||'')}" placeholder="https://mpago.la/...">
          </label>
          <label>Slug público (URL de tu página)
            <input id="cfg-slug" type="text" value="${esc(cfg.public_slug||'')}" placeholder="mi-dietetica">
            <small style="opacity:.7;">Tu página: /local/<strong>${esc(cfg.public_slug||'mi-dietetica')}</strong></small>
          </label>
          <label>Días de alerta de vencimiento
            <input id="cfg-expiry" type="number" min="1" max="60" value="${cfg.expiry_alert_days||7}">
          </label>
        </div>
        <div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="Settings.saveConfig()">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="Settings.uploadLogo()">📷 Subir Logo</button>
        </div>
      </label>
      </section>

      <!-- QR DEL LOCAL -->
      <section class="card" style="margin-bottom:1rem;">
        <h3 style="margin:0 0 1rem;font-size:1rem;">📱 QR del Local</h3>
        <p style="font-size:.85rem;opacity:.7;margin:0 0 1rem;">
          Imprimí este QR y pegalo en tu local. Tus clientes lo escanean y ven tus productos y ofertas.
        </p>
        <div id="settings-qr" style="display:flex;justify-content:center;margin-bottom:1rem;"></div>
        <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="Settings.printQR()">🖨️ Imprimir QR</button>
          <button class="btn btn-secondary" onclick="Settings.downloadQR()">⬇️ Descargar QR</button>
        </div>
        <p style="text-align:center;font-size:.8rem;opacity:.6;margin-top:.5rem;">
          ${location.origin}/local/${esc(cfg.public_slug||'mi-dietetica')}
        </p>
      </section>

      <!-- TEMAS VISUALES -->
      <section class="card" style="margin-bottom:1rem;">
        <h3 style="margin:0 0 1rem;font-size:1rem;">🎨 Temas Visuales</h3>
        <div class="theme-grid" id="theme-grid">
          ${_renderThemePicker(s.theme)}
        </div>
        <div id="custom-color-panel" style="display:${s.theme==='custom'?'block':'none'};margin-top:1rem;">
          <h4 style="margin:0 0 .75rem;font-size:.9rem;">🎨 Color personalizado</h4>
          <div class="form-grid">
            <label>Color primario
              <input type="color" id="custom-primary" value="${cfg.custom_primary||'#2ECC71'}" onchange="Settings.previewCustom()">
            </label>
            <label>Color de fondo
              <input type="color" id="custom-bg" value="${cfg.custom_bg||'#0d0d0d'}" onchange="Settings.previewCustom()">
            </label>
            <label>Color de superficie
              <input type="color" id="custom-surface" value="${cfg.custom_surface||'#1a1a1a'}" onchange="Settings.previewCustom()">
            </label>
            <label>Color de texto
              <input type="color" id="custom-text" value="${cfg.custom_text||'#f0f0f0'}" onchange="Settings.previewCustom()">
            </label>
          </div>
          <button class="btn btn-primary" style="margin-top:.5rem;" onclick="Settings.saveCustomTheme()">✅ Aplicar tema personalizado</button>
        </div>
      </section>

      <!-- COLABORADORES -->
      <section class="card" style="margin-bottom:1rem;">
        <h3 style="margin:0 0 .5rem;font-size:1rem;">👥 Colaboradores</h3>
        <p style="font-size:.8rem;opacity:.6;margin:0 0 1rem;">
          Plan actual: <strong>${_planLabel(plan)}</strong> — Límite: <strong>${collabMax} colaboradores</strong>
        </p>
        <div id="collab-list">
          ${_renderCollabList(s)}
        </div>
        <button class="btn btn-primary" style="margin-top:.75rem;" onclick="Settings.openCollabModal()">
          ➕ Agregar colaborador
        </button>
      </section>

      <!-- NOTIFICACIONES -->
      <section class="card" style="margin-bottom:1rem;">
        <h3 style="margin:0 0 1rem;font-size:1rem;">🔔 Notificaciones</h3>
        <div id="notif-perm-status"></div>
        <button class="btn btn-secondary" onclick="Notifications.requestPermission()">
          🔔 Habilitar notificaciones del navegador
        </button>
        <p style="font-size:.8rem;opacity:.6;margin-top:.5rem;">
          Recibirás alertas de stock bajo y vencimientos en tu PC o celular aunque tengas la pestaña en segundo plano.
        </p>
      </section>

      <!-- MODAL COLABORADOR -->
      <div id="collab-modal" class="modal-backdrop" style="display:none;" onclick="if(event.target===this)Settings.closeCollabModal()">
        <div class="modal" style="max-width:420px;">
          <div class="modal-header">
            <h3 id="collab-modal-title">Agregar colaborador</h3>
            <button class="modal-close" onclick="Settings.closeCollabModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="collab-edit-id">
            <label>Nombre completo
              <input id="collab-name" type="text" placeholder="Juan Pérez">
            </label>
            <label>Usuario (para login)
              <input id="collab-user" type="text" placeholder="juanperez" autocomplete="off">
            </label>
            <label>Contraseña
              <input id="collab-pass" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
            </label>
            <label>Permisos
              <select id="collab-perms">
                <option value="ventas">Solo ventas</option>
                <option value="productos">Ventas + Productos</option>
                <option value="todo">Acceso completo</option>
              </select>
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="Settings.closeCollabModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="Settings.saveCollab()">Guardar</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Helpers internos ──────────────────────────────────────────
  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function _planLabel(p) {
    return { basico:'Básico', pro:'Pro', max:'Max', libre:'Libre' }[p] || p;
  }

  function _renderThemePicker(current) {
    const themes = [
      { id:'default',      label:'🌿 Oscuro Verde',   colors:['#0d0d0d','#2ECC71'] },
      { id:'light',        label:'☀️ Claro Natural',   colors:['#f5f5f0','#27ae60'] },
      { id:'dark-neutral', label:'🌑 Oscuro Neutro',   colors:['#121212','#6c63ff'] },
      { id:'custom',       label:'🎨 Personalizado',   colors:['var(--bg)','var(--primary)'] },
    ];
    return themes.map(t => `
      <div class="theme-card ${current===t.id?'active':''}" onclick="Settings.setTheme('${t.id}')">
        <div class="theme-preview" style="background:${t.colors[0]};border-color:${t.colors[1]};"></div>
        <span>${t.label}</span>
        ${current===t.id ? '<span class="theme-check">✓</span>' : ''}
      </div>
    `).join('');
  }

  function _renderCollabList(s) {
    const collabs = s.collaborators || [];
    if (!collabs.length) return '<p style="opacity:.6;font-size:.85rem;">No hay colaboradores agregados.</p>';
    return collabs.map(c => `
      <div class="collab-row">
        <div>
          <strong>${esc(c.name)}</strong>
          <span style="font-size:.8rem;opacity:.7;margin-left:.5rem;">@${esc(c.username)}</span>
          <span class="badge badge-perms">${esc(c.permissions||'ventas')}</span>
        </div>
        <div style="display:flex;gap:.5rem;">
          <button class="btn btn-sm btn-secondary" onclick="Settings.editCollab('${c.id}')">✏️</button>
          <button class="btn btn-sm btn-danger"    onclick="Settings.deleteCollab('${c.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  // ── Inicialización ────────────────────────────────────────────
  async function init() {
    await Store.loadCollaborators();
    _generateQR();
    _checkNotifPerm();
  }

  function _generateQR() {
    const cfg  = Store.get().config || {};
    const slug = cfg.public_slug || 'mi-dietetica';
    const url  = `${location.origin}/local/${slug}`;
    const container = document.getElementById('settings-qr');
    if (!container) return;
    container.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, { text: url, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H });
    } else {
      container.innerHTML = `<p style="opacity:.6;font-size:.85rem;">QRCode.js no disponible</p>`;
    }
  }

  function _checkNotifPerm() {
    const el = document.getElementById('notif-perm-status');
    if (!el) return;
    if (!('Notification' in window)) {
      el.innerHTML = '<p style="color:var(--warning);font-size:.85rem;">⚠️ Tu navegador no soporta notificaciones.</p>';
      return;
    }
    const p = Notification.permission;
    const msg = { granted:'✅ Notificaciones habilitadas', denied:'❌ Notificaciones bloqueadas. Desbloqueá desde la config del navegador.', default:'ℹ️ Notificaciones no configuradas.' };
    el.innerHTML = `<p style="font-size:.85rem;margin-bottom:.5rem;">${msg[p]||''}</p>`;
  }

  // ── Config tienda ─────────────────────────────────────────────
  async function saveConfig() {
    const data = {
      name:              document.getElementById('cfg-name')?.value?.trim(),
      whatsapp:          document.getElementById('cfg-wa')?.value?.trim(),
      email:             document.getElementById('cfg-email')?.value?.trim(),
      address:           document.getElementById('cfg-addr')?.value?.trim(),
      mp_link:           document.getElementById('cfg-mp')?.value?.trim(),
      public_slug:       document.getElementById('cfg-slug')?.value?.trim().toLowerCase().replace(/\s+/g,'-'),
      expiry_alert_days: parseInt(document.getElementById('cfg-expiry')?.value) || 7,
    };
    if (!data.name) { App.toast('El nombre del local es obligatorio','error'); return; }
    const ok = await Store.saveConfig(data);
    if (ok) {
      App.toast('✅ Configuración guardada');
      _generateQR();
    } else {
      App.toast('Error al guardar','error');
    }
  }

  function uploadLogo() {
    App.toast('Función de logo próximamente', 'info');
  }

  // ── QR ────────────────────────────────────────────────────────
  function printQR() {
    const cfg  = Store.get().config || {};
    const slug = cfg.public_slug || 'mi-dietetica';
    const url  = `${location.origin}/local/${slug}`;
    const w = window.open('','_blank','width=400,height=500');
    w.document.write(`<!DOCTYPE html><html><head><title>QR ${esc(cfg.name||'')}</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
    </head><body style="text-align:center;font-family:sans-serif;padding:2rem;">
    <h2>${esc(cfg.name||'Mi Dietética')}</h2>
    <div id="qr"></div>
    <p style="font-size:.85rem;color:#555;margin-top:1rem;">${esc(url)}</p>
    <p style="font-size:.9rem;color:#333;">Escaneá para ver nuestros productos y ofertas</p>
    <script>window.onload=()=>{new QRCode(document.getElementById('qr'),{text:'${url}',width:250,height:250,correctLevel:QRCode.CorrectLevel.H});setTimeout(()=>window.print(),500);}<\/script>
    </body></html>`);
    w.document.close();
  }

  function downloadQR() {
    const canvas = document.querySelector('#settings-qr canvas');
    if (!canvas) { App.toast('QR no disponible','error'); return; }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'qr-local.png';
    a.click();
  }

  // ── Temas ─────────────────────────────────────────────────────
  function setTheme(themeId) {
    Store.applyTheme(themeId);
    const panel = document.getElementById('custom-color-panel');
    if (panel) panel.style.display = themeId === 'custom' ? 'block' : 'none';
    // Refresh theme cards
    const grid = document.getElementById('theme-grid');
    if (grid) grid.innerHTML = _renderThemePicker(themeId);
    // Re-attach custom panel
    const newPanel = document.getElementById('custom-color-panel');
    if (newPanel) newPanel.style.display = themeId === 'custom' ? 'block' : 'none';
  }

  function previewCustom() {
    const primary = document.getElementById('custom-primary')?.value || '#2ECC71';
    const bg      = document.getElementById('custom-bg')?.value      || '#0d0d0d';
    const surface = document.getElementById('custom-surface')?.value  || '#1a1a1a';
    const text    = document.getElementById('custom-text')?.value     || '#f0f0f0';
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--bg',      bg);
    root.style.setProperty('--surface', surface);
    root.style.setProperty('--text',    text);
  }

  async function saveCustomTheme() {
    const primary = document.getElementById('custom-primary')?.value || '#2ECC71';
    const bg      = document.getElementById('custom-bg')?.value      || '#0d0d0d';
    const surface = document.getElementById('custom-surface')?.value  || '#1a1a1a';
    const text    = document.getElementById('custom-text')?.value     || '#f0f0f0';
    Store.applyTheme('custom', { primary, bg, surface, text });
    await Store.saveConfig({ custom_primary:primary, custom_bg:bg, custom_surface:surface, custom_text:text, theme:'custom' });
    App.toast('✅ Tema personalizado guardado');
  }

  // ── Colaboradores ─────────────────────────────────────────────
  function openCollabModal(collab = null) {
    document.getElementById('collab-edit-id').value = collab?.id || '';
    document.getElementById('collab-name').value    = collab?.name || '';
    document.getElementById('collab-user').value    = collab?.username || '';
    document.getElementById('collab-pass').value    = '';
    document.getElementById('collab-perms').value   = collab?.permissions || 'ventas';
    document.getElementById('collab-modal-title').textContent = collab ? 'Editar colaborador' : 'Agregar colaborador';
    document.getElementById('collab-modal').style.display = 'flex';
  }

  function closeCollabModal() {
    document.getElementById('collab-modal').style.display = 'none';
  }

  async function saveCollab() {
    const id   = document.getElementById('collab-edit-id').value;
    const name = document.getElementById('collab-name').value.trim();
    const user = document.getElementById('collab-user').value.trim().toLowerCase();
    const pass = document.getElementById('collab-pass').value;
    const perm = document.getElementById('collab-perms').value;

    if (!name || !user) { App.toast('Nombre y usuario son obligatorios','error'); return; }

    const s = Store.get();
    const max = s.config?.max_collaborators ?? 2;
    const collabs = s.collaborators || [];

    if (!id && collabs.length >= max) {
      App.toast(`Límite de ${max} colaboradores alcanzado`,'error'); return;
    }
    if (!id && !pass) { App.toast('La contraseña es obligatoria','error'); return; }
    if (pass && pass.length < 6) { App.toast('Mínimo 6 caracteres','error'); return; }

    let ok;
    if (id) {
      ok = await Store.updateCollaborator(id, { name, username:user, permissions:perm, ...(pass?{password:pass}:{}) });
    } else {
      ok = await Store.saveCollaborator({ name, username:user, password:pass, permissions:perm });
    }
    if (ok) {
      closeCollabModal();
      App.toast('✅ Colaborador guardado');
      await Store.loadCollaborators();
      const list = document.getElementById('collab-list');
      if (list) list.innerHTML = _renderCollabList(Store.get());
    } else {
      App.toast('Error al guardar colaborador','error');
    }
  }

  function editCollab(id) {
    const c = (Store.get().collaborators||[]).find(x=>x.id===id);
    if (c) openCollabModal(c);
  }

  async function deleteCollab(id) {
    if (!confirm('¿Eliminar este colaborador?')) return;
    const ok = await Store.updateCollaborator(id, { active:false });
    if (ok) {
      App.toast('Colaborador eliminado');
      await Store.loadCollaborators();
      const list = document.getElementById('collab-list');
      if (list) list.innerHTML = _renderCollabList(Store.get());
    }
  }

  return { render, init, saveConfig, uploadLogo, printQR, downloadQR,
           setTheme, previewCustom, saveCustomTheme,
           openCollabModal, closeCollabModal, saveCollab, editCollab, deleteCollab };
})();
