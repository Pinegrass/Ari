import {useCallback,useEffect,useRef,useState} from 'react';
import {getPlanning,savePlanning,deletePlanning,type PlanningInputs,type PlanningResult} from '../api/product';
import {track} from '../lib/analytics';
export function usePlanning(currency:string, revision=''){
  const empty=():PlanningInputs=>({cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
  const [form,setForm]=useState<PlanningInputs>(empty),[result,setResult]=useState<PlanningResult|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const generation=useRef(0);
  const cancelRequests=useCallback(()=>{generation.current++;},[]);
  const invalidate=useCallback(()=>{
    generation.current++;
    setLoading(false);
    setResult(value=>value?{...value,estimate:null,status:'stale'}:null);
    setForm(value=>({...value,complete:false}));
  },[]);
  const retry=useCallback(()=>{invalidate();setAttempt(v=>v+1);},[invalidate]);
  // Synchronize the current currency/ledger with the server; old requests cannot restore stale estimates.
  useEffect(()=>{
    const current=++generation.current;
    setLoading(true);setResult(null);
    getPlanning().then(value=>{
      if(current!==generation.current)return;
      setResult(value);
      setForm(value.inputs?.currency===currency?{...value.inputs,complete:false}:{cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
      setError(false);
    }).catch(()=>{if(current===generation.current)setError(true);})
      .finally(()=>{if(current===generation.current)setLoading(false);});
    return cancelRequests;
  },[currency,attempt,revision,cancelRequests]);
  useEffect(()=>{
    if(!result?.estimate||!result.confirmedAt)return;
    const expires=Date.parse(result.expiresAt??'') || Date.parse(result.confirmedAt)+24*60*60*1000;
    const check=()=>{if(!Number.isFinite(expires)||Date.now()>=expires)invalidate();};
    check();const timer=setInterval(check,1000);
    return()=>clearInterval(timer);
  },[result,invalidate]);

  const change=(patch:Partial<PlanningInputs>)=>{generation.current++;setForm(v=>({...v,...patch,complete:patch.complete??false}));setResult(null);};
  const save=async()=>{
    const current=++generation.current;setBusy(true);setError(false);
    try{const value=await savePlanning({...form,currency});track('planning_saved');if(current===generation.current)setResult(value);}
    catch{if(current===generation.current)setError(true);}finally{setBusy(false);}
  };
  const clear=async()=>{
    const current=++generation.current;setBusy(true);setError(false);
    try{await deletePlanning();if(current===generation.current){setForm(empty());setResult({inputs:null,estimate:null,status:'missing'});}}
    catch{if(current===generation.current)setError(true);}finally{setBusy(false);}
  };
  return {form,result,loading,busy,error,change,save,clear,invalidate,retry};
}
