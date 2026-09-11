import { measurementProperties } from '../measurementProperties';
it('retains behavioral codes and drops financial and free-text metadata', () => {
  expect(measurementProperties({period:'weekly',has_data:true,amount:500,amount_bucket:'500_1000',category:'Private merchant',email:'a@b.test',reason:'server included private text',nudge_id:'merchant:123',status:200})).toEqual({period:'weekly',has_data:true,status:200});
});
