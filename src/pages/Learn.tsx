import { useState, useEffect } from 'react';

import {
  Languages,
  Layers,
  Keyboard,
  ListChecks,
  Headphones,
  Volume2,
  X,
  Check,
  ArrowRight,
  RotateCcw,
  CircleCheck
} from 'lucide-react';

import type {
  Word,
  Rating,
  LearningMode,
  Direction,
  TrainingSource,
  TrainingSettings,
  TrainingResult
} from '../types';

import {
  getTrainingWords,
  getQuestion,
  getAnswer,
  checkAnswer,
  getTestOptions
} from '../utils/training';

import {
  calculateReview,
  formatInterval
} from '../utils/repetition';

import {
  speakPolish,
  stopSpeech,
  loadSpeechRate,
  saveSpeechRate
} from '../utils/speech';

import type { SpeechRate } from '../utils/speech';

import '../Learn.css';

interface Props {
  words: Word[];

  onReview: (
    wordId: string,
    direction: Direction,
    rating: Rating,
    mode: LearningMode
  ) => void;

  onOpenDictionary: () => void;
}


const modes = [
  {
    id: 'flashcards',
    title: 'Карточки',
    description: 'Запоминай слова и выражения',
    icon: Layers
  },
  {
    id: 'writing',
    title: 'Письмо',
    description: 'Вводи перевод самостоятельно',
    icon: Keyboard
  },
  {
    id: 'test',
    title: 'Тест',
    description: 'Выбирай правильный перевод',
    icon: ListChecks
  },
  {
    id: 'listening',
    title: 'Диктант',
    description: 'Слушай и записывай на польском',
    icon: Headphones
  },
  {
    id: 'listening-translation',
    title: 'Понимание на слух',
    description: 'Слушай и переводи на русский',
    icon: Languages
  }
] as const;


const ratings = [
  { id: 'again', label: 'Не помню' },
  { id: 'hard', label: 'С трудом' },
  { id: 'good', label: 'Помню' },
  { id: 'easy', label: 'Легко' }
] as const;

const polishLetters = [
  'ą', 'ć', 'ę', 'ł', 'ń',
  'ó', 'ś', 'ź', 'ż'
];

