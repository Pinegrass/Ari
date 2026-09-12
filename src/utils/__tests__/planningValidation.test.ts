import {validatePlanning} from '../planningValidation';
const now=new Date('2026-09-12T12:00:00');
const form={cash:'1000.50',reserve:'0',payday:'2026-09-25',currency:'INR',complete:true,obligations:[{amount:'25.50',dueOn:'2026-09-12'}]};
it('accepts paise and inclusive obligation boundaries',()=>{expect(validatePlanning(form,now)).toEqual({});});
it('rejects missing, negative, excessive precision and impossible dates',()=>{
 expect(validatePlanning({...form,cash:'',reserve:'-1',payday:'2026-09-31',obligations:[{amount:'1.234',dueOn:'2026-02-30'}]},now)).toEqual(expect.objectContaining({cash:expect.any(String),reserve:expect.any(String),payday:expect.any(String),amount0:expect.any(String),dueOn0:expect.any(String)}));
});
it('rejects payday today or beyond 90 days and obligations after payday',()=>{
 expect(validatePlanning({...form,payday:'2026-09-12'},now).payday).toBeTruthy();
 expect(validatePlanning({...form,payday:'2027-01-01'},now).payday).toBeTruthy();
 expect(validatePlanning({...form,obligations:[{amount:'1',dueOn:'2026-09-26'}]},now).dueOn0).toBeTruthy();
});
