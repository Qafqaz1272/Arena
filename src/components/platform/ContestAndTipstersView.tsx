import React, { useMemo, useState } from 'react';
import { CheckCircle2, LogIn, ShieldCheck, Trophy } from 'lucide-react';
import type { PlatformMatch, PlatformTransparencyPayload } from '../../types/platform';
import {
  MANDATORY_DISCLAIMER_AZ,
  scoreContestPrediction,
} from '../../utils/bettingInsightsEngine';
import type { PersistedContestEntry } from '../../services/firestorePlatform';
import { ClubLogo } from './ClubLogo';

interface ContestViewProps {
  matches: PlatformMatch[];
  userDisplayName: string;
  isSignedIn: boolean;
  onSignIn: () => void;
  entries: Record<string, PersistedContestEntry>;
  onSavePrediction: (matchId: string, homeScore: number, awayScore: number) => void;
}

export const PredictionContestView: React.FC<ContestViewProps> = ({
  matches,
  userDisplayName,
  isSignedIn,
  onSignIn,
  entries,
  onSavePrediction,
}) => {
  const contestMatches = useMemo(
    () => matches.filter((m) => m.status === 'UPCOMING' || m.status === 'LIVE').slice(0, 12),
    [matches]
  );

  const [drafts, setDrafts] = useState<Record<string, { h: number; a: number }>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const userScorecard = useMemo(() => {
    let totalPoints = 0;
    let exactHits = 0;
    let goalDiffHits = 0;
    let outcomeHits = 0;
    let settledCount = 0;
    const list = Object.values(entries);

    for (const entry of list) {
      const m = matches.find((x) => x.id === entry.matchId);
      if (m && m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null) {
        settledCount += 1;
        const pts = scoreContestPrediction(
          entry.homeScore,
          entry.awayScore,
          m.homeScore,
          m.awayScore
        );
        totalPoints += pts;
        if (pts === 5) exactHits += 1;
        else if (pts === 3) goalDiffHits += 1;
        else if (pts === 1) outcomeHits += 1;
      }
    }

    return {
      totalPoints,
      exactHits,
      goalDiffHits,
      outcomeHits,
      settledCount,
      totalPredictions: list.length,
    };
  }, [entries, matches]);

  const handleSubmitScore = (matchId: string) => {
    const cur = drafts[matchId] ?? {
      h: entries[matchId]?.homeScore ?? 1,
      a: entries[matchId]?.awayScore ?? 1,
    };
    onSavePrediction(matchId, cur.h, cur.a);
    setSavedId(matchId);
    window.setTimeout(() => setSavedId(null), 2200);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-[#2BD576]">
            PULSUZ FANTASY PROQNOZ YARIŞI · REAL MATÇLAR
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white">
            Real Oyunların Hesabını Təxmin Et
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tamamilə pulsuz: Dəqiq hesab <strong>+5 xal</strong> · Düzgün top fərqi{' '}
            <strong>+3 xal</strong> · Düzgün nəticə (1X2) <strong>+1 xal</strong>. Xallar yalnız
            oyun real olaraq bitdikdən sonra hesablanır.
          </p>
        </div>

        {!isSignedIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2BD576] px-4 py-2.5 text-xs font-extrabold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Təxminləri buludda saxlamaq üçün daxil ol</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Real Upcoming Matches Prediction Cards */}
        <div className="lg:col-span-7 space-y-3">
          {contestMatches.length > 0 ? (
            contestMatches.map((m) => {
              const existing = entries[m.id];
              const draft = drafts[m.id] ?? {
                h: existing?.homeScore ?? 1,
                a: existing?.awayScore ?? 1,
              };

              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {m.leagueShort} · {m.dateIso} {m.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                      <ClubLogo
                        logoUrl={m.homeLogo}
                        shortCode={m.homeShort}
                        name={m.homeTeamName}
                        size="xs"
                      />
                      <span className="truncate">{m.homeTeamName}</span>
                      <span className="text-slate-400">–</span>
                      <ClubLogo
                        logoUrl={m.awayLogo}
                        shortCode={m.awayShort}
                        name={m.awayTeamName}
                        size="xs"
                      />
                      <span className="truncate">{m.awayTeamName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dixon-Coles ən ehtimallı hesabı:{' '}
                      <strong className="font-mono text-emerald-600 dark:text-[#2BD576]">
                        {m.prediction.topScorelines[0]?.score}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      aria-label={`${m.homeTeamName} qol sayı`}
                      value={draft.h}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [m.id]: {
                            ...draft,
                            h: Math.max(0, Math.min(15, Number(e.target.value) || 0)),
                          },
                        }))
                      }
                      className="h-10 w-12 rounded-xl border border-slate-300 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] text-center font-score text-2xl text-slate-950 dark:text-white"
                    />
                    <span className="font-score text-xl text-slate-400">:</span>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      aria-label={`${m.awayTeamName} qol sayı`}
                      value={draft.a}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [m.id]: {
                            ...draft,
                            a: Math.max(0, Math.min(15, Number(e.target.value) || 0)),
                          },
                        }))
                      }
                      className="h-10 w-12 rounded-xl border border-slate-300 dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14] text-center font-score text-2xl text-slate-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmitScore(m.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#2BD576] px-3.5 py-2.5 text-xs font-bold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
                    >
                      {savedId === m.id || existing ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{savedId === m.id ? 'Saxlandı' : 'Yenilə'}</span>
                        </>
                      ) : (
                        <span>Təxmin et</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[#1E2733] p-8 text-center text-sm text-slate-500">
              Hazırda təxmin üçün aktiv gələcək oyun siyahısı yüklənir.
            </div>
          )}
        </div>

        {/* Real Personal Scorecard (Zero fake seeded leaderboard users!) */}
        <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 dark:border-[#2BD576]/25 bg-white dark:bg-[#121821] p-5 h-fit space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Trophy className="h-4 w-4" />
              <span>ŞƏXSİ REAL NƏTİCƏ KARTIN</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-950 dark:text-white">
              {userDisplayName}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Süni və ya saxta istifadəçi siyahısı göstərilmir — yalnız real təxminləriniz və bitmiş
              ESPN oyunlarından qazandığınız xallar hesablanır.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3.5">
              <div className="text-[11px] text-slate-500">Qazanılmış Xal</div>
              <div className="mt-1 font-score text-4xl text-emerald-600 dark:text-[#2BD576]">
                {userScorecard.totalPoints}
              </div>
            </div>
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3.5">
              <div className="text-[11px] text-slate-500">Ümumi Təxmin</div>
              <div className="mt-1 font-score text-4xl text-slate-950 dark:text-white">
                {userScorecard.totalPredictions}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="rounded-lg bg-slate-50 dark:bg-[#0B0F14]/70 p-2">
              <div className="font-bold text-slate-900 dark:text-white">
                {userScorecard.exactHits}
              </div>
              <div className="text-[10px] text-slate-500">Dəqiq (+5)</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-[#0B0F14]/70 p-2">
              <div className="font-bold text-slate-900 dark:text-white">
                {userScorecard.goalDiffHits}
              </div>
              <div className="text-[10px] text-slate-500">Top fərqi (+3)</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-[#0B0F14]/70 p-2">
              <div className="font-bold text-slate-900 dark:text-white">
                {userScorecard.outcomeHits}
              </div>
              <div className="text-[10px] text-slate-500">Nəticə (+1)</div>
            </div>
          </div>

          {userScorecard.totalPredictions === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#1E2733] p-4 text-center text-xs text-slate-500">
              Soldakı real oyunlar üçün ilk hesab təxmininizi daxil edin.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface TipstersViewProps {
  transparency: PlatformTransparencyPayload | null;
  isSignedIn: boolean;
  onSignIn: () => void;
  onOpenTransparency: () => void;
}

export const TipstersView: React.FC<TipstersViewProps> = ({
  transparency,
  isSignedIn,
  onSignIn,
  onOpenTransparency,
}) => {
  const m = transparency?.metrics;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-[#F5A524]">
          TƏSDİQLƏNMİŞ ANALİTİK REYTİNQLƏRİ
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white">
          Yalnız Real Arxivlə Təsdiqlənmiş Profillər
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Saxta və ya uydurma tipster profilləri platformadan tamamilə silinib. Burada yalnız rəsmi
          nəticələrlə yoxlanılan analitik performans göstərilir.
        </p>
      </div>

      {/* Verified Quantitative Engine Profile (100% Real Backtest) */}
      <div className="rounded-2xl border border-emerald-500/35 dark:border-[#2BD576]/30 bg-white dark:bg-[#121821] p-6 shadow-lg space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2BD576] to-[#0EA5E9] font-display text-xl font-extrabold text-[#08140D]">
              DC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                  ARENA Dixon-Coles Riyazi Modeli
                </h2>
                <ShieldCheck className="h-5 w-5 text-[#2BD576]" />
              </div>
              <p className="text-xs text-slate-500">
                Rəsmi Avtomatik Model · {transparency?.sourceLabel || 'ESPN Live Backtest'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTransparency}
            className="rounded-xl bg-[#2BD576] px-4 py-2 text-xs font-extrabold text-[#08140D] hover:bg-[#24be68] cursor-pointer"
          >
            Tam Arxivə Bax →
          </button>
        </div>

        {m ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center font-mono">
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
              <div className="text-[10px] text-slate-500">REAL DƏQİQLİK</div>
              <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-[#2BD576]">
                {m.hitRatePct}%
              </div>
            </div>
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
              <div className="text-[10px] text-slate-500">YÜKSƏK ETİBARLI</div>
              <div className="mt-1 text-lg font-bold text-sky-600 dark:text-[#F5A524]">
                {m.highConfidenceHitRatePct}%
              </div>
            </div>
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
              <div className="text-[10px] text-slate-500">BRİER BALI</div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {m.brierScore.toFixed(3)}
              </div>
            </div>
            <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-slate-50 dark:bg-[#0B0F14]/70 p-3">
              <div className="text-[10px] text-slate-500">YOXLANILMIŞ OYUN</div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {m.totalSettled}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Real model göstəriciləri yüklənir...</p>
        )}
      </div>

      {/* Community Verified Tipsters Onboarding */}
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[#1E2733] bg-white/60 dark:bg-[#121821]/60 p-8 text-center space-y-3">
        <h3 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
          İcma Analitikləri Bölməsi
        </h3>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Hazırda heç bir saxta tipster profili göstərilmir. İstifadəçilər Google hesabı ilə daxil
          olub Proqnoz Yarışında real oyunlar üzrə ardıcıl nəticə göstərdikcə təsdiqlənmiş icma
          analitiki statusu qazanırlar.
        </p>
        {!isSignedIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-[#0B0F14] px-4 py-2.5 text-xs font-extrabold cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Google ilə qoşul</span>
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        {MANDATORY_DISCLAIMER_AZ}
      </p>
    </section>
  );
};
