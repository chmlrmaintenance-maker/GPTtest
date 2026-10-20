import { today, addPeriod, daysUntil, status, complete } from './checks.js';
const $ = s => document.querySelector(s);
const key = 'clearcheck-v1';
let checks = [];
try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); if (!Array.isArray(saved)) throw Error(); checks = saved; } catch { alert('Saved data could not be read. Please restore your records before adding new checks.'); }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const typesKey = 'clearcheck-types-v1';
let customTypes = [];
try {
  const stored = JSON.parse(localStorage.getItem(typesKey) || '[]');
  if (!Array.isArray(stored) || stored.some(t => typeof t !== 'string' || !t.trim())) throw Error();
  customTypes = stored;
} catch { alert('Saved check types could not be read. Existing records have been kept.'); }
const typeSelect = $('#check-form').elements.type;
function availableTypes() {
  return [...new Set(['Background check', 'Registry check', ...customTypes, ...checks.map(c => c.type)])];
}
function refreshTypes() {
  const selected = typeSelect.value, filter = $('#type').value;
  const options = availableTypes().map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  typeSelect.innerHTML = options + '<option value="">＋ Create new type…</option>';
  typeSelect.value = availableTypes().includes(selected) ? selected : 'Background check';
  $('#type').innerHTML = '<option value="">All check types</option>' + availableTypes().map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  $('#type').value = availableTypes().includes(filter) ? filter : '';
}
let previousType = 'Background check';
function closeTypeCreator() {
  $('#new-type-fields').hidden = true;
  $('#new-type-name').value = '';
  $('#type-error').textContent = '';
}
typeSelect.onchange = () => {
  if (typeSelect.value) { previousType = typeSelect.value; closeTypeCreator(); }
  else { $('#new-type-fields').hidden = false; $('#new-type-name').focus(); }
};
$('#cancel-type').onclick = () => { typeSelect.value = previousType; closeTypeCreator(); };
function saveType() {
  const name = $('#new-type-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { $('#type-error').textContent = 'Enter a name for the new check type.'; $('#new-type-name').focus(); return; }
  const existing = availableTypes().find(t => t.toLowerCase() === name.toLowerCase());
  if (!existing) {
    try { localStorage.setItem(typesKey, JSON.stringify([...customTypes, name])); customTypes.push(name); }
    catch { $('#type-error').textContent = 'Unable to save this type. Browser storage may be unavailable.'; return; }
  }
  refreshTypes(); typeSelect.value = existing || name; previousType = typeSelect.value;
  closeTypeCreator(); notify(existing ? 'Existing check type selected' : 'Check type saved');
}
$('#save-type').onclick = saveType;
$('#new-type-name').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); saveType(); } };
const format = d => new Date(d + 'T12:00:00').toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'});
const recurrence = c => c.interval ? `Every ${c.interval} ${c.interval === 1 ? c.unit.slice(0,-1) : c.unit}` : 'One-time';
function notify(message) { $('#toast').textContent = message; $('#toast').hidden = false; setTimeout(() => $('#toast').hidden = true, 3500); }
function save(next) { try { localStorage.setItem(key, JSON.stringify(next)); checks = next; render(); return true; } catch { alert('Unable to save. Browser storage may be full or unavailable. Export your existing data before continuing.'); return false; } }
function visible() {
  const search = $('#search').value.trim().toLowerCase();
  return checks.filter(c => `${c.employee} ${c.role} ${c.title} ${c.type}`.toLowerCase().includes(search) && ($('#status').value === 'all' || status(c) === $('#status').value) && ($('#type').value === '' || c.type === $('#type').value) && (!$('#from').value || c.due >= $('#from').value) && (!$('#to').value || c.due <= $('#to').value)).sort((a,b) => $('#sort').value === 'name' ? a.employee.localeCompare(b.employee) : (a.due.localeCompare(b.due) * ($('#sort').value === 'desc' ? -1 : 1)));
}
function render() {
  refreshTypes();
  $('#total').textContent = checks.length;
  $('#employees').textContent = new Set(checks.map(c=>c.employee.trim().toLowerCase())).size;
  for (const [id, state] of [['current','Up to date'],['soon','Due soon'],['overdue','Overdue']]) $(`#${id}`).textContent = checks.filter(c=>status(c)===state).length;
  const list = visible();
  $('#count').textContent = list.length;
  $('#showing').textContent = `Showing ${list.length} of ${checks.length} checks`;
  $('#empty').hidden = list.length !== 0;
  $('#clear-samples').hidden = !checks.some(c=>c.sample);
  $('#rows').innerHTML = list.map(c=> {
    const state = status(c), days = daysUntil(c.due);
    const detail = c.closed ? 'Check completed' : days < 0 ? `${-days} days overdue` : days === 0 ? 'Due today' : `In ${days} days`;
    return `<tr><td><div class="person"><span class="person-avatar">${esc(c.employee.split(/\s+/).map(s=>s[0]).slice(0,2).join(''))}</span><div><strong>${esc(c.employee)}</strong><small>${esc(c.role || 'Team member')}${c.sample ? ' · Sample' : ''}</small></div></div></td><td><div class="check-title">${esc(c.title || c.type)}</div><small>${esc(c.title ? c.type : c.type === 'Registry check' ? 'Registry verification' : c.type === 'Background check' ? 'Employment screening' : 'Compliance check')}</small></td><td><div class="due ${state === 'Overdue' ? 'red' : ''}">${format(c.due)}</div><small>${detail}</small></td><td><span class="repeat-icon">${c.interval ? '↻' : '—'}</span> ${recurrence(c)}</td><td><span class="badge ${state.toLowerCase().replaceAll(' ','-')}">● ${state}</span></td><td><div class="row-actions">${!c.closed ? `<button class="complete-button" data-complete="${esc(c.id)}" title="Mark complete" aria-label="Mark ${esc(c.employee)} check complete">✓</button>` : ''}<button class="edit-button" data-edit="${esc(c.id)}">Edit</button></div></td></tr>`;
  }).join('');
}
let editing = null;
$('#add').onclick = () => { editing = null; $('#check-form').reset(); closeTypeCreator(); previousType = typeSelect.value; $('#dialog-title').textContent = 'Add a check'; $('#delete').hidden = true; $('#editor').showModal(); };
$('#cancel').onclick = () => $('#editor').close();
$('#rows').onclick = e => {
  const edit = e.target.closest('[data-edit]'), done = e.target.closest('[data-complete]');
  if (edit) {
    editing = checks.find(c=>c.id===edit.dataset.edit);
    $('#check-form').reset();
    for (const field of ['employee','role','type','title','due','interval','unit']) $('#check-form').elements[field].value = editing[field] || '';
    closeTypeCreator(); previousType = typeSelect.value;
    $('#dialog-title').textContent = 'Edit check'; $('#delete').hidden = false; $('#editor').showModal();
  }
  if (done) {
    completing = checks.find(c=>c.id===done.dataset.complete);
    $('#complete-description').textContent = `${completing.employee} · ${completing.title || completing.type}`;
    $('#complete-form').elements.date.value = today(); $('#complete-form').elements.date.max = today(); updateNext(); $('#completion').showModal();
  }
};
$('#check-form').onsubmit = e => {
  e.preventDefault(); const data = Object.fromEntries(new FormData(e.target));
  if (!data.employee.trim()) return;
  const record = {...editing,...data, employee:data.employee.trim(), interval:data.interval ? Number(data.interval) : null, id:editing?.id || crypto.randomUUID()};
  if (editing && record.due !== editing.due) record.closed = false;
  if (save(editing ? checks.map(c=>c.id===editing.id ? record : c) : [...checks, record])) { $('#editor').close(); notify('Check saved'); }
};
$('#delete').onclick = () => { if (confirm(`Delete this check for ${editing.employee}?`) && save(checks.filter(c=>c.id!==editing.id))) { $('#editor').close(); notify('Check deleted'); } };
let completing = null;
function updateNext() { const date = $('#complete-form').elements.date.value; $('#next-date').textContent = date && completing.interval ? `Next due date: ${format(addPeriod(date, completing.interval, completing.unit))}` : 'This one-time check will be marked complete.'; }
$('#complete-form').elements.date.oninput = updateNext;
$('#complete-cancel').onclick = () => $('#completion').close();
$('#complete-form').onsubmit = e => { e.preventDefault(); const date = e.target.elements.date.value; if (save(checks.map(c=>c.id===completing.id ? complete(c,date) : c))) { $('#completion').close(); notify('Completion saved'); } };
for (const id of ['search','status','type','from','to','sort']) $(`#${id}`).addEventListener('input', render);
$('#clear').onclick = () => { for (const id of ['search','from','to']) $(`#${id}`).value=''; $('#status').value='all'; $('#type').value=''; $('#sort').value='asc'; render(); };
document.querySelectorAll('.stat').forEach(b=>b.onclick=()=> { $('#status').value=b.dataset.status; render(); });
$('#export').onclick = () => {
  const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"','""') + '"';
  const rows = [['Employee','Role','Check','Type','Due date','Recurrence','Status','Last completed'], ...visible().map(c=>[c.employee,c.role,c.title || c.type,c.type,c.due,recurrence(c),status(c),c.completed || ''])];
  const url = URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a'); a.href=url; a.download=`employee-checks-${today()}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); notify('Exported currently filtered checks');
};
$('#sample').onclick = () => {
  if(checks.some(c=>c.sample)) return notify('Sample data is already loaded');
  const offset = n => { const d=new Date(today()+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
  const people=[['Olivia Bennett','Care team',-12,5,'years'],['James Wilson','Operations',8,1,'years'],['Emma Thompson','Care team',22,5,'years'],['Noah Williams','Administration',84,12,'months'],['Sophia Martinez','Care team',145,5,'years'],['Liam Anderson','Support team',210,null,'years']];
  save([...checks,...people.map(([employee,role,days,interval,unit],i)=>({id:crypto.randomUUID(),employee,role,type:i%2?'Registry check':'Background check',title:'',due:offset(days),interval,unit,sample:true}))]);
};
$('#clear-samples').onclick = () => { if(confirm('Remove all sample checks? Your own checks will be kept.')) save(checks.filter(c=>!c.sample)); };
render();
