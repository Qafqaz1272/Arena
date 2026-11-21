import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, Plus, Target, TrendingDown } from 'lucide-react';
import type { PlatformMatch } from '../../types/platform';
import {
  MANDATORY_DISCLAIMER_AZ,
  type CouponLeg,
} from '../../utils/bettingInsightsEngine';
import { ClubLogo } from './ClubLogo';
import { TickProbabilityBar } from '../editorial/SportsViz';

interface ValueBetsHubViewProps {
  matches: PlatformMatch[];
  customCouponLegIds: Set<string>;
  onAddCouponLeg: (leg: CouponLeg) => void;
  onSelectMatch: (matchId: string) => void;
}

export const ValueBetsHubView: React.FC<ValueBetsHubViewProps> = ({
  matches,
  customCouponLegIds,
  onAddCouponLeg,
  onSelectMatch,
}) => {
  const [onlyValue, setOnlyValue] = useState<boolean>(true);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');

  const realOddsMatches = useMemo(
    () => matches.filter((m) => m.status !== 'FINISHED' && m.hasRealOdds && m.valueBets.length > 0),
    [matches]
  );

  const availableLeagues = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of realOddsMatches) {
      map.set(m.leagueId, m.leagueShort);
    }
    return Array.from(map.entries()).slice(0, 6);
  }, [realOddsMatches]);

  const valueList = useMemo(() => {
    const items = realOddsMatches.flatMap((m) =>
      m.valueBets
        .filter((vb) => (onlyValue ? vb.isValueBet : true))
        .map((vb) => ({ match: m, vb }))
    );
    return items
      .filter((x) => leagueFilter === 'all' || x.match.leagueId === leagueFilter)
      .sort((a, b) => b.vb.edgePct - a.vb.edgePct);
  }, [realOddsMatches, onlyValue, leagueFilter]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            DİXON-COLES SKANERİ · MODEL VS BUKMEKER (+5% FƏRQ)
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#111827] dark:text-[#F3F6FA]">
            Dəyərli Bazarlar (Value Bets)
          </h1>
          <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
            The Odds API-dən gələn real bukmeker əmsalları ilə model ehtimalı müqayisə olunur (
            <span className="font-mono tabular-nums">{realOddsMatches.length}</span> real əmsallı
            oyun skan edilib).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOnlyValue((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              onlyValue
                ? 'border-[#168A4A]/50 dark:border-[#2BD576]/45 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8]'
            }`}
          >
            {onlyValue ? 'Yalnız Value (+5%)' : 'Bütün Real Bazarlar'}
          </button>

          <button
            type="button"
            onClick={() => setLeagueFilter('all')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              leagueFilter === 'all'
                ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8]'
            }`}
          >
            Hamısı
          </button>

          {availableLeagues.map(([lid, label]) => (
            <button
              key={lid}
              type="button"
              onClick={() => setLeagueFilter(lid)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                leagueFilter === lid
                  ? 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                  : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Ranked Value Bets Table */}
      {valueList.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] divide-y divide-[#DCE2EA] dark:divide-[#1E2733]">
          {valueList.slice(0, 20).map(({ match, vb }) => {
            const leg: CouponLeg = {
              id: `${match.id}__${vb.market}__${vb.selection}`,
              matchId: match.id,
              matchLabel: `${match.homeTeamName} – ${match.awayTeamName}`,
              league: match.leagueShort,
              market: vb.market,
              selection: vb.selection,
              odds: vb.bookmakerOdds,
              modelProb: vb.modelProb,
              impliedProb: vb.impliedProb,
              edgePct: vb.edgePct,
              confidence: vb.confidence,
            };
            const added = customCouponLegIds.has(leg.id);

            return (
              <div
                key={leg.id}
                className="grid grid-cols-1 lg:grid-cols-[1fr_260px_auto] items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] dark:hover:bg-[#171F2B] transition-colors"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#64748B] tabular-nums">
                    <span className="rounded-[4px] border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-1.5 py-0.5 text-[10px] font-semibold">
                      {match.leagueShort}
                    </span>
                    <span>
                      {match.dateIso} · {match.time}
                    </span>
                    {vb.isValueBet && (
                      <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#2BD576]/40 bg-[#2BD576]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#147A42] dark:text-[#2BD576]">
                        <Target className="h-3 w-3" strokeWidth={1.5} /> +{vb.edgePct}% fərq
                      </span>
                    )}
                    {match.hasSharpDrop && (
                      <span className="inline-flex items-center gap-0.5 rounded-[4px] border border-[#F5A524]/40 bg-[#F5A524]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#A5620A] dark:text-[#F5A524]">
                        <TrendingDown className="h-3 w-3" strokeWidth={1.5} /> Eniş
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="flex items-center gap-2.5 text-left cursor-pointer group"
                  >
                    <ClubLogo
                      logoUrl={match.homeLogo}
                      shortCode={match.homeShort}
                      name={match.homeTeamName}
                      size="xs"
                    />
                    <span className="truncate font-display text-xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA] group-hover:text-[#168A4A] dark:group-hover:text-[#2BD576] transition-colors">
                      {match.homeTeamName} – {match.awayTeamName}
                    </span>
                  </button>

                  {match.prediction.top3FactorsAz[0] && (
                    <p className="truncate text-xs text-[#64748B] dark:text-[#8A97A8]">
                      {match.prediction.top3FactorsAz[0]}
                    </p>
                  )}
                </div>

                {/* Probability vs Implied Comparison */}
                <div className="space-y-1.5 border-t lg:border-t-0 lg:border-l border-[#DCE2EA] dark:border-[#1E2733] pt-3 lg:pt-0 lg:pl-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block font-mono text-[10px] text-[#64748B]">
                        {vb.market} · {match.oddsProvider || 'Real Bazar'}
                      </span>
                      <span className="truncate text-sm font-bold text-[#111827] dark:text-[#F3F6FA]">
                        {vb.selection}
                      </span>
                    </div>
                    <span className="font-score text-3xl font-bold leading-none text-[#168A4A] dark:text-[#2BD576] tabular-nums shrink-0">
                      {vb.bookmakerOdds.toFixed(2)}
                    </span>
                  </div>

                  <TickProbabilityBar value={vb.modelProb} tone="accent" animate={false} />

                  <div className="flex items-center justify-between font-mono text-[10px] text-[#64748B] tabular-nums">
                    <span>Model: {vb.modelProb}%</span>
                    <span>Bazar: {vb.impliedProb}%</span>
                    <span>EV: {vb.evPct >= 0 ? `+${vb.evPct}%` : `${vb.evPct}%`}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-[#64748B] tabular-nums">
                    Etibarlılıq: {vb.confidence} · xG {match.prediction.homeXg.toFixed(1)}–
                    {match.prediction.awayXg.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddCouponLeg(leg)}
                    className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      added
                        ? 'bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D]'
                        : 'border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] text-[#111827] dark:text-[#F3F6FA] hover:border-[#168A4A] dark:hover:border-[#2BD576]'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>Kuponda</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>Kupona əlavə et</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#263140] bg-white dark:bg-[#121821] p-10 text-center">
          <p className="font-display text-2xl font-bold uppercase text-[#111827] dark:text-[#F3F6FA]">
            Hazırda +5% üstü real Value Bet tapılmadı
          </p>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#8A97A8]">
            Yuxarıda &quot;Bütün Real Bazarlar&quot; rejiminə keçərək bütün canlı əmsal
            müqayisələrinə baxa bilərsiniz.
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 rounded-lg border border-[#F5A524]/35 bg-[#F5A524]/10 px-4 py-3 text-xs text-[#334155] dark:text-[#CBD5E1]">
        <AlertTriangle className="h-4 w-4 shrink-0 text-[#F5A524]" strokeWidth={1.5} />
        <span>{MANDATORY_DISCLAIMER_AZ}</span>
      </div>
    </section>
  );
};
