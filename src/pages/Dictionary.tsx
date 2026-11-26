
import { useState } from 'react';

import {
  Search,
  Plus,
  FileUp,
  Volume2,
  Pencil,
  Trash2,
  X,
  BookOpen,
  CheckCircle
} from 'lucide-react';

import { createWord } from '../types';

import type {
  Word,
  WordInput
} from '../types';

import {
  importWords,
  importWordsFromFile
} from '../utils/importWords';

import type { ImportResult } from '../utils/importWords';

import { speakPolish } from '../utils/speech';
import { getWordStatus } from '../utils/repetition';

interface Props {
  words: Word[];
  onChange: (words: Word[]) => void;
  modal: 'add' | 'import' | null;
  onCloseModal: () => void;
  onOpenModal: (modal: 'add' | 'import') => void;
}

const emptyForm: WordInput = {
  polish: '',
  russian: '',
  example: '',
  category: ''
};

const statusLabels = {
  new: 'Новое',
  learning: 'В процессе',
  mastered: 'Изучено'
};

export default function Dictionary({
  words,
  onChange,
  modal,
  onCloseModal,
  onOpenModal
}: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState<WordInput>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [importText, setImportText] = useState('');
  const [importCategory, setImportCategory] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState('');

  const categories = [...new Set(
    words.map(word => word.category)
  )].sort();

  const query = search.trim().toLowerCase();

  const filteredWords = words.filter(word => {
    const matchesSearch =
      word.polish.toLowerCase().includes(query) ||
      word.russian.toLowerCase().includes(query);

    const matchesCategory =
      !category || word.category === category;

    return matchesSearch && matchesCategory;
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    onOpenModal('add');
  }

  function editWord(word: Word) {
    setEditingId(word.id);

    setForm({
      polish: word.polish,
      russian: word.russian,
      example: word.example,
      category: word.category
    });

    onOpenModal('add');
  }

  function closeModal() {
    setForm(emptyForm);
    setEditingId(null);
    setImportText('');
    setImportCategory('');
    setResult(null);
    onCloseModal();
  }

  function saveWord() {
    if (!form.polish.trim() || !form.russian.trim()) {
      return;
    }

    const input = {
      polish: form.polish.trim(),
      russian: form.russian.trim(),
      example: form.example.trim(),
      category: form.category.trim() || 'Без категории'
    };

    if (editingId) {
      onChange(
        words.map(word =>
          word.id === editingId
            ? { ...word, ...input }
            : word
        )
      );

      setMessage('Слово обновлено');
    } else {
      onChange([createWord(input), ...words]);
      setMessage('Слово добавлено');
    }

    closeModal();
  }

  function deleteWord(word: Word) {
    if (window.confirm(`Удалить «${word.polish}»?`)) {
      onChange(
        words.filter(item => item.id !== word.id)
      );

      setMessage('Слово удалено');
    }
  }

  async function handleFile(file: File) {
    try {
      const imported = await importWordsFromFile(
        file,
        words,
        importCategory.trim() || 'Импортированные'
      );

      setResult(imported);
      setMessage('');
    } catch {
      setMessage('Не удалось прочитать файл');
    }
  }

  function previewText() {
    const imported = importWords(
      importText,
      words,
      importCategory.trim() || 'Импортированные'
    );

    setResult(imported);
  }

  function confirmImport() {
    if (!result || result.words.length === 0) {
      return;
    }

    onChange([...result.words, ...words]);

    setMessage(`Добавлено слов: ${result.words.length}`);

    closeModal();
  }

  function pronounce(text: string) {
    if (!speakPolish(text)) {
      setMessage('Озвучка недоступна на этом устройстве');
    }
  }

  return (
    <div className="page">
      <div className="section-heading">
        <div>
          <h2>Мой словарь</h2>
          <p>Слов и выражений: {words.length}</p>
        </div>

        <button
          className="icon-button primary"
          onClick={openAdd}
          aria-label="Добавить слово"
        >
          <Plus size={24} />
        </button>
      </div>

      {message && (
        <div className="message">
          {message}
          <button
            className="icon-button"
            onClick={() => setMessage('')}
            aria-label="Закрыть сообщение"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <button
        className="secondary-button full-width"
        onClick={() => onOpenModal('import')}
      >
        <FileUp size={20} />
        Импортировать слова
      </button>

      <div className="search-field">
        <Search size={20} />

        <input
          placeholder="Найти слово..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        {search && (
          <button
            className="icon-button"
            onClick={() => setSearch('')}
            aria-label="Очистить поиск"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <select
        className="field"
        value={category}
        onChange={event => setCategory(event.target.value)}
      >
        <option value="">Все категории</option>

        {categories.map(item => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <p className="result-count">
        Найдено: {filteredWords.length}
      </p>

      <div className="word-list">
        {filteredWords.map(word => (
          <article className="word-card" key={word.id}>
            <div className="word-header">
              <div className="word-text">
                <h3>{word.polish}</h3>
                <p>{word.russian}</p>
              </div>

              <button
                className="icon-button speech-button"
                onClick={() => pronounce(word.polish)}
                aria-label="Произношение"
              >
                <Volume2 size={22} />
              </button>
            </div>

            {word.example && (
              <p className="word-example">
                {word.example}
              </p>
            )}

            <div className="word-meta">
              <span className="category-tag">
                {word.category}
              </span>

              <span className={`word-status ${getWordStatus(word)}`}>
                {statusLabels[getWordStatus(word)]}
              </span>
            </div>

            <div className="word-actions">
              <button onClick={() => editWord(word)}>
                <Pencil size={16} />
                Изменить
              </button>

              <button
                className="danger-text"
                onClick={() => deleteWord(word)}
              >
                <Trash2 size={16} />
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="empty-state">
          <BookOpen size={42} />
          <h3>
            {words.length === 0
              ? 'Твой словарь пока пуст'
              : 'Ничего не найдено'}
          </h3>
          <p>
            {words.length === 0
              ? 'Добавь первое слово или загрузи готовый список.'
              : 'Попробуй изменить поиск или категорию.'}
          </p>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal === 'add' ? 'Слово' : 'Импорт слов'}
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-handle" />

            <div className="section-heading">
              <h2>
                {modal === 'add'
                  ? editingId
                    ? 'Редактировать'
                    : 'Новое слово'
                  : 'Импорт слов'}
              </h2>

              <button
                className="icon-button"
                onClick={closeModal}
                aria-label="Закрыть"
              >
                <X size={24} />
              </button>
            </div>

            {modal === 'add' && (
              <form
                className="form"
                onSubmit={event => {
                  event.preventDefault();
                  saveWord();
                }}
              >
                <label>
                  Польское слово
                  <input
                    className="field"
                    placeholder="Например, zazwyczaj"
                    value={form.polish}
                    lang="pl"
                    required
                    onChange={event =>
                      setForm({
                        ...form,
                        polish: event.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Перевод
                  <input
                    className="field"
                    placeholder="Обычно"
                    value={form.russian}
                    required
                    onChange={event =>
                      setForm({
                        ...form,
                        russian: event.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Пример предложения
                  <textarea
                    className="field"
                    placeholder="Zazwyczaj piję kawę rano."
                    value={form.example}
                    lang="pl"
                    rows={3}
                    onChange={event =>
                      setForm({
                        ...form,
                        example: event.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Категория
                  <input
                    className="field"
                    list="categories"
                    placeholder="Глаголы, урок 1..."
                    value={form.category}
                    onChange={event =>
                      setForm({
                        ...form,
                        category: event.target.value
                      })
                    }
                  />

                  <datalist id="categories">
                    {categories.map(item => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </label>

                <button className="primary-button" type="submit">
                  Сохранить слово
                </button>
              </form>
            )}

            {modal === 'import' && (
              <div className="form">
                <p className="muted">
                  Загрузи файл CSV или TXT либо вставь
                  готовый список слов.
                </p>

                <label>
                  Категория по умолчанию
                  <input
                    className="field"
                    placeholder="Например, Польский A2"
                    value={importCategory}
                    onChange={event => {
                      setImportCategory(event.target.value);
                      setResult(null);
                    }}
                  />
                </label>

                <label className="upload-area">
                  <FileUp size={32} />
                  <strong>Выбрать файл</strong>
                  <span>CSV или TXT в кодировке UTF-8</span>

                  <input
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    onChange={event => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void handleFile(file);
                      }

                      event.target.value = '';
                    }}
                  />
                </label>

                <div className="separator">или вставь текст</div>

                <textarea
                  className="field import-text"
                  rows={5}
                  value={importText}
                  placeholder={'zazwyczaj;обычно\nwoleć;предпочитать\nchociaż;хотя'}
                  onChange={event => {
                    setImportText(event.target.value);
                    setResult(null);
                  }}
                />

                <button
                  className="secondary-button"
                  onClick={previewText}
                  disabled={!importText.trim()}
                >
                  Проверить список
                </button>

                {message && <p className="muted">{message}</p>}

                {result && (
                  <div className="import-result">
                    <CheckCircle size={24} />

                    <h3>Результат проверки</h3>

                    <p>Новые слова: {result.words.length}</p>
                    <p>Дубликаты: {result.duplicates}</p>
                    <p>Некорректные строки: {result.invalid}</p>

                    <button
                      className="primary-button"
                      disabled={result.words.length === 0}
                      onClick={confirmImport}
                    >
                      Добавить слова ({result.words.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
