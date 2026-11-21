export type ShotOutcome = 'goal' | 'saved' | 'off_target' | 'blocked';
export type ShotZone = 'six_yard' | 'penalty_box' | 'outside_box';
export type ShotBodyPart = 'right_foot' | 'left_foot' | 'header';

export interface ShotEvent {
  id: string;
  team: 'home' | 'away';
  /** Pitch X coordinate in meters (0..105). Home attacks -> 105, Away attacks -> 0. */
  x: number;
  /** Pitch Y coordinate in meters (0..68). */
  y: number;
  /** Expected goal value for this individual shot (0.02..0.78). */
  xg: number;
  outcome: ShotOutcome;
  minute: number;
  zone: ShotZone;
  bodyPart: ShotBodyPart;
}

export interface GenerateShotMapParams {
  matchId: string;
  homeXg: number;
  awayXg: number;
  homeScore?: number | null;
  awayScore?: number | null;
  homeShotsCount?: number;
  awayShotsCount?: number;
}

export interface TeamThreatSummary {
  shots: number;
  totalXg: number;
  goals: number;
  bigChances: number;
  boxSharePct: number;
  sixYardXg: number;
  penaltyBoxXg: number;
  outsideBoxXg: number;
}

/** Deterministic FNV-1a string hash -> 32-bit unsigned seed */
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1337;
}

/** Mulberry32 deterministic PRNG */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Estimates spatial xG based on distance and angle to the center of the target goal (x=105, y=34).
 */
function spatialBaseXg(attackingX: number, y: number): number {
  const dx = Math.max(1.2, 105 - attackingX);
  const dy = Math.abs(y - 34);
  const dist = Math.hypot(dx, dy);
  // Goalposts at y = 30.34 and y = 37.66 (7.32m wide)
  const angle = Math.atan2(7.32 * dx, dx * dx + dy * dy - 3.66 * 3.66);
  const posAngle = Math.max(0.05, angle);
  const raw = 0.72 * Math.exp(-0.115 * dist) * Math.pow(posAngle / 0.85, 0.7);
  return clamp(raw, 0.02, 0.76);
}

function classifyZone(attackingX: number, y: number): ShotZone {
  if (attackingX >= 99.5 && y >= 24.84 && y <= 43.16) return 'six_yard';
  if (attackingX >= 88.5 && y >= 13.84 && y <= 54.16) return 'penalty_box';
  return 'outside_box';
}

