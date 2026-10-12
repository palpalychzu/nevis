// Render functions, one per Figma component (section "Components" 1:54).
// Styles for each live under the same class name in components.css.
// Contract kept from v1: every missing answer renders exactly one data-invalid="true" (on .field, .q or a group error); missing() counts them.
// Required answers also carry data-req, so progress() can count answers given against answers asked.

// ---------- Input set 1:61 (Empty, Focus, Filled, NotSure) ----------
function fieldFoot(id, err, right = '') {
  return err || right ? `<div class="field-foot">${err ? `<span class="field-foot__err" id="${id}-e">${esc(err)}</span>` : '<span></span>'}${right}</div>` : '';
}
function field(o) {
  const id = fid(o.path), unsure = S.notSure[o.path], err = errFor(o);
  let v = get(o.path) ?? '';
  if (o.kind === 'money') v = fmtNum(v);
  const mode = { money: 'numeric', rate: 'decimal', zip: 'numeric', year: 'numeric', date: 'numeric', phone: 'tel', qty: 'decimal' }[o.kind] || 'text';
  const right = o.unsure ? `<button type="button" class="link" data-act="${o.act || 'unsure'}" data-path="${o.path}">${unsure ? 'Undo' : o.unsure === true ? 'Not sure' : o.unsure}</button>` : '';
  return `<div class="field-wrap ${o.full ? 'full' : ''}" data-path="${o.path}">
  <div class="field" data-invalid="${!!err}" ${o.req ? 'data-req' : ''} data-empty="${!unsure && v === ''}" ${unsure ? 'data-unsure="true"' : ''}>
    <label class="field__label" for="${id}">${esc(o.label)}${o.opt ? '<span class="field__opt"> (optional)</span>' : ''}</label>
    <div class="field__value">${o.kind === 'money' ? '<span class="field__affix">$</span>' : ''}<input class="field__input" id="${id}" data-bind="${o.path}" data-kind="${o.kind || 'text'}" ${o.rule ? `data-rule="${o.rule}"` : ''} ${o.ac ? `data-ac="${o.ac}" autocomplete="off"` : ''} ${o.auto ? `autocomplete="${o.auto}"` : ''} type="${o.type || 'text'}" inputmode="${mode}" placeholder="${esc(o.hint || '')}" value="${unsure ? 'Not sure' : esc(v)}" ${unsure ? 'disabled' : ''} ${err ? `aria-invalid="true" aria-describedby="${id}-e"` : ''}>${o.kind === 'rate' ? '<span class="field__affix">%</span>' : ''}${o.suffix ? `<span class="field__affix">${o.suffix}</span>` : ''}</div>
  </div>${fieldFoot(id, err, right)}
</div>`;
}
function select(o) {
  const id = fid(o.path), v = get(o.path) ?? '', err = o.err !== undefined ? o.err : errFor(o);
  return `<div class="field-wrap ${o.full ? 'full' : ''}" data-path="${o.path}">
  <div class="field field--select" id="${id}" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${id}-l" data-select="${o.path}" data-opts="${esc(JSON.stringify(o.opts))}" data-invalid="${!!err}" ${o.req ? 'data-req' : ''} data-empty="${v === ''}">
    <div class="field__label" id="${id}-l">${esc(o.label)}${o.opt ? '<span class="field__opt"> (optional)</span>' : ''}</div>
    <div class="field__value" data-v="${esc(v)}">${esc(o.show ? o.show(v) : v)}</div>
    <span class="field__chev">${ICON.chevron}</span>
  </div>${fieldFoot(id, err, o.right)}
</div>`;
}
// Searchable select for long lists (countries, states): Input set with the select chevron. Typing filters; only a pick sets the answer.
// opts: [{ v, l, k }] (data.js).
function combo(o) {
  const id = fid(o.path), v = get(o.path) ?? '', err = o.err !== undefined ? o.err : errFor(o);
  return `<div class="field-wrap ${o.full ? 'full' : ''}" data-path="${o.path}">
  <div class="field field--combo" data-invalid="${!!err}" ${o.req ? 'data-req' : ''} data-empty="${v === ''}">
    <label class="field__label" for="${id}">${esc(o.label)}${o.opt ? '<span class="field__opt"> (optional)</span>' : ''}</label>
    <div class="field__value"><input class="field__input" id="${id}" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" data-combo="${o.path}" data-v="${esc(v)}" data-opts="${esc(JSON.stringify(o.opts))}" value="${esc(v)}" placeholder="${esc(o.hint || '')}" ${err ? `aria-invalid="true" aria-describedby="${id}-e"` : ''}></div>
    <span class="field__chev">${ICON.chevron}</span>
  </div>${fieldFoot(id, err, o.right)}
</div>`;
}
function calcField(o) { // computed: never asked, NotSure look, read-only
  return `<div class="field-wrap ${o.full ? 'full' : ''}">
  <div class="field field--calc" data-calc="true" data-empty="false"><div class="field__label">${esc(o.label)}</div><div class="field__value" data-out="${o.out}">${esc(OUT[o.out.split(':')[0]](o.out.split(':')[1]))}</div></div>
</div>`;
}
const textarea = (o) => `<div class="field-wrap${o.full === false ? '' : ' full'}" data-path="${o.path}"><div class="field field--area" data-empty="false"><label class="field__label" for="${o.id}">${esc(o.label)}</label><textarea id="${o.id}" class="field__input" data-bind="${o.path}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''}>${esc(get(o.path))}</textarea></div></div>`;

