import { ImageSourcePropType, Platform, TextStyle, ViewStyle } from 'react-native';

const serifFamily = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'serif',
});

export const urTheme = {
  colors: {
    parchmentBg: '#D8C29A',
    inkBrown: '#4A2E1C',
    boardDark: '#5B3A24',
    boardMid: '#8B5E3C',
    stoneLight: '#CDB692',
    stoneMid: '#B89A72',
    navyPanel: '#1F3A56',
    navyPanelDark: '#162C43',
    goldAccent: '#C89B3C',
    turquoiseAccent: '#4EA8A3',
    orangeAccent: '#D98A3A',
    shadowDark: 'rgba(0,0,0,0.42)',
    night: '#0D1117',
    ink: '#1C1410',
    tableOak: '#3E2A1F',
    tableWalnut: '#1E120C',
    tableAsh: '#5A3C2D',
    lapis: '#1A4A8A',
    lapisBright: '#2E6FD8',
    carnelian: '#C4451A',
    carnelianBright: '#E8622E',
    gold: '#C8981E',
    goldBright: '#F0C040',
    shell: '#F2E8D5',
    bitumen: '#1A1208',
    amber: '#B8651A',
    cedar: '#7A4228',
    clay: '#5A2E10',
    sand: '#D4BC9A',
    ivory: '#EFE3C8',
    obsidian: '#0D0F12',
    glow: '#5AA8FF',
    goldGlow: '#F0C040',
    smoke: '#2E3238',
    parchment: '#E8D2B0',
    ember: '#F0A840',
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
  board: {
    widthRatioBaseline: 0.21,
    frameOuterBorder: 2,
    frameInnerBorder: 1,
    tileGap: 3,
    tileRadius: 4,
    frameRadius: 6,
    insetShadowOpacity: 0.26,
    textureOpacity: 0.16,
  },
  hud: {
    badgeMinWidth: 120,
    capsuleRadius: 18,
    borderWidth: 1.2,
    textureOpacity: 0.18,
    shadowOpacity: 0.3,
  },
  scoreBadge: {
    labelSize: 10,
    valueSize: 26,
    radius: 12,
    borderWidth: 1.1,
  },
  reserve: {
    barHeight: 74,
    segmentGap: 6,
    tokenSpacing: 6,
    radius: 20,
  },
  turnPanel: {
    minHeight: 66,
    statusDot: 13,
    radius: 20,
  },
  cta: {
    minHeight: 140,
    triangleSize: 34,
    radius: 20,
    borderWidth: 1.4,
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
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    deep: {
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  },
} as const;

export const urShadows: Record<'soft' | 'deep', ViewStyle> = {
  soft: urTheme.shadow.soft,
  deep: urTheme.shadow.deep,
};

export const urTypography: Record<'title' | 'subtitle' | 'label', TextStyle> = {
  title: {
    fontFamily: serifFamily,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: serifFamily,
    letterSpacing: 0.6,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
