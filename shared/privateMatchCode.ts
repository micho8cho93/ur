const PRIVATE_MATCH_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const PRIVATE_MATCH_CODE_LENGTH = 8;

const PRIVATE_MATCH_CODE_CHARACTER_SET = new Set(PRIVATE_MATCH_CODE_ALPHABET.split(''));

export const normalizePrivateMatchCodeInput = (value: string): string =>
  value
    .toUpperCase()
    .split('')
    .filter((character) => PRIVATE_MATCH_CODE_CHARACTER_SET.has(character))
    .join('')
    .slice(0, PRIVATE_MATCH_CODE_LENGTH);

export const isPrivateMatchCode = (value: string): boolean =>
  normalizePrivateMatchCodeInput(value) === value && value.length === PRIVATE_MATCH_CODE_LENGTH;

export const generatePrivateMatchCode = (random: () => number = Math.random): string => {
  let code = '';

  for (let index = 0; index < PRIVATE_MATCH_CODE_LENGTH; index += 1) {
    const characterIndex = Math.floor(random() * PRIVATE_MATCH_CODE_ALPHABET.length);
    code += PRIVATE_MATCH_CODE_ALPHABET[characterIndex] ?? PRIVATE_MATCH_CODE_ALPHABET[0];
  }

  return code;
};
