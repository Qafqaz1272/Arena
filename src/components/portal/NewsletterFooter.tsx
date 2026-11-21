import React, { useState } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';
import { validateNewsletterEmail } from '../../utils/portalLogic';

interface NewsletterFooterProps {
  customCursorEnabled: boolean;
  onToggleCursor: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenMatchCenter: () => void;
}

export const NewsletterFooter: React.FC<NewsletterFooterProps> = ({
  onNavigateSection,
  onOpenMatchCenter,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateNewsletterEmail(email);
    if (!result.valid) {
      setError(result.error ?? 'E-poçt ünvanını yoxlayın.');
      return;
    }
    setError(null);
    setSubscribedEmail(email.trim());
    setEmail('');
  };

  return (
    <footer className="mt-8 border-t border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Flat Editorial Newsletter Strip (Zero blobs, zero gradients) */}
        <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#121821] p-6 sm:p-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-2">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                GÜNDƏLİK MATÇ BÜLLETENİ
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-none text-[#111827] dark:text-[#F3F6FA]">
                Günün TOP 10 seçimi poçtunuzda
              </h2>
              <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                Başlama fitindən əvvəl təsdiqlənmiş start heyətləri, xG fərqi və yüksək ehtimallı
                seçimlər gündəlik xülasədə.
              </p>
            </div>

            <div className="lg:col-span-6">
              {subscribedEmail ? (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-lg border border-[#2BD576]/40 bg-[#2BD576]/10 p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#168A4A] dark:text-[#2BD576]"
                    strokeWidth={1.5}
                  />
                  <div>
                    <div className="font-semibold text-sm text-[#111827] dark:text-[#F3F6FA]">
                      Abunəliyiniz qeydə alındı
                    </div>
                    <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-mono text-[#168A4A] dark:text-[#2BD576]">
                        {subscribedEmail}
                      </span>{' '}
                      ünvanına gündəlik analitik icmal göndəriləcək.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-2">
                  <label htmlFor="newsletter-email" className="sr-only">
                    E-poçt ünvanınız
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="E-poçt ünvanınız (məs: analitik@arena.az)"
                      className="h-11 flex-1 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#0B0F14] px-3.5 text-sm text-[#111827] dark:text-[#F3F6FA] placeholder:text-[#64748B] focus:border-[#2BD576] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#168A4A] dark:bg-[#2BD576] px-5 text-sm font-semibold text-white dark:text-[#08140D] hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
                    >
                      <span>Abunə ol</span>
                      <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  {error && (
                    <p role="alert" className="text-xs font-medium text-[#DC3B40] dark:text-[#E5484D]">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-[#DCE2EA] dark:border-[#1E2733] pt-8 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
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
            </div>
            <p className="max-w-sm text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              Azərbaycan və dünya futbolu üçün canlı hesablar, Dixon-Coles ehtimal modelləri və
              taktiki matç analitikası.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
              Bölmələr
            </h3>
            <ul className="space-y-2 text-sm text-[#475569] dark:text-[#94A3B8]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('oyunlar')}
                  className="hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
                >
                  Oyunlar və Top Təkliflər
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('cedvel')}
                  className="hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
                >
                  Turnir Cədvəlləri
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('xeberler')}
                  className="hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
                >
                  Futbol Xəbərləri
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenMatchCenter}
                  className="hover:text-[#111827] dark:hover:text-[#F3F6FA] cursor-pointer"
                >
                  Matç Mərkəzi
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
              Kanallar
            </h3>
            <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
              Canlı qol bildirişləri və oyunöncəsi hesabatlar üçün rəsmi səhifələrimiz.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { name: 'Telegram', href: 'https://telegram.org' },
                { name: 'Instagram', href: 'https://instagram.com' },
                { name: 'YouTube', href: 'https://youtube.com' },
                { name: 'X', href: 'https://x.com' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#121821] px-3 py-1.5 text-xs font-medium text-[#111827] dark:text-[#F3F6FA] hover:border-[#94A3B8] dark:hover:border-[#334155] transition-colors"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[#DCE2EA] dark:border-[#1E2733] pt-5 font-mono text-[11px] text-[#64748B] sm:flex-row">
          <span>© 2026 ARENA AZ</span>
          <span>ESPN Live Feed · The Odds API · Dixon-Coles Mühərriki</span>
        </div>
      </div>
    </footer>
  );
};
