import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa-banner-dismissed') === '1') {
      setHidden(true);
      return;
    }
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setHidden(true);
      return;
    }
    if (isIos) setShowIos(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (hidden) return null;
  if (!deferred && !showIos) return null;

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', '1');
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-purple-500/30 bg-[#15151f]/95 p-4 shadow-xl backdrop-blur md:bottom-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1 text-sm text-gray-200">
          <p className="font-semibold text-white">Installer xArtists</p>
          {deferred ? (
            <p className="mt-1 text-xs text-gray-400">
              Ajoute l’app sur ton écran d’accueil pour un accès rapide (LIA, marketplace, wallet).
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              Sur iPhone : Safari → Bouton Partager → <strong>Sur l’écran d’accueil</strong>.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {deferred && (
              <button type="button" onClick={install} className="btn-primary text-xs px-3 py-1.5">
                Installer
              </button>
            )}
            <button type="button" onClick={dismiss} className="btn-secondary text-xs px-3 py-1.5">
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
