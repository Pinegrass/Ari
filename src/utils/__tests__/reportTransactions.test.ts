import {loadReportTransactions} from '../reportTransactions';
import type {Transaction} from '../../types';
it('loads all months across a year boundary and excludes days outside the report',async()=>{
 const load=jest.fn(async(month:string)=>[{id:month,date:month==='2025-12'?'2025-12-31':'2026-01-01'},{id:'outside',date:'2025-12-01'}] as Transaction[]);
 const result=await loadReportTransactions('2025-12-29','2026-01-04',load);
 expect(load.mock.calls).toEqual([['2025-12'],['2026-01']]);
 expect(result.map(row=>row.date)).toEqual(['2025-12-31','2026-01-01']);
});
it('does not show older entries in an empty daily report',async()=>{
 const result=await loadReportTransactions('2026-09-12','2026-09-12',async()=>[{date:'2026-09-11'}] as Transaction[]);
 expect(result).toEqual([]);
});
