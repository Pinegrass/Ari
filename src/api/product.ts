import {apiRequest} from './client';
export interface PlanningInputs {confirmationId?:string;baseRevision?:string|null;cash:string;reserve:string;payday:string;currency:string;complete:boolean;obligations:{amount:string;dueOn:string}[]}
export interface PlanningResult {revision?:string|null;inputs:PlanningInputs|null;status:string;confirmedAt?:string;expiresAt?:string;estimate:{remaining:string;obligations:string;days:number;perDay:string}|null}
export const getPlanning=()=>apiRequest<PlanningResult>('/planning');
export const savePlanning=(value:PlanningInputs)=>apiRequest<PlanningResult>('/planning',{method:'PUT',body:JSON.stringify(value)});
export const deletePlanning=(confirmation?:{confirmationId:string;baseRevision:string|null})=>apiRequest<{ok:boolean;revision:string|null}>('/planning',{method:'DELETE',...(confirmation?{body:JSON.stringify(confirmation)}:{})});
export const getMeasurementConsent=()=>apiRequest<{enabled:boolean;consentEpoch:string|null}>('/measurement/v2/consent');
export const saveMeasurementConsent=(enabled:boolean)=>apiRequest<{enabled:boolean;consentEpoch:string|null}>('/measurement/v2/consent',{method:'PUT',body:JSON.stringify({enabled})});
