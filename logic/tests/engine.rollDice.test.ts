import { rollDice, rollThrowFace } from '@/logic/engine';

describe('engine rollDice', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('treats the threshold as an even 50/50 split for each binary die', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5);

    expect(rollDice()).toBe(4);
  });

  it('matches the standard Ur binary-dice outcome distribution of 1:4:6:4:1', () => {
    const outcomeCounts = [0, 0, 0, 0, 0];
    const dieFaces = [0.25, 0.75];

    for (const first of dieFaces) {
      for (const second of dieFaces) {
        for (const third of dieFaces) {
          for (const fourth of dieFaces) {
            const rolls = [first, second, third, fourth];
            jest.spyOn(Math, 'random').mockImplementation(() => rolls.shift() as number);
            outcomeCounts[rollDice()] += 1;
            jest.restoreAllMocks();
          }
        }
      }
    }

    expect(outcomeCounts).toEqual([1, 4, 6, 4, 1]);
  });

  it('uses three binary lots for Bell and Masters throw profiles', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5);

    expect(rollThrowFace({ throwProfile: 'bell' })).toBe(3);

    jest.restoreAllMocks();
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5);

    expect(rollThrowFace({ throwProfile: 'masters' })).toBe(3);
  });
});
