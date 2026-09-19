import { categoryDisplayLabel, getCategoryDef } from '../../constants/categories';
import { phrase } from '../phrases';
import { formatSectionDate, todayISO } from '../../utils/dateHelpers';
it('translates built-in category names while preserving custom names',()=>{
 const copy=(text:string)=>phrase('hi',text);
 expect(categoryDisplayLabel(getCategoryDef('food'),copy)).toBe('खाना');
 expect(categoryDisplayLabel({value:'custom-food',label:'Food',emoji:'',color:''},copy)).toBe('Food');
});
it('localizes relative and calendar dates without changing stored dates',()=>{
 expect(formatSectionDate(todayISO(),'hi')).toBe('आज');
 expect(formatSectionDate('2020-01-03','hi')).toMatch(/[\u0900-\u097f]/);
 expect(formatSectionDate(todayISO())).toBe('Today');
});
