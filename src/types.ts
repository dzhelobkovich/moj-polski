
export type Page =
  | 'home'
  | 'learn'
  | 'dictionary'
  | 'stats';

export type Direction = 'pl-ru' | 'ru-pl';

export type LearningMode =
  | 'flashcards'
  | 'writing'
  | 'test'
  | 'listening'
  | 'listening-translation';

  
export type Rating =
  | 'again'
  | 'hard'
  | 'good'
  | 'easy';

export type TrainingSource =
  | 'due'
  | 'new'
  | 'difficult'
  | 'all';

export interface TrainingSettings {
  mode: LearningMode;
  direction: Direction;
  source: TrainingSource;
  category: string;
  limit: number;
}

export interface ReviewProgress {
  repetitions: number;
  interval: number;
  nextReview: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: number | null;
}

export interface Word {
  id: string;
  polish: string;
  russian: string;
  example: string;
  category: string;
  createdAt: number;
  progress: Record<Direction, ReviewProgress>;
}

export interface WordInput {
  polish: string;
  russian: string;
  example: string;
  category: string;
}

export interface ReviewRecord {
  wordId: string;
  direction: Direction;
  rating: Rating;
  date: number;
  mode?: LearningMode;
}

export interface AppData {
  words: Word[];
  reviews: ReviewRecord[];
  dailyGoal?: number;
}

export interface TrainingResult {
  wordId: string;
  rating: Rating;
}

export function createProgress(): ReviewProgress {
  return {
    repetitions: 0,
    interval: 0,
    nextReview: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null
  };
}

export function createWord(input: WordInput): Word {
  return {
    id: crypto.randomUUID(),
    polish: input.polish.trim(),
    russian: input.russian.trim(),
    example: input.example.trim(),
    category:
      input.category.trim() || 'Без категории',
    createdAt: Date.now(),
    progress: {
      'pl-ru': createProgress(),
      'ru-pl': createProgress()
    }
  };
}
