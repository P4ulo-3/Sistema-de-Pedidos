import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import PWAInstallModal from "./PWAInstallModal.jsx";

export default function Layout() {
  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
          <PWAInstallModal />
        </main>
      </div>
    </div>
  );
}
