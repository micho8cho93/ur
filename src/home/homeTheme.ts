import { urTypography } from '@/constants/urTheme';

export type HomeLayoutVariant = 'desktop' | 'compact';

export const HOME_SUPERCELL_FONT_FAMILY = 'SupercellMagicRegular';
export const HOME_FREDOKA_FONT_FAMILY = 'LilitaOneBody';
export const HOME_GROBOLD_FONT_FAMILY = 'LilitaOneButton';

export const resolveHomeMagicFontFamily = (fontLoaded: boolean): string =>
  fontLoaded ? HOME_SUPERCELL_FONT_FAMILY : urTypography.title.fontFamily ?? 'serif';

export const resolveHomeFredokaFontFamily = (fontLoaded: boolean): string =>
  fontLoaded ? HOME_FREDOKA_FONT_FAMILY : urTypography.title.fontFamily ?? 'serif';

export const resolveHomeButtonFontFamily = (fontLoaded: boolean): string =>
  fontLoaded ? HOME_GROBOLD_FONT_FAMILY : urTypography.title.fontFamily ?? 'serif';

export const resolveHomeUsernameFontFamily = resolveHomeFredokaFontFamily;
