# MatchEdge — Football Analytics & Statistical Prediction Dashboard

MatchEdge is a responsive football (soccer) analytics and match-prediction web application built with React, TypeScript, Tailwind CSS, Recharts, and an Express server-side data proxy. The default UI language is **Azerbaijani (AZ)** with instant **English (EN)** and **Russian (RU)** switching, dark theme by default with a light theme toggle, and full `localStorage` watchlist persistence.

## Architecture Overview

- **Server-Side Data Proxy (`server.ts`, `src/services/footballApiServer.ts`)**:
  - Single football data integration supporting **API-Football v3** (`API_FOOTBALL_KEY`) and **football-data.org v4** (`FOOTBALL_DATA_API_KEY`).
  - API keys live strictly in server environment variables and are never exposed to the browser bundle.
  - Built-in in-memory TTL response caching, stale-cache fallback, and graceful HTTP `429` rate-limit handling.
  - When no key is configured, MatchEdge explicitly operates in clearly labeled **DEMO MODE** using deterministic worldwide sample data (Azərbaycan Premyer Liqası, Premier League, La Liga, Serie A, Bundesliga, Süper Lig, UEFA Champions League, Brasileirão, J1 League, MLS).
- **Transparent Statistical Engine (`src/engine/predictionEngine.ts`)**:
  - **Poisson + Dixon-Coles goal model**: Estimates venue-adjusted expected goals ($\lambda_{\text{home}}, \lambda_{\text{away}}$) blending goals and xG, with low-score correlation adjustment ($\tau$) for 0–0, 1–0, 0–1, and 1–1 scorelines.
  - **Elo rating differential**: Logistic strength adjustment with league-calibrated home advantage.
  - **Recent form weighting**: Exponentially time-decayed last-10 match results and goal differential.
  - **Home advantage**: League home-field multiplier + team home/away PPG splits.
  - **Head-to-Head (H2H)**: Empirical-Bayes shrunk historical edge to avoid small-sample overfitting.
  - **Squad availability**: Position-weighted offensive/defensive impact for injured and suspended players.
  - **Calibration & Uncertainty**: Pulls extreme probabilities toward realistic football bounds (never claiming 100% certainties) and reports calibrated uncertainty margins ($\pm\text{SE}$) alongside Low/Medium/High confidence scores.
- **Pages (`src/pages/`)**:
  1. `DashboardPage`: KPIs, Top Picks, live scores, and today's matches grouped by league.
  2. `MatchesPage`: Worldwide match browser with search and country, league, date, and status filters.
  3. `MatchDetailPage`: Full analytics breakdown (H2H, last-10 form, home/away splits, goals/xG chart, injuries/suspensions, Poisson scorelines, and "Why this prediction?" factor weights).
  4. `PredictionsPage`: Ranked probability list with league, minimum confidence, and market filters (`1X2`, `Over/Under 2.5`, `BTTS`).
  5. `TeamsLeaguesPage`: League standings, xG differentials, Elo ratings, W/D/L form strips, and rolling PPG sparklines.
  6. `WatchlistPage`: `localStorage`-persisted saved matches and picks.
  7. `PerformancePage`: Historical hit-rate and probability calibration tracking by league and confidence band with Recharts visualizations.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. (Optional) Add a live football API key in `.env`:
   - **API-Football v3**:
     ```env
     API_FOOTBALL_KEY="your_api_football_key"
     ```
   - **OR football-data.org v4**:
     ```env
     FOOTBALL_DATA_API_KEY="your_football_data_token"
     ```
   - Leave both empty to run in **DEMO MODE**.
4. Start the development server on port `3000`:
   ```bash
   npm run dev
   ```

## Running Unit Tests & Build Verification

- Run probability engine unit tests (`node:test` via `tsx`):
  ```bash
  npm test
  ```
- Type-check:
  ```bash
  npm run lint
  ```
- Production build:
  ```bash
  npm run build
  ```

## Disclaimer

Predictions are statistical estimates, not guarantees. For information only. 18+. Please act responsibly.
