import { TranslationKey } from '@/i18n/translations';

export type SheetIcon = {
  id: string;
  glyph: string;
  labelKey: TranslationKey;
};

export const SHEET_ICONS: SheetIcon[] = [
  { id: 'general', glyph: '📝', labelKey: 'iconGeneral' },
  { id: 'work', glyph: '💼', labelKey: 'iconWork' },
  { id: 'home', glyph: '🏠', labelKey: 'iconHome' },
  { id: 'shopping', glyph: '🛒', labelKey: 'iconShopping' },
  { id: 'study', glyph: '📚', labelKey: 'iconStudy' },
  { id: 'health', glyph: '💗', labelKey: 'iconHealth' },
  { id: 'travel', glyph: '✈️', labelKey: 'iconTravel' },
  { id: 'finance', glyph: '💰', labelKey: 'iconFinance' },
  { id: 'family', glyph: '👨‍👩‍👧', labelKey: 'iconFamily' },
  { id: 'important', glyph: '⭐', labelKey: 'iconImportant' },
  { id: 'diy', glyph: '🛠️', labelKey: 'iconDiy' },
  { id: 'fun', glyph: '🎵', labelKey: 'iconFun' },
];

export function iconGlyph(iconId: string): string {
  return SHEET_ICONS.find((icon) => icon.id === iconId)?.glyph ?? '📝';
}
