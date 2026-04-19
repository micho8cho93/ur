import { getMatchConfig } from '@/logic/matchConfigs';
import {
  buildOfflineMatchEconomyDetails,
  buildOpenOnlineMatchEconomyDetails,
  getVisibleMatchEconomyRows,
} from './matchEconomy';

describe('match economy helpers', () => {
  it('describes the offline race economy', () => {
    const details = buildOfflineMatchEconomyDetails(getMatchConfig('gameMode_3_pieces'));

    expect(details).toEqual({
      description: 'This mode awards XP on a win.',
      rows: [
        { label: 'XP on win', value: '+20 XP', tone: 'earn' },
        { label: 'Coins on win', value: 'None', tone: 'neutral' },
        { label: 'Coins on loss', value: 'None', tone: 'neutral' },
        { label: 'Join cost', value: 'None', tone: 'neutral' },
        { label: 'Gems', value: 'None', tone: 'neutral' },
      ],
    });
    expect(getVisibleMatchEconomyRows(details)).toEqual([{ label: 'XP on win', value: '+20 XP', tone: 'earn' }]);
  });

  it('describes the standard offline bot economy with a coin bonus', () => {
    expect(buildOfflineMatchEconomyDetails(getMatchConfig('standard'))).toEqual({
      description: 'This mode awards XP on a win and a small coin bonus when you finish the match.',
      rows: [
        { label: 'XP on win', value: '+50 XP', tone: 'earn' },
        { label: 'Coins on win', value: '+10 coins', tone: 'earn' },
        { label: 'Coins on loss', value: 'None', tone: 'neutral' },
        { label: 'Join cost', value: 'None', tone: 'neutral' },
        { label: 'Gems', value: 'None', tone: 'neutral' },
      ],
    });
  });

  it('describes the open online wager economy', () => {
    expect(buildOpenOnlineMatchEconomyDetails(40)).toEqual({
      description:
        'Open matches escrow the wager up front and pay the winner the wager pot plus the normal coin bonus.',
      rows: [
        { label: 'XP on win', value: '+100 XP', tone: 'earn' },
        {
          label: 'Coins on win',
          value: '+15 coins bonus + 80 coins pot = +95 coins total',
          tone: 'earn',
        },
        { label: 'Coins on loss', value: '+5 coins', tone: 'earn' },
        { label: 'Join cost', value: 'Spend 40 coins to join', tone: 'cost' },
        { label: 'Gems', value: 'None', tone: 'neutral' },
      ],
    });
  });
});
