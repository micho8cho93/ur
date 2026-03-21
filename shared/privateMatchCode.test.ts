import {
  PRIVATE_MATCH_CODE_LENGTH,
  generatePrivateMatchCode,
  isPrivateMatchCode,
  normalizePrivateMatchCodeInput,
} from './privateMatchCode';

describe('privateMatchCode', () => {
  it('normalizes pasted invite codes into the supported character set', () => {
    expect(normalizePrivateMatchCodeInput(' ej5-4@4dt! ')).toBe('EJ544DT');
  });

  it('validates normalized invite codes by exact length', () => {
    expect(isPrivateMatchCode('EJ544DTQ')).toBe(true);
    expect(isPrivateMatchCode('EJ54')).toBe(false);
    expect(isPrivateMatchCode('EJ54I0OQ')).toBe(false);
  });

  it('generates fixed-length invite codes', () => {
    const code = generatePrivateMatchCode(() => 0);

    expect(code).toHaveLength(PRIVATE_MATCH_CODE_LENGTH);
    expect(code).toBe('AAAAAAAA');
  });
});
