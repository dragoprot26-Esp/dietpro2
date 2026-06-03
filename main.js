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

    // Actualizar nav — soporta .nav-item y .nav-btn
    document.querySelectorAll('.nav-item[data-view], .nav-btn[data-view]').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewId);
    });

    // Render — nombres de módulos correctos (*View)
    const renderers = {
      dashboard: () => DashboardView?.render(),
      products:  () => ProductsView?.render(),
      sales:     () => SalesView?.render(),
      stock:     () => StockView?.render(),
      offers:    () => OffersView?.render(),
      settings:  () => SettingsView?.render(),
    };

    const html = renderers[viewId]?.();
    // Cada vista maneja su propio contenedor; si devuelve HTML lo inyectamos
    // en el contenedor legacy para compatibilidad
    if (html) {
      const container = document.getElementById('app-content');
      if (container) container.innerHTML = html;
    }

    // Post-render init
    const inits = {
      dashboard: () => DashboardView?.init?.(),
      products:  () => ProductsView?.init?.(),
      sales:     () => SalesView?.init?.(),
      stock:     () => StockView?.init?.(),
      offers:    () => OffersView?.init?.(),
      settings:  () => SettingsView?.init?.(),
    };
    inits[viewId]?.();

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Toast ─────────────────────────────────────────────────────
  let _toastTimer = null;

  function toast(msg, type = 'success', duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'show';
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, duration);
  }

  // ── FAB Scanner (botón central) ───────────────────────────────
  function openScanner() {
    Scanner.open((barcode) => {
      go('products');
      setTimeout(() => ProductsView?.openFromBarcode?.(barcode), 300);
    }, 'barcode');
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    // Página pública /local/SLUG
    if (location.pathname.startsWith('/local/')) {
      window.__SUPABASE_URL__ = 'https://upoexzjltapiuijhszzk.supabase.co';
      window.__SUPABASE_KEY__ = window.SUPABASE_ANON_KEY || '';
      PublicPage?.boot();
      return;
    }

    // App privada — intentar auto-login
    Auth.tryAutoLogin();
  }

  // ── Logout (llamado desde auth.js también) ────────────────────
  function logout() {
    // auth.js maneja la confirmación y limpieza; esto es solo por si
    // alguien llama App.logout() directamente
    Auth.logout();
  }

  return { go, toast, openScanner, init, logout };
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
