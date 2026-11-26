
import {
  BookOpen,
  Clock,
  CircleCheck,
  Layers,
  Plus,
  FileUp,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

import type { Word, Page } from '../types';

import {
  getDueWords,
  isMastered,
  getWordStatus
} from '../utils/repetition';

interface Props {
  words: Word[];
  dailyGoal: number;
  onNavigate: (page: Page) => void;
  onAdd: () => void;
  onImport: () => void;
}

export default function Home({
  words,
  dailyGoal,
  onNavigate,
  onAdd,
  onImport
}: Props) {
  const dueIds = new Set([
    ...getDueWords(words, 'pl-ru').map(word => word.id),
    ...getDueWords(words, 'ru-pl').map(word => word.id)
  ]);

  const mastered = words.filter(isMastered).length;

  const newWords = words.filter(
    word => getWordStatus(word) === 'new'
  ).length;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const reviewedToday = words.filter(word =>
    Object.values(word.progress).some(
      progress =>
        progress.lastReviewed !== null &&
        progress.lastReviewed >= todayStart
    )
  ).length;



  const progress = Math.min(
    100,
    Math.round(reviewedToday / dailyGoal * 100)
  );

  const date = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="page home-page">
      <section className="home-heading">
        <p className="current-date">{date}</p>
        <h2>Обзор обучения</h2>
      </section>

      <section className="daily-card">
        <div className="daily-info">
          <span className="muted">Дневная цель</span>

          <div className="daily-number">
            {reviewedToday}
            <span> / {dailyGoal}</span>
          </div>

          <p>слов повторено сегодня</p>
        </div>

        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(
              var(--primary) ${progress}%,
              #e9edf5 ${progress}%
            )`
          }}
        >
          <div className="progress-ring-inner">
            {progress}%
          </div>
        </div>
      </section>

      <button
        className="learn-card"
        onClick={() => onNavigate('learn')}
      >
        <div className="learn-card-top">
          <span>ЕЖЕДНЕВНАЯ ПРАКТИКА</span>
          <Layers size={24} strokeWidth={1.7} />
        </div>

        <h2>Повторение слов</h2>

        <p>
          {dueIds.size > 0
            ? `${dueIds.size} слов готовы к изучению`
            : 'Начни новую тренировку'}
        </p>

        <div className="learn-card-footer">
          <span>Начать тренировку</span>
          <ArrowRight size={20} />
        </div>
      </button>

      <section className="home-section">
        <div className="section-title">
          <h3>Моя коллекция</h3>

          <button
            className="text-button"
            onClick={() => onNavigate('dictionary')}
          >
            Открыть
          </button>
        </div>

        <div className="grouped-list">
          <button
            className="list-row"
            onClick={() => onNavigate('dictionary')}
          >
            <div className="list-icon">
              <BookOpen size={20} />
            </div>

            <span>Все слова</span>

            <strong>{words.length}</strong>

            <ChevronRight
              className="row-chevron"
              size={17}
            />
          </button>

          <div className="list-row">
            <div className="list-icon">
              <Clock size={20} />
            </div>

            <span>Новые слова</span>

            <strong>{newWords}</strong>
          </div>

          <div className="list-row">
            <div className="list-icon">
              <CircleCheck size={20} />
            </div>

            <span>Изученные</span>

            <strong>{mastered}</strong>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-title">
          <h3>Быстрые действия</h3>
        </div>

        <div className="grouped-list">
          <button
            className="list-row"
            onClick={onAdd}
          >
            <div className="list-icon">
              <Plus size={20} />
            </div>

            <span>Добавить слово</span>

            <ChevronRight
              className="row-chevron"
              size={17}
            />
          </button>

          <button
            className="list-row"
            onClick={onImport}
          >
            <div className="list-icon">
              <FileUp size={20} />
            </div>

            <span>Импортировать файл</span>

            <ChevronRight
              className="row-chevron"
              size={17}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