// ---------- choices (v1 pills; not in Figma, built from button-secondary 1:85) ----------
function choices(o) {
  const id = fid(o.path), v = get(o.path);
  const err = SHOW_ERR && o.req && (v == null || v === '') ? o.msg || 'Choose an answer' : '';
  const clear = !o.req && o.label ? `data-clear="${esc(JSON.stringify(typeof o.opts[0][0] === 'boolean' ? null : ''))}"` : ''; // optional question: clicking the chosen answer again clears it
  return `<div class="q ${o.full ? 'full' : ''}" data-invalid="${!!err}" ${o.req ? 'data-req' : ''}>
  ${o.label ? `<div class="q__label" id="${id}-l">${esc(o.label)}${o.opt ? ' <span class="q__opt">(optional)</span>' : ''}</div>` : ''}
  <div class="choices" role="radiogroup" ${clear} ${o.label ? `aria-labelledby="${id}-l"` : `aria-label="${esc(o.aria || '')}"`}>${o.opts.map(([val, l]) => `<button type="button" class="btn btn--secondary" role="radio" id="${id}-${String(val).replace(/\W/g, '')}" aria-checked="${v === val}" data-choice="${o.path}" data-v="${esc(JSON.stringify(val))}">${esc(l)}</button>`).join('')}</div>
  ${err ? `<span class="q__err">${esc(err)}</span>` : ''}
</div>`;
}
const YN = [[true, 'Yes'], [false, 'No']];
const groupErr = (show, msg) => (show ? `<div class="q" data-invalid="true"><span class="q__err">${msg}</span></div>` : '');

// ---------- buttons: button-main 1:147, button-secondary 1:85, button-header 1:94 ----------
const btn = (label, act, extra = '', kind = 'secondary', icon = '') => `<button type="button" class="btn btn--${kind}" data-act="${act}" ${extra}>${icon}<span>${label}</span></button>`;
const link = (label, attrs) => `<button type="button" class="link" ${attrs}>${label}</button>`;
const iconBtn = (act, label, attrs = '') => `<button type="button" class="icon-btn" data-act="${act}" ${attrs} aria-label="${esc(label)}">${ICON.close}</button>`;
const rmBtn = (list, id, what) => iconBtn('rm', `Remove ${what}`, `data-list="${list}" data-id="${id}"`);

// ---------- Frame 110 page head 1:135 ----------
function pageHead(title, lead, extra = '') {
  return `<div class="page-head"><h1 class="page-head__title">${title}</h1>${lead || extra ? `<div class="page-head__guide">${lead ? `<p>${lead}</p>` : ''}${extra}</div>` : ''}</div>`;
}
const delegateLink = (sec) => link('Ask someone else to fill this in', `data-act="delegate" data-sec="${esc(sec)}"`);

