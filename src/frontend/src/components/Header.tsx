import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Download, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { Profile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  profile: Profile;
}

const NAV_ITEMS: { label: string; page: Page }[] = [
  { label: "Home", page: "dashboard" },
  { label: "Live Classes", page: "live" },
  { label: "Recordings", page: "recordings" },
  { label: "Profile", page: "profile" },
];

export default function Header({
  currentPage,
  onNavigate,
  profile,
}: HeaderProps) {
  const { clear } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canInstall, install } = usePWAInstall();

  return (
    <header className="header-navy sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <span className="text-white font-semibold text-base hidden sm:block">
            Teacher App
          </span>
        </div>

        {/* Desktop Nav */}
        <nav
          className="hidden md:flex items-center gap-1 flex-1 justify-center"
          data-ocid="nav.panel"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              data-ocid={`nav.${item.page}.link`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentPage === item.page
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="text-white/70 hover:text-white p-2 rounded-md hover:bg-white/10 hidden sm:block"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className="text-white/70 hover:text-white p-2 rounded-md hover:bg-white/10 relative hidden sm:block"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full live-red" />
          </button>

          {/* PWA Install Button */}
          {canInstall && (
            <Button
              variant="outline"
              size="sm"
              onClick={install}
              data-ocid="nav.install.button"
              className="hidden sm:flex items-center gap-1.5 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white text-xs px-2.5 py-1.5 h-auto"
            >
              <Download size={13} />
              Install
            </Button>
          )}

          {/* User avatar */}
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            data-ocid="nav.profile.link"
            className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full live-green border-2 border-navy-700" />
            </div>
            <span className="text-white text-sm font-medium hidden sm:block max-w-[100px] truncate">
              {profile.name}
            </span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            data-ocid="nav.logout.button"
            className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex"
            title="Log out"
          >
            <LogOut size={16} />
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden text-white/70 hover:text-white p-2 rounded-md hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden header-navy-dark border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                onNavigate(item.page);
                setMobileOpen(false);
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                currentPage === item.page
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
          {canInstall && (
            <button
              type="button"
              onClick={install}
              data-ocid="nav.install.button"
              className="px-3 py-2 rounded-md text-sm font-medium text-left text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Download size={14} />
              Install App
            </button>
          )}
          <button
            type="button"
            onClick={clear}
            className="px-3 py-2 rounded-md text-sm font-medium text-left text-white/70 hover:text-white hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
