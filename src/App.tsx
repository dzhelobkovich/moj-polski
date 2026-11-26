
import { useState } from 'react';

import Statistics from './pages/Statistics';

import Navigation from './components/Navigation';

import Home from './pages/Home';
import Dictionary from './pages/Dictionary';
import Learn from './pages/Learn';

import type {
  Page,
  AppData,
  Word,
  Direction,
  Rating,
  LearningMode
} from './types';

import {
  calculateReview
} from './utils/repetition';

import './App.css';

function App({data,onDataChange}:{data:AppData;onDataChange:(data:AppData)=>void}) {
  function setData(value:AppData|((previous:AppData)=>AppData)){onDataChange(typeof value==='function'?value(data):value); }
  const [page, setPage] =
    useState<Page>('home');

  const [modal, setModal] =
    useState<'add' | 'import' | null>(null);

  function navigate(nextPage: Page) {
    setModal(null);
    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  function openDictionary(
    nextModal: 'add' | 'import'
  ) {
    navigate('dictionary');
    setModal(nextModal);
  }

  function updateWords(words: Word[]) {
    setData(previous => ({
      ...previous,
      words
    }));
  }

  function reviewWord(
    wordId: string,
    direction: Direction,
    rating: Rating,
    mode: LearningMode
  ) {
    setData(previous => ({
      ...previous,
      words: previous.words.map(word => {
        if (word.id !== wordId) {
          return word;
        }

        return {
          ...word,
          progress: {
            ...word.progress,
            [direction]: calculateReview(
              word.progress[direction],
              rating
            )
          }
        };
      }),

      reviews: [
        ...previous.reviews,
        {
          wordId,
          direction,
          rating,
          mode,
          date: Date.now()
        }
      ]
    }));
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Mój Polski</h1>

        <div className="brand-icon">
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            PL
          </span>
        </div>
      </header>

      <main className="content">
        {page === 'home' && (
          <Home
            words={data.words}
            dailyGoal={data.dailyGoal ?? 20}
            onNavigate={navigate}
            onAdd={() =>
              openDictionary('add')
            }
            onImport={() =>
              openDictionary('import')
            }
          />
        )}

        {page === 'dictionary' && (
          <Dictionary
            words={data.words}
            onChange={updateWords}
            modal={modal}
            onCloseModal={() => setModal(null)}
            onOpenModal={setModal}
          />
        )}

        {page === 'learn' && (
          <Learn
            words={data.words}
            onReview={reviewWord}
            onOpenDictionary={() =>
              navigate('dictionary')
            }
          />
        )}

        {page === 'stats' && (
          <Statistics data={data}
            onGoalChange={dailyGoal => setData(previous => ({...previous, dailyGoal}))}
            onRestore={setData}
          />
        )}
      </main>

      <Navigation
        page={page}
        onNavigate={navigate}
      />
    </div>
  );
}

export default App;
