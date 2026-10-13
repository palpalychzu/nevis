// Core for v2/cif-form.html: state, validation, computed values, routing, masks, popover, dialog/toast, events.
// Markup lives in components.js (one render function per Figma component), step views in steps.js.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidN = 0;
const uid = (p = 'r') => p + ++uidN;
const num = (v) => (typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, '')) || 0);
const fmtNum = (v) => (v === '' || v == null ? '' : Math.round(num(v)).toLocaleString('en-US'));
const money = (v) => (v < 0 ? '−$' : '$') + Math.round(Math.abs(v)).toLocaleString('en-US');
const fid = (path) => 'f-' + path.replace(/[^\w]/g, '-');
const THIS_YEAR = 2026;

// ---------- state ----------
let S;
function fresh() {
  return {
    step: 'welcome', visited: ['welcome'], tried: {}, sent: false, noticeClosed: false,
    you: { first: 'Jordan', last: 'Reyes', middle: '', suffix: '', dob: '', usStatus: '', cits: [], sex: '', marital: '', email: 'jordan.reyes@example.com', phone: '(914) 555-0182' },
    partner: { first: 'Taylor', last: 'Reyes', dob: '', usStatus: '', cits: [], email: '', phone: '' },
    home: { street: '', apt: '', city: '', state: '', zip: '' },
    mailingDiff: null, mailing: { street: '', apt: '', city: '', state: '', zip: '' },
    otherHomes: [], taxState: '', filing: '',
    hasDeps: null, deps: [],
    work: { status: '', occupation: '', employer: '', start: '' },
    pwork: { status: '', occupation: '', employer: '', start: '' },
    foreignTax: null, noIncome: false, incomes: [], ss: '', pension: '',
    goalsText: '', goals: [], goalsUnsure: false, retireAge: '', retireCost: '',
    cats: [], assets: [], hasDebts: null, debts: [],
    more: { spending: '', hasIns: null, ins: [], will: null, willYear: '', poa: null, trust: null, health: '', ltc: null, cpa: '', cpaFirm: '', cpaPhone: '', attorney: '', agent: '', future: '' },
    notSure: {}, docs: [], linked: [],
  };
}

function resolve(path) {
  const parts = path.split('.');
  let o = S;
  for (const p of parts.slice(0, -1)) {
    if (!o) return [null];
    if (p.includes('#')) { const [arr, id] = p.split('#'); o = o[arr]?.find((r) => r.id === id); } else o = o[p];
  }
  return [o, parts.at(-1)];
}
const get = (path) => { const [o, k] = resolve(path); return o ? o[k] : undefined; };
const set = (path, v) => { const [o, k] = resolve(path); if (o) o[k] = v; };
const partnered = () => PARTNERED.includes(S.you.marital);
const pname = () => S.partner.first || 'Your partner';
const ownerOpts = (trust) => (partnered() ? ['You', pname(), 'Joint', ...(trust ? ['Trust'] : [])] : []);
const ownerLabel = (v) => (v === 'Partner' ? pname() : v);

// ---------- validation ----------
let SHOW_ERR = false;
const RULES = {
  email: (v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && 'Enter a valid email',
  phone: (v) => v.replace(/\D/g, '').length !== 10 && 'Enter a 10-digit phone number',
  zip: (v) => !/^\d{5}$/.test(v) && 'Enter a 5-digit ZIP code',
  year: (v) => !(/^\d{4}$/.test(v) && +v > 1900 && +v < 2100) && 'Enter a 4-digit year',
  age: (v) => !(+v >= 40 && +v <= 90) && 'Enter an age between 40 and 90',
  date: (v) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    const d = m && new Date(+m[3], +m[1] - 1, +m[2]);
    return !(d && d.getMonth() === +m[1] - 1 && +m[3] > 1900 && d <= new Date(THIS_YEAR, 9, 9)) && 'Enter a date as MM/DD/YYYY';
  },
};
function errFor(o) {
  if (!SHOW_ERR || S.notSure[o.path]) return '';
  const v = get(o.path);
  const empty = v === '' || v == null || (Array.isArray(v) && !v.length);
  if (empty) return o.req ? o.msg || `${o.name || o.label} is required` : '';
  return (o.rule && RULES[o.rule](String(v))) || '';
}

