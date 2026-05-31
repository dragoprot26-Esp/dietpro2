// ================================================
// DietPro - Main / Router
// ================================================

const App = (() => {

  const VIEWS = ['dashboard','products','sales','stock','offers','settings'];

  // Vista actual
  let _current = null;

  // ── Router ────────────────────────────────────────────────────
  function go(viewId) {
    if (!VIEWS.includes(viewId)) return;

    // Si es la misma vista, no re-renderizar (salvo dashboard que tiene datos en tiempo real)
    if (_current === viewId && viewId !== 'dashboard') return;
    _current = viewId;

    // Actualizar nav
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewId);
    });

    // Render
    const container = document.getElementById('app-content');
    if (!container) return;

    const renderers = {
      dashboard: () => Dashboard.render(),
      products:  () => Products.render(),
      sales:     () => Sales.render(),
      stock:     () => Stock.render(),
      offers:    () => Offers.render(),
      settings:  () => Settings.render(),
    };

    container.innerHTML = renderers[viewId]?.() || '';

    // Post-render init
    const inits = {
      dashboard: () => Dashboard.init?.(),
      products:  () => Products.init?.(),
      sales:     () => Sales.init?.(),
      stock:     () => Stock.init?.(),
      offers:    () => Offers.init?.(),
      settings:  () => Settings.init?.(),
    };
    inits[viewId]?.();

    // Scroll top
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  // ── Toast ─────────────────────────────────────────────────────
  let _toastTimer = null;

  function toast(msg, type = 'success', duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className   = `toast toast-${type} show`;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, duration);
  }

  // ── FAB Scanner (botón central) ───────────────────────────────
  function openScanner() {
    Scanner.open((barcode) => {
      // Abrir productos con el código pre-cargado
      go('products');
      setTimeout(() => Products.openFromBarcode?.(barcode), 300);
    }, 'barcode');
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    // Detectar si es página pública
    if (location.pathname.startsWith('/local/')) {
      // Inyectar credenciales Supabase para la pública (sólo la anon key)
      window.__SUPABASE_URL__ = 'https://upoexzjltapiuijhszzk.supabase.co';
      // La anon key es pública — se inyecta desde el HTML (window.SUPABASE_ANON_KEY)
      window.__SUPABASE_KEY__ = window.SUPABASE_ANON_KEY || '';
      PublicPage.boot();
      return;
    }

    // App privada — intentar auto-login
    Auth.tryAutoLogin();
  }

  // ── Post-login: arrancar la app ───────────────────────────────
  function startApp() {
    document.getElementById('auth-screen').style.display  = 'none';
    document.getElementById('main-app').style.display     = 'flex';

    // Notificaciones
    Notifications.startRealtime();

    // Vista inicial
    go('dashboard');
  }

  // ── Logout ────────────────────────────────────────────────────
  function logout() {
    if (!confirm('¿Cerrar sesión?')) return;
    Notifications.stopRealtime();
    Store.reset();
    Auth.logout();
    document.getElementById('main-app').style.display  = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    toast('Sesión cerrada', 'info');
  }

  return { go, toast, openScanner, init, startApp, logout };
})();

// ── Arranque ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());

// ── Registrar Service Worker ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registrado:', reg.scope))
      .catch(err => console.warn('[SW] Error:', err));
  });
}
