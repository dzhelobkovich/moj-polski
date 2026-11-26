import { useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppData } from '../types';
import { supabase } from '../lib/supabase';
import { readCloud, writeCloud } from '../lib/cloud';
import { loadData, exportBackup } from '../utils/storage';
import App from '../App';
interface Cache { revision:number; data:AppData; dirty:boolean }
const empty:AppData={words:[],reviews:[],dailyGoal:20};
function Account({user}:{user:string}) {
 const key='moj-polski-cloud-'+user;
 const [cache,setCache]=useState<Cache|null>(()=>{try{return JSON.parse(localStorage.getItem(key)||'null') as Cache|null;}catch{return null;}});
 const ref=useRef(cache);
 const [status,setStatus]=useState('Подключение…');
 const [conflict,setConflict]=useState(false);
 const busy=useRef(false);
 const migrationDeferred=useRef(false);
 function store(next:Cache){localStorage.setItem(key,JSON.stringify(next));ref.current=next;setCache(next);}
 async function sync(){
  if(busy.current||migrationDeferred.current)return;busy.current=true;
  try{
   const remote=await readCloud(user); const local=ref.current;
   if(!local){
    if(remote){store({...remote,dirty:false});}
    else {const legacy=loadData(); if ((legacy.words.length || legacy.reviews.length) && !window.confirm('Перенести существующий локальный словарь в облако? Отмена сохранит старые данные и отложит перенос.')) {migrationDeferred.current=true;setStatus('Перенос отложен');return;} const data=(legacy.words.length||legacy.reviews.length)?legacy:empty;store({revision:0,data,dirty:true});}
   }
   const current=ref.current!;
   if(current.dirty){
    if((remote?.revision??0)!==current.revision){setConflict(true);setStatus('Конфликт: изменения сохранены локально');return;}
    const revision=await writeCloud(user,current.revision,current.data);
    const latest=ref.current!;store({...latest,revision,dirty:latest.data!==current.data});
   }else if(remote && remote.revision!==current.revision){store({...remote,dirty:false});}
   setConflict(false);setStatus(ref.current?.dirty?'Ожидает отправки':'Синхронизировано');
  }catch{setStatus('Нет синхронизации — повторим автоматически');}finally{busy.current=false;}
 }
 useEffect(()=>{void sync();const timer=window.setInterval(()=>void sync(),5000);const online=()=>void sync();window.addEventListener('online',online);return()=>{clearInterval(timer);window.removeEventListener('online',online);};},[user]);
 function change(data:AppData){const current=ref.current;if(!current||current.data===data)return;try{store({...current,data,dirty:true});setStatus('Ожидает отправки');}catch{setStatus('Ошибка локального сохранения');throw new Error('Local storage full');}}
 async function useRemote(){if(busy.current||!window.confirm('Скачать облачную версию? Сначала сохрани локальную копию.'))return;busy.current=true;try{const remote=await readCloud(user);if(remote){store({...remote,dirty:false});setConflict(false);setStatus('Синхронизировано');}}catch{setStatus('Не удалось загрузить облако');}finally{busy.current=false;}}
 return <><div className="cloud-bar"><span>{status}</span><button onClick={()=>{migrationDeferred.current=false;void sync();}}>Обновить</button>{conflict&&<><button onClick={()=>cache&&exportBackup(cache.data)}>Скачать локальную копию</button><button onClick={()=>void useRemote()}>Загрузить облачную версию</button></>}</div>{cache?<App data={cache.data} onDataChange={change}/>:<div className="cloud-login"><p>Загрузка словаря…</p><button className="secondary-button" onClick={()=>{migrationDeferred.current=false;void sync();}}>Повторить</button></div>}</>;
}
export default function CloudGate(){
 const [session,setSession]=useState<Session|null>(null);const [ready,setReady]=useState(false);const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [pending,setPending]=useState(false);
 useEffect(()=>{const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,value)=>{setSession(value);setReady(true);});return()=>subscription.unsubscribe();},[]);
 if(!ready)return <div className="cloud-login">Загрузка…</div>;
 if(session)return <Account key={session.user.id} user={session.user.id}/>;
 return <div className="cloud-login"><div className="brand-icon">PL</div><h1>Mój Polski</h1><p>Вход в личный словарь</p><form className="form" onSubmit={async e=>{e.preventDefault();setPending(true);setError('');try{const result=await supabase.auth.signInWithPassword({email:email.trim(),password});if(result.error)setError('Не удалось войти. Проверь почту и пароль.');}catch{setError('Ошибка подключения');}finally{setPending(false);}}}><label>Email<input className="field" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Пароль<input className="field" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="message">{error}</p>}<button className="primary-button" disabled={pending}>{pending?'Вход…':'Войти'}</button></form></div>;
}