export default function Learn({
  words,
  onReview,
  onOpenDictionary
}: Props) {
  const [settings, setSettings] =
    useState<TrainingSettings>({
      mode: 'flashcards',
      direction: 'ru-pl',
      source: 'due',
      category: '',
      limit: 20
    });

  const [stage, setStage] =
    useState<'setup' | 'training' | 'finished'>(
      'setup'
    );

  const [session, setSession] =
    useState<Word[]>([]);

  const [index, setIndex] = useState(0);

  const [revealed, setRevealed] =
    useState(false);

  const [answer, setAnswer] = useState('');

  const [checked, setChecked] =
    useState(false);

  const [correct, setCorrect] =
    useState(false);

  const [options, setOptions] =
    useState<string[]>([]);

  const [results, setResults] =
    useState<TrainingResult[]>([]);

  const [message, setMessage] = useState('');


const [speechRate, setSpeechRate] =
  useState<SpeechRate>(loadSpeechRate);

const isListening =
  settings.mode === 'listening' ||
  settings.mode === 'listening-translation';

useEffect(() => {
  saveSpeechRate(speechRate);
}, [speechRate]);

useEffect(() => {
  return () => stopSpeech();
}, []);

function getExpectedAnswer(word: Word): string {
  if (settings.mode === 'listening') {
    return word.polish;
  }

  if (settings.mode === 'listening-translation') {
    return word.russian;
  }

  return getAnswer(word, direction);
}


  const categories = [...new Set(
    words.map(word => word.category)
  )].sort();

const direction: Direction =
  settings.mode === 'listening'
    ? 'ru-pl'
    : settings.mode === 'listening-translation'
      ? 'pl-ru'
      : settings.direction;

  const availableWords = getTrainingWords(
    words,
    {
      ...settings,
      direction,
      limit: 0
    }
  );

  const currentWord = session[index];

  function selectMode(mode: LearningMode) {
    stopSpeech();
    setSettings(previous => ({
      ...previous,
      mode
    }));

    setMessage('');
  }

  function prepareQuestion(word: Word) {
    setAnswer('');
    setChecked(false);
    setCorrect(false);
    setRevealed(false);

    setOptions(
      getTestOptions(
        word,
        words,
        direction
      )
    );
  }

  function startTraining(
    selectedWords?: Word[]
  ) {
    const selected = selectedWords ??
      getTrainingWords(words, {
        ...settings,
        direction
      });

    if (selected.length === 0) {
      setMessage(
        'Нет слов для выбранной тренировки.'
      );

      return;
    }

    stopSpeech();
    setSession(selected);
    setIndex(0);
    setResults([]);
    setMessage('');

    prepareQuestion(selected[0]);

    setStage('training');
  }

  function closeTraining() {
    if (
      stage === 'training' &&
      !window.confirm('Завершить тренировку?')
    ) {
      return;
    }

    stopSpeech();
    setStage('setup');
    setMessage('');
  }

  function rateWord(rating: Rating) {
    stopSpeech();
    if (!currentWord) {
      return;
    }

    onReview(
      currentWord.id,
      direction,
      rating,
      settings.mode
    );

    setResults(previous => [
      ...previous,
      {
        wordId: currentWord.id,
        rating
      }
    ]);

    const nextIndex = index + 1;

    if (nextIndex >= session.length) {
      setStage('finished');
      return;
    }

    setIndex(nextIndex);

    prepareQuestion(session[nextIndex]);
  }

  function verifyAnswer(
    value = answer
  ) {
    if (
      !currentWord ||
      !value.trim() ||
      checked
    ) {
      return;
    }

const expected = getExpectedAnswer(currentWord);

    stopSpeech();
    setAnswer(value);

    setCorrect(
      checkAnswer(value, expected)
    );

    setChecked(true);
  }

function pronounce(text: string) {
  setMessage('');

  if (!speakPolish(text, speechRate)) {
    setMessage(
      'Озвучка недоступна на устройстве.'
    );
  }
}

  function retryMistakes() {
    const missedIds = new Set(
      results
        .filter(result =>
          result.rating === 'again' ||
          result.rating === 'hard'
        )
        .map(result => result.wordId)
    );

    startTraining(
      words.filter(word =>
        missedIds.has(word.id)
      )
    );
  }

  if (stage === 'setup') {
    return (
      <div className="page training-page">
        <div className="section-heading">
          <div>
            <h2>Тренировка</h2>
            <p>Выбери режим изучения</p>
          </div>
        </div>

        <div className="mode-list">
          {modes.map(mode => {
            const Icon = mode.icon;

            return (
              <button
                key={mode.id}
                className={
                  `mode-item ${
                    settings.mode === mode.id
                      ? 'selected'
                      : ''
                  }`
                }
                onClick={() =>
                  selectMode(mode.id)
                }
              >
                <div className="mode-icon">
                  <Icon size={22} />
                </div>

                <div className="mode-text">
                  <strong>{mode.title}</strong>
                  <span>{mode.description}</span>
                </div>

                <div className="radio-indicator">
                  {settings.mode === mode.id && (
                    <Check size={14} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!isListening && (
          <section className="training-section">
            <h3>Направление перевода</h3>

            <div className="segmented">
              <button
                className={
                  settings.direction === 'ru-pl'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  setSettings({
                    ...settings,
                    direction: 'ru-pl'
                  })
                }
              >
                RU → PL
              </button>

              <button
                className={
                  settings.direction === 'pl-ru'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  setSettings({
                    ...settings,
                    direction: 'pl-ru'
                  })
                }
              >
                PL → RU
              </button>
            </div>
          </section>
        )}



{isListening && (
  <section className="training-section">
    <h3>Скорость произношения</h3>

    <div className="speech-settings">
      <div className="speech-speed-grid">
        {([
          { rate: 0.6, label: 'Медленно' },
          { rate: 0.85, label: 'Учебная' },
          { rate: 1, label: 'Естественно' }
        ] as const).map(item => (
          <button
            key={item.rate}
            type="button"
            className={
              `speech-speed-button ${
                speechRate === item.rate
                  ? 'selected'
                  : ''
              }`
            }
            onClick={() => {
              stopSpeech();
              setSpeechRate(item.rate);
            }}
          >
            <strong>
              {item.rate === 1 ? '1.0' : item.rate}×
            </strong>

            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="speech-preview"
        onClick={() =>
          pronounce('Dzień dobry! Jak się masz?')
        }
      >
        <Volume2 size={18} />
        Проверить произношение
      </button>
    </div>
  </section>
)}



        <section className="training-section">
          <h3>Настройки</h3>

          <div className="training-settings">
            <label className="setting-row">
              <span>Слова</span>

              <select
                value={settings.source}
                onChange={event => {
                  setSettings({
                    ...settings,
                    source: event.target
                      .value as TrainingSource
                  });

                  setMessage('');
                }}
              >
                <option value="due">
                  К повторению
                </option>

                <option value="new">
                  Новые
                </option>

                <option value="difficult">
                  Сложные
                </option>

                <option value="all">
                  Все слова
                </option>
              </select>
            </label>

            <label className="setting-row">
              <span>Категория</span>

              <select
                value={settings.category}
                onChange={event =>
                  setSettings({
                    ...settings,
                    category: event.target.value
                  })
                }
              >
                <option value="">
                  Все категории
                </option>

                {categories.map(category => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="setting-row">
              <span>Количество</span>

              <select
                value={settings.limit}
                onChange={event =>
                  setSettings({
                    ...settings,
                    limit: Number(
                      event.target.value
                    )
                  })
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={0}>Все</option>
              </select>
            </label>
          </div>
        </section>

        <p className="training-available">
          Доступно слов: {availableWords.length}
        </p>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {words.length === 0 ? (
          <button
            className="primary-button"
            onClick={onOpenDictionary}
          >
            Добавить слова
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={availableWords.length === 0}
            onClick={() => startTraining()}
          >
            Начать тренировку
            <ArrowRight size={19} />
          </button>
        )}
      </div>
    );
  }

  if (stage === 'finished') {
    const remembered = results.filter(
      result =>
        result.rating === 'good' ||
        result.rating === 'easy'
    ).length;

    const missed =
      results.length - remembered;

    const percentage = results.length
      ? Math.round(
          remembered / results.length * 100
        )
      : 0;

    return (
      <div className="page">
        <section className="session-result">
          <div className="result-icon">
            <CircleCheck size={42} />
          </div>

          <h2>Тренировка завершена</h2>

          <strong className="result-percentage">
            {percentage}%
          </strong>

          <p className="muted">
            Уверенно вспомнила слова
          </p>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{remembered}</strong>
            <span>Помню</span>
          </div>

          <div className="stat-card">
            <strong>{missed}</strong>
            <span>Нужно повторить</span>
          </div>
        </div>

        {missed > 0 && (
          <button
            className="primary-button"
            onClick={retryMistakes}
          >
            <RotateCcw size={19} />
            Повторить сложные слова
          </button>
        )}

        <button
          className="secondary-button"
          onClick={() => setStage('setup')}
        >
          Новая тренировка
        </button>
      </div>
    );
  }

  if (!currentWord) {
    return null;
  }

  const question = getQuestion(
    currentWord,
    direction
  );

  const expected = getExpectedAnswer(currentWord);

  const progress =
    index / session.length * 100;

  return (
    <div className="page active-training">
      <div className="session-header">
        <button
          className="icon-button"
          onClick={closeTraining}
          aria-label="Закрыть тренировку"
        >
          <X size={24} />
        </button>

        <span>
          {index + 1} из {session.length}
        </span>

        <span className="session-counter">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="session-progress">
        <div
          style={{
            width: `${progress}%`
          }}
        />
      </div>

      <div className="session-label">
  {settings.mode === 'listening'
    ? 'ДИКТАНТ'
    : settings.mode === 'listening-translation'
      ? 'ПОНИМАНИЕ НА СЛУХ'
      : direction === 'ru-pl'
        ? 'РУССКИЙ → ПОЛЬСКИЙ'
        : 'ПОЛЬСКИЙ → РУССКИЙ'}
</div>

      {settings.mode === 'flashcards' && (
        <>
          <button
            className="flashcard"
            onClick={() =>
              setRevealed(!revealed)
            }
          >
            <span className="muted">
              Переведи слово
            </span>

            <h2>{question}</h2>

            {revealed ? (
              <>
                <div className="flashcard-divider" />

                <h2 className="flashcard-answer">
                  {expected}
                </h2>

                {currentWord.example && (
                  <p className="flashcard-example">
                    {currentWord.example}
                  </p>
                )}
              </>
            ) : (
              <span className="flip-hint">
                Нажми, чтобы перевернуть
              </span>
            )}
          </button>

          {(revealed ||
            direction === 'pl-ru') && (
            <button
              className="secondary-button"
              onClick={() =>
                pronounce(currentWord.polish)
              }
            >
              <Volume2 size={20} />
              Произношение
            </button>
          )}

          {revealed ? (
            <div className="rating-grid">
              {ratings.map(rating => {
                const interval =
                  calculateReview(
                    currentWord.progress[direction],
                    rating.id
                  ).interval;

                return (
                  <button
                    key={rating.id}
                    className={
                      `rating-button ${rating.id}`
                    }
                    onClick={() =>
                      rateWord(rating.id)
                    }
                  >
                    <strong>
                      {rating.label}
                    </strong>

                    <span>
                      {formatInterval(interval)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              className="primary-button"
              onClick={() => setRevealed(true)}
            >
              Показать ответ
            </button>
          )}
        </>
      )}

      {settings.mode !== 'flashcards' && (
        <>
          
<section className="question-card">
  {isListening ? (
    <>
      <button
        className="listen-button"
        onClick={() => pronounce(currentWord.polish)}
        aria-label="Прослушать слово"
      >
        <Volume2 size={38} />
      </button>

      <h3 className="listening-title">
        {settings.mode === 'listening'
          ? 'Прослушай и напиши слово'
          : 'Прослушай и переведи слово'}
      </h3>

      <p>
        {settings.mode === 'listening'
          ? 'Ответ на польском'
          : 'Ответ на русском'}
      </p>

      <div className="inline-speed-control">
        {([0.6, 0.85, 1] as const).map(rate => (
          <button
            key={rate}
            type="button"
            className={
              speechRate === rate ? 'selected' : ''
            }
            onClick={() => {
              setSpeechRate(rate);
              stopSpeech();
            }}
          >
            {rate === 1 ? '1.0' : rate}×
          </button>
        ))}
      </div>

      <span className="listening-hint">
        Можно прослушивать несколько раз
      </span>
    </>
  ) : (
    <>
      <span className="muted">
        Переведи
      </span>

      <h2>{question}</h2>
    </>
  )}
</section>

          {settings.mode === 'test' ? (
            <div className="test-options">
              {options.map(option => {
                const isCorrect = checkAnswer(
                  option,
                  expected
                );

                const isSelected =
                  answer === option;

                const state = checked
                  ? isCorrect
                    ? 'correct'
                    : isSelected
                      ? 'incorrect'
                      : ''
                  : '';

                return (
                  <button
                    key={option}
                    className={
                      `test-option ${state}`
                    }
                    disabled={checked}
                    onClick={() =>
                      verifyAnswer(option)
                    }
                  >
                    {option}

                    {checked && isCorrect && (
                      <Check size={19} />
                    )}

                    {checked &&
                      isSelected &&
                      !isCorrect && (
                        <X size={19} />
                      )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              className="writing-form"
              onSubmit={event => {
                event.preventDefault();
                verifyAnswer();
              }}
            >
              <input
                className="field answer-input"
                value={answer}
                placeholder="Введи ответ..."
                disabled={checked}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                lang={
                  direction === 'ru-pl'
                    ? 'pl'
                    : 'ru'
                }
                onChange={event =>
                  setAnswer(event.target.value)
                }
              />

              {direction === 'ru-pl' &&
                !checked && (
                  <div className="polish-keyboard">
                    {polishLetters.map(letter => (
                      <button
                        type="button"
                        key={letter}
                        onClick={() =>
                          setAnswer(
                            previous =>
                              previous + letter
                          )
                        }
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                )}

              {!checked && (
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!answer.trim()}
                >
                  Проверить
                </button>
              )}
            </form>
          )}

          {!checked && (
            <button
              className="text-button"
              onClick={() => {
                stopSpeech();
                setCorrect(false);
                setChecked(true);
              }}
            >
              Не знаю ответ
            </button>
          )}

          {checked && (
            <>
              <div
                className={
                  `answer-feedback ${
                    correct
                      ? 'correct'
                      : 'incorrect'
                  }`
                }
              >
                <strong>
                  {correct
                    ? 'Правильно!'
                    : 'Правильный ответ'}
                </strong>

                <h3>{expected}</h3>

                {isListening && (
                  <div className="listening-answer-details">
                    {settings.mode === 'listening'
                      ? <span>{currentWord.russian}</span>
                      : <strong>{currentWord.polish}</strong>}
                  </div>
                )}

                {currentWord.example && (
                  <p>{currentWord.example}</p>
                )}
              </div>

              <button
                className="secondary-button"
                onClick={() =>
                  pronounce(currentWord.polish)
                }
              >
                <Volume2 size={20} />
                Прослушать
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  rateWord(
                    correct ? 'good' : 'again'
                  )
                }
              >
                Далее
                <ArrowRight size={19} />
              </button>
            </>
          )}
        </>
      )}

      {message && (
        <div className="message">
          {message}
        </div>
      )}
    </div>
  );
}
