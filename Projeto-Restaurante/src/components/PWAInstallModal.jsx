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

    // detect iOS add-to-home-screen (no beforeinstallprompt)
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
    <Modal
      title="Instalar aplicativo"
      isOpen={open}
      onClose={onCancel}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-yellow-400 flex items-center justify-center shadow-lg">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 7h16v10H4z" fill="white" opacity="0.9" />
              <path d="M7 10h10v2H7z" fill="#F97316" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Instalar Restaurante</h3>
            <p className="text-sm text-gray-400">
              Acesse rápido, offline e como um app nativo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <div className="text-2xl">⚡</div>
            <div>
              <div className="font-medium">Acesso rápido</div>
              <div className="text-xs text-gray-400">
                Abra o app direto da sua tela inicial.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <div className="text-2xl">🗒️</div>
            <div>
              <div className="font-medium">Offline</div>
              <div className="text-xs text-gray-400">
                Veja pedidos e menus mesmo sem internet.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <div className="text-2xl">🔔</div>
            <div>
              <div className="font-medium">Notificações</div>
              <div className="text-xs text-gray-400">
                Receba atualizações importantes em tempo real.
              </div>
            </div>
          </div>
        </div>

        {isIos ? (
          <div className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
            <div className="font-semibold">iOS: adicionar à tela de início</div>
            <ol className="mt-2 list-decimal list-inside text-xs text-gray-600">
              <li>
                Toque em <span className="font-medium">Compartilhar</span>{" "}
                (ícone de quadrado com seta).
              </li>
              <li>
                Selecione{" "}
                <span className="font-medium">Adicionar à Tela de Início</span>.
              </li>
            </ol>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Talvez depois
          </button>
          {!isIos && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-2 btn-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v12"
                />
              </svg>
              Instalar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
