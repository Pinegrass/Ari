import {useEffect,useState} from 'react';
import {getPlanning,savePlanning,deletePlanning,type PlanningInputs,type PlanningResult} from '../api/product';
export function usePlanning(currency:string){
  const empty=():PlanningInputs=>({cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
  const [form,setForm]=useState<PlanningInputs>(empty),[result,setResult]=useState<PlanningResult|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;setLoading(true);setResult(null);getPlanning().then(value=>{if(active){setResult(value);setForm(value.inputs?.currency===currency?{...value.inputs,complete:false}:{cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});setError(false);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[currency,attempt]);
  useEffect(()=>{
    if (!result?.estimate || !result.confirmedAt) return;
    const confirmedAt = Date.parse(result.confirmedAt);
    const invalidateExpired = () => {
      if (!Number.isFinite(confirmedAt) || Date.now() - confirmedAt >= 24 * 60 * 60 * 1000) {
        setResult(value => value ? {...value, estimate:null, status:'stale'} : null);
        setForm(value => ({...value, complete:false}));
      }
    };
    invalidateExpired();
    const timer = setInterval(invalidateExpired, 1000);
    return () => clearInterval(timer);
  },[result]);
  const change=(patch:Partial<PlanningInputs>)=>{setForm(v=>({...v,...patch,complete:patch.complete??false}));setResult(null);};
  const save=async()=>{setBusy(true);setError(false);try{setResult(await savePlanning({...form,currency}));}catch{setError(true);}finally{setBusy(false);}};
  const clear=async()=>{setBusy(true);setError(false);try{await deletePlanning();setForm(empty());setResult({inputs:null,estimate:null,status:'missing'});}catch{setError(true);}finally{setBusy(false);}};
  const invalidate=()=>{setResult(value=>value?{...value,estimate:null,status:'stale'}:null);setForm(value=>({...value,complete:false}));};
  return {form,result,loading,busy,error,change,save,clear,invalidate,retry:()=>{setLoading(true);setAttempt(v=>v+1);}};
}