// ---------- section card + head ----------
function cardHead(title, desc = '', right = '', icon = '') {
  return `<div class="card__head${icon ? ' card__head--icon' : ''}">${icon ? `<span class="card__icon">${icon}</span>` : ''}<div class="card__titles"><h2 class="card__title">${title}</h2>${desc ? `<p class="card__desc">${desc}</p>` : ''}</div>${right}</div>`;
}
const rowHead = (title, rm) => `<div class="row-head"><span class="row-head__title">${esc(title)}</span>${rm}</div>`;

// ---------- Frame 45 doc tile 1:96 + Frame 50 badge 1:101 ----------
const badge = (t, neutral) => `<span class="badge${neutral ? ' badge--neutral' : ''}">${t}</span>`;
const docTile = (text, best) => `<li class="doc-tile"><span class="doc-tile__icon">${ICON.filePlus}</span><span>${text}</span>${best ? badge('Best start') : ''}</li>`;

// ---------- category tile (instances in 1:862) ----------
const tile = (c, on) => `<button type="button" class="tile" aria-pressed="${on}" data-act="cat" data-cat="${c.id}" id="tile-${c.id}"><span class="tile__icon">${ICON.cat[c.id]}</span><span class="tile__text"><span class="tile__name">${c.name}</span><span class="tile__desc">${c.desc}</span></span></button>`;

// ---------- upload item 1:759 ----------
function fileItem(d) {
  const status = d.state === 'reading' ? '<span class="file-item__bar" role="progressbar" aria-label="Reading"><i></i></span>'
    : d.state === 'done' ? `<span class="file-item__status">${d.found} filled in ${esc(d.kind)}${ICON.checkCircle}</span>`
    : '<span class="file-item__status file-item__status--wait">Not read in this prototype. Use the sample documents.</span>';
  const t = d.state === 'reading' ? ` style="--t:${d.t0 - Date.now()}ms;--dur:${d.dur}ms"` : ''; // negative delay: a re-render picks up mid-read
  return `<li class="file-item" data-key="${esc(d.name)}" data-state="${d.state}"${t}><span class="file-item__icon">${ICON.file}</span><span class="file-item__text"><span class="file-item__name">${esc(d.name)}</span>${status}</span></li>`;
}

// ---------- success notice 1:795 ----------
const notice = (title, body, closeAct) => `<div class="notice" role="status"><span class="notice__icon">${ICON.check}</span><div class="notice__text"><div class="notice__title">${title}</div>${body}</div>${closeAct ? `<button type="button" class="notice__close" data-act="${closeAct}" aria-label="Dismiss">${ICON.close}</button>` : ''}</div>`;

// ---------- Component 1 review row 1:152 ----------
// rows: [label, value, {money, strong}]
const reviewRows = (rows, noLabel) => `<dl class="review-rows${noLabel ? ' review-rows--plain' : ''}">${rows.map(([l, v, o = {}]) => `<div class="review-row${o.money ? ' review-row--money' : ''}${o.strong ? ' review-row--strong' : ''}">${noLabel ? '' : `<dt>${l}</dt>`}<dd>${v}</dd></div>`).join('')}</dl>`;

// ---------- Frame 115 missing row 1:157 ----------
const missingRow = (s, n) => `<li class="missing-row"><div><div class="missing-row__title">${s.name}</div><div class="missing-row__count">${n === 1 ? '1 answer is missing' : `${n} answers are missing`}</div></div><button type="button" class="btn btn--primary btn--fix" data-go="${s.id}">Fix</button></li>`;

// ---------- nav (Skip = button-secondary white, Continue = button-main) ----------
const nav = (skip = true) => `<div class="nav">${skip ? btn('Skip', 'skip', '', 'white') : ''}${btn('Continue', 'next', '', 'primary')}</div>`;

