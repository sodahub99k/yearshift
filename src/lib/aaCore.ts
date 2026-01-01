import { DIGIT_ART, DIGIT_HEIGHT, DIGIT_WIDTH } from "./digitArt.ts";

const BLANK_CELL = " ".repeat(DIGIT_WIDTH);

type DigitChar = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Year4 = string;

interface CellData {
  rows8: readonly [string, string, string, string, string, string, string, string];
}

const isYear4 = (value: unknown): value is Year4 =>
  typeof value === "string" && /^[0-9]{4}$/.test(value);

const rtrim = (value: string): string => value.replace(/ +$/u, "");

const getGlyph = (digit: DigitChar): readonly [string, string, string, string, string, string] | null => {
  const glyph = DIGIT_ART[digit];
  if (!glyph || !Array.isArray(glyph) || glyph.length !== DIGIT_HEIGHT) return null;
  if (glyph.some((row) => typeof row !== "string")) return null;
  return glyph;
};

const makeStaticCell = (digit: DigitChar): CellData | null => {
  const glyph = getGlyph(digit);
  if (!glyph) return null;
  return { rows8: [BLANK_CELL, ...glyph, BLANK_CELL] as const };
};

const makeShiftCell = (fromDigit: DigitChar, toDigit: DigitChar): CellData | null => {
  const fromGlyph = getGlyph(fromDigit);
  const toGlyph = getGlyph(toDigit);
  if (!fromGlyph || !toGlyph) return null;

  const stack = [...toGlyph, ...fromGlyph];
  const shift = 3;

  const topOverflow = stack[shift - 1] ?? BLANK_CELL;
  const window6 = stack.slice(shift, shift + DIGIT_HEIGHT);
  while (window6.length < DIGIT_HEIGHT) window6.push(BLANK_CELL);
  const bottomOverflow = stack[shift + DIGIT_HEIGHT] ?? BLANK_CELL;

  const rows8: readonly [string, string, string, string, string, string, string, string] = [
    topOverflow,
    window6[0] ?? BLANK_CELL,
    window6[1] ?? BLANK_CELL,
    window6[2] ?? BLANK_CELL,
    window6[3] ?? BLANK_CELL,
    window6[4] ?? BLANK_CELL,
    window6[5] ?? BLANK_CELL,
    bottomOverflow,
  ];

  return { rows8 };
};

const renderFrame = (cells: readonly CellData[]): string => {
  const rows = Array.from({ length: 8 }, () => "");
  for (let row = 0; row < 8; row += 1) {
    rows[row] = cells.map((cell) => cell.rows8[row] ?? BLANK_CELL).join("");
  }

  const top = rtrim(rows[0]);
  const bottom = rtrim(rows[7]);
  const middle = rows.slice(1, 7).map((line) => rtrim(line));

  // 最大幅を求め、全行をその幅に揃える（左詰めでパディング）
  const allLines = [top, ...middle, bottom];
  const maxWidth = Math.max(...allLines.map((line) => line.length));
  const padLine = (line: string) => line.padEnd(maxWidth, " ");

  const output = [];
  if (top.length > 0) output.push(padLine(top));
  output.push(...middle.map(padLine));
  if (bottom.length > 0) output.push(padLine(bottom));
  return output.join("\n");
};

export const buildShiftAscii = (fromYear: Year4, toYear: Year4): string => {
  if (!isYear4(fromYear) || !isYear4(toYear)) return "";

  const fromDigits = fromYear.split("") as [DigitChar, DigitChar, DigitChar, DigitChar];
  const toDigits = toYear.split("") as [DigitChar, DigitChar, DigitChar, DigitChar];

  const cells: CellData[] = [];
  for (let i = 0; i < 4; i += 1) {
    const fromDigit = fromDigits[i];
    const toDigit = toDigits[i];
    const cell = fromDigit === toDigit ? makeStaticCell(toDigit) : makeShiftCell(fromDigit, toDigit);
    if (!cell) return "";
    cells.push(cell);
  }

  return renderFrame(cells);
};
