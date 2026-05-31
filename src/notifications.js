// ============================================================
// DietPro — Notifications (campanita + push)
// ============================================================
const Notifications = (() => {
  let _unsub = null;
  let _panelOpen = false;

  const icons = {
    stock_low:      '🔴',
    expiry_soon:    '🟠',
    sale_cancelled: '❌',
    collab_added:   '👤',
    info:           'ℹ️',
  };

  function togglePanel() {
    const panel = document.getElementById('notif-panel');
    _panelOpen = !_panelOpen;
    panel.classList.toggle('open', _panelOpen);
    if (_panelOpen) { render(); }
    // Cerrar al hacer click afuera
    if (_panelOpen) {
      setTimeout(() => {
        document.addEventListener('click', _closeOnOutside, { once: true });
      }, 50);
    }
  }

  function _closeOnOutside(e) {
    const panel = document.getElementById('notif-panel');
    const bell  = document.querySelector('.bell-btn');
    if (!panel.contains(e.target) && !bell?.contains(e.target)) {
      _panelOpen = false;
      panel.classList.remove('open');
    }
  }

  function render() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    const notifs = Store.get('notifications') || [];
    if (notifs.length === 0) {
      list.innerHTML = '<div class="notif-empty">🔕 Sin notificaciones</div>';
      return;
    }
    list.innerHTML = notifs.map(n => ).join('');
  }

  async function readOne(id) {
    await Store.markNotifRead(id);
    render();
  }

  async function markAll() {
    await Store.markAllRead();
    render();
    App.toast('Todo marcado como leído');
  }

  function startRealtime() {
    _unsub = Store.subscribeNotifications(() => {
      render();
      // Notificación push nativa si el panel está cerrado
      if (!_panelOpen) {
        const unread = (Store.get('notifications') || []).filter(n => !n.read);
        if (unread.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
          const latest = unread[0];
          new Notification(latest.title, {
            body: latest.message,
            icon: '/icons/icon-192.png',
            tag: latest.id,
          });
        }
      }
    });
  }

  function stopRealtime() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  function _timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return mins + ' min';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + ' h';
    return Math.floor(hrs / 24) + ' d';
  }

  return { togglePanel, render, readOne, markAll, startRealtime, stopRealtime, requestPermission };
})();
