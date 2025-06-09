import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./DemoDropdownMenu.css";

// All modules for dropdown menu (matches App.tsx)
const modules = [
  { title: "Ecosystem Overview", link: "/ecosystem", icon: "🌐" },
  { title: "Authentication & Minting", link: "/auth-minting", icon: "🛡️" },
  { title: "Marketplace & Escrow", link: "/marketplace-escrow", icon: "🛒" },
  { title: "Tagrity", link: "/tagrity", icon: "🔖" },
  { title: "Burnify", link: "/burnify", icon: "🔥" },
  { title: "NFT Staking", link: "/nft-staking", icon: "🎨" },
  { title: "DAO Governance", link: "/dao", icon: "🏛️" },
  { title: "Discovery Parcours", link: "/discovery", icon: "🎲" },
  { title: "NFT Minter Demo", link: "/minter", icon: "🖼️" },
  { title: "Faucet Demo", link: "/faucet", icon: "🚰" },
  { title: "Escrow Demo", link: "/escrow", icon: "🔒" },
  { title: "TRO Dashboard", link: "/tro-dashboard", icon: "💎" },
];

const DemoDropdownMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard accessibility: close on Escape, focus trap
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="dropdown-menu-root" ref={menuRef}>
      <button
        className="dropdown-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
        tabIndex={0}
      >
        ☰ Menu
      </button>
      {open && (
        <div className="dropdown-menu-list" role="menu" aria-label="Feature menu">
          {modules.map((mod) => (
            <Link
              to={mod.link}
              className={location.pathname === mod.link ? "active" : ""}
              key={mod.link}
              role="menuitem"
              tabIndex={0}
              onClick={() => setOpen(false)}
            >
              <span className="dropdown-icon">{mod.icon}</span>
              {mod.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DemoDropdownMenu;
