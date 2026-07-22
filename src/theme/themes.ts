import { ImageSourcePropType } from 'react-native';

import { LocalImageAttachment, ThemeId } from '@/domain/models';
import { TranslationKey } from '@/i18n/translations';

export type ThemeDefinition = {
  id: ThemeId;
  labelKey: TranslationKey;
  image: ImageSourcePropType;
  titleColor: string;
  scrim: string;
  statusBar: 'light' | 'dark';
};

export const THEMES: ThemeDefinition[] = [
  {
    id: 'twilight',
    labelKey: 'themeTwilight',
    image: require('../../assets/backgrounds/twilight-nook.png'),
    titleColor: '#fff8ed',
    scrim: 'rgba(20, 30, 49, 0.24)',
    statusBar: 'light',
  },
  {
    id: 'winter',
    labelKey: 'themeWinter',
    image: require('../../assets/backgrounds/winter-window.png'),
    titleColor: '#263956',
    scrim: 'rgba(244, 247, 255, 0.08)',
    statusBar: 'dark',
  },
  {
    id: 'spring',
    labelKey: 'themeSpring',
    image: require('../../assets/backgrounds/spring-window.png'),
    titleColor: '#3d533e',
    scrim: 'rgba(255, 251, 235, 0.06)',
    statusBar: 'dark',
  },
  {
    id: 'autumn',
    labelKey: 'themeAutumn',
    image: require('../../assets/backgrounds/autumn-attic.png'),
    titleColor: '#fff8ed',
    scrim: 'rgba(67, 35, 35, 0.15)',
    statusBar: 'light',
  },
];

export function getTheme(
  themeId: ThemeId,
  customBackground: LocalImageAttachment | null = null,
): ThemeDefinition {
  const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0];
  if (!customBackground) return theme;
  return {
    ...theme,
    image: { uri: customBackground.uri },
    titleColor: '#fffaf4',
    scrim: 'rgba(18, 25, 38, 0.38)',
    statusBar: 'light',
  };
}
