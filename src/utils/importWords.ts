
import Papa from 'papaparse';
import { createWord } from '../types';
import type { Word } from '../types';

export interface ImportResult {
  words: Word[];
  duplicates: number;
  invalid: number;
}

function normalize(value: string): string {
  return value
    .trim()
    .normalize('NFC')
    .toLocaleLowerCase('pl-PL');
}

function wordKey(polish: string, russian: string): string {
  return JSON.stringify([
    normalize(polish),
    normalize(russian)
  ]);
}

export function importWords(
  text: string,
  existingWords: Word[],
  defaultCategory = 'Импортированные'
): ImportResult {
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [';', '\t', ',']
  });

  const existingKeys = new Set(
    existingWords.map(word =>
      wordKey(word.polish, word.russian)
    )
  );

  const words: Word[] = [];

  let duplicates = 0;
  let invalid = 0;

  const invalidRows = new Set(
    result.errors
      .filter(error => typeof error.row === 'number')
      .map(error => error.row)
  );

  result.data.forEach((row, index) => {
    const polish = (row[0] || '').trim();
    const russian = (row[1] || '').trim();

    const example = (row[2] || '').trim();

    const category =
      (row[3] || '').trim() || defaultCategory;

    const headers = [
      'polish',
      'polski',
      'польский'
    ];

    if (
      index === 0 &&
      headers.includes(normalize(polish))
    ) {
      return;
    }

    if (
      invalidRows.has(index) ||
      !polish ||
      !russian ||
      row.length > 4
    ) {
      invalid++;
      return;
    }

    const key = wordKey(polish, russian);

    if (existingKeys.has(key)) {
      duplicates++;
      return;
    }

    const word = createWord({
      polish,
      russian,
      example,
      category
    });

    words.push(word);
    existingKeys.add(key);
  });

  return {
    words,
    duplicates,
    invalid
  };
}

export async function importWordsFromFile(
  file: File,
  existingWords: Word[],
  defaultCategory = 'Импортированные'
): Promise<ImportResult> {
  const text = await file.text();

  return importWords(
    text,
    existingWords,
    defaultCategory
  );
}
