import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ReceiptText,
  Shield,
  ShieldAlert,
  Sun,
  X,
} from 'lucide-react';
import type { Language, ThemeMode } from '../../types/football';
import { PWAInstallButton } from '../PWAInstallButton';

export type PlatformTab =
  | 'home'
  | 'match-detail'
  | 'predictions'
  | 'coupons'
  | 'ai-chat'
  | 'contest'
  | 'tipsters'
  | 'transparency'
  | 'premium'
  | 'admin';

interface PortalNavbarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  activeTab: PlatformTab;
  onSelectTab: (tab: PlatformTab) => void;
  customCouponCount: number;
  user: { displayName: string | null; email: string | null } | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenAlerts: () => void;
  onOpenResponsible: () => void;
  onOpenCouponDrawer: () => void;
  onOpenProAnalytics: () => void;
}

const PRIMARY_TABS: Array<{ id: PlatformTab; label: Record<Language, string> }> = [
  { id: 'home', label: { az: 'Matçlar', en: 'Matches', ru: 'Матчи' } },
  { id: 'predictions', label: { az: 'Dəyərli Seçimlər', en: 'Value Picks', ru: 'Валуй' } },
  { id: 'coupons', label: { az: 'Kuponlar', en: 'Coupons', ru: 'Купоны' } },
  { id: 'contest', label: { az: 'Yarış', en: 'Contest', ru: 'Конкурс' } },
  { id: 'tipsters', label: { az: 'Analitiklər', en: 'Analysts', ru: 'Аналитики' } },
  { id: 'transparency', label: { az: 'Arxiv', en: 'Archive', ru: 'Архив' } },
  { id: 'premium', label: { az: 'Pro', en: 'Pro', ru: 'Pro' } },
];

