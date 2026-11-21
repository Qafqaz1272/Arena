import React from 'react';
import { Bell, BellOff, Bookmark, Trash2 } from 'lucide-react';
import type {
  Language,
  MatchWithPrediction,
  WatchlistAlertItem,
  WatchlistEntry,
} from '../types/football';
import type { TranslationDictionary } from '../i18n/translations';
import { formatSelectionLabel } from '../i18n/translations';
import { proTranslations } from '../i18n/proTranslations';
import { formatKickoffTime, formatPercent, formatShortDate } from '../utils/formatters';
import {
  ConfidenceIndicator,
  DisclaimerBanner,
  ProbabilityBar,
  TeamCrest,
} from '../components/AnalyticsPrimitives';

interface WatchlistPageProps {
  entries: WatchlistEntry[];
  matches: MatchWithPrediction[];
  lang: Language;
  t: TranslationDictionary;
  onSelectMatch: (matchId: string) => void;
  onRemove: (matchId: string) => void;
  onClearAll: () => void;
  onBrowseMatches: () => void;
  notifEnabled: boolean;
  onToggleNotifEnabled: (next: boolean) => void;
  browserPermission: NotificationPermission;
  browserSupported: boolean;
  onRequestBrowserPermission: () => void;
  alerts: WatchlistAlertItem[];
  onClearAlerts: () => void;
  onSendTestAlert: () => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  entries,
  matches,
  lang,
  t,
  onSelectMatch,
  onRemove,
  onClearAll,
  onBrowseMatches,
  notifEnabled,
  onToggleNotifEnabled,
  browserPermission,
  browserSupported,
  onRequestBrowserPermission,
  alerts,
  onClearAlerts,
  onSendTestAlert,
}) => {
  const pt = proTranslations[lang].watchlistAlerts;
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const resolved = entries
    .map((entry) => ({ entry, match: matchMap.get(entry.matchId) }))
    .filter(
      (item): item is { entry: WatchlistEntry; match: MatchWithPrediction } =>
        item.match !== undefined
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {t.watchlist.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.watchlist.subtitle}
          </p>
        </div>
        {resolved.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.watchlist.clearAll}</span>
          </button>
        )}
      </div>

      {/* Watchlist Notifications Settings & Feed */}
      <section
        aria-labelledby="watchlist-alerts-heading"
        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="watchlist-alerts-heading"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50"
            >
              {notifEnabled ? (
                <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <BellOff className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
              <span>{pt.title}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{pt.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={notifEnabled}
              onClick={() => onToggleNotifEnabled(!notifEnabled)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                notifEnabled
                  ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
              }`}
            >
              {pt.inAppLabel}: {notifEnabled ? 'ON' : 'OFF'}
            </button>

            {browserSupported ? (
              browserPermission === 'granted' ? (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {pt.browserGranted}
                </span>
              ) : browserPermission === 'denied' ? (
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  {pt.browserDenied}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onRequestBrowserPermission}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 whitespace-nowrap"
                >
                  {pt.enableBrowser}
                </button>
              )
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {pt.browserUnsupported}
              </span>
            )}

            <button
              type="button"
              onClick={onSendTestAlert}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {pt.testAlert}
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">{pt.recentAlerts}</span>
              <button
                type="button"
                onClick={onClearAlerts}
                className="text-xs hover:text-slate-900 dark:hover:text-slate-200"
              >
                {pt.clearHistory}
              </button>
            </div>
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/80">
              {alerts.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
                >
                  <span className="text-slate-800 dark:text-slate-200">
                    <strong className="font-semibold">{a.title}:</strong> {a.body}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {new Date(a.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {resolved.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <Bookmark
            className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.watchlist.emptyTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t.watchlist.emptyDesc}
          </p>
          <button
            type="button"
            onClick={onBrowseMatches}
            className="mt-5 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            {t.watchlist.browseMatches}
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {resolved.map(({ entry, match }) => (
            <article
              key={match.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate">
                    {match.leagueName} · {formatShortDate(match.dateKey, lang)},{' '}
                    {formatKickoffTime(match.kickoffIso, lang)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(match.id)}
                    aria-label={`${t.watchlist.remove} ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.watchlist.remove}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectMatch(match.id)}
                  className="mt-3 block w-full text-left group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest code={match.homeTeam.code} size="sm" />
                      <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                        {match.homeTeam.name}
                      </span>
                    </div>
                    {match.score && (
                      <span className="font-mono text-sm font-bold tabular-nums">
                        {match.score.home}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest code={match.awayTeam.code} size="sm" />
                      <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                        {match.awayTeam.name}
                      </span>
                    </div>
                    {match.score && (
                      <span className="font-mono text-sm font-bold tabular-nums">
                        {match.score.away}
                      </span>
                    )}
                  </div>
                </button>

                <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t.watchlist.savedPick}:{' '}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatSelectionLabel(
                          entry.savedPick?.selection ?? match.prediction.topOutcome.selection,
                          t
                        )}
                      </strong>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatPercent(
                        entry.savedPick?.probability ?? match.prediction.topOutcome.probability,
                        1
                      )}
                    </span>
                  </div>
                  <ProbabilityBar
                    homeProb={match.prediction.homeWinProb}
                    drawProb={match.prediction.drawProb}
                    awayProb={match.prediction.awayWinProb}
                    compact
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <ConfidenceIndicator
                  band={match.prediction.confidenceBand}
                  score={match.prediction.confidenceScore}
                  t={t}
                />
                <button
                  type="button"
                  onClick={() => onSelectMatch(match.id)}
                  className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
                >
                  {t.common.viewDetails} →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DisclaimerBanner text={t.common.disclaimer} />
    </div>
  );
};