// ---------- General progress widget 1:725 ----------
// Built once; setRing() moves the arc (CSS transition) and counts the number, so changes animate. 100% draws the whole circle.
const ringHTML = () => `<div class="ring" role="img" aria-label="0% done"><svg viewBox="0 0 144 144" width="144" height="144" aria-hidden="true"><circle cx="72" cy="72" r="69.46" fill="none" stroke="var(--c-border)" stroke-width="1"/><circle class="ring__arc" cx="72" cy="72" r="68.14" pathLength="100" fill="none" stroke="var(--c-text)" stroke-width="7.73" stroke-linecap="round" stroke-dasharray="100 100" stroke-dashoffset="100" transform="rotate(-90 72 72)" style="opacity:0"/></svg><div class="ring__label"><span class="ring__pct"><span class="ring__n">0</span>%</span><span class="ring__cap">Progress</span></div></div>`;
function setRing(p) {
  const ring = $('#rail .ring');
  if (!ring) return;
  const arc = $('.ring__arc', ring), len = p >= 100 ? 100 : Math.max(0, p - 1.81); // below 100 the round caps add 7.73px (1.81 of 100)
  arc.style.strokeDashoffset = 100 - len;
  arc.style.opacity = p > 0 ? 1 : 0;
  ring.setAttribute('aria-label', `${p}% done`);
  tween($('.ring__n', ring), p, Math.round, 900);
}

// ---------- rail 1:105 + item 1:140 ----------
function renderRail() {
  const st = STEPS.map(stepStatus), rail = $('#rail');
  const rows = STEPS.map((s, i) => `<li><button type="button" class="rail__item" data-go="${s.id}" data-s="${st[i]}" ${st[i] === 'cur' ? 'aria-current="step"' : ''}><span class="rail__n">${i + 1}.</span><span class="rail__name">${s.name}</span>${s.id === 'review' ? '' : `<span class="rail__mark">${st[i] === 'done' ? ICON.stepDone : ''}</span>`}</button></li>`).join('');
  const i = Math.max(STEPS.findIndex((s) => s.id === S.step), 0);
  if (!rail.firstElementChild) { // built once, so the pill and the ring persist between renders and can animate
    rail.innerHTML = `<div class="rail__track"><span class="rail__pill"></span><ol class="rail__list"></ol></div>${ringHTML()}
    <details class="mprog"><summary></summary><ol class="rail__list"></ol></details><div class="mprog__bar"><i></i></div>`;
    getComputedStyle($('.ring__arc', rail)).strokeDashoffset; // flush styles so the first value animates up from 0
  }
  $('.rail__track .rail__list', rail).innerHTML = rows;
  $('.mprog .rail__list', rail).innerHTML = rows;
  $('.mprog summary', rail).innerHTML = `<span>${S.sent ? 'Sent' : `Step ${i + 1} of ${STEPS.length}`}</span><span class="mprog__all">All steps ${ICON.chevron}</span>`;
  $('.mprog__bar i', rail).style.transform = `scaleX(${S.sent ? 1 : (i + 1) / STEPS.length})`;
  const on = $('.rail__track [data-s=cur]', rail), pill = $('.rail__pill', rail);
  pill.style.opacity = on ? 1 : 0;
  if (on) pill.style.transform = `translateY(${on.offsetTop}px)`;
}

// ---------- Frame 107 summary 1:122 ----------
function renderSum() {
  const t = totals(), sum = $('#sum'), v = { ...t, owe: -t.debts };
  if (!sum.firstElementChild) sum.innerHTML = `<div class="nw-card"><div class="nw-card__label">Your net worth</div><div class="nw-card__total" data-n="net"></div>
  <dl class="nw-card__rows"><div><dt>What you own</dt><dd data-n="assets"></dd></div><div><dt>What you owe</dt><dd data-n="owe"></dd></div><div><dt>Without home</dt><dd data-n="exHome"></dd></div><div><dt>Cash &amp; Investments</dt><dd data-n="liquid"></dd></div></dl></div>`;
  for (const el of $$('[data-n]', sum)) tween(el, v[el.dataset.n], money, 700);
}
