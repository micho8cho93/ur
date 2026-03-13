import { Platform, TextStyle, ViewStyle } from 'react-native';

type ShadowOffset = {
  width?: number;
  height?: number;
};

type ShadowConfig = {
  color: string;
  opacity?: number;
  offset?: ShadowOffset;
  blurRadius?: number;
  spreadDistance?: number;
  inset?: boolean;
  elevation?: number;
};

type TextShadowConfig = {
  color: string;
  opacity?: number;
  offset?: ShadowOffset;
  blurRadius?: number;
};

type WebTextStyle = TextStyle & {
  textShadow?: string;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const parseHexColor = (value: string) => {
  const hex = value.replace('#', '').trim();

  if (hex.length === 3) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }

  if (hex.length === 4) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
      a: Number.parseInt(hex[3] + hex[3], 16) / 255,
    };
  }

  if (hex.length === 6) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  if (hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: Number.parseInt(hex.slice(6, 8), 16) / 255,
    };
  }

  return null;
};

const parseRgbColor = (value: string) => {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .split(',')
    .map((part) => part.trim())
    .map(Number);

  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) {
    return null;
  }

  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: clamp(Number.isNaN(parts[3]) ? 1 : parts[3]),
  };
};

const resolveShadowColor = (color: string, opacity = 1) => {
  if (color === 'transparent') {
    return 'rgba(0, 0, 0, 0)';
  }

  const parsed = color.startsWith('#') ? parseHexColor(color) : parseRgbColor(color);
  if (!parsed) {
    return color;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${clamp(parsed.a * opacity)})`;
};

export const boxShadow = ({
  color,
  opacity = 1,
  offset = { width: 0, height: 0 },
  blurRadius = 0,
  spreadDistance = 0,
  inset = false,
  elevation,
}: ShadowConfig): ViewStyle => ({
  boxShadow: [
    {
      color: resolveShadowColor(color, opacity),
      offsetX: offset.width ?? 0,
      offsetY: offset.height ?? 0,
      blurRadius,
      spreadDistance,
      inset,
    },
  ],
  ...(Platform.OS === 'android' && elevation != null ? { elevation } : {}),
});

export const textShadow = ({
  color,
  opacity = 1,
  offset = { width: 0, height: 0 },
  blurRadius = 0,
}: TextShadowConfig): WebTextStyle =>
  Platform.select<WebTextStyle>({
    web: {
      textShadow: `${offset.width ?? 0}px ${offset.height ?? 0}px ${blurRadius}px ${resolveShadowColor(color, opacity)}`,
    },
    default: {
      textShadowColor: resolveShadowColor(color, opacity),
      textShadowOffset: {
        width: offset.width ?? 0,
        height: offset.height ?? 0,
      },
      textShadowRadius: blurRadius,
    },
  }) ?? {};