// ---------- computed values ----------
function age(dob) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob || ''); return m ? THIS_YEAR - +m[3] - (+m[1] > 10 ? 1 : 0) : null; }
const assetValue = (a) => (a.qty !== undefined && PRICE[a.type] ? num(a.qty) * PRICE[a.type] : a.type === 'Pension' ? 0 : num(a.value));
function totals() {
  let assets = 0, home = 0, liquid = 0, debts = 0, homeDebt = 0;
  for (const a of S.assets) {
    if (!S.cats.includes(a.cat)) continue;
    const v = assetValue(a); assets += v;
    if (a.type === 'Primary home') home += v;
    if (a.cat === 'cash' || a.cat === 'invest') liquid += v;
  }
  if (S.more.hasIns) for (const i of S.more.ins) assets += num(i.cash);
  if (S.hasDebts) for (const d of S.debts) { debts += num(d.balance); if (d.type === 'Mortgage' && d.secured === 'primary') homeDebt += num(d.balance); }
  const net = assets - debts;
  return { assets, debts, net, exHome: net - home + Math.min(homeDebt, home), liquid };
}
const incomeTotal = () => (S.noIncome ? 0 : S.incomes.reduce((t, i) => t + num(i.amount) * (i.per === 'month' ? 12 : 1), 0));
function bracket() { // needs the client's filing status; never guessed
  const t = BRACKETS[S.filing], taxable = incomeTotal() - (t?.std || 0);
  if (!t || !incomeTotal()) return '—';
  return (taxable <= 0 ? 10 : t.b.find(([top]) => taxable <= top)[1]) + '%';
}
const retireYear = () => { const a = age(S.you.dob); return a == null || !S.retireAge ? null : THIS_YEAR + (num(S.retireAge) - a); };
function payoff(d) {
  const B = num(d.balance), r = num(d.rate) / 1200, P = num(d.payment);
  if (!B || !P) return '';
  if (r && P <= B * r) return "The payment doesn't cover the interest";
  const n = r ? -Math.log(1 - (r * B) / P) / Math.log(1 + r) : B / P;
  const end = new Date(THIS_YEAR, 9 + Math.ceil(n), 1);
  return `Paid off around ${end.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
}
const OUT = {
  net: () => money(totals().net), assets: () => money(totals().assets), debts: () => money(-totals().debts),
  exHome: () => money(totals().exHome), liquid: () => money(totals().liquid),
  income: () => money(incomeTotal()) + ' a year',
  incomeSum: () => `Total ${OUT.income()}` + (bracket() === '—' ? '' : ` · ${bracket()} federal tax bracket, estimated`),
  retire: () => (S.notSure.retireAge ? 'Not sure yet' : !S.retireAge ? 'Add your retirement age to see the year' : retireYear() ? `${retireYear()}, when you're ${num(S.retireAge)}` : 'Add your date of birth to see the year'),
  depUntil: (id) => { const d = S.deps.find((x) => x.id === id); const m = /(\d{4})$/.exec(d?.dob || ''); return m ? `${d.until || +m[1] + 22} (age ${(d.until || +m[1] + 22) - +m[1]})` : 'Add a date of birth'; },
  value: (id) => { const a = S.assets.find((x) => x.id === id); return a ? money(assetValue(a)) : ''; },
  payoff: (id) => payoff(S.debts.find((x) => x.id === id) || {}) || 'Add a payment to see it',
};
function refresh() {
  for (const el of $$('[data-out]')) { const [k, a] = el.dataset.out.split(':'); el.textContent = OUT[k](a); }
  renderSum();
  setRing(progress());
}

