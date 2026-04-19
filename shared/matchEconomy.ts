import type { MatchConfig } from '../logic/matchConfigs';
import { getXpAwardAmount } from './progression';

export type MatchEconomyRowTone = 'earn' | 'cost' | 'neutral';

export type MatchEconomyRow = {
  label: string;
  value: string;
  tone: MatchEconomyRowTone;
};

export type MatchEconomyDetails = {
  description: string;
  rows: MatchEconomyRow[];
};

const numberFormatter = new Intl.NumberFormat('en-US');

const OFFLINE_MATCH_WIN_COIN_BONUS = 10;
const ONLINE_MATCH_WIN_COIN_BONUS = 15;
const ONLINE_MATCH_LOSS_COIN_BONUS = 5;
const ONLINE_MATCH_PLAYER_COUNT = 2;

const formatCount = (value: number): string => numberFormatter.format(Math.abs(Math.trunc(value)));

const formatPositiveValue = (amount: number, unit: string): string => `+${formatCount(amount)} ${unit}`;

const formatNone = (): string => 'None';

const formatCoinAmount = (amount: number): string => `${formatCount(amount)} ${amount === 1 ? 'coin' : 'coins'}`;

export const getVisibleMatchEconomyRows = (details: MatchEconomyDetails): MatchEconomyRow[] =>
  details.rows.filter((row) => row.value !== 'None');

export const hasVisibleMatchEconomyRows = (details: MatchEconomyDetails): boolean =>
  getVisibleMatchEconomyRows(details).length > 0;

export const buildOfflineMatchEconomyDetails = (
  config: Pick<MatchConfig, 'allowsCoins' | 'allowsXp' | 'offlineWinRewardSource'>,
): MatchEconomyDetails => {
  const xpRewardValue = config.allowsXp ? formatPositiveValue(getXpAwardAmount(config.offlineWinRewardSource), 'XP') : formatNone();
  const coinRewardValue = config.allowsCoins ? formatPositiveValue(OFFLINE_MATCH_WIN_COIN_BONUS, 'coins') : formatNone();

  let description = 'This mode does not currently award XP, coin, or gem rewards.';
  if (config.allowsXp && config.allowsCoins) {
    description = 'This mode awards XP on a win and a small coin bonus when you finish the match.';
  } else if (config.allowsXp) {
    description = 'This mode awards XP on a win.';
  } else if (config.allowsCoins) {
    description = 'This mode awards a coin bonus on a win.';
  }

  return {
    description,
    rows: [
      {
        label: 'XP on win',
        value: xpRewardValue,
        tone: config.allowsXp ? 'earn' : 'neutral',
      },
      {
        label: 'Coins on win',
        value: coinRewardValue,
        tone: config.allowsCoins ? 'earn' : 'neutral',
      },
      {
        label: 'Coins on loss',
        value: formatNone(),
        tone: 'neutral',
      },
      {
        label: 'Join cost',
        value: formatNone(),
        tone: 'neutral',
      },
      {
        label: 'Gems',
        value: formatNone(),
        tone: 'neutral',
      },
    ],
  };
};

export const buildOpenOnlineMatchEconomyDetails = (wager: number): MatchEconomyDetails => {
  const potAmount = wager * ONLINE_MATCH_PLAYER_COUNT;
  const winCoinTotal = potAmount + ONLINE_MATCH_WIN_COIN_BONUS;

  return {
    description: 'Open matches escrow the wager up front and pay the winner the wager pot plus the normal coin bonus.',
    rows: [
      {
        label: 'XP on win',
        value: formatPositiveValue(getXpAwardAmount('pvp_win'), 'XP'),
        tone: 'earn',
      },
      {
        label: 'Coins on win',
        value: `${formatPositiveValue(ONLINE_MATCH_WIN_COIN_BONUS, 'coins')} bonus + ${formatCoinAmount(
          potAmount,
        )} pot = ${formatPositiveValue(winCoinTotal, 'coins')} total`,
        tone: 'earn',
      },
      {
        label: 'Coins on loss',
        value: formatPositiveValue(ONLINE_MATCH_LOSS_COIN_BONUS, 'coins'),
        tone: 'earn',
      },
      {
        label: 'Join cost',
        value: `Spend ${formatCoinAmount(wager)} to join`,
        tone: 'cost',
      },
      {
        label: 'Gems',
        value: formatNone(),
        tone: 'neutral',
      },
    ],
  };
};
