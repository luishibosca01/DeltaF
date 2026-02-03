// Registro del Service Worker con notificaciones de actualización
// Incluye este script en tu HTML antes del cierre de </body>

(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  }

  function registerServiceWorker() {
    navigator.serviceWorker.register('./sw.js', { 
      scope: './'
      // REMOVIDO updateViaCache para permitir que el SW se cachee correctamente
    })
      .then((registration) => {
        console.log('[App] Service Worker registrado');

        // Verificar actualizaciones cada 60 segundos
        setInterval(() => {
          console.log('[App] Verificando actualizaciones...');
          registration.update();
        }, 60000);

        // Detectar cuando hay un nuevo SW instalándose
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[App] 🔄 Nueva versión detectada, instalando...');

          newWorker.addEventListener('statechange', () => {
            console.log('[App] Estado del nuevo SW:', newWorker.state);

            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Hay una actualización esperando
                console.log('[App] ✅ Nueva versión lista para activar');
                showUpdateNotification(newWorker);
              } else {
                // Primera instalación
                console.log('[App] ✅ PWA instalada correctamente');
                showInstalledNotification();
              }
            }
          });
        });

        // Verificar inmediatamente si hay actualizaciones
        registration.update();
      })
      .catch((error) => {
        console.error('[App] ❌ Error al registrar Service Worker:', error);
      });

    // Escuchar mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_ACTIVATED') {
        console.log('[App] 🎉 Service Worker activado, versión:', event.data.version);
      }
    });

    // Detectar cuando un nuevo SW toma control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        console.log('[App] 🔄 Nuevo Service Worker tomó control');
        refreshing = true;
        // Recargar la página automáticamente
        window.location.reload();
      }
    });
  }

  function showUpdateNotification(worker) {
    // Verificar si ya existe un toast
    if (document.getElementById('update-toast')) {
      return;
    }

    const toast = document.createElement('div');
    toast.id = 'update-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
        max-width: 90%;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">✨ Nueva versión disponible</div>
          <div style="opacity: 0.9; font-size: 13px;">Toca "Actualizar" para ver los cambios</div>
        </div>
        <button id="reload-button" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
          white-space: nowrap;
        ">
          Actualizar
        </button>
        <button id="close-toast" style="
          background: transparent;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s;
        ">
          ×
        </button>
      </div>
    `;

    // Agregar animación
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
        }
        #reload-button:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
        #close-toast:hover {
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Botón de actualizar
    document.getElementById('reload-button').addEventListener('click', () => {
      console.log('[App] Usuario solicitó actualización');
      if (worker) {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
      // La página se recargará automáticamente cuando el SW tome control
    });

    // Botón de cerrar
    document.getElementById('close-toast').addEventListener('click', () => {
      closeToast();
    });

    // No auto-cerrar - dejar que el usuario decida
  }

  function showInstalledNotification() {
    const toast = document.createElement('div');
    toast.id = 'installed-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
        max-width: 90%;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="font-weight: 600;">🎉 PWA instalada correctamente</div>
        <div style="opacity: 0.9; font-size: 13px; margin-top: 4px;">La aplicación funciona offline</div>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      const toastElement = document.getElementById('installed-toast');
      if (toastElement) {
        toastElement.firstElementChild.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => toastElement.remove(), 300);
      }
    }, 5000);
  }

  function closeToast() {
    const toastElement = document.getElementById('update-toast');
    if (toastElement) {
      toastElement.firstElementChild.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => toastElement.remove(), 300);
    }
  }
})();
