import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Crosshair, Flame, Layers } from 'lucide-react';
import type { Language } from '../types/football';
import {
  computeTeamThreatSummary,
  generateMatchShotMap,
  type ShotBodyPart,
  type ShotEvent,
  type ShotOutcome,
  type ShotZone,
} from '../utils/xgShotMap';

export interface MatchHeatmapProps {
  matchId: string;
  homeTeamName: string;
  homeShort: string;
  awayTeamName: string;
  awayShort: string;
  homeXg: number;
  awayXg: number;
  homeScore?: number | null;
  awayScore?: number | null;
  homeShotsCount?: number;
  awayShotsCount?: number;
  /** Optional explicit shot data if supplied by a shot-level feed */
  shots?: ShotEvent[];
  lang?: Language;
  className?: string;
}

type TeamFilter = 'both' | 'home' | 'away';

const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;
const SVG_W = 630;
const SVG_H = 408;

const LABELS: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    both: string;
    heatmap: string;
    shots: string;
    attacksRight: string;
    attacksLeft: string;
    totalXg: string;
    totalShots: string;
    bigChances: string;
    boxThreat: string;
    goal: string;
    saved: string;
    offTarget: string;
    blocked: string;
    sixYard: string;
    penaltyBox: string;
    outsideBox: string;
    rightFoot: string;
    leftFoot: string;
    header: string;
    hoverPrompt: string;
    minute: string;
    zone: string;
    outcome: string;
    bodyPart: string;
    modelEstimateNote: string;
  }
> = {
  az: {
    eyebrow: 'TAKTİKİ TƏHLÜKƏ XƏRİTƏSİ · D3 xG',
    title: 'Zərbə Nöqtələri və xG İstilik Xəritəsi',
    subtitle: 'Meydança üzrə zərbə sıxlığı və gözlənilən qol (xG) təhlükə intensivliyi',
    both: 'Hər ikisi',
    heatmap: 'İstilik qatı',
    shots: 'Zərbələr',
    attacksRight: 'Hücum →',
    attacksLeft: '← Hücum',
    totalXg: 'Ümumi xG',
    totalShots: 'Zərbə',
    bigChances: 'Böyük şans',
    boxThreat: 'Cərimə meydançası',
    goal: 'Qol',
    saved: 'Qapıçı tutdu',
    offTarget: 'Hədəfdən kənar',
    blocked: 'Bloklandı',
    sixYard: 'Qapıçı meydançası',
    penaltyBox: 'Cərimə meydançası',
    outsideBox: 'Cərimə xaricindən',
    rightFoot: 'Sağ ayaq',
    leftFoot: 'Sol ayaq',
    header: 'Baş zərbəsi',
    hoverPrompt: 'Detallı xG oxumaq üçün meydançadakı istənilən zərbə nöqtəsinə toxunun.',
    minute: 'Dəq.',
    zone: 'Zona',
    outcome: 'Nəticə',
    bodyPart: 'Zərbə növü',
    modelEstimateNote: 'xG paylanması matçın hücum göstəricilərinə görə modelləşdirilib',
  },
  en: {
    eyebrow: 'TACTICAL THREAT MAP · D3 xG',
    title: 'Shot Locations & xG Threat Heatmap',
    subtitle: 'Spatial shot density contours weighted by expected goals (xG) intensity',
    both: 'Both',
    heatmap: 'Contours',
    shots: 'Shots',
    attacksRight: 'Attacks →',
    attacksLeft: '← Attacks',
    totalXg: 'Total xG',
    totalShots: 'Shots',
    bigChances: 'Big chances',
    boxThreat: 'In-box xG',
    goal: 'Goal',
    saved: 'Saved',
    offTarget: 'Off target',
    blocked: 'Blocked',
    sixYard: 'Six-yard box',
    penaltyBox: 'Penalty box',
    outsideBox: 'Outside box',
    rightFoot: 'Right foot',
    leftFoot: 'Left foot',
    header: 'Header',
    hoverPrompt: 'Hover or tap any shot marker on the pitch to inspect xG, minute, and zone.',
    minute: 'Min',
    zone: 'Zone',
    outcome: 'Outcome',
    bodyPart: 'Body part',
    modelEstimateNote: 'Spatial distribution calibrated to match expected goals profile',
  },
  ru: {
    eyebrow: 'ТАКТИЧЕСКАЯ КАРТА УГРОЗЫ · D3 xG',
    title: 'Точки ударов и тепловая карта xG',
    subtitle: 'Плотность ударов и интенсивность ожидаемых голов (xG) на поле',
    both: 'Обе',
    heatmap: 'Тепловая карта',
    shots: 'Удары',
    attacksRight: 'Атака →',
    attacksLeft: '← Атака',
    totalXg: 'Всего xG',
    totalShots: 'Удары',
    bigChances: 'Явные шансы',
    boxThreat: 'Из штрафной',
    goal: 'Гол',
    saved: 'Сейв',
    offTarget: 'Мимо',
    blocked: 'Блок',
    sixYard: 'Вратарская',
    penaltyBox: 'Штрафная',
    outsideBox: 'Из-за штрафной',
    rightFoot: 'Правая нога',
    leftFoot: 'Левая нога',
    header: 'Головой',
    hoverPrompt: 'Наведите или нажмите на точку удара, чтобы увидеть xG, минуту и зону.',
    minute: 'Мин.',
    zone: 'Зона',
    outcome: 'Исход',
    bodyPart: 'Тип удара',
    modelEstimateNote: 'Пространственное распределение откалибровано под xG матча',
  },
};

