import {apiRequest} from './client';
export interface PlanningInputs {cash:string;reserve:string;payday:string;currency:string;complete:boolean;obligations:{amount:string;dueOn:string}[]}
export interface PlanningResult {inputs:PlanningInputs|null;status:string;confirmedAt?:string;expiresAt?:string;estimate:{remaining:string;obligations:string;days:number;perDay:string}|null}
export const getPlanning=()=>apiRequest<PlanningResult>('/planning');
export const savePlanning=(value:PlanningInputs)=>apiRequest<PlanningResult>('/planning',{method:'PUT',body:JSON.stringify(value)});
export const deletePlanning=()=>apiRequest('/planning',{method:'DELETE'});
export const getMeasurementConsent=()=>apiRequest<{enabled:boolean}>('/measurement/consent');
export const saveMeasurementConsent=(enabled:boolean)=>apiRequest<{enabled:boolean}>('/measurement/consent',{method:'PUT',body:JSON.stringify({enabled})});
