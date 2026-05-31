// ============================================================
// DietPro — Scanner (QuaggaJS + jsQR)
// ============================================================
const Scanner = (() => {
  let _active = false;
  let _stream = null;
  let _callback = null;
  let _mode = 'barcode'; // barcode | qr
  let _qrInterval = null;

  function open(callback, mode = 'barcode') {
    _callback = callback;
    _mode = mode;
    const overlay = document.getElementById('scanner-overlay');
    overlay.classList.add('open');
    _active = true;
    _startCamera();
  }

  function close() {
    _active = false;
    document.getElementById('scanner-overlay').classList.remove('open');
    _stopCamera();
    if (typeof Quagga !== 'undefined') {
      try { Quagga.stop(); } catch(e) {}
    }
    if (_qrInterval) { clearInterval(_qrInterval); _qrInterval = null; }
  }

  function manual() {
    close();
    const code = prompt('Ingresá el código de barras o QR:');
    if (code && code.trim() && _callback) {
      _callback(code.trim());
    }
  }

  async function _startCamera() {
    try {
      _stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const video = document.getElementById('scanner-video');
      video.srcObject = _stream;
      await video.play();

      if (_mode === 'barcode' && typeof Quagga !== 'undefined') {
        _startQuagga();
      } else {
        _startQRDecode();
      }
    } catch (err) {
      console.error('[Scanner] Camera error:', err);
      close();
      App.toast('No se pudo acceder a la cámara. Usá el ingreso manual.');
    }
  }

  function _stopCamera() {
    if (_stream) {
      _stream.getTracks().forEach(t => t.stop());
      _stream = null;
    }
  }

  function _startQuagga() {
    const video = document.getElementById('scanner-video');
    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: video,
        constraints: { facingMode: 'environment' },
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader', 'upc_e_reader'],
      },
      locate: true,
    }, err => {
      if (err) { console.error('[Quagga init]', err); _startQRDecode(); return; }
      Quagga.start();
    });

    Quagga.onDetected(data => {
      const code = data?.codeResult?.code;
      if (code && _active && _callback) {
        navigator.vibrate && navigator.vibrate(100);
        close();
        _callback(code);
      }
    });
  }

  function _startQRDecode() {
    const video = document.getElementById('scanner-video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    _qrInterval = setInterval(() => {
      if (!_active || video.readyState !== 4) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      try {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && _active && _callback) {
          navigator.vibrate && navigator.vibrate(100);
          close();
          _callback(code.data);
        }
      } catch(e) {}
    }, 200);
  }

  return { open, close, manual };
})();
