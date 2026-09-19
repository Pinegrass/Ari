import {randomUUID} from 'expo-crypto';
import {useCallback,useEffect,useRef,useState} from 'react';
import {getPlanning,savePlanning,deletePlanning,type PlanningInputs,type PlanningResult} from '../api/product';
import {track} from '../lib/analytics';
export function usePlanning(currency:string, revision='', accountKey=''){
  const empty=():PlanningInputs=>({cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
  const [form,setForm]=useState<PlanningInputs>(empty),[result,setResult]=useState<PlanningResult|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const generation=useRef(0);
  const dirty=useRef(false);
  const confirmation=useRef<{id:string;base:string|null}|null>(null);
  const deletion=useRef<{id:string;base:string|null}|null>(null);
  const baseRevision=useRef<string|null>(null);
  const owner=useRef(accountKey);
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
    if(draftCurrency.current!==currency||owner.current!==accountKey){confirmation.current=null;deletion.current=null;baseRevision.current=null;owner.current=accountKey;dirty.current=false;draftCurrency.current=currency;setForm({cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});}
    setLoading(true);setResult(null);
    getPlanning().then(value=>{
      if(current!==generation.current)return;
      baseRevision.current=value.revision??null;
      setResult(dirty.current?null:value);
      if(!dirty.current)setForm(value.inputs?.currency===currency?{...value.inputs,complete:false}:{cash:'',reserve:'',payday:'',currency,complete:false,obligations:[]});
      setError(false);
    }).catch(()=>{if(current===generation.current){setErrorOperation('load');setError(true);}})
      .finally(()=>{if(current===generation.current)setLoading(false);});
    return cancelRequests;
  },[currency,attempt,revision,accountKey,cancelRequests]);
  useEffect(()=>{
    if(!result?.estimate||!result.confirmedAt)return;
    const expires=Date.parse(result.expiresAt??'') || Date.parse(result.confirmedAt)+24*60*60*1000;
    const check=()=>{if(!Number.isFinite(expires)||Date.now()>=expires)invalidate();};
    check();const timer=setInterval(check,1000);
    return()=>clearInterval(timer);
  },[result,invalidate]);

  const change=(patch:Partial<PlanningInputs>)=>{confirmation.current=null;deletion.current=null;generation.current++;dirty.current=true;setLoading(false);setForm(v=>({...v,...patch,complete:patch.complete??false}));setResult(null);};
  const save=async()=>{
    if(busy)return;
    const current=++generation.current;setBusy(true);setError(false);
    try{const attempt=confirmation.current??{id:randomUUID(),base:baseRevision.current};confirmation.current=attempt;const value=await savePlanning({...form,currency,confirmationId:attempt.id,baseRevision:attempt.base});track('planning_saved');if(current===generation.current){confirmation.current=null;deletion.current=null;baseRevision.current=value.revision??null;dirty.current=false;setResult(value);}}
    catch(error){if(current===generation.current){const conflict=typeof error==='object'&&error!==null&&'status' in error&&error.status===409;if(conflict)confirmation.current=null;setErrorOperation(conflict?'load':'save');setError(true);}}finally{setBusy(false);}
  };
  const clear=async()=>{
    if(busy)return;
    const current=++generation.current;setBusy(true);setError(false);
    try{const attempt=deletion.current??{id:randomUUID(),base:baseRevision.current};deletion.current=attempt;const deleted=await deletePlanning({confirmationId:attempt.id,baseRevision:attempt.base});if(current===generation.current){confirmation.current=null;deletion.current=null;baseRevision.current=deleted?.revision??null;dirty.current=false;setForm(empty());setResult({inputs:null,estimate:null,status:'missing'});}}
    catch(error){if(current===generation.current){const conflict=typeof error==='object'&&error!==null&&'status' in error&&error.status===409;if(conflict)deletion.current=null;setErrorOperation(conflict?'load':'clear');setError(true);}}finally{setBusy(false);}
  };
  const retry=()=>{if(busy)return; if(errorOperation==='save')void save();else if(errorOperation==='clear')void clear();else reload();};
  return {form,result,loading,busy,error,errorOperation,change,save,clear,invalidate,retry};
}
