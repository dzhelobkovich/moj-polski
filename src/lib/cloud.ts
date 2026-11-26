import { supabase } from './supabase';
import type { AppData } from '../types';
import { parseBackup } from '../utils/storage';
export interface Snapshot { revision: number; data: AppData }
export async function readCloud(user: string): Promise<Snapshot | null> {
  const {data,error} = await supabase.from('app_snapshots').select('revision,data').eq('user_id',user).maybeSingle();
  if(error) throw error;
  return data ? {revision:Number(data.revision),data:parseBackup(JSON.stringify(data.data))} : null;
}
export async function writeCloud(user:string, revision:number, data:AppData):Promise<number> {
  const row = {data,revision:revision+1,updated_at:new Date().toISOString()};
  const query = revision === 0 ? supabase.from('app_snapshots').insert({...row,user_id:user}) : supabase.from('app_snapshots').update(row).eq('user_id',user).eq('revision',revision);
  const result = await query.select('revision').maybeSingle();
  if(result.error) throw result.error;
  if(!result.data) throw new Error('Конфликт версий');
  return Number(result.data.revision);
}
