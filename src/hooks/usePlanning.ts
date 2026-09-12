import {useCallback,useEffect,useRef,useState} from 'react';
import {getPlanning,savePlanning,deletePlanning,type PlanningInputs,type PlanningResult} from '../api/product';
import {track} from '../lib/analytics';
export function usePlanning(currency:string, revision=''){
  const empty=():PlanningInputs=>({cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
  const [form,setForm]=useState<PlanningInputs>(empty),[result,setResult]=useState<PlanningResult|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const generation=useRef(0);
  const dirty=useRef(false);
  const [errorOperation,setErrorOperation]=useState<'load'|'save'|'clear'>('load');
  const draftCurrency=useRef(currency);
  const cancelRequests=useCallback(()=>{generation.current++;},[]);
  const invalidate=useCallback(()=>{
    generation.current++;
    setLoading(false);
    setResult(value=>value?{...value,estimate:null,status:'stale'}:null);
    setForm(value=>({...value,complete:false}));
  },[]);
  const reload=useCallback(()=>{setAttempt(v=>v+1);},[]);
  // Synchronize the current currency/ledger with the server; old requests cannot restore stale estimates.
  useEffect(()=>{
    const current=++generation.current;
    if(draftCurrency.current!==currency){dirty.current=false;draftCurrency.current=currency;setForm({cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});}
    setLoading(true);setResult(null);
    getPlanning().then(value=>{
      if(current!==generation.current)return;
      setResult(dirty.current?null:value);
      if(!dirty.current)setForm(value.inputs?.currency===currency?{...value.inputs,complete:false}:{cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
      setError(false);
    }).catch(()=>{if(current===generation.current){setErrorOperation('load');setError(true);}})
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

  const change=(patch:Partial<PlanningInputs>)=>{generation.current++;dirty.current=true;setLoading(false);setForm(v=>({...v,...patch,complete:patch.complete??false}));setResult(null);};
  const save=async()=>{
    const current=++generation.current;setBusy(true);setError(false);
    try{const value=await savePlanning({...form,currency});track('planning_saved');if(current===generation.current){dirty.current=false;setResult(value);}}
    catch{if(current===generation.current){setErrorOperation('save');setError(true);}}finally{setBusy(false);}
  };
  const clear=async()=>{
    const current=++generation.current;setBusy(true);setError(false);
    try{await deletePlanning();if(current===generation.current){dirty.current=false;setForm(empty());setResult({inputs:null,estimate:null,status:'missing'});}}
    catch{if(current===generation.current){setErrorOperation('clear');setError(true);}}finally{setBusy(false);}
  };
  const retry=()=>{if(busy)return; if(errorOperation==='save')void save();else if(errorOperation==='clear')void clear();else reload();};
  return {form,result,loading,busy,error,errorOperation,change,save,clear,invalidate,retry};
}
