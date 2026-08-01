import { MONTHS, MONTH_TITLES } from './calendar-locale';

describe('Ukrainian calendar month names', () => {
  test('uses nominative month names in standalone calendar headings', () => {
    expect(MONTH_TITLES.uk).toEqual([
      'Січень',
      'Лютий',
      'Березень',
      'Квітень',
      'Травень',
      'Червень',
      'Липень',
      'Серпень',
      'Вересень',
      'Жовтень',
      'Листопад',
      'Грудень',
    ]);
  });

  test('keeps genitive month names for full date labels', () => {
    expect(MONTHS.uk[7]).toBe('серпня');
    expect(MONTHS.uk[8]).toBe('вересня');
  });
});
