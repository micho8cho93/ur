import React from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
} from 'react-native';

type ProgressionRankIconProps = {
  title?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

const rankIconSources: Record<string, ImageSourcePropType> = {
  Laborer: require('../../assets/ranks/laborer.png'),
  'Servant of the Temple': require('../../assets/ranks/servant_of_the_temple.png'),
  'Apprentice Scribe': require('../../assets/ranks/apprentice_scribe.png'),
  Scribe: require('../../assets/ranks/scribe.png'),
  Merchant: require('../../assets/ranks/merchant.png'),
  Artisan: require('../../assets/ranks/artisan.png'),
  Priest: require('../../assets/ranks/priest.png'),
  Diviner: require('../../assets/ranks/diviner.png'),
  'Royal Guard': require('../../assets/ranks/royal_guard.png'),
  'Noble of the Court': require('../../assets/ranks/noble_of_the_court.png'),
  Governor: require('../../assets/ranks/governor.png'),
  Royalty: require('../../assets/ranks/royalty.png'),
  'High Priest': require('../../assets/ranks/high_priest.png'),
  'Emperor of Sumer & Akkad': require('../../assets/ranks/emperor_of_sumer_and_akkad.png'),
  Immortal: require('../../assets/ranks/immortal.png'),
};

const normalizeRankTitle = (title: string): string => (title === 'King' ? 'Royalty' : title);

export const ProgressionRankIcon: React.FC<ProgressionRankIconProps> = ({
  title,
  size = 40,
  style,
  accessibilityLabel,
  testID,
}) => {
  if (!title) {
    return null;
  }

  const source = rankIconSources[normalizeRankTitle(title)];
  if (!source) {
    return null;
  }

  return (
    <Image
      accessible
      source={source}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${title} rank badge`}
      testID={testID}
      style={[{ width: size, height: size }, style]}
    />
  );
};
