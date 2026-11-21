import stadiumNightHero from '../../assets/images/stadium_night_hero_1795271034161.jpg';
import newsFeaturedDerby from '../../assets/images/news_featured_derby_1795271032754.jpg';
import newsUclTactics from '../../assets/images/news_ucl_tactics_1795271033604.jpg';
import playerSpotlightStriker from '../../assets/images/player_spotlight_striker_1795271035920.jpg';
import playerSpotlightPlaymaker from '../../assets/images/player_spotlight_playmaker_1795271033678.jpg';
import highlightGoalStrike from '../../assets/images/highlight_goal_strike_1795271033200.jpg';

export type PortalAssetKey =
  | 'stadiumNightHero'
  | 'newsFeaturedDerby'
  | 'newsUclTactics'
  | 'playerSpotlightStriker'
  | 'playerSpotlightPlaymaker'
  | 'highlightGoalStrike';

export const PORTAL_ASSETS: Record<PortalAssetKey, string> = {
  stadiumNightHero,
  newsFeaturedDerby,
  newsUclTactics,
  playerSpotlightStriker,
  playerSpotlightPlaymaker,
  highlightGoalStrike,
};
