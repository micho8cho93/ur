import { ImageSourcePropType, TextStyle, ViewStyle } from 'react-native';
import { boxShadow, textShadow } from './styleEffects';

const lilitaBodyFamily = 'LilitaOneBody';

export const urTheme = {
  colors: {
    night: '#150F08',
    ink: '#24170E',
    tableOak: '#5A3A1A',
    tableWalnut: '#3B260F',
    tableAsh: '#7B542B',
    lapis: '#225D8F',
    lapisBright: '#2D9CDB',
    carnelian: '#B95C20',
    carnelianBright: '#D97A2B',
    gold: '#F4C542',
    goldBright: '#FFE27A',
    goldShadow: '#B8860B',
    shell: '#FFF3C4',
    bitumen: '#28190E',
    amber: '#D69A2C',
    cedar: '#5A3A1A',
    clay: '#704621',
    sand: '#DFC08A',
    ivory: '#FFF3C4',
    obsidian: '#100B07',
    glow: '#2D9CDB',
    goldGlow: '#FFE27A',
    smoke: '#4B3521',
    parchment: '#E6D3A3',
    ember: '#D97A2B',
    deepShadow: '#3B260F',
  },
  radii: { xs: 6, sm: 10, md: 16, lg: 24, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 },
  layout: {
    stage: {
      maxWidth: 1040,
      sideRailMin: 200,
      sideRailMax: 320,
      gutter: 18,
    },
    rail: {
      tokenSize: 44,
      overlap: 16,
    },
    boardMax: 760,
  },
  playerPalette: {
    dark: {
      shell: '#141C2E',
      rim: '#C09030',
      core: '#2A5AAE',
      center: '#8AB8FF',
      inlay: '#D4E8FF',
      shadow: '#060810',
    },
    light: {
      shell: '#C04818',
      rim: '#F0C840',
      core: '#E86828',
      center: '#FFE8C8',
      inlay: '#FFF4E8',
      shadow: '#3A1008',
    },
  } as const,
  materials: {
    woodDark: '#12263A',
    woodMid: '#1E3550',
    inlayGold: '#C58D3C',
    lapis: '#1B4D8F',
    obsidian: '#101318',
  },
  motion: {
    duration: {
      fast: 160,
      base: 320,
      slow: 680,
      epic: 1200,
    },
    spring: {
      tight: { mass: 0.45, damping: 10, stiffness: 210 },
      game: { mass: 0.58, damping: 8, stiffness: 180 },
      settle: { mass: 0.62, damping: 11, stiffness: 155 },
    },
    curves: {
      pulse: [0.22, 0.61, 0.36, 1] as const,
      sweep: [0.19, 1, 0.22, 1] as const,
    },
  },
  fx: {
    vignette: 0.34,
    ambientGlow: 0.2,
    focusGlow: 0.72,
    pulseMin: 0.24,
    pulseMax: 0.92,
  },
  shadow: {
    soft: {
      ...boxShadow({
        color: '#000',
        opacity: 0.18,
        offset: { width: 0, height: 6 },
        blurRadius: 10,
        elevation: 4,
      }),
    },
    deep: {
      ...boxShadow({
        color: '#000',
        opacity: 0.28,
        offset: { width: 0, height: 10 },
        blurRadius: 16,
        elevation: 8,
      }),
    },
  },
} as const;

export const urShadows: Record<'soft' | 'deep', ViewStyle> = {
  soft: urTheme.shadow.soft,
  deep: urTheme.shadow.deep,
};

export const urTextColors = {
  titleOnScene: urTheme.colors.ivory,
  titleOnPanel: urTheme.colors.cedar,
  bodyOnScene: urTheme.colors.parchment,
  bodyOnPanel: '#6E4C27',
  bodyMutedOnPanel: 'rgba(90, 58, 26, 0.74)',
  captionOnScene: urTheme.colors.goldBright,
  captionOnPanel: '#8A611B',
  buttonOnGold: urTheme.colors.ivory,
  buttonOnStone: urTheme.colors.cedar,
  statusGood: '#7FBF3E',
  statusDanger: '#B84F41',
  jewel: urTheme.colors.glow,
} as const;

export const urPanelColors = {
  sceneOverlay: 'rgba(59, 38, 15, 0.14)',
  parchmentSurface: 'rgba(255, 243, 196, 0.72)',
  parchmentSurfaceStrong: 'rgba(255, 243, 196, 0.82)',
  parchmentBorder: 'rgba(184, 134, 11, 0.3)',
  parchmentInnerBorder: 'rgba(255, 226, 122, 0.34)',
  darkSurface: 'rgba(35, 22, 11, 0.82)',
  darkSurfaceSoft: 'rgba(50, 32, 17, 0.72)',
  darkBorder: 'rgba(244, 197, 66, 0.34)',
  darkBorderStrong: 'rgba(255, 226, 122, 0.52)',
  topGlow: 'rgba(255, 226, 122, 0.2)',
  bottomShade: 'rgba(59, 38, 15, 0.18)',
  badgeSurface: 'rgba(255, 239, 196, 0.7)',
  badgeBorder: 'rgba(184, 134, 11, 0.26)',
  accentBlueSurface: 'rgba(45, 156, 219, 0.16)',
} as const;

type UrTextVariant =
  | 'displayTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'body'
  | 'buttonLabel'
  | 'caption';

