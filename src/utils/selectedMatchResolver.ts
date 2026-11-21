import type { MatchWithPrediction } from '../types/football';

function normalizeTeamKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|ac|as|afc|cfc|ssc|rcd|ud|cd|ca|sv|tsv|vfb|vfl|fsv|rb|real|club|de|la|el|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function teamsRoughlyMatch(a: string, b: string): boolean {
  const na = normalizeTeamKey(a);
  const nb = normalizeTeamKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.includes(na)) return true;
  if (nb.length >= 4 && na.includes(nb)) return true;
  return false;
}

function mergeMatchEnrichment(
  incoming: MatchWithPrediction,
  previous: MatchWithPrediction | null,
  stableId: string
): MatchWithPrediction {
  if (!previous) {
    return incoming.id === stableId ? incoming : { ...incoming, id: stableId };
  }

  return {
    ...incoming,
    id: stableId,
    h2h: incoming.h2h.length >= previous.h2h.length ? incoming.h2h : previous.h2h,
    liveStats: incoming.liveStats ?? previous.liveStats,
    homeTeam: {
      ...incoming.homeTeam,
      last10Form:
        incoming.homeTeam.last10Form.length >= previous.homeTeam.last10Form.length
          ? incoming.homeTeam.last10Form
          : previous.homeTeam.last10Form,
      absences:
        incoming.homeTeam.absences.length >= previous.homeTeam.absences.length
          ? incoming.homeTeam.absences
          : previous.homeTeam.absences,
    },
    awayTeam: {
      ...incoming.awayTeam,
      last10Form:
        incoming.awayTeam.last10Form.length >= previous.awayTeam.last10Form.length
          ? incoming.awayTeam.last10Form
          : previous.awayTeam.last10Form,
      absences:
        incoming.awayTeam.absences.length >= previous.awayTeam.absences.length
          ? incoming.awayTeam.absences
          : previous.awayTeam.absences,
    },
  };
}

/**
 * Keeps the user's currently selected match (and open Match Analyst Chat) pinned
 * even when background live polling switches data providers or drops a finished fixture.
 */
export function resolveStickySelectedMatch(
  selectedMatchId: string | null,
  snapshot: MatchWithPrediction | null,
  matches: MatchWithPrediction[]
): MatchWithPrediction | null {
  if (!selectedMatchId) return null;

  const exact = matches.find((m) => m.id === selectedMatchId);
  if (exact) {
    return mergeMatchEnrichment(exact, snapshot, selectedMatchId);
  }

  if (snapshot) {
    const byTeams = matches.find(
      (m) =>
        (teamsRoughlyMatch(m.homeTeam.name, snapshot.homeTeam.name) ||
          teamsRoughlyMatch(m.homeTeam.shortName, snapshot.homeTeam.shortName)) &&
        (teamsRoughlyMatch(m.awayTeam.name, snapshot.awayTeam.name) ||
          teamsRoughlyMatch(m.awayTeam.shortName, snapshot.awayTeam.shortName))
    );
    if (byTeams) {
      return mergeMatchEnrichment(byTeams, snapshot, selectedMatchId);
    }
    return snapshot;
  }

  return null;
}
