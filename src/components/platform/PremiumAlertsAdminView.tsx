import React, { useState } from 'react';
import {
  Bell,
  Check,
  Crown,
  Mail,
  RefreshCw,
  Send,
  Shield,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import type { AlertPreferences } from '../../services/firestorePlatform';
import type {
  PlatformFeatureFlag,
  PlatformTransparencyPayload,
} from '../../types/platform';
import { MANDATORY_DISCLAIMER_AZ } from '../../utils/bettingInsightsEngine';

/* ================= PREMIUM PLANS VIEW ================= */

interface PremiumPlansViewProps {
  currentPlan: 'free' | 'pro';
  onSelectPlan: (plan: 'free' | 'pro') => void;
}

export const PremiumPlansView: React.FC<PremiumPlansViewProps> = ({
  currentPlan,
  onSelectPlan,
}) => {
  const [checkoutToast, setCheckoutToast] = useState<string | null>(null);

  const handleActivatePro = () => {
    onSelectPlan('pro');
    setCheckoutToast('ARENA AZ Pro rejimi aktivləşdirildi.');
    window.setTimeout(() => setCheckoutToast(null), 4000);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-[#2BD576]">
          ŞƏFFAF ABUNƏLİK PLANLARI
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white">
          Pulsuz Başla, İstədikdə Pro-ya Keç
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Canlı matç mərkəzi, əsas Dixon-Coles proqnozları və ictimai arxiv hər kəs üçün pulsuzdur.
        </p>
      </div>

      {checkoutToast && (
        <div
          role="status"
          className="rounded-xl border border-[#2BD576]/50 bg-[#2BD576]/12 px-4 py-3 text-center text-sm font-semibold text-emerald-800 dark:text-[#2BD576]"
        >
          {checkoutToast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free Tier */}
        <div className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-6 flex flex-col justify-between">
          <div>
            <span className="inline-block rounded bg-slate-100 dark:bg-white/10 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
              PULSUZ PLAN
            </span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-score text-5xl text-slate-950 dark:text-white">0 AZN</span>
              <span className="text-xs text-slate-500">/ ay</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Bütün canlı oyunlar, gündəlik əsas proqnozlar və pulsuz Proqnoz Yarışı.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-200">
              {[
                'Bütün liqaların canlı Matç Mərkəzi və rəsmi start heyətləri',
                'Gündəlik AI Dixon-Coles proqnozları və xG analizi',
                'Günün kuponu və Təhlükəsiz kupon',
                'İctimai Şəffaflıq Arxivi və Brier kalibrasiyası',
                'Pulsuz Proqnoz Yarışı',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectPlan('free')}
            className={`mt-7 w-full rounded-xl py-3 text-sm font-bold cursor-pointer ${
              currentPlan === 'free'
                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-[#2BD576]'
                : 'border border-slate-300 dark:border-[#1E2733] text-slate-700 dark:text-slate-200'
            }`}
          >
            {currentPlan === 'free' ? 'Cari Planınız' : 'Pulsuz Plana Qayıt'}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="relative rounded-2xl border-2 border-[#2BD576] bg-gradient-to-b from-[#0C192E] to-[#0A1120] p-6 text-white shadow-[0_20px_60px_rgba(0,245,140,0.18)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded bg-[#2BD576] px-2.5 py-1 font-mono text-xs font-extrabold text-[#08140D]">
                <Crown className="h-3.5 w-3.5" /> ARENA PRO
              </span>
              <span className="font-mono text-xs text-[#2BD576]">ƏN POPULYAR</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-score text-5xl text-white">19 AZN</span>
              <span className="text-xs text-slate-400">/ ay · Stripe / MilliÖN / Kart</span>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Peşəkar analitiklər üçün limitsiz Value Bet skaneri, canlı əmsal siqnalları və AI
              kupon auditi.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
              {[
                'Limitsiz real Value Bet (+5% fərq) skaneri',
                'Real vaxt əmsal düşüşü siqnalları (Telegram + Push)',
                'Limitsiz AI Analitik söhbəti və fərdi kupon auditi',
                'Dəyərli kupon + Risk kuponu + Fraksional Kelli sinxronizasiyası',
                'Təsdiqlənmiş start heyəti və dərin bazar hesabatları',
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-[#2BD576]" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleActivatePro}
            className="mt-7 w-full rounded-xl bg-[#2BD576] py-3 text-sm font-extrabold text-[#08140D] hover:bg-[#24be68] transition-colors cursor-pointer"
          >
            {currentPlan === 'pro' ? 'ARENA Pro Aktivdir' : 'Pro Planı Aktivləşdir'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        {MANDATORY_DISCLAIMER_AZ} Abunəlik yalnız analitika alətlərinə giriş üçündür; mərc qəbul
        edilmir.
      </p>
    </section>
  );
};

/* ================= ALERTS CENTER DRAWER ================= */

interface AlertsDrawerProps {
  open: boolean;
  onClose: () => void;
  prefs: AlertPreferences;
  onChangePrefs: (next: AlertPreferences) => void;
  onSendTestAlert: () => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  open,
  onClose,
  prefs,
  onChangePrefs,
  onSendTestAlert,
}) => {
  if (!open) return null;

  const toggle = (key: keyof AlertPreferences) => {
    onChangePrefs({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-drawer-title"
      className="fixed inset-0 z-[90] flex justify-end bg-slate-950/65 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-slate-900 dark:text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#DCE2EA] dark:border-[#1E2733] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-[#2BD576]" />
            <h2 id="alerts-drawer-title" className="font-display text-2xl font-extrabold">
              Bildiriş Mərkəzi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bildiriş mərkəzini bağla"
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Çatdırılma Kanalları
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                { key: 'push' as const, label: 'Brauzer Push Bildirişləri', icon: Bell },
                { key: 'telegram' as const, label: 'Telegram Bot Bildirişləri', icon: Send },
                { key: 'email' as const, label: 'E-poçt Gündəlik Xülasəsi', icon: Mail },
              ].map((ch) => {
                const Icon = ch.icon;
                return (
                  <label
                    key={ch.key}
                    className="flex items-center justify-between rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3.5 py-3 text-sm cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 font-medium">
                      <Icon className="h-4 w-4 text-sky-500" />
                      {ch.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs[ch.key]}
                      onChange={() => toggle(ch.key)}
                      className="h-4 w-4 accent-[#2BD576]"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Siqnal Növləri
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                {
                  key: 'lineupConfirmed' as const,
                  label: 'Rəsmi start heyəti təsdiqlənəndə',
                  desc: 'Oyundan ~60 dəqiqə əvvəl heyət xəbəri',
                },
                {
                  key: 'valueBetFound' as const,
                  label: 'Yeni real Value Bet (+5% fərq) tapılanda',
                  desc: 'Real bukmeker əmsalında model üstünlüyü aşkarlandıqda',
                },
                {
                  key: 'followedGoal' as const,
                  label: 'İzlənilən oyunda qol və ya qırmızı vərəqə',
                  desc: 'Favorit komanda və liqalar üçün canlı bildiriş',
                },
              ].map((ev) => (
                <label
                  key={ev.key}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3.5 py-3 cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-semibold">{ev.label}</div>
                    <div className="text-xs text-slate-500">{ev.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[ev.key]}
                    onChange={() => toggle(ev.key)}
                    className="mt-1 h-4 w-4 accent-[#2BD576]"
                  />
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onSendTestAlert}
            className="w-full rounded-xl bg-[#2BD576] py-3 text-xs font-extrabold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
          >
            Canlı Real Siqnalı Yoxla
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= ADMIN PANEL VIEW ================= */

interface AdminPanelViewProps {
  isAuthenticatedAdmin: boolean;
  userEmail?: string | null;
  featureFlags: PlatformFeatureFlag[];
  onToggleFeatureFlag: (key: string) => void;
  transparency: PlatformTransparencyPayload | null;
  totalLiveMatches: number;
  oddsMatchCount: number;
  onForceRefreshAll: () => void;
  refreshing: boolean;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  isAuthenticatedAdmin,
  userEmail,
  featureFlags,
  onToggleFeatureFlag,
  transparency,
  totalLiveMatches,
  oddsMatchCount,
  onForceRefreshAll,
  refreshing,
}) => {
  const m = transparency?.metrics;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F5A524]">
            ADMİN İDARƏETMƏ PANELİ · CANLI SİSTEM MONİTORİNQİ
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white">
            Model Performansı, Canlı Keş və Feature Flags
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Firestore yazma icazələri server qaydaları ilə yalnız təsdiqlənmiş adminlərə
            məhdudlaşdırılıb.
            {userEmail ? ` Cari hesab: ${userEmail}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onForceRefreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2BD576] px-3.5 py-2 text-xs font-extrabold text-[#08140D] hover:bg-[#24be68] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Canlı API Keşini Yenilə</span>
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-[#2BD576]">
            <Shield className="h-4 w-4" />
            <span>{isAuthenticatedAdmin ? 'Təsdiqlənmiş Admin' : 'Yalnız Oxuma'}</span>
          </span>
        </div>
      </div>

      {/* Real Model Health Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4">
          <div className="text-xs text-slate-500">Real Brier Balı</div>
          <div className="font-score text-3xl text-sky-500">
            {m ? m.brierScore.toFixed(3) : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4">
          <div className="text-xs text-slate-500">Real Hit Rate</div>
          <div className="font-score text-3xl text-[#2BD576]">
            {m ? `${m.hitRatePct}%` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4">
          <div className="text-xs text-slate-500">Aktiv Real Matçlar</div>
          <div className="font-score text-3xl text-slate-950 dark:text-white">
            {totalLiveMatches}
          </div>
        </div>
        <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4">
          <div className="text-xs text-slate-500">Real Əmsallı Matçlar</div>
          <div className="font-score text-3xl text-emerald-500">{oddsMatchCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Feature Flags */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#2BD576]">
            <Sliders className="h-4 w-4" />
            <span>FEATURE FLAGS (CANLI İDARƏETMƏ)</span>
          </div>
          <div className="space-y-2.5">
            {featureFlags.map((flag) => (
              <label
                key={flag.key}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3.5 cursor-pointer"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {flag.labelAz}
                  </div>
                  <div className="text-xs text-slate-500">{flag.descriptionAz}</div>
                </div>
                <input
                  type="checkbox"
                  checked={flag.enabled}
                  onChange={() => onToggleFeatureFlag(flag.key)}
                  className="mt-1 h-4 w-4 accent-[#2BD576]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Recent Real Settled Audit Records */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-5 space-y-4">
          <h2 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
            Son Yoxlanılmış Real ESPN Matçları
          </h2>
          <p className="text-xs text-slate-500">
            Mənbə: {transparency?.sourceLabel || 'ESPN Live'} · Ümumi yoxlanılan:{' '}
            {m?.totalSettled ?? 0} oyun
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(transparency?.archive ?? []).slice(0, 12).map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{p.matchLabel}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {p.date} · {p.selection} · Model {p.modelProb}% · Hesab {p.actualOutcome}
                  </div>
                </div>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    p.status === 'WON'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-[#2BD576]'
                      : 'bg-rose-500/20 text-rose-500'
                  }`}
                >
                  {p.status === 'WON' ? 'QAZANDI' : 'UDUZDU'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