function outcomeLabel(o: ShotOutcome, copy: (typeof LABELS)['az']): string {
  if (o === 'goal') return copy.goal;
  if (o === 'saved') return copy.saved;
  if (o === 'blocked') return copy.blocked;
  return copy.offTarget;
}

function zoneLabel(z: ShotZone, copy: (typeof LABELS)['az']): string {
  if (z === 'six_yard') return copy.sixYard;
  if (z === 'penalty_box') return copy.penaltyBox;
  return copy.outsideBox;
}

function bodyPartLabel(b: ShotBodyPart, copy: (typeof LABELS)['az']): string {
  if (b === 'header') return copy.header;
  if (b === 'left_foot') return copy.leftFoot;
  return copy.rightFoot;
}

export const MatchHeatmap: React.FC<MatchHeatmapProps> = ({
  matchId,
  homeTeamName,
  homeShort,
  awayTeamName,
  awayShort,
  homeXg,
  awayXg,
  homeScore,
  awayScore,
  homeShotsCount,
  awayShotsCount,
  shots: explicitShots,
  lang = 'az',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('both');
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showShots, setShowShots] = useState<boolean>(true);
  const [activeShot, setActiveShot] = useState<ShotEvent | null>(null);

  const copy = LABELS[lang] ?? LABELS.az;

  const allShots = useMemo<ShotEvent[]>(() => {
    if (explicitShots && explicitShots.length > 0) return explicitShots;
    return generateMatchShotMap({
      matchId,
      homeXg,
      awayXg,
      homeScore,
      awayScore,
      homeShotsCount,
      awayShotsCount,
    });
  }, [explicitShots, matchId, homeXg, awayXg, homeScore, awayScore, homeShotsCount, awayShotsCount]);

  const visibleShots = useMemo(() => {
    if (teamFilter === 'both') return allShots;
    return allShots.filter((s) => s.team === teamFilter);
  }, [allShots, teamFilter]);

  const homeSummary = useMemo(() => computeTeamThreatSummary(allShots, 'home'), [allShots]);
  const awaySummary = useMemo(() => computeTeamThreatSummary(allShots, 'away'), [allShots]);

  // Clear active shot if filtered out
  useEffect(() => {
    if (activeShot && teamFilter !== 'both' && activeShot.team !== teamFilter) {
      setActiveShot(null);
    }
  }, [activeShot, teamFilter]);

  // Render D3 pitch, kernel density xG heatmap contours, and interactive shot markers
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const padX = 18;
    const padY = 14;
    const xScale = d3
      .scaleLinear()
      .domain([0, PITCH_LENGTH])
      .range([padX, SVG_W - padX]);
    const yScale = d3
      .scaleLinear()
      .domain([0, PITCH_WIDTH])
      .range([padY, SVG_H - padY]);

    const rScale = d3.scaleSqrt().domain([0.02, 0.78]).range([3.8, 13.5]).clamp(true);

    const innerW = xScale(PITCH_LENGTH) - xScale(0);
    const innerH = yScale(PITCH_WIDTH) - yScale(0);
    const clipId = `pitch-clip-${matchId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const defs = svg.append('defs');
    defs
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', xScale(0))
      .attr('y', yScale(0))
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('rx', 4);

    // Layer 0: Pitch Base & Subtle Vertical Mowing Stripes (Editorial Flat Ink)
    const pitchGroup = svg.append('g').attr('class', 'pitch-layer');
    pitchGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', SVG_W)
      .attr('height', SVG_H)
      .attr('fill', '#0B0F14');

    const stripeCount = 10;
    const stripeWidth = innerW / stripeCount;
    for (let i = 0; i < stripeCount; i += 1) {
      if (i % 2 === 0) {
        pitchGroup
          .append('rect')
          .attr('x', xScale(0) + i * stripeWidth)
          .attr('y', yScale(0))
          .attr('width', stripeWidth)
          .attr('height', innerH)
          .attr('fill', '#101620');
      }
    }

    // Subtle tactical thirds guides
    [35, 70].forEach((thirdX) => {
      pitchGroup
        .append('line')
        .attr('x1', xScale(thirdX))
        .attr('x2', xScale(thirdX))
        .attr('y1', yScale(0))
        .attr('y2', yScale(PITCH_WIDTH))
        .attr('stroke', '#1E2733')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 4');
    });

    // Layer 1: D3 Contour Density Heatmap (weighted by xG)
    const contourLayer = svg
      .append('g')
      .attr('class', 'contour-layer')
      .attr('clip-path', `url(#${clipId})`);

    const renderTeamContours = (team: 'home' | 'away', fillHex: string) => {
      const teamShots = visibleShots.filter((s) => s.team === team);
      if (teamShots.length === 0) return;

      const contourGenerator = d3
        .contourDensity<ShotEvent>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .weight((d) => Math.max(0.04, d.xg * 3.2))
        .size([SVG_W, SVG_H])
        .bandwidth(28)
        .thresholds(7);

      const contours = contourGenerator(teamShots);
      const maxVal = d3.max(contours, (c) => c.value) || 1;
      const opacityScale = d3.scaleLinear().domain([0, maxVal]).range([0.05, 0.36]);
      const geoPath = d3.geoPath();

      contourLayer
        .selectAll(`path.contour-${team}`)
        .data(contours)
        .join('path')
        .attr('class', `contour-${team}`)
        .attr('d', (d) => geoPath(d) || '')
        .attr('fill', fillHex)
        .attr('fill-opacity', (d) => opacityScale(d.value))
        .attr('stroke', fillHex)
        .attr('stroke-opacity', (d) => Math.min(0.45, opacityScale(d.value) + 0.08))
        .attr('stroke-width', 0.65);
    };

    if (showContours) {
      if (teamFilter === 'both' || teamFilter === 'home') {
        renderTeamContours('home', '#2BD576');
      }
      if (teamFilter === 'both' || teamFilter === 'away') {
        renderTeamContours('away', '#F5A524');
      }
    }

    // Layer 2: Precision Hairline FIFA Pitch Markings
    const lineStroke = '#2A3646';
    const markings = svg
      .append('g')
      .attr('class', 'pitch-markings')
      .attr('fill', 'none')
      .attr('stroke', lineStroke)
      .attr('stroke-width', 1.2);

    // Outer touchline
    markings
      .append('rect')
      .attr('x', xScale(0))
      .attr('y', yScale(0))
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('rx', 2);

    // Halfway line & center circle (radius 9.15m)
    markings
      .append('line')
      .attr('x1', xScale(52.5))
      .attr('x2', xScale(52.5))
      .attr('y1', yScale(0))
      .attr('y2', yScale(PITCH_WIDTH));

    markings
      .append('circle')
      .attr('cx', xScale(52.5))
      .attr('cy', yScale(34))
      .attr('r', xScale(9.15) - xScale(0));

    markings
      .append('circle')
      .attr('cx', xScale(52.5))
      .attr('cy', yScale(34))
      .attr('r', 2)
      .attr('fill', lineStroke);

    // Penalty boxes (16.5m deep, 40.32m wide -> y from 13.84 to 54.16)
    markings
      .append('rect')
      .attr('x', xScale(0))
      .attr('y', yScale(13.84))
      .attr('width', xScale(16.5) - xScale(0))
      .attr('height', yScale(54.16) - yScale(13.84));

    markings
      .append('rect')
      .attr('x', xScale(PITCH_LENGTH - 16.5))
      .attr('y', yScale(13.84))
      .attr('width', xScale(16.5) - xScale(0))
      .attr('height', yScale(54.16) - yScale(13.84));

    // Six-yard boxes (5.5m deep, 18.32m wide -> y from 24.84 to 43.16)
    markings
      .append('rect')
      .attr('x', xScale(0))
      .attr('y', yScale(24.84))
      .attr('width', xScale(5.5) - xScale(0))
      .attr('height', yScale(43.16) - yScale(24.84));

    markings
      .append('rect')
      .attr('x', xScale(PITCH_LENGTH - 5.5))
      .attr('y', yScale(24.84))
      .attr('width', xScale(5.5) - xScale(0))
      .attr('height', yScale(43.16) - yScale(24.84));

    // Goal mouths (outside touchlines, 7.32m wide -> y 30.34..37.66)
    markings
      .append('rect')
      .attr('x', xScale(0) - 7)
      .attr('y', yScale(30.34))
      .attr('width', 7)
      .attr('height', yScale(37.66) - yScale(30.34))
      .attr('stroke', '#3B4A5E');

    markings
      .append('rect')
      .attr('x', xScale(PITCH_LENGTH))
      .attr('y', yScale(30.34))
      .attr('width', 7)
      .attr('height', yScale(37.66) - yScale(30.34))
      .attr('stroke', '#3B4A5E');

    // Penalty spots (11m from goal line)
    [11, PITCH_LENGTH - 11].forEach((px) => {
      markings
        .append('circle')
        .attr('cx', xScale(px))
        .attr('cy', yScale(34))
        .attr('r', 1.8)
        .attr('fill', lineStroke);
    });

    // Penalty arcs (D)
    const arcR = xScale(9.15) - xScale(0);
    const leftArc = d3
      .arc<unknown>()
      .innerRadius(arcR)
      .outerRadius(arcR)
      .startAngle(Math.PI * 0.21)
      .endAngle(Math.PI * 0.79);
    markings
      .append('path')
      .attr('transform', `translate(${xScale(11)},${yScale(34)})`)
      .attr('d', leftArc({}) || '');

    const rightArc = d3
      .arc<unknown>()
      .innerRadius(arcR)
      .outerRadius(arcR)
      .startAngle(-Math.PI * 0.79)
      .endAngle(-Math.PI * 0.21);
    markings
      .append('path')
      .attr('transform', `translate(${xScale(PITCH_LENGTH - 11)},${yScale(34)})`)
      .attr('d', rightArc({}) || '');

    // Subtle attacking-direction micro labels inside pitch corners
    const dirLabels = svg
      .append('g')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '9.5px')
      .attr('font-weight', '600');

    dirLabels
      .append('text')
      .attr('x', xScale(2))
      .attr('y', yScale(3.5))
      .attr('fill', '#F5A524')
      .attr('opacity', teamFilter === 'home' ? 0.25 : 0.85)
      .text(`${awayShort} ${copy.attacksLeft}`);

    dirLabels
      .append('text')
      .attr('x', xScale(PITCH_LENGTH - 2))
      .attr('y', yScale(3.5))
      .attr('text-anchor', 'end')
      .attr('fill', '#2BD576')
      .attr('opacity', teamFilter === 'away' ? 0.25 : 0.85)
      .text(`${homeShort} ${copy.attacksRight}`);

    // Layer 3: Individual Shot Location Markers (Area proportional to xG)
    if (showShots) {
      const shotLayer = svg.append('g').attr('class', 'shots-layer');

      // Sort so goals and larger shots render cleanly on top
      const sortedShots = [...visibleShots].sort((a, b) => {
        if (a.outcome === 'goal' && b.outcome !== 'goal') return 1;
        if (b.outcome === 'goal' && a.outcome !== 'goal') return -1;
        return a.xg - b.xg;
      });

      const shotGroups = shotLayer
        .selectAll<SVGGElement, ShotEvent>('g.shot-node')
        .data(sortedShots, (d) => d.id)
        .join('g')
        .attr('class', 'shot-node')
        .attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function (_event, d) {
          d3.select(this)
            .select('circle.shot-main')
            .transition()
            .duration(140)
            .attr('r', rScale(d.xg) + 2.5);
          setActiveShot(d);
        })
        .on('mouseleave', function (_event, d) {
          d3.select(this)
            .select('circle.shot-main')
            .transition()
            .duration(140)
            .attr('r', rScale(d.xg));
        })
        .on('click', (_event, d) => {
          setActiveShot(d);
        });

      // Outer precision halo ring for Goals or active selected shot
      shotGroups
        .filter((d) => d.outcome === 'goal' || activeShot?.id === d.id)
        .append('circle')
        .attr('r', (d) => rScale(d.xg) + 3.2)
        .attr('fill', 'none')
        .attr('stroke', (d) => (d.team === 'home' ? '#2BD576' : '#F5A524'))
        .attr('stroke-width', (d) => (activeShot?.id === d.id ? 1.8 : 1.1))
        .attr('stroke-opacity', 0.85);

      // Main shot marker scaled by xG
      shotGroups
        .append('circle')
        .attr('class', 'shot-main')
        .attr('r', (d) => rScale(d.xg))
        .attr('fill', (d) => {
          const color = d.team === 'home' ? '#2BD576' : '#F5A524';
          if (d.outcome === 'goal') return color;
          if (d.outcome === 'saved') return color;
          return '#0B0F14';
        })
        .attr('fill-opacity', (d) => {
          if (d.outcome === 'goal') return 0.95;
          if (d.outcome === 'saved') return 0.38;
          return 0.72;
        })
        .attr('stroke', (d) => (d.team === 'home' ? '#2BD576' : '#F5A524'))
        .attr('stroke-width', (d) => (d.outcome === 'goal' ? 1.8 : 1.35))
        .attr('stroke-dasharray', (d) => (d.outcome === 'blocked' ? '2 1.5' : 'none'));

      // Crisp inner dot on goals for unmistakable legibility
      shotGroups
        .filter((d) => d.outcome === 'goal')
        .append('circle')
        .attr('r', 2.2)
        .attr('fill', '#0B0F14');
    }
  }, [
    visibleShots,
    showContours,
    showShots,
    teamFilter,
    activeShot?.id,
    matchId,
    homeShort,
    awayShort,
    copy.attacksLeft,
    copy.attacksRight,
  ]);

  return (
    <section
      aria-labelledby={`match-heatmap-heading-${matchId}`}
      className={`overflow-hidden rounded-xl border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] ${className}`}
    >
      {/* Header & Layer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0E131B] px-5 py-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#168A4A] dark:text-[#2BD576]">
            {copy.eyebrow}
          </p>
          <h2
            id={`match-heatmap-heading-${matchId}`}
            className="mt-0.5 font-display text-2xl font-bold tracking-wide text-[#111827] dark:text-[#F3F6FA]"
          >
            {copy.title}
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B] dark:text-[#8A97A8]">{copy.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Team Filter Segmented Switch */}
          <div
            role="group"
            aria-label="Team filter"
            className="inline-flex rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#0B0F14] p-0.5"
          >
            {(
              [
                { id: 'both' as const, label: copy.both },
                { id: 'home' as const, label: homeShort },
                { id: 'away' as const, label: awayShort },
              ] as const
            ).map((opt) => {
              const active = teamFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTeamFilter(opt.id)}
                  aria-pressed={active}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? opt.id === 'home'
                        ? 'bg-[#168A4A] dark:bg-[#2BD576] text-white dark:text-[#08140D]'
                        : opt.id === 'away'
                        ? 'bg-[#F5A524] text-[#0B0F14]'
                        : 'bg-[#111827] dark:bg-[#F3F6FA] text-white dark:text-[#0B0F14]'
                      : 'text-[#64748B] hover:text-[#111827] dark:hover:text-[#F3F6FA]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Layer Toggles */}
          <button
            type="button"
            onClick={() => setShowContours((v) => !v)}
            aria-pressed={showContours}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              showContours
                ? 'border-[#168A4A]/45 dark:border-[#2BD576]/40 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#64748B]'
            }`}
          >
            <Flame className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{copy.heatmap}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShots((v) => !v)}
            aria-pressed={showShots}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              showShots
                ? 'border-[#168A4A]/45 dark:border-[#2BD576]/40 bg-[#2BD576]/10 text-[#147A42] dark:text-[#2BD576]'
                : 'border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] text-[#64748B]'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{copy.shots}</span>
          </button>
        </div>
      </div>

      {/* Asymmetric Editorial Body: Pitch Canvas (8 cols) + Tactical Threat Rail (4 cols) */}
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-12 lg:items-start">
        <div className="space-y-3 lg:col-span-8">
          <div className="relative overflow-hidden rounded-lg border border-[#1E2733] bg-[#0B0F14]">
            <svg
              ref={svgRef}
              data-testid="match-heatmap-svg"
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="block w-full h-auto select-none"
              role="img"
              aria-label={`${homeTeamName} vs ${awayTeamName} xG shot heatmap`}
            />
          </div>

          {/* Interactive Shot Inspector Readout + Legend Row */}
          <div
            data-testid="match-heatmap-inspector"
            className="flex flex-col gap-2.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            {activeShot ? (
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#111827] dark:text-[#F3F6FA]">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      activeShot.team === 'home' ? 'bg-[#2BD576]' : 'bg-[#F5A524]'
                    }`}
                  />
                  {activeShot.team === 'home' ? homeTeamName : awayTeamName}
                </span>
                <span className="font-mono font-bold text-[#168A4A] dark:text-[#2BD576] tabular-nums">
                  {activeShot.xg.toFixed(2)} xG
                </span>
                <span className="font-mono text-[#64748B] tabular-nums">
                  {copy.minute} {activeShot.minute}&apos;
                </span>
                <span className="rounded-[4px] border border-[#DCE2EA] dark:border-[#1E2733] bg-white dark:bg-[#121821] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#111827] dark:text-[#F3F6FA]">
                  {outcomeLabel(activeShot.outcome, copy)}
                </span>
                <span className="text-[#475569] dark:text-[#94A3B8]">
                  {zoneLabel(activeShot.zone, copy)} · {bodyPartLabel(activeShot.bodyPart, copy)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#8A97A8]">
                <Layers className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>{copy.hoverPrompt}</span>
              </div>
            )}

            {/* Compact Marker Legend */}
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#64748B] shrink-0">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#2BD576] ring-1 ring-[#2BD576]/60">
                  <span className="h-1 w-1 rounded-full bg-[#0B0F14]" />
                </span>
                {copy.goal}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full border border-[#2BD576] bg-[#2BD576]/35" />
                {copy.saved}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full border border-[#2BD576] bg-[#0B0F14]" />
                {copy.offTarget}
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Threat Intensity Rail */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          {[
            {
              side: 'home' as const,
              name: homeTeamName,
              short: homeShort,
              summary: homeSummary,
              dotClass: 'bg-[#2BD576]',
              barPrimary: 'bg-[#2BD576]',
              barMid: 'bg-[#2BD576]/55',
              accentClass: 'text-[#168A4A] dark:text-[#2BD576]',
            },
            {
              side: 'away' as const,
              name: awayTeamName,
              short: awayShort,
              summary: awaySummary,
              dotClass: 'bg-[#F5A524]',
              barPrimary: 'bg-[#F5A524]',
              barMid: 'bg-[#F5A524]/55',
              accentClass: 'text-[#A5620A] dark:text-[#F5A524]',
            },
          ].map((item) => {
            const denom = Math.max(0.01, item.summary.totalXg);
            const sixPct = Math.round((item.summary.sixYardXg / denom) * 100);
            const boxPct = Math.round((item.summary.penaltyBoxXg / denom) * 100);
            const outPct = Math.max(0, 100 - sixPct - boxPct);

            return (
              <div
                key={item.side}
                className="rounded-lg border border-[#DCE2EA] dark:border-[#1E2733] bg-[#F6F7F9] dark:bg-[#0B0F14] p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClass}`} />
                    <span className="truncate text-xs font-bold text-[#111827] dark:text-[#F3F6FA]">
                      {item.name}
                    </span>
                  </div>
                  <span className={`font-mono text-base font-bold tabular-nums ${item.accentClass}`}>
                    {item.summary.totalXg.toFixed(2)} xG
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-[#DCE2EA] dark:divide-[#1E2733] text-center font-mono tabular-nums">
                  <div className="px-1">
                    <div className="text-[9px] uppercase text-[#64748B]">{copy.totalShots}</div>
                    <div className="mt-0.5 text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                      {item.summary.shots}
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="text-[9px] uppercase text-[#64748B]">{copy.bigChances}</div>
                    <div className="mt-0.5 text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                      {item.summary.bigChances}
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="text-[9px] uppercase text-[#64748B]">{copy.boxThreat}</div>
                    <div className="mt-0.5 text-sm font-semibold text-[#111827] dark:text-[#F3F6FA]">
                      {item.summary.boxSharePct}%
                    </div>
                  </div>
                </div>

                {/* Zone xG Breakdown Bar */}
                <div className="mt-3 space-y-1.5 border-t border-[#DCE2EA] dark:border-[#1E2733] pt-2.5">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-[2px] bg-[#DCE2EA] dark:bg-[#1E2733]">
                    <div className={item.barPrimary} style={{ width: `${sixPct}%` }} />
                    <div className={item.barMid} style={{ width: `${boxPct}%` }} />
                    <div className="bg-[#64748B]/45" style={{ width: `${outPct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-mono text-[9px] tabular-nums text-[#64748B]">
                    <div className="truncate">
                      6m: <span className="text-[#111827] dark:text-[#CBD5E1]">{item.summary.sixYardXg.toFixed(2)}</span>
                    </div>
                    <div className="truncate text-center">
                      16m: <span className="text-[#111827] dark:text-[#CBD5E1]">{item.summary.penaltyBoxXg.toFixed(2)}</span>
                    </div>
                    <div className="truncate text-right">
                      16m+: <span className="text-[#111827] dark:text-[#CBD5E1]">{item.summary.outsideBoxXg.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <p className="font-mono text-[10px] leading-relaxed text-[#64748B]">
            {copy.modelEstimateNote}
          </p>
        </div>
      </div>
    </section>
  );
};
