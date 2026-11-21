import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { MANDATORY_DISCLAIMER_AZ } from '../../utils/bettingInsightsEngine';

const AGE_GATE_KEY = 'arena_az_age_verified_18_v1';

interface AgeGateModalProps {
  onOpenResponsibleModal: () => void;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({ onOpenResponsibleModal }) => {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    try {
      return window.localStorage.getItem(AGE_GATE_KEY) !== 'confirmed';
    } catch {
      return true;
    }
  });
  const [rejected, setRejected] = useState(false);

  const handleConfirm = () => {
    try {
      window.localStorage.setItem(AGE_GATE_KEY, 'confirmed');
    } catch {
      // ignore storage failure
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F14]/85 p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#1E2733] bg-[#121821] p-6 sm:p-7 text-[#F3F6FA]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F5A524]/12 border border-[#F5A524]/35 font-display text-2xl font-bold text-[#F5A524]">
            18+
          </span>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2BD576]">
              MƏSULİYYƏTLİ İSTİFADƏ · YAŞ TƏSDİQİ
            </p>
            <h2 id="age-gate-title" className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#F3F6FA]">
              ARENA AZ · Matç Analitikası
            </h2>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-[#94A3B8] leading-relaxed">
          <p>
            Bu platforma yalnız futbol statistikası, Dixon-Coles ehtimal modelləri və məlumat
            xarakterli təhlil təqdim edir. <strong className="text-[#F3F6FA]">Sayt mərc qəbul etmir</strong>{' '}
            və ödəniş əməliyyatı aparmır.
          </p>
          <div className="rounded-lg border border-[#F5A524]/35 bg-[#F5A524]/10 p-3.5 text-xs text-[#CBD5E1] flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#F5A524]" strokeWidth={1.5} />
            <span>
              <strong className="text-[#F3F6FA]">{MANDATORY_DISCLAIMER_AZ}</strong> Həmişə şəxsi
              büdcə limiti müəyyən edin.
            </span>
          </div>
        </div>

        {rejected ? (
          <div className="mt-4 rounded-lg border border-[#E5484D]/40 bg-[#E5484D]/10 p-3.5 text-xs text-[#FCA5A5]">
            18 yaşdan aşağı istifadəçilər üçün giriş məhdudlaşdırılıb.
          </div>
        ) : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#2BD576] px-5 py-2.5 text-sm font-semibold text-[#08140D] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
            <span>18+ yaşım var — Davam et</span>
          </button>
          <button
            type="button"
            onClick={() => setRejected(true)}
            className="min-h-[44px] rounded-lg border border-[#1E2733] bg-[#0B0F14] px-4 py-2.5 text-sm font-medium text-[#94A3B8] hover:text-[#F3F6FA] transition-colors cursor-pointer"
          >
            18 yaşım yoxdur
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            handleConfirm();
            onOpenResponsibleModal();
          }}
          className="mt-4 w-full text-center text-xs text-[#8A97A8] hover:text-[#2BD576] underline underline-offset-4 cursor-pointer"
        >
          Məsuliyyətli oyun qaydaları və yardım resursları
        </button>
      </div>
    </div>
  );
};

interface ResponsibleGamblingModalProps {
  open: boolean;
  onClose: () => void;
}

export const ResponsibleGamblingModal: React.FC<ResponsibleGamblingModalProps> = ({
  open,
  onClose,
}) => {
  const [dailyLimitAzn, setDailyLimitAzn] = useState<number>(() => {
    try {
      const saved = Number(window.localStorage.getItem('arena_az_daily_limit_azn'));
      return Number.isFinite(saved) && saved > 0 ? saved : 50;
    } catch {
      return 50;
    }
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveLimit = () => {
    try {
      window.localStorage.setItem('arena_az_daily_limit_azn', String(dailyLimitAzn));
    } catch {
      // ignore
    }
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rg-modal-title"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0B0F14]/80 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-6 sm:p-7 text-[#111827] dark:text-[#F3F6FA]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#F5A524]/35 bg-[#F5A524]/12 text-[#A5620A] dark:text-[#F5A524]">
              <ShieldAlert className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
                HÜQUQİ XƏBƏRDARLIQ · 18+
              </p>
              <h2 id="rg-modal-title" className="font-display text-2xl sm:text-3xl font-bold uppercase">
                Məsuliyyətli Oyun və Şəffaflıq Prinsipləri
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
          <div className="rounded-lg border border-[#F5A524]/40 bg-[#F5A524]/10 p-4 text-xs sm:text-sm text-[#111827] dark:text-[#F3F6FA]">
            <strong>Məcburi bildiriş:</strong> {MANDATORY_DISCLAIMER_AZ} ARENA AZ yalnız statistik
            təhlil, xG modelləşdirməsi və məlumat xidməti göstərir; saytda heç bir mərc qəbul edilmir
            və maliyyə əməliyyatı aparılmır.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-4">
              <h3 className="font-semibold text-[#111827] dark:text-[#F3F6FA]">Şəxsi Limitlər</h3>
              <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                Yalnız itirməyi gözə ala biləcəyiniz məbləğlə hərəkət edin. Zərəri geri qaytarmaq üçün
                məbləği artırmayın.
              </p>
            </div>
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-4">
              <h3 className="font-semibold text-[#111827] dark:text-[#F3F6FA]">Özünü Məhdudlaşdırma</h3>
              <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                Nəzarəti itirdiyinizi hiss edirsinizsə, dərhal fasilə verin və rəsmi hesabınızda
                özünü-məhdudlaşdırma (self-exclusion) rejimini aktivləşdirin.
              </p>
            </div>
          </div>

          {/* Personal Daily Loss Reminder Control */}
          <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-4">
            <label
              htmlFor="rg-daily-limit"
              className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]"
            >
              Gündəlik Zərər Limiti Xatırladıcısı (AZN)
            </label>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <input
                id="rg-daily-limit"
                type="number"
                min={5}
                max={5000}
                value={dailyLimitAzn}
                onChange={(e) => setDailyLimitAzn(Math.max(5, Number(e.target.value) || 5))}
                className="w-36 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-3 py-2 font-mono text-sm font-semibold tabular-nums text-[#111827] dark:text-[#F3F6FA] focus:border-[#2BD576] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveLimit}
                className="min-h-[38px] rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-4 py-2 text-xs font-semibold text-white dark:text-[#08140D] hover:opacity-90 cursor-pointer"
              >
                Limiti Yadda Saxla
              </button>
              {savedNotice && (
                <span className="font-mono text-xs font-semibold text-[#168A4A] dark:text-[#2BD576] tabular-nums">
                  Limit saxlandı ({dailyLimitAzn} AZN)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-[#111827] dark:text-[#F3F6FA]">
              Pulsuz Dəstək və Yardım Resursları
            </h3>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.begambleaware.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576] transition-colors"
              >
                <span>BeGambleAware</span>
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
              <a
                href="https://www.gamblingtherapy.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576] transition-colors"
              >
                <span>Gambling Therapy (Beynəlxalq Dəstək)</span>
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
              <a
                href="https://www.gamblersanonymous.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576] transition-colors"
              >
                <span>Gamblers Anonymous</span>
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
