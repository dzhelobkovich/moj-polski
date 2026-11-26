import { useState } from 'react';
import { Download, Upload, Flame, CalendarDays } from 'lucide-react';
import type { AppData, LearningMode } from '../types';
import { getWordStatus, getDueWords } from '../utils/repetition';
import { exportBackup, parseBackup } from '../utils/storage';
import '../Statistics.css';

interface Props {
  data: AppData;
  onGoalChange: (goal: number) => void;
  onRestore: (data: AppData) => void;
}
const modes: [LearningMode, string][] = [
  ['flashcards','Карточки'], ['writing','Письмо'], ['test','Тест'],
  ['listening','Диктант'], ['listening-translation','Понимание на слух']
];
function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}
function dayOffset(offset: number) {
  const date = new Date();
  date.setHours(0,0,0,0);
  date.setDate(date.getDate()+offset);
  return date;
}
export default function Statistics({data,onGoalChange,onRestore}: Props) {
  const [message,setMessage] = useState('');
  const [pending,setPending] = useState<AppData | null>(null);
  const {words,reviews} = data;
  const goal = data.dailyGoal ?? 20;
  const days = new Map<string, Set<string>>();
  for (const r of reviews) {
    const key = dayKey(new Date(r.date));
    if (!days.has(key)) days.set(key,new Set());
    days.get(key)?.add(r.wordId);
  }
  const today = words.filter(w => Object.values(w.progress).some(p => p.lastReviewed !== null && dayKey(new Date(p.lastReviewed)) === dayKey(new Date()))).length;
  let offset = days.has(dayKey(dayOffset(0))) ? 0 : -1;
  let streak = 0;
  while (days.has(dayKey(dayOffset(offset)))) { streak++; offset--; }
  const week = Array.from({length:7},(_,i) => {const date=dayOffset(i-6); return {date,count:days.get(dayKey(date))?.size ?? 0};});
  const max = Math.max(goal,...week.map(d=>d.count));
  const due = new Set([...getDueWords(words,'pl-ru'),...getDueWords(words,'ru-pl')].map(w=>w.id)).size;
  const difficult = words.map(w=>{const p=Object.values(w.progress); const errors=p.reduce((n,x)=>n+x.incorrectCount,0); const attempts=p.reduce((n,x)=>n+x.correctCount+x.incorrectCount,0); return {w,errors,attempts};}).filter(x=>x.errors>0).sort((a,b)=>b.errors/b.attempts-a.errors/a.attempts || b.errors-a.errors).slice(0,8);
  const calendar = Array.from({length:7},(_,i)=>{const date=dayOffset(i+1);const count=words.filter(w=>Object.values(w.progress).some(p=>p.lastReviewed!==null && dayKey(new Date(p.nextReview))===dayKey(date))).length;return {date,count};});
  async function readBackup(file: File) {
    setPending(null);setMessage('');
    try {setPending(parseBackup(await file.text()));} catch {setMessage('Не удалось прочитать резервную копию. Текущие данные не изменены.');}
  }
  return <div className="page statistics-page">
    <div className="section-heading"><h2>Мой прогресс</h2></div>
    <section className="tip-card">
      <div className="statistics-heading"><h3>Дневная цель</h3><select className="field" aria-label="Дневная цель" value={goal} onChange={e=>onGoalChange(Number(e.target.value))}>{[10,20,30,50].map(n=><option key={n} value={n}>{n} слов</option>)}</select></div>
      <div className="statistics-number">{today} <span>/ {goal}</span></div>
      <div className="statistics-track"><div style={{width:`${Math.min(100,today/goal*100)}%`}}/></div>
      <p className="muted">{today>=goal?'Цель выполнена':`Осталось ${goal-today} слов`}</p>
      <div className="statistics-streak"><Flame size={22}/><strong>{streak} дн.</strong><span>Серия занятий</span></div>
    </section>
    <div className="stats-grid">{[['В словаре',words.length],['Изучено',words.filter(w=>getWordStatus(w)==='mastered').length],['В процессе',words.filter(w=>getWordStatus(w)==='learning').length],['Новые',words.filter(w=>getWordStatus(w)==='new').length],['Доступно к повторению',due],['Всего ответов',reviews.length]].map(([label,n])=><div className="stat-card" key={label}><strong>{n}</strong><span>{label}</span></div>)}</div>
    <section className="tip-card"><h3>Активность за 7 дней</h3><p className="muted">Уникальные слова за день</p><div className="statistics-week">{week.map(d=><div className="statistics-day" key={dayKey(d.date)}><span>{d.count}</span><div className="statistics-bar-space"><div className="statistics-bar" style={{height:`${d.count/max*100}%`}}/></div><span>{d.date.toLocaleDateString('ru-RU',{weekday:'short'})}</span></div>)}</div></section>
    <section className="tip-card"><h3>Результаты по режимам</h3><p className="muted">Доля уверенных ответов</p>{modes.map(([mode,label])=>{const list=reviews.filter(r=>r.mode===mode);const pct=list.length?Math.round(list.filter(r=>r.rating==='good'||r.rating==='easy').length/list.length*100):0;return <div className="statistics-mode" key={mode}><div className="statistics-heading"><span>{label}</span><strong>{list.length?`${pct}% · ${list.length}`:'Нет данных'}</strong></div><div className="statistics-track"><div style={{width:`${pct}%`}}/></div></div>;})}{reviews.some(r=>!r.mode)&&<p className="muted">Старые ответы без режима: {reviews.filter(r=>!r.mode).length}</p>}</section>
    <section className="tip-card"><div className="statistics-heading"><h3>Календарь повторений</h3><CalendarDays size={20}/></div><p className="muted">Запланировано на ближайшие 7 дней. Расписание меняется после ответов.</p>{calendar.map(d=><div className="statistics-heading statistics-line" key={dayKey(d.date)}><span>{d.date.toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'})}</span><strong>{d.count}</strong></div>)}</section>
    <section className="tip-card"><h3>Сложные слова</h3><p className="muted">По доле ошибок за все время</p>{difficult.length===0?<p className="muted">Пока нет ошибок.</p>:difficult.map(({w,errors,attempts})=><div className="statistics-heading statistics-line" key={w.id}><div><strong>{w.polish}</strong><p className="muted">{w.russian}</p></div><span className="statistics-errors">{errors}/{attempts}</span></div>)}</section>
    <section className="tip-card"><h3>Резервная копия</h3><p className="muted">Словарь, история и дневная цель. Восстановление заменяет текущие данные.</p><button className="secondary-button full-width" onClick={()=>exportBackup(data)}><Download size={20}/>Скачать копию</button><label className="secondary-button full-width statistics-upload"><Upload size={20}/>Выбрать файл<input type="file" accept=".json,application/json" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file) void readBackup(file);}}/></label>{pending&&<div className="statistics-mode"><p>В копии: {pending.words.length} слов, {pending.reviews.length} ответов.</p><button className="primary-button full-width" onClick={()=>{if(window.confirm('Заменить текущий словарь и прогресс?')){onRestore(pending);setPending(null);setMessage('Данные восстановлены.');}}}>Восстановить</button><button className="secondary-button full-width" onClick={()=>setPending(null)}>Отмена</button></div>}{message&&<p role="status" className="muted">{message}</p>}</section>
  </div>;
}