export const PortalNavbar: React.FC<PortalNavbarProps> = ({
  theme,
  onToggleTheme,
  lang,
  onChangeLang,
  activeTab,
  onSelectTab,
  customCouponCount,
  user,
  onSignIn,
  onSignOut,
  onOpenAlerts,
  onOpenResponsible,
  onOpenCouponDrawer,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelect = (tab: PlatformTab) => {
    setMobileOpen(false);
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-200 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#0B0F14]/95 backdrop-blur-sm border-[#DCE2EA] dark:border-[#1E2733]'
          : 'bg-white dark:bg-[#0B0F14] border-[#DCE2EA] dark:border-[#1E2733]'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        {/* Left: Editorial Wordmark (Clean pitch mark, zero glow) */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="ARENA AZ Ana Səhifə"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#168A4A]/30 dark:border-[#2BD576]/35 bg-[#168A4A]/10 dark:bg-[#2BD576]/12 text-[#168A4A] dark:text-[#2BD576]">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <rect x="2" y="3.5" width="16" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="3.5" x2="10" y2="16.5" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
          <span className="font-display text-2xl font-bold tracking-[0.06em] text-[#111827] dark:text-[#F3F6FA]">
            ARENA <span className="text-[#168A4A] dark:text-[#2BD576]">AZ</span>
          </span>
        </button>

        {/* Center: Primary Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Əsas naviqasiya">
          {PRIMARY_TABS.map((tab) => {
            const isActive =
              activeTab === tab.id || (tab.id === 'home' && activeTab === 'match-detail');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#EEF1F5] dark:bg-[#121821] text-[#111827] dark:text-[#F3F6FA] font-semibold'
                    : 'text-[#475569] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F3F6FA]'
                }`}
              >
                <span>{tab.label[lang]}</span>
                {tab.id === 'coupons' && customCouponCount > 0 && (
                  <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#168A4A] dark:bg-[#2BD576] px-1 font-mono text-[10px] font-semibold text-white dark:text-[#08140D] tabular-nums">
                    {customCouponCount}
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-[11px] h-[2px] bg-[#168A4A] dark:bg-[#2BD576]"
                  />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleSelect('ai-chat')}
            aria-current={activeTab === 'ai-chat' ? 'page' : undefined}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ai-chat'
                ? 'bg-[#EEF1F5] dark:bg-[#121821] text-[#111827] dark:text-[#F3F6FA] font-semibold'
                : 'text-[#475569] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-[#F3F6FA]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#168A4A] dark:text-[#2BD576]" strokeWidth={1.5} />
            <span>AI Analitik</span>
            {activeTab === 'ai-chat' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-[11px] h-[2px] bg-[#168A4A] dark:bg-[#2BD576]"
              />
            )}
          </button>
        </nav>

        {/* Right: Utilities (Hairline bordered, 1.5px stroke icons) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Switcher AZ/EN/RU */}
          <div
            role="group"
            aria-label="Dil seçimi"
            className="hidden sm:inline-flex items-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#121821] p-0.5"
          >
            {(['az', 'en', 'ru'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLang(code)}
                aria-pressed={lang === code}
                className={`rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase transition-colors cursor-pointer ${
                  lang === code
                    ? 'bg-white dark:bg-[#1E2733] text-[#111827] dark:text-[#F3F6FA]'
                    : 'text-[#64748B] hover:text-[#111827] dark:text-[#8A97A8] dark:hover:text-[#F3F6FA]'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="hidden lg:block">
            <PWAInstallButton
              installLabel="Quraşdır"
              iosTitle="iPhone / iPad-ə Quraşdır"
              iosStep1="Safari alt panelində Paylaş (Share) düyməsinə toxunun."
              iosStep2="Aşağı sürüşdürüb 'Ana Ekrana Əlavə Et' seçimini seçin."
              closeLabel="Bağla"
              compact
            />
          </div>

          <button
            type="button"
            onClick={onOpenCouponDrawer}
            aria-label="Kupon panelini aç"
            title="Kupon Konstruktoru"
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              customCouponCount > 0
                ? 'border-[#168A4A]/50 dark:border-[#2BD576]/45 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
            }`}
          >
            <ReceiptText className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="font-mono text-[11px] tabular-nums">{customCouponCount}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAlerts}
            aria-label="Bildiriş mərkəzi"
            title="Bildiriş tənzimləmələri"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA] hover:border-[#94A3B8] dark:hover:border-[#334155] transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => handleSelect('admin')}
            aria-label="Admin paneli"
            title="Admin Paneli"
            className={`hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              activeTab === 'admin'
                ? 'border-[#F5A524]/50 bg-[#F5A524]/10 text-[#B4690E] dark:text-[#F5A524]'
                : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
            }`}
          >
            <Shield className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={onOpenResponsible}
            aria-label="18+ Məsuliyyətli istifadə"
            title="18+ Məsuliyyətli oyun qaydaları"
            className="hidden sm:inline-flex h-9 items-center gap-1 rounded-lg border border-[#F5A524]/40 bg-[#F5A524]/10 px-2.5 font-mono text-[11px] font-semibold text-[#A5620A] dark:text-[#F5A524] hover:bg-[#F5A524]/15 transition-colors cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>18+</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#F5A524]" strokeWidth={1.5} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Hesabdan çıx"
              title={`${user.displayName || user.email} — Çıxış`}
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-3 text-xs font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#2BD576]/50 transition-colors cursor-pointer"
            >
              <span className="max-w-[78px] truncate">{user.displayName?.split(' ')[0] || 'Hesab'}</span>
              <LogOut className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-3 text-xs font-semibold text-white dark:text-[#08140D] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Daxil ol</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Menyunu bağla' : 'Menyunu aç'}
            aria-expanded={mobileOpen}
            className="inline-flex xl:hidden h-10 w-10 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#111827] dark:text-[#F3F6FA] cursor-pointer"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            aria-label="Mobil naviqasiya"
            className="xl:hidden overflow-hidden border-t border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#0B0F14]"
          >
            <div className="grid grid-cols-2 gap-2 px-4 py-3">
              {PRIMARY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#168A4A]/50 dark:border-[#2BD576]/45 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                      : 'border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#121821] text-[#111827] dark:text-[#F3F6FA]'
                  }`}
                >
                  {tab.label[lang]}
                  {tab.id === 'coupons' && customCouponCount > 0 ? ` (${customCouponCount})` : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSelect('ai-chat')}
                className="min-h-[44px] rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#121821] px-3 py-2 text-left text-xs font-semibold text-[#111827] dark:text-[#F3F6FA]"
              >
                AI Analitik Çat
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenResponsible();
                }}
                className="min-h-[44px] rounded-lg border border-[#F5A524]/35 bg-[#F5A524]/10 px-3 py-2 text-left text-xs font-semibold text-[#A5620A] dark:text-[#F5A524]"
              >
                18+ Məsuliyyətli Oyun
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onSignIn();
                  }}
                  className="col-span-2 min-h-[44px] rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-3 py-2 text-center text-xs font-semibold text-white dark:text-[#08140D]"
                >
                  Google ilə Daxil Ol
                </button>
              )}
              <div className="col-span-2">
                <PWAInstallButton
                  installLabel="ARENA AZ Tətbiqini Quraşdır"
                  iosTitle="iPhone / iPad-ə Quraşdır"
                  iosStep1="Safari alt panelində Paylaş (Share) düyməsinə toxunun."
                  iosStep2="Aşağı sürüşdürüb 'Ana Ekrana Əlavə Et' seçimini seçin."
                  closeLabel="Bağla"
                />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