function generateTeamShots(
  team: 'home' | 'away',
  targetXg: number,
  goalsCount: number,
  explicitShotCount: number | undefined,
  rng: () => number
): ShotEvent[] {
  const safeXg = clamp(Number.isFinite(targetXg) ? targetXg : 1.2, 0.25, 4.2);
  const inferredShots = Math.round(clamp(safeXg / 0.135, 5, 19));
  const totalShots = Math.max(
    goalsCount,
    explicitShotCount && explicitShotCount > 0 ? clamp(explicitShotCount, 3, 24) : inferredShots
  );

  // Sample realistic shot coordinates in canonical attacking direction (attacking right towards x=105)
  const rawShots: Array<{
    ax: number;
    y: number;
    baseXg: number;
    zone: ShotZone;
    minute: number;
    bodyPart: ShotBodyPart;
  }> = [];

  for (let i = 0; i < totalShots; i += 1) {
    const roll = rng();
    let ax: number;
    let y: number;

    if (roll < 0.17) {
      // High-danger six-yard box zone
      ax = 99.4 + rng() * 4.4;
      y = 28.5 + rng() * 11.0;
    } else if (roll < 0.68) {
      // Central & half-space penalty box
      ax = 89.0 + rng() * 10.6;
      const spread = (rng() + rng() - 1) * 16.5;
      y = clamp(34 + spread, 15.0, 53.0);
    } else {
      // Outside the box (Zone 14 / edge of D / angled strikes)
      ax = 74.5 + rng() * 13.8;
      const spread = (rng() + rng() - 1) * 20.5;
      y = clamp(34 + spread, 10.5, 57.5);
    }

    const zone = classifyZone(ax, y);
    const baseXg = spatialBaseXg(ax, y) * (0.86 + rng() * 0.28);
    const bodyRoll = rng();
    const bodyPart: ShotBodyPart =
      zone === 'six_yard' && bodyRoll < 0.38
        ? 'header'
        : zone === 'penalty_box' && bodyRoll < 0.22
        ? 'header'
        : bodyRoll < 0.68
        ? 'right_foot'
        : 'left_foot';

    const minute = clamp(Math.round(3 + rng() * 87), 1, 90);
    rawShots.push({ ax, y, baseXg, zone, minute, bodyPart });
  }

  // Scale shot xG values so their sum closely reflects the match's model/live team xG
  const sumRaw = rawShots.reduce((acc, s) => acc + s.baseXg, 0) || 1;
  const scale = safeXg / sumRaw;

  const withScaledXg = rawShots.map((s) => ({
    ...s,
    xg: Number(clamp(s.baseXg * scale, 0.02, 0.78).toFixed(2)),
  }));

  // Assign goals to the highest-xG shots (with subtle tie jitter) if scoreboard goals > 0
  const rankedIndices = withScaledXg
    .map((s, idx) => ({ idx, score: s.xg + rng() * 0.09 }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.idx);
  const goalIndexSet = new Set(rankedIndices.slice(0, Math.min(goalsCount, totalShots)));

  return withScaledXg
    .map((s, idx): ShotEvent => {
      let outcome: ShotOutcome;
      if (goalIndexSet.has(idx)) {
        outcome = 'goal';
      } else {
        const outRoll = rng();
        if (outRoll < 0.36) outcome = 'saved';
        else if (outRoll < 0.68) outcome = 'off_target';
        else outcome = 'blocked';
      }

      // Mirror away shots to attack right -> left (into x = 0) so full-pitch comparison is crystal clear
      const pitchX = team === 'home' ? s.ax : 105 - s.ax;
      const pitchY = team === 'home' ? s.y : 68 - s.y;

      return {
        id: `${team}-${idx}-${s.minute}`,
        team,
        x: Number(pitchX.toFixed(2)),
        y: Number(pitchY.toFixed(2)),
        xg: s.xg,
        outcome,
        minute: s.minute,
        zone: s.zone,
        bodyPart: s.bodyPart,
      };
    })
    .sort((a, b) => a.minute - b.minute);
}

/**
 * Deterministically builds spatial xG shot events anchored to match xG, real scores, and shot counts.
 */
export function generateMatchShotMap(params: GenerateShotMapParams): ShotEvent[] {
  const rng = createRng(hashSeed(`${params.matchId}::xg-heatmap-v1`));
  const homeGoals = Math.max(0, params.homeScore ?? 0);
  const awayGoals = Math.max(0, params.awayScore ?? 0);

  const homeShots = generateTeamShots(
    'home',
    params.homeXg,
    homeGoals,
    params.homeShotsCount,
    rng
  );
  const awayShots = generateTeamShots(
    'away',
    params.awayXg,
    awayGoals,
    params.awayShotsCount,
    rng
  );

  return [...homeShots, ...awayShots];
}

export function computeTeamThreatSummary(
  shots: ShotEvent[],
  team: 'home' | 'away'
): TeamThreatSummary {
  const list = shots.filter((s) => s.team === team);
  const totalXg = list.reduce((sum, s) => sum + s.xg, 0);
  const goals = list.filter((s) => s.outcome === 'goal').length;
  const bigChances = list.filter((s) => s.xg >= 0.3).length;
  const sixYardXg = list
    .filter((s) => s.zone === 'six_yard')
    .reduce((sum, s) => sum + s.xg, 0);
  const penaltyBoxXg = list
    .filter((s) => s.zone === 'penalty_box')
    .reduce((sum, s) => sum + s.xg, 0);
  const outsideBoxXg = list
    .filter((s) => s.zone === 'outside_box')
    .reduce((sum, s) => sum + s.xg, 0);
  const inBoxXg = sixYardXg + penaltyBoxXg;
  const boxSharePct = totalXg > 0 ? Math.round((inBoxXg / totalXg) * 100) : 0;

  return {
    shots: list.length,
    totalXg: Number(totalXg.toFixed(2)),
    goals,
    bigChances,
    boxSharePct,
    sixYardXg: Number(sixYardXg.toFixed(2)),
    penaltyBoxXg: Number(penaltyBoxXg.toFixed(2)),
    outsideBoxXg: Number(outsideBoxXg.toFixed(2)),
  };
}
