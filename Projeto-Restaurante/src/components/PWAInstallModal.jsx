import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";

export default function PWAInstallModal() {
  const deferredPrompt = useRef(null);
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    function handler(e) {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      deferredPrompt.current = e;
      // only show if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa_install_dismissed_v1");
      if (!dismissed) {
        setSupported(true);
        setOpen(true);
      }
    }

    window.addEventListener("beforeinstallprompt", handler);

    // close if appinstalled
    function handleInstalled() {
      localStorage.setItem("pwa_installed_v1", "1");
      setOpen(false);
    }

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function onInstall() {
    const e = deferredPrompt.current;
    if (!e) return;
    try {
      e.prompt();
      const choice = await e.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem("pwa_installed_v1", "1");
        setOpen(false);
      } else {
        // user dismissed; don't spam
        localStorage.setItem("pwa_install_dismissed_v1", "1");
        setOpen(false);
      }
    } catch (err) {
      // ignore
      setOpen(false);
    }
  }

  function onCancel() {
    localStorage.setItem("pwa_install_dismissed_v1", "1");
    setOpen(false);
  }

  // do not render modal if not supported or already installed
  if (!supported) return null;

  return (
    <Modal title="Instalar app" isOpen={open} onClose={onCancel} size="sm">
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          Instale este aplicativo no seu dispositivo para acesso rápido e
          offline.
        </p>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            Talvez depois
          </button>
          <button onClick={onInstall} className="btn-primary">
            Instalar
          </button>
        </div>
      </div>
    </Modal>
  );
}
