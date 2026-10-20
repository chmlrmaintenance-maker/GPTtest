import test from 'node:test';
import assert from 'node:assert/strict';
import {addPeriod, status, complete} from '../checks.js';
test('five-year check renews from actual completion date',()=>{
  const result=complete({due:'2026-03-01',interval:5,unit:'years'},'2026-03-04');
  assert.equal(result.due,'2031-03-04'); assert.equal(result.completed,'2026-03-04'); assert.equal(result.closed,false);
});
test('calendar recurrence clamps leap days and month ends',()=>{
  assert.equal(addPeriod('2024-02-29',1,'years'),'2025-02-28');
  assert.equal(addPeriod('2026-01-31',1,'months'),'2026-02-28');
  assert.equal(addPeriod('2026-12-31',2,'months'),'2027-02-28');
});
test('status boundaries include today and exactly 30 days',()=>{
  assert.equal(status({due:'2026-01-01'},'2026-01-02'),'Overdue');
  assert.equal(status({due:'2026-01-02'},'2026-01-02'),'Due soon');
  assert.equal(status({due:'2026-02-01'},'2026-01-02'),'Due soon');
  assert.equal(status({due:'2026-02-02'},'2026-01-02'),'Up to date');
});
test('one-time completions stop appearing overdue',()=>{
  const result=complete({due:'2026-01-01',interval:null},'2026-01-02');
  assert.equal(status(result,'2026-01-03'),'Complete');
});