export const urTextVariants: Record<UrTextVariant, TextStyle> = {
  displayTitle: {
    textAlign: 'center',
    letterSpacing: 0.7,
    ...textShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.94,
      offset: { width: 0, height: 3 },
      blurRadius: 2,
    }),
  },
  sectionTitle: {
    textAlign: 'center',
    letterSpacing: 0.45,
    ...textShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.76,
      offset: { width: 0, height: 2 },
      blurRadius: 2,
    }),
  },
  cardTitle: {
    textAlign: 'center',
    letterSpacing: 0.32,
    ...textShadow({
      color: urTheme.colors.goldBright,
      opacity: 0.42,
      offset: { width: 0, height: 1 },
      blurRadius: 1,
    }),
  },
  body: {
    letterSpacing: 0.08,
  },
  buttonLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.72,
    ...textShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.88,
      offset: { width: 0, height: 2 },
      blurRadius: 1,
    }),
  },
  caption: {
    textTransform: 'uppercase',
    letterSpacing: 0.95,
  },
};

type UrButtonPaletteName = 'primary' | 'secondary' | 'outline' | 'disabled';

export const urRoyalButtonColors = {
  topHighlight: '#EDA164',
  topHighlightFade: '#E18346',
  mainFace: '#DB7942',
  faceMid: '#CA6737',
  midDepth: '#B1582F',
  faceBase: '#97492B',
  bottomLip: '#7D3822',
  bottomLipBase: '#612B1B',
  outerStroke: '#3A220F',
  innerHighlight: '#F8D0A4',
  capGloss: 'rgba(255, 228, 198, 0.5)',
  capGlossFade: 'rgba(255, 227, 197, 0)',
  faceHighlight: 'rgba(250, 192, 128, 0.24)',
  faceHighlightFade: 'rgba(250, 192, 128, 0)',
  faceGlow: 'rgba(255, 231, 214, 0.12)',
  seamShadow: 'rgba(58, 34, 15, 0.22)',
  seamShadowFade: 'rgba(58, 34, 15, 0)',
  lipHighlight: 'rgba(255, 222, 202, 0.22)',
  lipShade: 'rgba(58, 34, 15, 0.26)',
  pressedWash: 'rgba(58, 34, 15, 0.08)',
  disabledWash: 'rgba(59, 38, 15, 0.16)',
  focusGlow: 'rgba(224, 138, 98, 0.32)',
  text: urTheme.colors.ivory,
} as const;

type UrButtonPalette = {
  lip: string;
  face: string;
  faceLowlight: string;
  border: string;
  gloss: string;
  sheen: string;
  text: string;
};

export const urButtonPalettes: Record<UrButtonPaletteName, UrButtonPalette> = {
  primary: {
    lip: urRoyalButtonColors.bottomLip,
    face: urRoyalButtonColors.mainFace,
    faceLowlight: urRoyalButtonColors.seamShadow,
    border: urRoyalButtonColors.innerHighlight,
    gloss: urRoyalButtonColors.capGloss,
    sheen: urRoyalButtonColors.faceHighlight,
    text: urRoyalButtonColors.text,
  },
  secondary: {
    lip: '#6A4822',
    face: '#C59450',
    faceLowlight: 'rgba(90, 58, 26, 0.22)',
    border: '#F4D58E',
    gloss: 'rgba(255, 243, 196, 0.26)',
    sheen: 'rgba(255, 226, 122, 0.12)',
    text: urTextColors.buttonOnStone,
  },
  outline: {
    lip: '#4B3116',
    face: 'rgba(63, 40, 18, 0.84)',
    faceLowlight: 'rgba(17, 11, 7, 0.22)',
    border: urTheme.colors.gold,
    gloss: 'rgba(255, 226, 122, 0.12)',
    sheen: 'rgba(255, 226, 122, 0.08)',
    text: urTextColors.titleOnScene,
  },
  disabled: {
    lip: '#6B5A43',
    face: '#9D8A6E',
    faceLowlight: 'rgba(59, 38, 15, 0.16)',
    border: 'rgba(255, 226, 122, 0.28)',
    gloss: 'rgba(255, 248, 226, 0.16)',
    sheen: 'rgba(255, 226, 122, 0.06)',
    text: 'rgba(255, 243, 196, 0.72)',
  },
};

export const urTypography: Record<'title' | 'subtitle' | 'label', TextStyle> = {
  title: {
    fontFamily: lilitaBodyFamily,
    letterSpacing: 0.9,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: lilitaBodyFamily,
    letterSpacing: 0.38,
  },
  label: {
    fontFamily: lilitaBodyFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
};

export const urTextures: Record<
  'wood' | 'woodDark' | 'rosette' | 'goldInlay' | 'border' | 'lapisMosaic',
  ImageSourcePropType
> = {
  wood: require('../assets/textures/texture-wood-grain.png'),
  woodDark: require('../assets/textures/texture-wood-grain-dark.png'),
  rosette: require('../assets/textures/texture-rosette-pattern.png'),
  goldInlay: require('../assets/textures/texture-inlaid-gold-pattern.png'),
  border: require('../assets/textures/texture-gold-inlay-border-weathered.png'),
  lapisMosaic: require('../assets/textures/texture-lapis-mosaic.png'),
};
