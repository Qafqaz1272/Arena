import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Language, MatchWithPrediction } from '../types/football';

export interface ExportPredictionRow {
  date: string;
  league: string;
  match: string;
  topPick: string;
  homeProbPct: string;
  drawProbPct: string;
  awayProbPct: string;
  over25Pct: string;
  bttsYesPct: string;
  expectedGoals: string;
  topScore: string;
  confidence: string;
}

const SELECTION_ASCII: Record<string, string> = {
  home: '1 (Home)',
  draw: 'X (Draw)',
  away: '2 (Away)',
  over25: 'Over 2.5',
  under25: 'Under 2.5',
  btts_yes: 'BTTS Yes',
  btts_no: 'BTTS No',
};

export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  // Protect spreadsheets from formula injection
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildPredictionExportRows(matches: MatchWithPrediction[]): ExportPredictionRow[] {
  return matches.map((m) => {
    const p = m.prediction;
    return {
      date: m.dateKey,
      league: m.leagueName,
      match: `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
      topPick: SELECTION_ASCII[p.topOutcome.selection] ?? p.topOutcome.selection,
      homeProbPct: `${(p.homeWinProb * 100).toFixed(1)}%`,
      drawProbPct: `${(p.drawProb * 100).toFixed(1)}%`,
      awayProbPct: `${(p.awayWinProb * 100).toFixed(1)}%`,
      over25Pct: `${(p.over25Prob * 100).toFixed(1)}%`,
      bttsYesPct: `${(p.bttsYesProb * 100).toFixed(1)}%`,
      expectedGoals: `${p.expectedGoals.home.toFixed(2)} - ${p.expectedGoals.away.toFixed(2)}`,
      topScore: p.topScorelines[0]?.score ?? '-',
      confidence: `${p.confidenceScore}% (${p.confidenceBand.toUpperCase()})`,
    };
  });
}

/**
 * Generates RFC-4180 compliant CSV with UTF-8 BOM for clean Excel rendering.
 */
export function buildPredictionsCsv(matches: MatchWithPrediction[]): string {
  const headers = [
    'Date',
    'League',
    'Match',
    'Top 1X2 Estimate',
    'Home %',
    'Draw %',
    'Away %',
    'Over 2.5 %',
    'BTTS Yes %',
    'Expected Goals (xG)',
    'Most Likely Score',
    'Confidence',
  ];

  const rows = buildPredictionExportRows(matches);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [
        r.date,
        r.league,
        r.match,
        r.topPick,
        r.homeProbPct,
        r.drawProbPct,
        r.awayProbPct,
        r.over25Pct,
        r.bttsYesPct,
        r.expectedGoals,
        r.topScore,
        r.confidence,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];

  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadPredictionsCsv(
  matches: MatchWithPrediction[],
  filenamePrefix: string = 'matchedge-predictions'
): void {
  const csv = buildPredictionsCsv(matches);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Transliterates extended Latin / Cyrillic characters to clean ASCII for jsPDF's built-in
 * Helvetica font so exported PDFs never show broken glyph boxes.
 */
export function toPdfSafeText(input: string): string {
  const map: Record<string, string> = {
    ə: 'e',
    Ə: 'E',
    ğ: 'g',
    Ğ: 'G',
    ı: 'i',
    İ: 'I',
    ö: 'o',
    Ö: 'O',
    ş: 's',
    Ş: 'S',
    ü: 'u',
    Ü: 'U',
    ç: 'c',
    Ç: 'C',
  };
  return input
    .replace(/[əƏğĞıİöÖşŞüÜçÇ]/g, (ch) => map[ch] ?? ch)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function downloadPredictionsPdf(
  matches: MatchWithPrediction[],
  lang: Language,
  filenamePrefix: string = 'matchedge-predictions'
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const stamp = new Date().toISOString().slice(0, 10);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('MatchEdge — Statistical Match Predictions Report', 40, 42);

  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Generated: ${stamp}  |  Matches: ${matches.length}  |  Statistical estimates only — not a guarantee (18+).`,
    40,
    58
  );

  const rows = buildPredictionExportRows(matches);

  autoTable(doc, {
    startY: 72,
    head: [
      [
        'Date',
        'League',
        'Match',
        'Top 1X2',
        '1 / X / 2',
        'O2.5',
        'BTTS',
        'xG',
        'Score',
        'Conf.',
      ],
    ],
    body: rows.map((r) => [
      r.date,
      toPdfSafeText(r.league),
      toPdfSafeText(r.match),
      r.topPick,
      `${r.homeProbPct} / ${r.drawProbPct} / ${r.awayProbPct}`,
      r.over25Pct,
      r.bttsYesPct,
      r.expectedGoals,
      r.topScore,
      r.confidence,
    ]),
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  const disclaimer =
    lang === 'az'
      ? 'MatchEdge statistik qiymetlendirme teqdim edir, zemanet deyil. 18+. Mesuliyyetli davranin.'
      : 'MatchEdge provides statistical estimates only, not guarantees. 18+. Gamble responsibly.';
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(disclaimer, 40, pageHeight - 22);

  doc.save(`${filenamePrefix}-${stamp}.pdf`);
}
