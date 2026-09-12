import type {PlanningInputs} from '../api/product';
import {toLocalISODate} from './dateHelpers';
export function validatePlanning(form:PlanningInputs, now=new Date()) {
  const errors:Record<string,'planningAmountInvalid'|'planningPaydayInvalid'|'planningDueInvalid'|'planningConfirmRequired'>={};
  const today=toLocalISODate(now), limit=new Date(now);limit.setDate(limit.getDate()+90);
  const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00'))&&toLocalISODate(new Date(v+'T12:00:00'))===v;
  const validAmount=(v:string)=>/^\d+(\.\d{1,2})?$/.test(v)&&Number(v)<=999999999.99;
  for(const key of ['cash','reserve'] as const)if(!validAmount(form[key]))errors[key]='planningAmountInvalid';
  if(!validDate(form.payday)||form.payday<=today||form.payday>toLocalISODate(limit))errors.payday='planningPaydayInvalid';
  form.obligations.forEach((row,i)=>{
    if(!validAmount(row.amount))errors[`amount${i}`]='planningAmountInvalid';
    if(!validDate(row.dueOn)||row.dueOn<today||row.dueOn>form.payday)errors[`dueOn${i}`]='planningDueInvalid';
  });
  if(!form.complete)errors.complete='planningConfirmRequired';
  return errors;
}
