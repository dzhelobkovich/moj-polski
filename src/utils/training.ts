
import type {
  Word,
  Direction,
  TrainingSettings
} from '../types';

import { getDueWords } from './repetition';

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] =
      [result[j], result[i]];
  }

  return result;
}

export function getQuestion(
  word: Word,
  direction: Direction
): string {
  return direction === 'pl-ru'
    ? word.polish
    : word.russian;
}

export function getAnswer(
  word: Word,
  direction: Direction
): string {
  return direction === 'pl-ru'
    ? word.russian
    : word.polish;
}

export function normalizeAnswer(
  value: string
): string {
  return value
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function checkAnswer(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const normalized = normalizeAnswer(userAnswer);

  const variants = correctAnswer
    .split(/[;,/]/)
    .map(normalizeAnswer)
    .filter(Boolean);

  return (
    normalized === normalizeAnswer(correctAnswer) ||
    variants.includes(normalized)
  );
}

export function getTrainingWords(
  words: Word[],
  settings: TrainingSettings
): Word[] {
  const direction = settings.direction;

  let filtered = words.filter(word =>
    !settings.category ||
    word.category === settings.category
  );

  if (settings.source === 'due') {
    filtered = getDueWords(filtered, direction);
  }

  if (settings.source === 'new') {
    filtered = shuffle(
      filtered.filter(word =>
        word.progress[direction].lastReviewed === null
      )
    );
  }

  if (settings.source === 'difficult') {
    filtered = filtered
      .filter(word =>
        word.progress[direction].incorrectCount > 0
      )
      .sort((a, b) => {
        const first = a.progress[direction];
        const second = b.progress[direction];

        return (
          second.incorrectCount -
          first.incorrectCount
        );
      });
  }

  if (settings.source === 'all') {
    filtered = shuffle(filtered);
  }

  return settings.limit === 0
    ? filtered
    : filtered.slice(0, settings.limit);
}

export function getTestOptions(
  currentWord: Word,
  words: Word[],
  direction: Direction
): string[] {
  const correct = getAnswer(
    currentWord,
    direction
  );

  const unique = new Map<string, string>();

  for (const word of shuffle(words)) {
    const answer = getAnswer(word, direction);
    const key = normalizeAnswer(answer);

    if (
      key !== normalizeAnswer(correct) &&
      !checkAnswer(answer, correct) &&
      !checkAnswer(correct, answer)
    ) {
      unique.set(key, answer);
    }
  }

  const incorrect = [...unique.values()]
    .slice(0, 3);

  return shuffle([
    correct,
    ...incorrect
  ]);
}