// ---------- motion (emilkowalski/skills: transform + opacity only, ease-out, UI under 300ms, nothing moves with reduced motion) ----------
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const EASE_OUT = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() || 'ease-out';
function tween(el, to, fmt, ms) { // counts a number to its new value; a new target picks up from what's on screen
  cancelAnimationFrame(el._raf);
  const from = el._shown ?? 0, t0 = performance.now();
  if (calm.matches || from === to) { el._shown = to; el.textContent = fmt(to); return; }
  const tick = () => {
    const k = Math.min(1, Math.max(0, (performance.now() - t0) / ms)); // own clock: rAF's frame time can sit before t0
    el._shown = from + (to - from) * (1 - (1 - k) ** 5); // easeOutQuint = the --ease-out curve
    el.textContent = fmt(el._shown);
    if (k < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}
// Re-renders replace #main, so blocks are matched by key: ones that moved glide from where they were (FLIP), new ones rise in.
const KEYED = '.page-head, .card, .row, .field-wrap, .q, .q__err, .field-foot__err, .notice, .file-item, .file-item__status, .chip, .actions > .btn, .nav, .submit, .nwbar, #main .muted, .income-total';
function keyed() {
  const n = {};
  return $$(KEYED, $('#main')).map((el) => {
    const sub = el.querySelector('.card__title, [data-choice], [data-path], [data-out]');
    const k = el.classList[0] + ':' + (el.dataset.key || el.dataset.path || el.id || sub?.dataset.choice || sub?.dataset.path || sub?.dataset.out || (sub || el).textContent.trim().slice(0, 60));
    n[k] = (n[k] || 0) + 1;
    return [k + '#' + n[k], el];
  });
}
const snap = () => new Map(keyed().map(([k, el]) => [k, el.getBoundingClientRect()]));
function settle(before) {
  const now = keyed(), keyOf = new Map(now.map(([k, el]) => [el, k])), rect = new Map(now.map(([, el]) => [el, el.getBoundingClientRect()])), fresh = [];
  for (const [k, el] of now) {
    if (fresh.some((f) => f.contains(el))) continue;
    const a = before.get(k), b = rect.get(el);
    if (!a || !a.width) { fresh.push(el); continue; }
    const p = el.parentElement.closest(KEYED), pa = p && before.get(keyOf.get(p)), pb = p && rect.get(p); // move relative to the parent block, which glides itself
    const dx = a.left - b.left - (pa ? pa.left - pb.left : 0), dy = a.top - b.top - (pa ? pa.top - pb.top : 0);
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 300, easing: EASE_OUT });
  }
  fresh.forEach((el, i) => el.animate([{ opacity: 0, transform: `translateY(${el.matches('.field-foot__err, .q__err') ? -4 : 8}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, delay: Math.min(i, 6) * 40, easing: EASE_OUT, fill: 'backwards' }));
}
function enter(back, chrome) { // a new page: its blocks rise in, 50ms apart
  if (calm.matches) return;
  const els = [...(chrome ? [$('#rail'), $('#sum')] : []), ...$$('#main > .page-head, #main > .cards > *, #main > .nav, #main > .submit, #main > .nwbar')];
  els.forEach((el, i) => el.animate([{ opacity: 0, transform: `translateY(${back ? -12 : 12}px)` }, { opacity: 1, transform: 'none' }], { duration: 400, delay: Math.min(i, 6) * 50, easing: EASE_OUT, fill: 'backwards' }));
}
let SWAP = 0;
function reveal(to) { // Review's per-row Edit: the new page opens on that answer, its Undo focused
  const el = $(`#main [data-path="${to}"]`) || $(`#t-${to}`);
  if (!el) return;
  const d = el.closest('details');
  if (d) d.open = true;
  el.scrollIntoView({ block: 'center' });
  (el.querySelector('.field-foot .link') || el).focus({ preventScroll: true });
}
function swap(back, to) { // page transition: the old page fades out, then the new one comes in
  const main = $('#main'), n = ++SWAP, from = shown;
  const show = () => { render(); scrollTo(0, 0); enter(back, from == null || from === 'welcome'); if (to) reveal(to); };
  if (calm.matches || from == null) { show(); return; }
  main.inert = true;
  main.animate([{ opacity: 0, transform: `translateY(${back ? 8 : -8}px)` }], { duration: 180, easing: EASE_OUT, fill: 'forwards' });
  setTimeout(() => { // a timer, not .finished: a throttled timeline (background tab) must not hold up navigation
    if (n !== SWAP) return;
    main.getAnimations().forEach((a) => a.cancel());
    main.inert = false;
    show();
  }, 180);
}

// ---------- routing ----------
function audit(step) { // renders a step offscreen with errors on
  const prev = SHOW_ERR; // render() may already be showing errors (Review calls missing() mid-render)
  SHOW_ERR = true;
  const t = document.createElement('template');
  t.innerHTML = STEP_VIEW[step]();
  SHOW_ERR = prev;
  const bad = $$('[data-invalid=true]', t.content).length, req = $$('[data-req]', t.content).length, badReq = $$('[data-req][data-invalid=true]', t.content).length;
  return { bad, asked: req + bad - badReq, given: req - badReq }; // group errors ("Add at least one…") count as asked, not given
}
const missing = (step) => audit(step).bad;
let PREFILLED = 0; // required answers Daniel filled in before the client arrives (name, email, phone); set at boot
function progress() { // required answers the client has given ÷ still to give, over the steps that gate Submit. Starts at 0%; Not sure counts.
  if (S.sent) return 100;
  const a = REQ_STEPS.map(audit), asked = a.reduce((t, x) => t + x.asked, 0) - PREFILLED, given = a.reduce((t, x) => t + x.given, 0) - PREFILLED;
  return asked > 0 ? Math.max(0, Math.floor((100 * given) / asked)) : 0;
}
function stepStatus(s) {
  if (s.id === S.step) return 'cur';
  const miss = ['docs', 'review'].includes(s.id) ? 0 : missing(s.id);
  if (S.tried[s.id] && miss) return 'err';
  return S.visited.includes(s.id) && !miss ? 'done' : 'todo';
}
let shown = null; // the step whose view is on screen
function render(focusId) {
  const fid0 = focusId || document.activeElement?.id;
  const before = S.step === shown && !calm.matches ? snap() : null; // same page: animate what changed
  document.body.dataset.view = S.step === 'welcome' ? 'welcome' : 'form';
  SHOW_ERR = !!S.tried[S.step]; // errors appear after the first Continue on a step
  $('#main').innerHTML = (STEP_VIEW[S.step] || STEP_VIEW.done)();
  SHOW_ERR = false;
  shown = S.step;
  $$('#main .field').forEach(sync);
  if (S.step !== 'welcome') { renderRail(); refresh(); }
  if (before) settle(before);
  if (fid0 && document.getElementById(fid0)) document.getElementById(fid0).focus({ preventScroll: true });
}
const order = (id) => STEPS.findIndex((s) => s.id === id); // welcome and done: -1
function go(id, to) {
  if (id === shown && id === S.step) { render(); return; }
  const back = order(id) < order(shown);
  S.step = id;
  if (!S.visited.includes(id)) S.visited.push(id);
  normalize();
  if (document.body.dataset.view === 'form' && order(id) >= 0) renderRail(); // the rail answers the click right away
  try { history.replaceState(null, '', '#' + id); } catch {}
  swap(back, to);
}
function next() {
  const i = STEPS.findIndex((s) => s.id === S.step);
  S.tried[S.step] = true;
  if (missing(S.step)) { render(); const bad = $('#main [data-invalid=true]'); bad?.scrollIntoView({ block: 'center', behavior: calm.matches ? 'auto' : 'smooth' }); (bad?.querySelector('input,[tabindex],button') || bad)?.focus({ preventScroll: true }); return; }
  go(STEPS[i + 1].id);
}

// field visual state: data-empty / data-focused drive the floating label (Figma Input set: Empty, Focus, Filled)
function sync(f) {
  if (f.dataset.calc || f.classList.contains('field--area')) return;
  const input = f.querySelector('input'), vEl = f.querySelector('.field__value');
  const val = input ? input.value : vEl.dataset.v;
  const focused = String(f.contains(document.activeElement) || f.dataset.state === 'open');
  f.dataset.empty = String(!val); f.dataset.focused = focused;
  if (f.dataset.select && !val) vEl.textContent = focused === 'true' ? 'Select an option' : '';
}
const rise = (el) => calm.matches || el.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE_OUT }); // an error appearing
function fieldErr(f, msg) { // shows or clears a field's error in place, as field() renders it (red border, message beneath), for checks that don't re-render
  const el = f.querySelector('input, textarea'), before = !calm.matches && f.closest('#main') && snap();
  const old = f.nextElementSibling?.classList.contains('field-foot') ? f.nextElementSibling : null;
  f.insertAdjacentHTML('afterend', fieldFoot(el.id, msg, old?.querySelector('.link')?.outerHTML)); // keeps Not sure/Undo on the right
  old?.remove();
  f.dataset.invalid = String(!!msg);
  if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', `${el.id}-e`); } else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  if (before) settle(before); // on the page: blocks below glide, like a re-render
  else if (msg) rise(document.getElementById(`${el.id}-e`));
}

// ---------- input masks ----------
const MASK = {
  money: (v) => { const d = v.replace(/\D/g, ''); return [d ? +d : '', d ? (+d).toLocaleString('en-US') : '']; },
  qty: (v) => { const d = v.replace(/[^\d.]/g, ''); return [d, d]; },
  rate: (v) => { const d = v.replace(/[^\d.]/g, '').slice(0, 6); return [d, d]; },
  zip: (v) => { const d = v.replace(/\D/g, '').slice(0, 5); return [d, d]; },
  year: (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return [d, d]; },
  date: (v) => { const d = v.replace(/\D/g, '').slice(0, 8); const s = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; return [s, s]; },
  phone: (v) => { const d = v.replace(/\D/g, '').slice(0, 10); const s = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d; return [s, s]; },
};

// ---------- popover (select menu + address suggestions) ----------
let POP = null;
const popList = (items, cur, empty) => (items.length ? items.map((it, i) => `<div class="menu__opt" role="option" id="pop-${i}" aria-selected="${it.v === cur}" data-i="${i}"><span class="menu__text">${esc(it.l)}</span>${it.v === cur ? `<span class="menu__check">${ICON.check}</span>` : ''}</div>`).join('') : `<div class="menu__empty">${empty}</div>`);
function popOpen(anchor, items, cur, onPick, input, empty = 'No matches. Keep typing, or fill in the fields below yourself.') {
  if (input && POP?.anchor === anchor) { // typing into an open list: swap the options in place, no second entrance
    Object.assign(POP, { items, onPick });
    POP.el.firstElementChild.innerHTML = popList(items, cur, empty);
    popPlace(); popHi(items.findIndex((it) => it.v === cur));
    return;
  }
  popClose();
  const el = document.createElement('div');
  el.className = 'menu-pos';
  el.innerHTML = `<div class="menu" role="listbox" tabindex="-1">${popList(items, cur, empty)}</div>`;
  $('#layer').append(el);
  POP = { el, anchor, items, onPick, input, hi: -1 };
  popPlace(); popHi(items.findIndex((it) => it.v === cur));
  if (!input) { anchor.dataset.state = 'open'; anchor.setAttribute('aria-expanded', 'true'); sync(anchor); el.querySelector('[role=listbox]').focus({ preventScroll: true }); }
  else input.setAttribute('aria-expanded', 'true');
}
function popPlace() {
  const t = POP.anchor.getBoundingClientRect(), below = innerHeight - t.bottom - 16, above = t.top - 16;
  const h = Math.min(POP.el.firstElementChild.scrollHeight, 320), down = h <= below || below >= above;
  POP.el.style.cssText = `left:${t.left}px;top:${down ? t.bottom + 8 : t.top - 8 - Math.min(h, above)}px;width:${Math.max(t.width, 240)}px;--avail:${down ? below : above}px`; // 240: state names fit next to the narrow State field
  POP.el.firstElementChild.style.transformOrigin = down ? 'top' : 'bottom'; // the menu grows out of its field
}
function popHi(i) {
  POP.hi = i;
  $$('[role=option]', POP.el).forEach((o) => o.toggleAttribute('data-highlighted', +o.dataset.i === i));
  if (i >= 0) $(`#pop-${i}`).scrollIntoView({ block: 'nearest' });
  if (POP.input) { if (i >= 0) POP.input.setAttribute('aria-activedescendant', `pop-${i}`); else POP.input.removeAttribute('aria-activedescendant'); }
}
function popClose(refocus) {
  if (!POP) return;
  const { el, anchor, input } = POP;
  POP = null; el.remove();
  if (!input) { anchor.dataset.state = 'closed'; anchor.setAttribute('aria-expanded', 'false'); sync(anchor); if (refocus) anchor.focus({ preventScroll: true }); return; }
  input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
  if (input.dataset.combo) { input.value = input.dataset.v; sync(anchor); } // typed text alone is not an answer: show the last pick again
}
function popPick(i) { const { items, onPick } = POP; popClose(true); onPick(items[i].v); }
document.addEventListener('keydown', (e) => {
  if (!POP) return;
  const n = POP.items.length, i = POP.hi;
  const to = { ArrowDown: (i + 1) % n, ArrowUp: i < 0 ? n - 1 : (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
  if (to !== undefined && n) { e.preventDefault(); popHi(to); }
  else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); popPick(i); }
  else if (e.key === 'Escape') { e.preventDefault(); popClose(true); }
  else if (!POP.input && e.key.length === 1) { const j = POP.items.findIndex((it) => it.l.toLowerCase().startsWith(e.key.toLowerCase())); if (j >= 0) popHi(j); }
});
document.addEventListener('pointerdown', (e) => { if (POP && !POP.el.contains(e.target) && !POP.anchor.contains(e.target)) popClose(); });
document.addEventListener('mousedown', (e) => { if (POP?.input && e.target.closest?.('#layer [role=option]')) e.preventDefault(); }); // the typing field keeps focus while an option is clicked
document.addEventListener('click', (e) => { const o = POP && e.target.closest('[role=option]'); if (o) popPick(+o.dataset.i); });
document.addEventListener('pointermove', (e) => { const o = POP && e.target.closest('[role=option]'); if (o) popHi(+o.dataset.i); });
addEventListener('resize', () => POP && popPlace());
addEventListener('scroll', () => POP && popPlace(), true);

// ---------- dialog + toast ----------
function dialog(html) {
  const open = $('#layer .dialog:not(.is-out)');
  if (open) open.innerHTML = html; // next screen of the same dialog: swap content, no second entrance
  else $('#layer').insertAdjacentHTML('beforeend', `<div class="backdrop" data-act="closeDialog"></div><div class="dialog" role="dialog" aria-modal="true">${html}</div>`);
  ($('.dialog:not(.is-out) [autofocus]') || $('.dialog:not(.is-out) button'))?.focus();
}
function leave(n, to) { n.classList.add('is-out'); if (calm.matches) { n.remove(); return; } n.animate([to], { duration: 150, easing: EASE_OUT, fill: 'forwards' }); setTimeout(() => n.remove(), 150); }
function closeDialog() {
  $$('#layer .backdrop:not(.is-out)').forEach((n) => leave(n, { opacity: 0 }));
  $$('#layer .dialog:not(.is-out)').forEach((n) => leave(n, { opacity: 0, transform: 'translate(-50%, -50%) scale(.96)' }));
}
function toast(msg) {
  $$('#layer .toast').forEach((t) => t.remove());
  $('#layer').insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(msg)}</div>`);
  const t = $('#layer .toast');
  setTimeout(() => leave(t, { opacity: 0, transform: 'translate(-50%, 16px)' }), 3200);
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !POP && $('.dialog:not(.is-out)')) closeDialog(); });

// ---------- events ----------
document.addEventListener('input', (e) => {
  const el = e.target, path = el.dataset.bind, f = el.closest('.field'), mask = MASK[el.dataset.kind];
  if (el.dataset.combo) { sync(f); comboOpen(el, el.value); return; } // typing searches; only a pick sets the answer
  if (path && mask) { const [v, shown] = mask(el.value); if (el.value !== shown) el.value = shown; set(path, v); } else if (path) set(path, el.value);
  if (f) sync(f);
  if (f?.dataset.invalid === 'true' && el.value.trim() && !RULES[el.dataset.rule]?.(el.value)) fieldErr(f, ''); // live re-validation: a shown error clears once the value is valid
  if (!path) return;
  if (el.dataset.ac) acSuggest(el);
  refresh();
});
document.addEventListener('click', (e) => { // an Other section opens natively: its content rises in, the cards below glide
  if (calm.matches || !e.target.closest('details.more > summary')) return;
  const before = snap();
  requestAnimationFrame(() => settle(before));
});
document.addEventListener('focusin', (e) => { const f = e.target.closest('.field'); if (f) sync(f); if (e.target.dataset?.combo) e.target.select(); });
document.addEventListener('focusout', (e) => { const f = e.target.closest('.field'); if (f) setTimeout(() => sync(f)); });
document.addEventListener('click', (e) => {
  const sel = e.target.closest('[data-select]');
  if (sel && !e.target.closest('.link')) { openSelect(sel); return; }
  const ch = e.target.closest('[data-choice]');
  if (ch) { const g = ch.closest('[data-clear]'); set(ch.dataset.choice, g && ch.getAttribute('aria-checked') === 'true' ? JSON.parse(g.dataset.clear) : JSON.parse(ch.dataset.v)); normalize(); render(ch.id); return; }
  const g = e.target.closest('[data-go]');
  if (g) { if (g.closest('.mprog')) g.closest('details').open = false; go(g.dataset.go, g.dataset.to); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) ACT[a.dataset.act](a, e);
});
document.addEventListener('keydown', (e) => {
  const sel = e.target.closest?.('[data-select]');
  if (sel && !POP && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSelect(sel); }
  if (e.target.dataset?.combo && !POP && e.key === 'ArrowDown') { e.preventDefault(); comboOpen(e.target); }
});
document.addEventListener('mousedown', (e) => { // whole field shell focuses its input
  const f = e.target.closest('.field'); const input = f?.querySelector('.field__input');
  if (f?.matches('.field--combo')) { // closed: a press opens the whole list with the answer selected, so typing replaces it; open: the chevron closes it
    if (POP?.anchor !== f) { e.preventDefault(); input.focus(); comboOpen(input); input.select(); } else if (e.target !== input) { e.preventDefault(); popClose(); }
    return;
  }
  if (input && !input.disabled && e.target !== input && !e.target.closest('button')) { e.preventDefault(); input.focus(); }
});
function openSelect(f) {
  if (POP && POP.anchor === f) { popClose(true); return; }
  const path = f.dataset.select, opts = JSON.parse(f.dataset.opts);
  popOpen(f, opts.map((o) => ({ v: o, l: path.endsWith('.owner') || path.endsWith('.who') ? ownerLabel(o) : o })), get(path), (v) => { set(path, v); normalize(); render(f.id); });
}
function acSuggest(input) {
  const q = input.value.trim().toLowerCase();
  if (q.length < 2) { popClose(); return; }
  const items = ADDRESSES.filter((a) => `${a.street}, ${a.city}, ${a.state} ${a.zip}`.toLowerCase().includes(q)).map((a) => ({ v: a, l: `${a.street}, ${a.city}, ${a.state} ${a.zip}` }));
  popOpen(input.closest('.field'), items, null, (a) => { fillAddress(input.dataset.ac, a); render(); }, input);
}
// ---------- searchable select (combo) ----------
const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // "cote" finds Côte d'Ivoire
function comboItems(opts, q) { // label starts with the query, then every typed word starts a word (aliases too), then it appears anywhere
  q = norm(q.trim());
  if (!q) return opts;
  const words = q.split(/\s+/);
  const rank = (o) => { const t = norm(`${o.l} ${o.k || ''}`), w = t.split(/[^a-z0-9]+/); return t.startsWith(q) ? 0 : words.every((x) => w.some((y) => y.startsWith(x))) ? 1 : t.includes(q) ? 2 : 3; };
  return opts.map((o) => [rank(o), o]).filter(([r]) => r < 3).sort((a, b) => a[0] - b[0]).map(([, o]) => o);
}
function comboOpen(input, q = '') {
  const items = comboItems(JSON.parse(input.dataset.opts), q);
  popOpen(input.closest('.field'), items, input.dataset.v, (v) => comboPick(input, v), input, 'No matches');
  if (q.trim() && items.length) popHi(0); // Enter takes the best match
}
function comboPick(input, v) { set(input.dataset.combo, v); normalize(); render(input.id); }
document.addEventListener('focusout', (e) => { // leaving a combo: an exact match ("NY", "canada") counts as picked; anything else shows the last pick again
  const input = e.target.closest?.('[data-combo]');
  if (!input || (POP && POP.el.contains(e.relatedTarget))) return;
  const q = norm(input.value.trim()), hit = q && input.value !== input.dataset.v && JSON.parse(input.dataset.opts).find((o) => norm(o.l) === q || norm(o.v) === q);
  if (POP?.anchor === input.closest('.field')) popClose(); else { input.value = input.dataset.v; sync(input.closest('.field')); }
  if (hit) setTimeout(() => { set(input.dataset.combo, hit.v); normalize(); render(); }); // after focus lands on the next field
});
function fillAddress(base, a) { for (const k of ['street', 'city', 'state', 'zip']) set(`${base}.${k}`, a[k]); }
