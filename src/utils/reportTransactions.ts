import type {Transaction} from '../types';
/** Load every month touched by an inclusive report period, then trim its boundary days. */
export async function loadReportTransactions(start:string,end:string,load:(month:string)=>Promise<Transaction[]>){
  const cursor=new Date(start+'T12:00:00');cursor.setDate(1);
  const months:string[]=[];
  const monthKey=()=>`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`;
  while(monthKey()<=end.slice(0,7)){
    months.push(monthKey());
    cursor.setMonth(cursor.getMonth()+1);
  }
  const rows=(await Promise.all(months.map(month=>load(month)))).flat();
  return rows.filter(row=>row.date.slice(0,10)>=start&&row.date.slice(0,10)<=end);
}
