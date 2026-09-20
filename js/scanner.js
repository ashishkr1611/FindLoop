// Real Camera QR Code Scanner Module for FindLoop
// Powered by html5-qrcode engine for cross-platform camera QR decoding

let html5QrCode = null;
let isLibraryLoading = false;

// Dynamically load html5-qrcode CDN script if not present
function loadLibrary() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (isLibraryLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.Html5Qrcode) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }
  isLibraryLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.onload = () => {
      isLibraryLoading = false;
      resolve();
    };
    script.onerror = (err) => {
      isLibraryLoading = false;
      reject(err);
    };
    document.head.appendChild(script);
  });
}

// Parse secure token from scanned QR text or full URL
export function parseTokenFromQR(decodedText) {
  if (!decodedText) return null;
  const str = decodedText.trim();
  try {
    if (str.startsWith("http://") || str.startsWith("https://")) {
      const url = new URL(str);
      const token = url.searchParams.get("token") || url.searchParams.get("id");
      if (token) return token;
    }
  } catch (e) {
    // Not a valid URL string
  }
  return str;
}

// Inject Modal Markup into DOM
function ensureModalHTML() {
  if (document.getElementById("qr-scanner-modal")) return;

  const modal = document.createElement("div");
  modal.id = "qr-scanner-modal";
  modal.className = "qr-scanner-modal-backdrop";
  modal.innerHTML = `
    <div class="qr-scanner-modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; background: #14B8A6; border-radius: 8px; color: #0F172A; font-weight: 900; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">FL</div>
          <h2 style="font-size: 1.15rem; font-weight: 900; color: white; margin: 0;">FindLoop Scanner</h2>
        </div>
        <button id="close-scanner-modal-icon" style="background: none; border: none; color: #94A3B8; font-size: 1.5rem; cursor: pointer; padding: 4px 8px; border-radius: 8px; line-height: 1;">✕</button>
      </div>

      <p style="font-size: 0.825rem; color: #94A3B8; margin: -0.25rem 0 0.25rem;">
        Point your camera at a FindLoop QR Tag
      </p>

      <!-- Camera Stream Viewport -->
      <div class="qr-video-box">
        <div id="qr-reader-viewport" style="width: 100%; height: 100%;"></div>
        <div class="qr-scanner-guide"></div>
        <div class="qr-scanner-laser"></div>
      </div>

      <div id="scanner-status-message" style="font-size: 0.825rem; font-weight: 700; color: #14B8A6; min-height: 28px; display: flex; align-items: center; justify-content: center;">
        ⚡ Requesting camera access...
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.25rem;">
        <button id="cancel-scanner-btn" class="btn btn-navy" style="width: 100%; padding: 0.75rem; border-radius: 12px; font-weight: 800; min-height: 44px;">
          Cancel
        </button>
        <a id="demo-fallback-link" href="#" class="btn btn-ghost-dark" style="font-size: 0.75rem; color: #94A3B8; padding: 0.4rem; text-decoration: underline; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;">
          🧪 Try Demo Scan
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("close-scanner-modal-icon").addEventListener("click", closeScannerModal);
  document.getElementById("cancel-scanner-btn").addEventListener("click", closeScannerModal);

  document.getElementById("demo-fallback-link").addEventListener("click", (e) => {
    e.preventDefault();
    closeScannerModal();
    const isPublicDir = window.location.pathname.includes("/public/");
    const targetUrl = isPublicDir ? "scan.html?token=FL-8X92K" : "public/scan.html?token=FL-8X92K";
    window.location.href = targetUrl;
  });
}

export async function openScannerModal() {
  ensureModalHTML();
  const modal = document.getElementById("qr-scanner-modal");
  const statusMsg = document.getElementById("scanner-status-message");

  modal.classList.add("active");
  statusMsg.style.color = "#14B8A6";
  statusMsg.textContent = "⚡ Requesting camera access...";

  try {
    await loadLibrary();

    if (html5QrCode) {
      await stopScanner();
    }

    html5QrCode = new Html5Qrcode("qr-reader-viewport");

    const config = {
      fps: 15,
      qrbox: (viewWidth, viewHeight) => {
        const minEdge = Math.min(viewWidth, viewHeight);
        return { width: Math.floor(minEdge * 0.75), height: Math.floor(minEdge * 0.75) };
      }
    };

    statusMsg.textContent = "📷 Point your camera at the QR code...";

    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        statusMsg.style.color = "#10B981";
        statusMsg.textContent = "✅ Tag Scanned! Redirecting...";
        await stopScanner();

        const token = parseTokenFromQR(decodedText);
        if (token) {
          const isPublicDir = window.location.pathname.includes("/public/");
          const targetUrl = isPublicDir 
            ? `scan.html?token=${encodeURIComponent(token)}` 
            : `public/scan.html?token=${encodeURIComponent(token)}`;
          window.location.href = targetUrl;
        } else {
          statusMsg.style.color = "#F43F5E";
          statusMsg.textContent = "❌ Invalid FindLoop QR Code";
        }
      },
      () => {
        // Ignored frame decode error
      }
    );
  } catch (err) {
    console.error("Camera scanner error:", err);
    statusMsg.style.color = "#F43F5E";

    if (err.name === "NotAllowedError" || (err.toString && err.toString().includes("Permission"))) {
      statusMsg.innerHTML = `⚠️ Camera permission denied.<br><span style="font-weight: 400; font-size: 0.75rem; color: #CBD5E1;">Please enable camera access in your browser.</span>`;
    } else if (err.name === "NotFoundError" || (err.toString && err.toString().includes("device"))) {
      statusMsg.innerHTML = `⚠️ No camera found on this device.`;
    } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      statusMsg.innerHTML = `⚠️ Camera requires secure HTTPS connection.`;
    } else {
      statusMsg.innerHTML = `⚠️ Camera error: ${err.message || "Please check permissions."}`;
    }
  }
}

export async function stopScanner() {
  if (html5QrCode) {
    try {
      if (html5QrCode.isScanning) {
        await html5QrCode.stop();
      }
      html5QrCode.clear();
    } catch (e) {
      console.warn("Error stopping QR reader:", e);
    }
  }
}

export async function closeScannerModal() {
  await stopScanner();
  const modal = document.getElementById("qr-scanner-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

export function initScannerButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#open-qr-scanner-btn, .open-qr-scanner-btn");
    if (btn) {
      e.preventDefault();
      openScannerModal();
    }
  });
}

window.addEventListener("beforeunload", () => {
  stopScanner();
});
