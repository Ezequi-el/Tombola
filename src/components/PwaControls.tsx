import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaControls() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const standalone = () => window.matchMedia('(display-mode: standalone)').matches;
    const onPrompt = (event: Event) => {
      if (standalone()) return;
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = () => { setPrompt(null); setStatus('Tómbola instalada.'); };
    const connectivity = () => setOffline(!navigator.onLine);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('online', connectivity);
    window.addEventListener('offline', connectivity);

    let disposed = false;
    const onReady = (event: MessageEvent) => {
      if (event.data?.type === 'TOMBOLA_OFFLINE_READY' && !disposed) {
        setReady(true);
        setStatus('Lista para usar sin conexión.');
      }
    };
    const checkReady = () => {
      navigator.serviceWorker.ready.then(registration =>
        registration.active?.postMessage('TOMBOLA_OFFLINE_STATUS')
      );
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onReady);
      navigator.serviceWorker.addEventListener('controllerchange', checkReady);
    }
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      setStatus('Preparando uso sin conexión…');
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then(registration => {
          const waiting = () => {
            if (registration.waiting && !disposed) {
              setStatus('Actualización lista. Cierra todas las ventanas de Tómbola y vuelve a abrir con internet.');
            }
          };
          waiting();
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => {
              waiting();
              if (worker.state === 'redundant' && !disposed) {
                setStatus('No se pudo completar la descarga. Recarga con internet para reintentar.');
              }
            });
          });
          checkReady();
        })
        .catch(() => {
          if (!disposed) setStatus('No se pudo preparar el modo sin conexión. Recarga con internet para reintentar.');
        });
    }
    return () => {
      disposed = true;
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onReady);
        navigator.serviceWorker.removeEventListener('controllerchange', checkReady);
      }
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', connectivity);
      window.removeEventListener('offline', connectivity);
    };
  }, []);

  const install = async () => {
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setStatus(choice.outcome === 'accepted'
        ? 'Instalación solicitada.' : 'Puedes instalar desde el menú del navegador.');
    } catch {
      setStatus('Puedes instalar desde el menú del navegador.');
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  };

  if (!status && !prompt && !offline) return null;
  return (
    <div className="relative z-20 flex flex-wrap items-center justify-center gap-3 bg-white/70 px-4 py-2 text-xs text-slate-600">
      <span role="status" aria-live="polite">
        {offline && ready ? 'Sin conexión · Tómbola disponible en este dispositivo.' : status}
      </span>
      {prompt && (
        <button type="button" onClick={install} disabled={busy}
          className="rounded-xl border-2 border-pink-200 bg-white px-4 py-2 font-bold text-pink-700 hover:bg-pink-50 disabled:opacity-50">
          {busy ? 'Instalando…' : 'Instalar Tómbola'}
        </button>
      )}
    </div>
  );
}
