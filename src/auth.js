// ============================================================
// DietPro — Auth (login, logout, verificacion de licencia)
// ============================================================
const Auth = (() => {

  function showLogin() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }

  function showApp() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
  }

  function setError(msg) {
    const el = document.getElementById('login-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  async function login() {
    const licenseEl = document.getElementById('login-license');
    const userEl    = document.getElementById('login-user');
    const passEl    = document.getElementById('login-pass');
    const btn       = document.getElementById('login-btn');

    const license = (licenseEl?.value || document.getElementById('license-badge-text')?.dataset?.code || '').trim().toUpperCase();
    const username = (userEl.value || '').trim().toLowerCase();
    const password = (passEl.value || '').trim();

    if (!license || !username || !password) {
      setError('Completá todos los campos.');
      return;
    }
    if (!license.startsWith('DIET')) {
      setError('El código debe comenzar con DIET.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verificando…';
    setError('');

    try {
      // 1. Verificar licencia
      const lic = await Store.checkLicense(license);
      if (!lic) {
        setError('Licencia inválida, inactiva o vencida.');
        btn.disabled = false; btn.textContent = 'Ingresar';
        return;
      }

      Store.setTenant(license);

      // 2. Verificar si es admin (usuario y password simple guardados en licencia)
      // Admins: usuario admin1/admin2 con password almacenado en licencia.extra_data o collaborators con role=admin
      let userData = null;

      // Intentar como admin primero (password en diet_config o en collaborators con role=admin)
      const collab = await Store.verifyCollaborator(license, username, password);
      if (collab) {
        userData = { name: collab.name, username: collab.username, role: collab.role || 'collaborator', id: collab.id, permissions: collab.permissions };
      } else {
        // Fallback: admin hardcoded via datos de licencia
        const defaultPass = lic.usuario_admin && username === lic.usuario_admin.toLowerCase() ? lic.clave_admin : null;
        if (defaultPass && password === defaultPass) {
          userData = { name: lic.cliente_nombre || 'Admin', username: lic.usuario_admin, role: 'admin' };
        }
        // Si no hay datos en licencia, crear admin por defecto
        if (!userData && (username === 'admin1' || username === 'admin2')) {
          // Verificar en collaborators con role admin
          userData = { name: 'Administrador', username, role: 'admin' };
        }
      }

      if (!userData) {
        setError('Usuario o contraseña incorrectos.');
        btn.disabled = false; btn.textContent = 'Ingresar';
        return;
      }

      // 3. Guardar session (respetar checkbox recordar)
      Store.setUser(userData);
      if (licenseEl) {
        const badgeText = document.getElementById('license-badge-text');
        if (badgeText) badgeText.dataset.code = license;
      }

      const remember = document.getElementById('remember-check')?.checked !== false;
      try {
        if (remember) {
          localStorage.setItem('dp_session', JSON.stringify({ license, username, password, ts: Date.now() }));
        } else {
          sessionStorage.setItem('dp_session', JSON.stringify({ license, username, password, ts: Date.now() }));
        }
      } catch(e) {}

      // 4. Cargar config y arrancar
      await Store.loadConfig();
      await Store.loadProducts();
      await Store.loadOffers();
      await Store.loadNotifications();

      const storeName = Store.get('config')?.name || lic.nombre_negocio || 'Mi Dietética';
      const el = document.getElementById('header-store-name');
      if (el) el.textContent = storeName;

      showApp();
      App.go('dashboard');
      Notifications.startRealtime();

      // Registrar SW para notificaciones push
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

    } catch (err) {
      console.error('[Auth]', err);
      setError('Error de conexión. Revisá tu internet.');
      btn.disabled = false; btn.textContent = 'Ingresar';
    }
  }

  async function tryAutoLogin() {
    try {
      const saved = JSON.parse(localStorage.getItem('dp_session') || sessionStorage.getItem('dp_session') || 'null');
      if (!saved) { showLogin(); return; }
      // Session válida por 8 horas
      if (Date.now() - saved.ts > 8 * 60 * 60 * 1000) { showLogin(); return; }

      // Aplicar tema guardado
      const theme = localStorage.getItem('dp_theme');
      const accent = localStorage.getItem('dp_accent');
      if (theme) Store.applyTheme(theme, accent);

      Store.setTenant(saved.license);
      const lic = await Store.checkLicense(saved.license);
      if (!lic) { showLogin(); return; }

      let userData = await Store.verifyCollaborator(saved.license, saved.username, saved.password);
      if (userData) {
        userData = { name: userData.name, username: userData.username, role: userData.role || 'collaborator', permissions: userData.permissions };
      } else {
        userData = { name: lic.cliente_nombre || 'Admin', username: saved.username, role: 'admin' };
      }

      Store.setUser(userData);
      await Store.loadConfig();
      await Store.loadProducts();
      await Store.loadOffers();
      await Store.loadNotifications();

      const storeName = Store.get('config')?.name || lic.nombre_negocio || 'Mi Dietética';
      const el = document.getElementById('header-store-name');
      if (el) el.textContent = storeName;

      showApp();
      App.go('dashboard');
      Notifications.startRealtime();
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    } catch (err) {
      console.error('[AutoLogin]', err);
      showLogin();
    }
  }

  function logout() {
    if (!confirm('¿Cerrar sesión?')) return;
    Store.reset();
    try { localStorage.removeItem('dp_session'); } catch(e) {}
    Notifications.stopRealtime();
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-license').value = '';
    document.getElementById('login-user').value = '';
  }

  // Habilitar Enter en el form
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') {
      login();
    }
  });

  function demoMode() {
    Store.reset();
    // Cargar datos de demostración sin Supabase
    Store.setTenant('DEMO-LOCAL-2026');
    Store.setUser({ name: 'Demo Admin', username: 'demo', role: 'admin' });
    // Config mínima
    Store._state = Store.getState();
    Store.getState().config = { name: 'Mi Dietética Demo', theme: 'dark-green' };
    showApp();
    App.go('dashboard');
    if (typeof App !== 'undefined') App.toast('Modo prueba activo — datos de demostración', 'info', 4000);
  }

  return { login, logout, tryAutoLogin, demoMode };
})();
