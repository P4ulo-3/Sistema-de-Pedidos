import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";

export default function PWAInstallModal() {
  const deferredPrompt = useRef(null);
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem("pwa_install_dismissed_v1");
    const installed = localStorage.getItem("pwa_installed_v1");
    if (installed) return;

    const ua = navigator.userAgent || navigator.vendor || "";
    const ios =
      /iphone|ipad|ipod/i.test(ua) &&
      !window.matchMedia("(display-mode: standalone)").matches;
    if (ios && !dismissed) {
      setIsIos(true);
      setSupported(true);
      setOpen(true);
    }

    function beforeInstallHandler(e) {
      e.preventDefault();
      deferredPrompt.current = e;
      if (!dismissed) {
        setSupported(true);
        setOpen(true);
      }
    }

    function handleInstalled() {
      localStorage.setItem("pwa_installed_v1", "1");
      setOpen(false);
      setSupported(false);
    }

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
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
        setSupported(false);
      } else {
        localStorage.setItem("pwa_install_dismissed_v1", "1");
        setOpen(false);
      }
    } catch (err) {
      setOpen(false);
    }
  }

  function onCancel() {
    localStorage.setItem("pwa_install_dismissed_v1", "1");
    setOpen(false);
  }

  if (!supported) return null;

  return (
    <Modal title="Instalar app" isOpen={open} onClose={onCancel} size="sm">
      <div className="max-w-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-yellow-400 flex items-center justify-center shadow">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 7h16v10H4z" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold">Instalar app</div>
            <div className="text-xs text-gray-400">Rápido • Offline</div>
          </div>
        </div>

        {isIos ? (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
            iOS: Compartilhar → Adicionar à Tela de Início
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded-md bg-gray-200 text-sm"
          >
            Depois
          </button>
          {!isIos && (
            <button
              onClick={onInstall}
              className="px-3 py-1 rounded-md bg-rose-500 text-white text-sm"
            >
              Instalar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
