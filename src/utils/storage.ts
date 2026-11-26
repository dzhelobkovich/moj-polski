
import type { AppData } from '../types';

const STORAGE_KEY = 'moj-polski-data-v1';

export function loadData(): AppData {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      words: [],
      reviews: []
    };
  }

  const data = JSON.parse(saved) as AppData;

  if (
    !Array.isArray(data.words) ||
    !Array.isArray(data.reviews)
  ) {
    throw new Error('Не удалось прочитать данные');
  }

  return data;
}

export function saveData(data: AppData): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

export function exportBackup(data: AppData): void {
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  link.href = url;
  link.download = `moj-polski-backup-${date}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Validate before replacing any existing data.
export function parseBackup(text: string): AppData {
  const data = JSON.parse(text) as AppData;
  const fail = () => { throw new Error('Некорректный файл резервной копии'); };
  const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  if (!data || !Array.isArray(data.words) || !Array.isArray(data.reviews)) fail();
  const ids = new Set<string>();
  for (const w of data.words) {
    if (!w || !['id','polish','russian','example','category'].every(k => typeof w[k as keyof typeof w] === 'string') || !w.id || !w.polish.trim() || !w.russian.trim() || ids.has(w.id) || !number(w.createdAt)) fail();
    ids.add(w.id);
    for (const d of ['pl-ru','ru-pl'] as const) {
      const p = w.progress?.[d];
      if (!p || ![p.repetitions,p.interval,p.nextReview,p.correctCount,p.incorrectCount].every(number) || !(p.lastReviewed === null || number(p.lastReviewed))) fail();
    }
  }
  for (const r of data.reviews) {
    if (!r || typeof r.wordId !== 'string' || !['pl-ru','ru-pl'].includes(r.direction) || !['again','hard','good','easy'].includes(r.rating) || !number(r.date) || (r.mode !== undefined && !['flashcards','writing','test','listening','listening-translation'].includes(r.mode))) fail();
  }
  if (data.dailyGoal !== undefined && ![10,20,30,50].includes(data.dailyGoal)) fail();
  return {words: data.words, reviews: data.reviews, dailyGoal: data.dailyGoal ?? 20};
}
