
import type {
  Word,
  Direction,
  Rating,
  ReviewProgress
} from '../types';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

const INTERVALS = [
  1, 3, 7, 14, 30, 60, 120
];

export function calculateReview(
  progress: ReviewProgress,
  rating: Rating
): ReviewProgress {
  const now = Date.now();

  let repetitions = progress.repetitions;
  let interval = progress.interval;

  let correctCount = progress.correctCount;
  let incorrectCount = progress.incorrectCount;

  if (rating === 'again') {
    repetitions = 0;
    interval = MINUTE;
    incorrectCount++;
  }

  if (rating === 'hard') {
    interval = 10 * MINUTE;
    repetitions = Math.max(0, repetitions - 1);
    correctCount++;
  }

  if (rating === 'good') {
    const index = Math.min(
      repetitions,
      INTERVALS.length - 1
    );

    interval = INTERVALS[index] * DAY;
    repetitions++;
    correctCount++;
  }

  if (rating === 'easy') {
    const index = Math.min(
      repetitions + 1,
      INTERVALS.length - 1
    );

    interval = INTERVALS[index] * DAY;
    repetitions += 2;
    correctCount++;
  }

  return {
    repetitions,
    interval,
    nextReview: now + interval,
    correctCount,
    incorrectCount,
    lastReviewed: now
  };
}

export function getDueWords(
  words: Word[],
  direction: Direction
): Word[] {
  const now = Date.now();

  return words
    .filter(word =>
      word.progress[direction].nextReview <= now
    )
    .sort((a, b) => {
      const first = a.progress[direction];
      const second = b.progress[direction];

      const firstIsNew = first.lastReviewed === null;
      const secondIsNew = second.lastReviewed === null;

      if (firstIsNew !== secondIsNew) {
        return firstIsNew ? 1 : -1;
      }

      return first.nextReview - second.nextReview;
    });
}

export function isMastered(word: Word): boolean {
  return (
    word.progress['pl-ru'].repetitions >= 5 &&
    word.progress['ru-pl'].repetitions >= 5
  );
}

export function getWordStatus(
  word: Word
): 'new' | 'learning' | 'mastered' {
  if (isMastered(word)) {
    return 'mastered';
  }

  if (
    word.progress['pl-ru'].lastReviewed === null &&
    word.progress['ru-pl'].lastReviewed === null
  ) {
    return 'new';
  }

  return 'learning';
}

export function formatInterval(
  interval: number
): string {
  if (interval < DAY) {
    const minutes = Math.max(
      1,
      Math.round(interval / MINUTE)
    );

    return `${minutes} мин`;
  }

  return `${Math.round(interval / DAY)} дн`;
}
