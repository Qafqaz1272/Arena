import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calculator,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { MANDATORY_DISCLAIMER_AZ } from '../../utils/bettingInsightsEngine';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const FACTORS = [
  {
    icon: Calculator,
    title: 'Poisson & Dixon-Coles Qol Matrisi',
    desc: 'Hər iki komandanın gözlənilən qol (xG) göstəriciləri əsasında 0:0-dan 7:7-yə qədər bütün hesab ehtimalları hesablanır. Aşağı hesablı nəticələr (0:0, 1:0, 0:1, 1:1) üçün Dixon-Coles korrelyasiya düzəlişi tətbiq edilir.',
  },
  {
    icon: BarChart3,
    title: 'Elo Reytinqi + Son 5 Oyun Forması',
    desc: 'Komandaların ümumi gücü cədvəl xalı, qol fərqi və son 5 oyunun nəticələri (Q/H/M) ilə birləşdirilərək ev/səfər üstünlüyü ayrıca çəkiləndirilir.',
  },
  {
    icon: Activity,
    title: 'H2H, İstirahət Günləri və İtkilər',
    desc: 'Şəxsi qarşılaşma balansı, zədəli/cəzalı oyunçular, sıx təqvim və turnir motivasiyası ehtimal matrisinə birbaşa daxil edilir.',
  },
  {
    icon: Scale,
    title: 'Riyazi Uyğunluq və 95% Yuxarı Hədd',
    desc: '1X2 ehtimalları həmişə tam 100%-ə bərabər normallaşdırılır. Futbolda gözlənilməz ssenarilər qaçılmaz olduğu üçün heç bir bazar ehtimalı 95%-dən yuxarı göstərilmir.',
  },
];

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0B0F14]/75"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-6 text-[#111827] dark:text-[#F3F6FA]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#DCE2EA] dark:border-[#1E2733] pb-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
                  STATİSTİK METODOLOGİYA
                </p>
                <h2
                  id="how-it-works-title"
                  className="mt-1 font-display text-2xl sm:text-3xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]"
                >
                  Ehtimallar necə hesablanır?
                </h2>
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

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FACTORS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-4"
                  >
                    <div className="flex items-center gap-2 text-[#168A4A] dark:text-[#2BD576]">
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-4">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#F3F6FA]">
                <ShieldCheck className="h-4 w-4 text-[#168A4A] dark:text-[#2BD576]" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold">
                  Ehtimal (%) ilə Model Etibarlılığı arasındakı fərq
                </h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                <strong>Ehtimal (%)</strong> hadisənin riyazi başvermə şansını göstərir.{' '}
                <strong>Etibarlılıq</strong> (Yüksək / Orta / Aşağı) isə əldəki göstəricilərin
                sabitliyini ölçür. Yüksək ehtimallı seçim belə derbi və ya heyət itkiləri səbəbilə
                “Orta” etibarlılıq ala bilər.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px]">
                <span className="rounded-full border border-[#2BD576]/35 bg-[#2BD576]/10 px-2.5 py-0.5 font-semibold text-[#147A42] dark:text-[#2BD576]">
                  Yüksək · Yaşıl
                </span>
                <span className="rounded-full border border-[#F5A524]/35 bg-[#F5A524]/10 px-2.5 py-0.5 font-semibold text-[#A5620A] dark:text-[#F5A524]">
                  Orta · Kəhrəba
                </span>
                <span className="rounded-full border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-2.5 py-0.5 font-semibold text-[#64748B]">
                  Aşağı · Neytral
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#F5A524]/35 bg-[#F5A524]/10 p-3.5 text-xs text-[#334155] dark:text-[#CBD5E1]">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#F5A524]" strokeWidth={1.5} />
              <p>
                <strong>{MANDATORY_DISCLAIMER_AZ}</strong> Sayt mərc qəbul etmir və ödəniş
                əməliyyatı aparmır.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
