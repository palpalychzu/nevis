// Step views, actions and sample data flows for v2/cif-form.html. Order and field decisions: ../CIF-FIELDS.md section I and A1–A12.
// Screens follow Figma "Iterations 2" (1:652): 01 Welcome 1:653, 02/03 Documents 1:684/1:736, 04 About you 1:822, 05 Net worth 1:852, 06 Review & Send 1:928.

const isWorking = (st) => st === 'Employed' || st === 'Self-employed or business owner';
const title = (id) => STEPS.find((s) => s.id === id).title;

function citsBlock(who) { // status, then other citizenships 12px beneath it; a US citizen opens that with a link
  const p = S[who], need = p.usStatus && p.usStatus !== 'US citizen', open = need || p.citOpen || p.cits.length > 0;
  const chips = p.cits.map((c) => `<span class="chip">${esc(c)}${iconBtn('rmCit', `Remove ${c}`, `data-who="${who}" data-c="${esc(c)}"`)}</span>`).join('');
  const more = p.usStatus === 'US citizen' && !open ? link('Add another citizenship', `data-act="addCit" data-who="${who}"`) : '';
  return `<div class="stack">${select({ path: `${who}.usStatus`, label: 'US citizenship status', name: 'Citizenship status', req: true, opts: OPTS.usStatus, right: more })}
  ${open ? combo({ path: `${who}.citAdd`, label: need && !p.cits.length ? 'Country of citizenship' : 'Other citizenships', opt: !need || p.cits.length > 0, req: need, hint: 'Start typing a country', opts: COUNTRY_OPTS.filter((c) => !p.cits.includes(c.v)), err: SHOW_ERR && need && !p.cits.length ? 'Country of citizenship is required' : '' }) : ''}
  ${chips ? `<div class="chips">${chips}</div>` : ''}</div>`;
}
function addressFields(base, ac, req = true) {
  return `<div class="fg">${field({ path: `${base}.street`, label: 'Street address', req, ac, full: true, hint: 'Start typing and pick your address' })}${field({ path: `${base}.apt`, label: 'Apt, suite or unit', opt: true, full: true })}
  ${field({ path: `${base}.city`, label: 'City', req })}<div class="fg fg--pair">${combo({ path: `${base}.state`, label: 'State', req, opts: STATE_OPTS })}${field({ path: `${base}.zip`, label: 'ZIP code', name: 'ZIP code', req, kind: 'zip', rule: 'zip' })}</div></div>`;
}

// welcome title, one span per letter for the reveal (kept inline so Romie's kerning survives); --i staggers the letters
const letters = (text, i0) => [...text].map((c, i) => (c === ' ' ? ' ' : `<span class="welcome__ch" style="--i:${i0 + i}">${esc(c)}</span>`)).join('');
const STEP_VIEW = {
  welcome: () => {
    const name = S.you.first;
    return `<section class="welcome"><div class="welcome__in">
  <div class="welcome__left">
    <h1 class="welcome__title" aria-label="${esc(`Welcome, ${name}.`)}"><span class="welcome__line" style="--l:0" aria-hidden="true">${letters('Welcome,', 0)}</span><br><span class="welcome__line" style="--l:1" aria-hidden="true">${letters(`${name}.`, 8)}</span></h1>
    <div class="welcome__advisor">
      <img class="welcome__photo" src="${ADVISOR.photo}" alt="${ADVISOR.name}" width="198" height="279">
      <div class="welcome__msg">
        <div style="--i:0"><p>I'm looking forward to meeting you. Before we talk, it helps me to understand you a little better: your finances, your plans, and what matters most to you.</p><p>Sharing it here, at your own pace, means we can spend our time on your future instead of paperwork.</p></div>
        <div style="--i:1"><div class="welcome__name">${ADVISOR.name}</div><div class="welcome__role">${ADVISOR.role}</div></div>
      </div>
    </div>
  </div>
  <div class="welcome__right">
    <h2 class="welcome__h2 w-in" style="--i:0">Before we meet</h2>
    <p class="welcome__lead w-in" style="--i:1">We value your time and money. To focus on what matters, we need some information from you.</p>
    <ul class="overview">${[['realestate', 'Personal information', 'Name, date of birth, citizenship, address'], ['work', 'Occupation and income', 'Your work and annual earnings'], ['invest', 'Financial goals', 'What you want to achieve, and when'], ['owed', 'Net worth', 'What you own and what you owe']].map(([i, t, d], n) => `<li class="w-in" style="--i:${n + 2}"><span class="overview__icon">${ICON.cat[i]}</span><span><span class="overview__title">${t}</span><span class="overview__desc">${d}</span></span></li>`).join('')}</ul>
    <button type="button" class="btn btn--primary btn--lg w-in" style="--i:6" data-act="start">Start</button>
    <p class="welcome__privacy w-in" style="--i:7">${ICON.shield}<span>Your information is encrypted and seen only by ${ADVISOR.name.split(' ')[0]} and his team.</span></p>
  </div>
</div></section>`;
  },

  docs: () => {
    const busy = S.docs.some((d) => d.state === 'reading'), read = S.docs.filter((d) => d.state === 'done');
    const found = read.reduce((t, d) => t + d.found, 0), got1040 = read.some((d) => d.kind === 'Tax return');
    return pageHead(title('docs'), 'Upload last year\'s tax return and a few statements. We read them and fill in what we can. You check every answer before Daniel sees it.') + `
<div class="cards">
  <section class="card card--upload">${cardHead('Upload documents', 'PDFs, photos or spreadsheets, up to 25 MB each.')}
    <div class="dropzone" id="drop">${ICON.upload24}<p>Drag files here, or</p><div class="dropzone__btns">${btn('Choose files', 'pick')}${btn('Use sample documents', 'sampleDocs')}</div><input type="file" id="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx"></div>
    ${S.docs.length ? `<ul class="file-list">${S.docs.map(fileItem).join('')}</ul>` : ''}
    ${read.length && !busy && !S.noticeClosed ? notice(`${found} fields have been filled successfully!`, `<p>Please go over the steps to check if the information provided is valid.</p>${got1040 ? "<p>Your 1040 also lists 2 accounts Daniel can't see yet. We added them to Net worth.</p>" : ''}`, 'closeNotice') : ''}
    <div><h3 class="sub">What helps</h3>
      <ul class="doc-tiles">${docTile('Form 1040 with all schedules, from last year', true)}${docTile('W-2 or a recent pay stub')}${docTile('401(k) or 403(b) statement')}${docTile('Mortgage statement or Form 1098')}</ul>
      <p class="doc-optional"><b>Optional:</b> A bank's personal financial statement, a net-worth spreadsheet or a previous advisor's questionnaire</p></div>
  </section>
  <section class="card">${cardHead('Connect accounts', 'Read-only. You sign in at your bank, and we never see your password. Works best for checking, savings, brokerage accounts, IRAs and credit cards. For a 401(k), upload a statement instead.')}
    <div class="actions">${btn('Connect accounts', 'connect', '', 'secondary', ICON.link)}</div>
    ${S.linked.length ? reviewRows(S.linked.map((l) => [esc(l.name), money(l.amount), { money: true }])) : ''}</section>
  <section class="card">${cardHead('Someone else keeps these papers?', 'Your CPA, an assistant or your partner can upload them for you. They only see this step.')}
    <div class="actions">${btn('Ask someone', 'delegate', 'data-sec="Documents"', 'secondary', ICON.userPlus)}</div></section>
</div>${nav()}`;
  },

  you: () => `${pageHead(title('you'), 'Your legal name and details, as they appear on your ID.', delegateLink('About you'))}
<div class="cards">
  <section class="card">${cardHead('You', '', link("Scan your driver's license", 'data-act="idScan"'))}
    <div class="fg">
      ${field({ path: 'you.first', label: 'First name', req: true, auto: 'given-name' })}
      ${field({ path: 'you.middle', label: 'Middle name' })}
      ${field({ path: 'you.last', label: 'Last name', req: true, auto: 'family-name' })}
      ${select({ path: 'you.suffix', label: 'Suffix', opt: true, opts: OPTS.suffix })}
      ${field({ path: 'you.dob', label: 'Date of birth', req: true, kind: 'date', rule: 'date', hint: 'MM/DD/YYYY' })}
      ${select({ path: 'you.sex', label: 'Sex', opt: true, opts: OPTS.sex })}
    </div>
    <div class="fg">
      ${citsBlock('you')}
      ${select({ path: 'you.marital', label: 'Marital status', req: true, opts: OPTS.marital })}
    </div>
    <div class="fg">
      ${field({ path: 'you.phone', label: 'Mobile phone', req: true, kind: 'phone', rule: 'phone', type: 'tel' })}
      ${field({ path: 'you.email', label: 'Email', req: true, rule: 'email', type: 'email' })}
    </div>
  </section>
  ${partnered() ? `<section class="card" data-key="partner">${cardHead(`${esc(pname())}, your partner`, 'Your plan covers you both, so we need a few details.', link(`Invite ${esc(pname())} to fill this in`, `data-act="delegate" data-sec="${esc(pname())}'s details"`))}
    <div class="fg">
      ${field({ path: 'partner.first', label: 'First name', req: true })}
      ${field({ path: 'partner.last', label: 'Last name', req: true })}
      ${field({ path: 'partner.dob', label: 'Date of birth', req: true, kind: 'date', rule: 'date', hint: 'MM/DD/YYYY' })}
      ${citsBlock('partner')}
      ${field({ path: 'partner.email', label: 'Email', opt: true, rule: 'email', type: 'email' })}
      ${field({ path: 'partner.phone', label: 'Mobile phone', opt: true, kind: 'phone', rule: 'phone', type: 'tel' })}
    </div></section>` : ''}
  <section class="card">${cardHead('Home', "Where you live now. A PO box won't work here.")}
    ${addressFields('home', 'home')}
    ${choices({ path: 'mailingDiff', label: 'Is your mailing address different?', opts: [[false, 'No'], [true, 'Yes']] })}
    ${S.mailingDiff ? addressFields('mailing', 'mailing') : ''}
    ${S.otherHomes.map((h, n) => `<div class="row">${rowHead(`Other home ${n + 1}`, rmBtn('otherHomes', h.id, 'home'))}${addressFields(`otherHomes#${h.id}`, `otherHomes#${h.id}`)}</div>`).join('')}
    <div class="actions">${btn('Add another home you live in', 'add', 'data-list="otherHomes"', 'secondary', ICON.plus)}</div>
    <div class="fg">${combo({ path: 'taxState', label: 'State where you pay income tax', req: true, full: true, opts: STATE_OPTS })}</div>
  </section>
  <section class="card">${cardHead('Children and dependents')}
    ${choices({ path: 'hasDeps', label: 'Do you have children or anyone else who depends on you financially?', opts: YN, req: true })}
    ${S.hasDeps ? S.deps.map((d, n) => `<div class="row">${S.deps.length > 1 ? rowHead(d.name || `Dependent ${n + 1}`, rmBtn('deps', d.id, 'dependent')) : ''}
      <div class="fg">${field({ path: `deps#${d.id}.name`, label: 'Full name', name: 'Name', req: true })}${select({ path: `deps#${d.id}.rel`, label: 'Relationship', req: true, opts: OPTS.rel })}${field({ path: `deps#${d.id}.dob`, label: 'Date of birth', req: true, kind: 'date', rule: 'date', hint: 'MM/DD/YYYY' })}${calcField({ label: 'Supported until', out: `depUntil:${d.id}` })}</div></div>`).join('') + `<div class="actions">${btn('Add a dependent', 'add', 'data-list="deps"', 'secondary', ICON.plus)}</div>` + groupErr(SHOW_ERR && !S.deps.length, 'Add at least one dependent, or choose No') : ''}
  </section>
</div>${nav()}`,

  work: () => {
    const workCard = (w) => `
    <div class="fg">${select({ path: `${w}.status`, label: 'Employment status', req: true, opts: OPTS.employment, full: true })}
    ${isWorking(S[w].status) ? `${field({ path: `${w}.occupation`, label: 'Occupation or job title', name: 'Occupation', req: true })}${field({ path: `${w}.employer`, label: S[w].status === 'Employed' ? 'Employer' : 'Business name', req: true })}${field({ path: `${w}.start`, label: 'Year you started', opt: true, kind: 'year', rule: 'year' })}` : ''}</div>`;
    const foreign = [S.you, ...(partnered() ? [S.partner] : [])].some((p) => (p.usStatus && p.usStatus !== 'US citizen') || p.cits.length);
    const hasInc = S.incomes.length > 0 && !S.noIncome; // "no income" hides the rows; they come back if it's undone
    const addInc = btn('Add income', 'add', 'data-list="incomes"', 'secondary', ICON.plus);
    return `${pageHead(title('work'), 'What you do and what comes in each year, before tax.', delegateLink('Work & income'))}
<div class="cards">
  <section class="card">${cardHead('Your work')}${workCard('work')}</section>
  ${partnered() ? `<section class="card">${cardHead(`${esc(pname())}'s work`)}${workCard('pwork')}</section>` : ''}
  ${foreign ? `<section class="card">${choices({ path: 'foreignTax', label: partnered() ? 'Do either of you file taxes in another country?' : 'Do you file taxes in another country?', opts: YN, req: true })}</section>` : ''}
  <section class="card">${cardHead('Income', "Before tax. Last year's numbers are a fine starting point.")}
    <div class="actions"><button type="button" class="btn btn--secondary" aria-pressed="${S.noIncome}" data-act="toggle" data-key="noIncome" id="t-noIncome">I have no income right now</button>${hasInc ? '' : addInc}</div>
    ${hasInc ? `<div class="fg">${select({ path: 'filing', label: 'Tax filing status', req: true, opts: OPTS.filing })}</div>` : ''}
    ${hasInc ? S.incomes.map((r, n) => `<div class="row">${rowHead(r.source || `Income ${n + 1}`, rmBtn('incomes', r.id, 'income'))}
      <div class="fg">${partnered() ? select({ path: `incomes#${r.id}.who`, label: 'Whose', opts: ownerOpts(), show: ownerLabel }) : ''}${select({ path: `incomes#${r.id}.source`, label: 'Source', req: true, opts: OPTS.income })}
      <div class="stack">${field({ path: `incomes#${r.id}.amount`, label: r.per === 'month' ? 'Amount per month' : 'Amount per year', name: 'Amount', req: true, kind: 'money', unsure: true })}
      ${choices({ path: `incomes#${r.id}.per`, aria: 'How often', opts: [['year', 'Per year'], ['month', 'Per month']] })}</div></div></div>`).join('') + `<div class="actions">${addInc}</div>` : ''}
    ${groupErr(SHOW_ERR && !S.noIncome && !S.incomes.length, 'Add at least one income, or tell us you have none')}
    ${hasInc ? `<p class="income-total" data-key="incomeSum" data-out="incomeSum">${esc(OUT.incomeSum())}</p>` : ''}
  </section>
  <section class="card">${cardHead('Future income', 'Optional. Helps Daniel plan your retirement.')}
    <div class="fg">${field({ path: 'ss', label: 'Social Security, per month', opt: true, kind: 'money' })}${field({ path: 'pension', label: 'Pension, per month', opt: true, kind: 'money' })}</div></section>
</div>${nav()}`;
  },
};

// ---------- goals ----------
STEP_VIEW.goals = () => {
  const retired = S.work.status === 'Retired';
  return `${pageHead(title('goals'), 'What you want your money to do, by when, and roughly how much it costs. Rough is fine.')}
<div class="cards">
  <section class="card">${cardHead('Tell us in your own words', "We'll turn it into goals with dates and rough costs. Daniel goes over every goal with you.")}
    ${textarea({ id: 'f-goalsText', path: 'goalsText', label: 'Your goals', ph: 'For example: retire at 60, help both kids with college, buy a lake house in about 5 years' })}
    <div class="actions">${btn('Turn into goals', 'goalsAI', '', 'primary')}${btn('Use an example', 'goalsSample')}</div>
  </section>
  ${retired ? '' : `<section class="card">${cardHead('Retirement')}
    <div class="fg">${field({ path: 'retireAge', label: 'Age you want to retire', name: 'Retirement age', req: true, kind: 'year', rule: 'age', hint: '65', unsure: true })}${calcField({ label: 'Retirement year', out: 'retire' })}
    ${field({ path: 'retireCost', label: 'Yearly spending in retirement, today\'s dollars', opt: true, kind: 'money', unsure: true, full: true })}</div></section>`}
  ${S.goals.map((g) => `<section class="card" data-key="${g.id}">${cardHead(esc(g.name || g.type || 'New goal'), '', rmBtn('goals', g.id, 'goal'))}
    <div class="fg">${select({ path: `goals#${g.id}.type`, label: 'Type of goal', name: 'Goal type', req: true, opts: OPTS.goal.filter((t) => t !== 'Retire') })}${field({ path: `goals#${g.id}.name`, label: 'Name it', opt: true })}
    ${field({ path: `goals#${g.id}.when`, label: 'Target year or age', name: 'Target date', req: true, kind: 'year', unsure: 'Flexible' })}
    <div class="stack">${field({ path: `goals#${g.id}.cost`, label: g.per === 'year' ? 'Cost per year, today\'s dollars' : 'Cost, today\'s dollars', name: 'Cost', req: true, kind: 'money', unsure: g.cost ? '' : 'Estimate it for me', act: 'estimate' })}
    ${choices({ path: `goals#${g.id}.per`, aria: 'One-time or yearly', opts: [['once', 'One-time'], ['year', 'Every year']] })}</div>
    ${choices({ path: `goals#${g.id}.priority`, label: 'How important is it?', opt: true, opts: [['must', 'Must-have'], ['nice', 'Nice to have']] })}</div></section>`).join('')}
  <div class="actions">${btn('Add a goal', 'add', 'data-list="goals"', 'white', ICON.plus)}<button type="button" class="btn btn--white" aria-pressed="${S.goalsUnsure}" data-act="toggle" data-key="goalsUnsure" id="t-goalsUnsure">Not sure yet, let's talk in the meeting</button></div>
  ${groupErr(SHOW_ERR && retired && !S.goals.length && !S.goalsUnsure, 'Add at least one goal, or choose "Not sure yet"')}
</div>${nav()}`;
};

// ---------- net worth ----------
function assetRow(a, many) {
  const c = CATS.find((x) => x.id === a.cat), p = `assets#${a.id}`;
  const owner = partnered() ? select({ path: `${p}.owner`, label: 'Owner', opts: ownerOpts(true), show: ownerLabel }) : '';
  let body;
  if (c.how === 'price') body = `${field({ path: `${p}.qty`, label: c.id === 'crypto' ? 'How many coins' : 'Ounces', name: 'Quantity', req: true, kind: 'qty' })}${calcField({ label: 'Value', out: `value:${a.id}` })}`;
  else if (c.id === 'realestate') body = `${field({ path: `${p}.inst`, label: 'Address', req: true, full: true })}${field({ path: `${p}.value`, label: 'Current value', name: 'Value', req: true, kind: 'money', unsure: true })}${field({ path: `${p}.cost`, label: 'What you paid', opt: true, kind: 'money' })}`;
  else if (a.type === 'Pension') body = `${field({ path: `${p}.inst`, label: 'Employer or plan', req: true })}${field({ path: `${p}.value`, label: 'Monthly benefit at retirement', name: 'Benefit', req: true, kind: 'money', unsure: true })}`;
  else body = `${field({ path: `${p}.inst`, label: c.how === 'manual' ? 'Description' : 'Institution', req: true, unsure: c.how !== 'manual' })}${field({ path: `${p}.value`, label: 'Amount', req: true, kind: 'money', unsure: true })}`;
  return `<div class="row">${many ? rowHead(a.inst || a.type || c.name, rmBtn('assets', a.id, c.name)) : ''}<div class="fg">${owner}${select({ path: `${p}.type`, label: 'Type', req: true, opts: c.types })}${body}</div></div>`;
}
function catCard(c) {
  const rows = S.assets.filter((a) => a.cat === c.id);
  const add = btn(c.id === 'realestate' ? 'Add a property' : c.how === 'link' || c.how === 'doc' ? 'Enter manually' : 'Add', 'add', `data-list="assets" data-cat="${c.id}"`, 'secondary', ICON.plus);
  const up = btn('Upload statement', 'pick', '', 'secondary', ICON.upload);
  const acts = { link: btn('Connect accounts', 'connect', '', 'secondary', ICON.link) + up + add, doc: up + add }[c.how] || add;
  const how = { link: 'Connecting is quickest. You can also upload a statement or type it in.', doc: 'A statement is quickest. You can also type it in.', address: 'We estimate each value from the address. Change it if you know better.', price: "Tell us how much you hold and we'll work out the value.", manual: 'Your own estimate is fine.' }[c.how];
  return `<section class="card">${cardHead(c.name, how, '', ICON.cat[c.id])}
    <div class="actions">${acts}</div>
    ${c.tip ? `<div class="notice notice--info">${c.tip}</div>` : ''}
    ${rows.map((a) => assetRow(a, rows.length > 1)).join('') || '<p class="muted">Nothing added yet.</p>'}
    ${groupErr(SHOW_ERR && !rows.length, `Add at least one, or unselect ${c.name}`)}</section>`;
}
function debtRow(d, many) {
  const p = `debts#${d.id}`;
  return `<div class="row">${many ? rowHead(d.lender || d.type || 'Debt', rmBtn('debts', d.id, 'debt')) : ''}
  <div class="fg">${partnered() ? select({ path: `${p}.owner`, label: 'Whose', opts: ownerOpts(), show: ownerLabel }) : ''}${select({ path: `${p}.type`, label: 'Type', req: true, opts: OPTS.debt })}
  ${field({ path: `${p}.lender`, label: 'Lender', req: true, unsure: true })}${field({ path: `${p}.balance`, label: 'Balance', req: true, kind: 'money' })}
  ${field({ path: `${p}.rate`, label: 'Interest rate', name: 'Interest rate', req: true, kind: 'rate', unsure: true })}${field({ path: `${p}.payment`, label: 'Monthly payment', opt: true, kind: 'money' })}
  ${calcField({ label: 'Payoff date', out: `payoff:${d.id}` })}</div></div>`;
}
STEP_VIEW.networth = () => `${pageHead(title('networth'), 'What you own and what you owe. Estimates are fine.', delegateLink('Net worth'))}
<div class="cards">
  <section class="card card--tiles">${cardHead('What you own', 'Pick everything that applies, then add details below.')}
    <div class="tiles">${CATS.map((c) => tile(c, S.cats.includes(c.id))).join('')}</div>
    ${groupErr(SHOW_ERR && !S.cats.length, 'Pick at least one')}
  </section>
  ${CATS.filter((c) => S.cats.includes(c.id)).map(catCard).join('')}
  <section class="card">${cardHead('What you owe', 'Mortgages, loans and card balances.')}
    ${choices({ path: 'hasDebts', label: 'Do you owe money on anything?', opts: YN, req: true })}
    ${S.hasDebts ? S.debts.map((d) => debtRow(d, S.debts.length > 1)).join('') + `<div class="actions">${btn('Add a debt', 'add', 'data-list="debts"', 'secondary', ICON.plus)}${btn('Connect a credit card', 'connect', '', 'secondary', ICON.link)}</div>` + groupErr(SHOW_ERR && !S.debts.length, 'Add at least one debt, or choose No') : ''}
  </section>
</div>${nav()}
<div class="nwbar" data-key="nwbar"><span>Your net worth</span><strong data-out="net"></strong></div>`;

// ---------- other (optional, never blocks submit) ----------
function moreSec(key, t, desc, body, answered) {
  return `<details class="card more" data-key="${key}" ${S.open?.[key] ? 'open' : ''}><summary class="card__head"><div class="card__titles"><h2 class="card__title">${t}</h2><p class="card__desc">${desc}</p></div><span class="more__meta">${badge(answered ? 'Answered' : 'Optional', true)}<span class="more__chev">${ICON.chevron}</span></span></summary><div class="more__body">${body}</div></details>`;
}
STEP_VIEW.more = () => {
  const m = S.more;
  return `${pageHead(title('more'), 'All optional. Skip anything you would rather talk about in person.')}
<div class="cards">
  ${moreSec('spend', 'Spending', 'One number instead of a budget.', `<div class="fg">${field({ path: 'more.spending', label: 'About how much do you spend a month?', opt: true, kind: 'money', unsure: true, full: true })}</div>`, m.spending)}
  ${moreSec('ins', 'Insurance', 'Life, disability and long-term-care policies.', `${choices({ path: 'more.hasIns', label: 'Do you have life, disability or long-term-care insurance?', opts: YN })}
    ${m.hasIns ? `<div class="notice notice--info notice--row"><span>Upload your policies or annual statements and we'll fill this in.</span>${btn('Upload policies', 'pick', '', 'white', ICON.upload)}</div>` + m.ins.map((i) => `<div class="row">${m.ins.length > 1 ? rowHead(i.type || 'Policy', rmBtn('ins', i.id, 'policy')) : ''}<div class="fg">${select({ path: `more.ins#${i.id}.type`, label: 'Type', opt: true, opts: OPTS.ins })}${field({ path: `more.ins#${i.id}.insurer`, label: 'Insurer', opt: true })}${field({ path: `more.ins#${i.id}.coverage`, label: 'Coverage amount', opt: true, kind: 'money' })}${field({ path: `more.ins#${i.id}.premium`, label: 'Premium per month', opt: true, kind: 'money' })}${field({ path: `more.ins#${i.id}.ends`, label: 'Coverage ends', opt: true, kind: 'year', rule: 'year' })}${i.type === 'Permanent life' ? field({ path: `more.ins#${i.id}.cash`, label: 'Cash value', opt: true, kind: 'money' }) : ''}</div></div>`).join('') + `<div class="actions">${btn('Add a policy', 'add', 'data-list="ins"', 'secondary', ICON.plus)}</div>` : ''}`, m.hasIns !== null)}
  ${moreSec('estate', 'Estate documents', 'Whether these exist. Daniel reads the details later.', `${choices({ path: 'more.will', label: 'Do you have a will?', opts: YN })}${m.will ? `<div class="fg">${field({ path: 'more.willYear', label: 'Year you signed it', opt: true, kind: 'year', rule: 'year' })}</div>` : ''}${choices({ path: 'more.poa', label: 'Do you have a financial power of attorney or healthcare proxy?', opts: YN })}${choices({ path: 'more.trust', label: 'Do you have a revocable living trust?', opts: YN })}`, m.will !== null || m.poa !== null || m.trust !== null)}
  ${moreSec('health', 'Health', 'Only used to plan how long your money needs to last.', `<div class="fg">${select({ path: 'more.health', label: 'Your health overall', opt: true, opts: OPTS.health })}</div>${choices({ path: 'more.ltc', label: 'Do you expect to need long-term care?', opts: YN })}`, m.health || m.ltc !== null)}
  ${moreSec('pros', 'Your other advisors', 'Daniel may need to work with them.', `<div class="fg">${field({ path: 'more.cpa', label: 'CPA or tax preparer', opt: true })}${field({ path: 'more.cpaFirm', label: 'Firm', opt: true })}${field({ path: 'more.cpaPhone', label: 'Phone', opt: true, kind: 'phone', rule: 'phone' })}${field({ path: 'more.attorney', label: 'Estate attorney', opt: true })}${field({ path: 'more.agent', label: 'Insurance agent', opt: true })}</div>`, m.cpa || m.attorney || m.agent)}
  ${moreSec('future', 'Anything coming up', 'An inheritance, a big gift, a home sale, a job change.', textarea({ id: 'f-more-future', path: 'more.future', label: 'Tell Daniel about it' }), m.future)}
</div>${nav()}`;
};

// ---------- review & send ----------
const LABEL = { marital: 'Marital status', street: 'Street address', city: 'City', state: 'State', zip: 'ZIP code', status: 'Employment status', amount: 'Income amount', value: 'Amount', hasDeps: 'Dependents', type: 'Type', inst: 'Account', retireAge: 'Retirement age', retireCost: 'Spending in retirement', spending: 'Monthly spending', cost: 'Goal cost', when: 'Target date', name: 'Name', rel: 'Relationship', dob: 'Date of birth', middle: 'Middle name', lender: 'Lender', rate: 'Interest rate' };
const REQ_STEPS = ['you', 'work', 'goals', 'networth'];
STEP_VIEW.review = () => {
  const miss = STEPS.filter((s) => REQ_STEPS.includes(s.id)).map((s) => [s, missing(s.id)]).filter((x) => x[1]);
  const unsure = Object.keys(S.notSure).filter((k) => S.notSure[k] && get(k) !== undefined && !(S.noIncome && k.startsWith('incomes#'))), t = totals();
  const edit = (id) => link('Edit', `data-go="${id}"`);
  const deps = S.hasDeps ? S.deps.map((d) => d.name).filter(Boolean).join(', ') || 'Yes' : S.hasDeps === false ? 'None' : '—';
  const meeting = unsure.map((k) => { const o = k.includes('#') ? resolve(k)[0] : null; return [LABEL[k.split('.').at(-1)] || k, esc(o?.inst || o?.lender || o?.name || o?.type || 'Not sure')]; });
  if (S.goalsUnsure) meeting.push(['Your goals', 'Not sure yet']);
  return `${pageHead(title('review'), 'Change anything that looks off.')}
<div class="cards">
  ${miss.length ? `<section class="card card--missing">${cardHead('Some required answers are missing', 'Please fix these', '', ICON.warning)}<ul class="missing-rows">${miss.map(([s, n]) => missingRow(s, n)).join('')}</ul></section>` : ''}
  ${meeting.length ? `<section class="card card--review">${cardHead("We'll go over these in your meeting")}${reviewRows(meeting)}</section>` : ''}
  <section class="card card--review">${cardHead('About you', '', edit('you'))}${reviewRows([
    ['Name', esc(`${S.you.first} ${S.you.middle} ${S.you.last} ${S.you.suffix}`.replace(/\s+/g, ' ').trim())],
    ['Date of birth', esc(S.you.dob || '—')],
    ['Citizenship', esc([S.you.usStatus, ...S.you.cits].filter(Boolean).join(', ') || '—')],
    ['Marital status', esc(S.you.marital || '—')],
    ['Home', esc(S.home.street ? `${S.home.street}, ${S.home.city}, ${S.home.state}` : '—')],
    ['Own or rent', S.assets.some((a) => a.type === 'Primary home' && S.cats.includes('realestate')) ? 'Own' : 'Rent'],
    ['Dependents', esc(deps)]])}</section>
  <section class="card card--review">${cardHead('Work & income', '', edit('work'))}${reviewRows([
    ['Employment', esc([S.work.status, S.work.employer].filter(Boolean).join(' · ') || '—')],
    ...(partnered() ? [[esc(pname()), esc([S.pwork.status, S.pwork.employer].filter(Boolean).join(' · ') || '—')]] : []),
    ['Total income', OUT.income()], ...(S.incomes.length && !S.noIncome ? [['Filing status', esc(S.filing || '—')], ['Tax bracket', bracket()]] : [])])}</section>
  <section class="card card--review">${cardHead('Goals', '', edit('goals'))}${reviewRows([
    ...(S.work.status === 'Retired' || S.notSure.retireAge ? [] : [S.retireAge ? [`Retire at ${num(S.retireAge)}`, String(retireYear() || '—')] : ['Retirement age', '—']]),
    ...S.goals.map((g) => [esc(g.name || g.type || 'Goal'), `${S.notSure[`goals#${g.id}.when`] ? 'Flexible' : esc(g.when || '—')} · ${g.cost ? money(num(g.cost)) + (g.per === 'year' ? ' a year' : '') : 'Not sure'}`])])}</section>
  <section class="card card--review">${cardHead('Net worth', '', edit('networth'))}${reviewRows([
    ...CATS.filter((c) => S.cats.includes(c.id)).map((c) => [c.name, money(S.assets.filter((a) => a.cat === c.id).reduce((s, a) => s + assetValue(a), 0)), { money: true }]),
    ['What you owe', money(-t.debts), { money: true }], ['Net worth', money(t.net), { money: true, strong: true }]])}</section>
</div>
<div class="submit">${btn('Submit form', 'send', '', 'primary btn--lg')}</div>`;
};
STEP_VIEW.done = () => `${pageHead(`Thanks, ${esc(S.you.first)}. Daniel has your answers.`, 'Daniel will review everything before your meeting on Tuesday, October 20 at 10:00 AM. You can still change your answers until then.')}
<div class="cards"><section class="card card--review">${cardHead('After the meeting', "If you decide to open accounts, we'll ask for a few more things then.")}
  ${reviewRows(['Social Security number and a photo ID', 'Beneficiaries for each account', 'A trusted contact, if you want one', 'Whether you work for a brokerage or are an officer of a public company', 'A short questionnaire about investment risk'].map((x) => ['', x]), true)}</section></div>
<div class="nav">${btn('See your answers', 'goReview', '', 'white')}</div>`;

// ---------- state upkeep ----------
const ROW = {
  incomes: () => ({ who: 'You', source: '', amount: '', per: 'year' }),
  deps: () => ({ name: '', rel: '', dob: '' }),
  goals: () => ({ type: '', name: '', when: '', cost: '', per: 'once', priority: '' }),
  otherHomes: () => ({ street: '', apt: '', city: '', state: '', zip: '' }),
  debts: () => ({ owner: 'You', type: '', lender: '', balance: '', rate: '', payment: '' }),
  ins: () => ({ type: '', insurer: '', coverage: '', premium: '', ends: '', cash: '' }),
};
function addRow(list, extra = {}) {
  const r = { id: uid(), ...(list === 'assets' ? { owner: 'You', type: '', inst: '', value: '' } : ROW[list]()), ...extra };
  if (r.cat && CATS.find((c) => c.id === r.cat).how === 'price') r.qty = r.qty ?? '';
  (list === 'ins' ? S.more.ins : S[list]).push(r);
  return r;
}
function homeRow(base, a, type) { // every home you live in is also real estate (CIF-FIELDS.md A2)
  if (!a.street || !S.cats.includes('realestate') || S.assets.some((x) => x.home === base)) return;
  addRow('assets', { cat: 'realestate', type, inst: `${a.street}, ${a.city}`, home: base, value: HOME_VALUE[a.street] || '' });
}
function normalize() {
  for (const w of ['you', 'partner']) if (S[w].citAdd) { S[w].cits.push(S[w].citAdd); S[w].citAdd = ''; }
  homeRow('home', S.home, 'Primary home');
  S.otherHomes.forEach((h) => homeRow(h.id, h, 'Vacation home'));
  if (S.hasDeps && !S.deps.length) addRow('deps');
  if (S.hasDebts && !S.debts.length) addRow('debts');
  if (S.more.hasIns && !S.more.ins.length) addRow('ins');
  for (const i of S.incomes) if (!partnered()) i.who = 'You';
}

// ---------- sample flows (prototype stand-ins for document AI, linking, ID scan, goal builder) ----------
function apply1040() {
  set('you.marital', 'Married');
  fillAddress('home', ADDRESSES[0]);
  S.hasDeps = true;
  S.deps = S.deps.filter((d) => d.name);
  for (const [name, rel] of [['Mia Reyes', 'Daughter'], ['Leo Reyes', 'Son']]) if (!S.deps.some((d) => d.name === name)) addRow('deps', { name, rel });
  set('work.status', 'Employed');
  set('pwork.status', 'Self-employed or business owner');
  S.filing = 'Married filing jointly'; // read from the return, not guessed
  S.incomes = S.incomes.filter((i) => i.amount);
  for (const [who, source, amount] of [['You', 'Salary', 395000], ['Partner', 'Business income', 96000], ['Joint', 'Rental income', 28400], ['Joint', 'Investment income', 14500]]) addRow('incomes', { who, source, amount });
  Object.assign(S.more, { cpa: 'Lena Ortiz, CPA', cpaFirm: 'Ortiz & Gold LLP', cpaPhone: '(914) 555-0147' });
  for (const c of ['invest', 'realestate', 'funds']) if (!S.cats.includes(c)) S.cats.push(c);
  addRow('assets', { cat: 'invest', type: 'Brokerage (individual)', owner: 'Partner', inst: 'Vanguard' });
  addRow('assets', { cat: 'realestate', type: 'Rental property', inst: '12 Bayshore Drive, Sarasota', value: HOME_VALUE['12 Bayshore Drive'], owner: 'Joint' });
  addRow('assets', { cat: 'funds', type: 'Limited partnership', inst: 'Harbor Point Ventures II, LP' });
}
function applyW2() { set('work.employer', 'Northwind Health'); if (!S.cats.includes('work')) S.cats.push('work'); }
function apply401k() { addRow('assets', { cat: 'work', type: '401(k)', inst: 'Northwind Health 401(k), Empower', value: 498200 }); }
function applyMortgage() {
  S.hasDebts = true; S.debts = S.debts.filter((d) => d.type);
  addRow('debts', { type: 'Mortgage', lender: 'Wells Fargo Home Mortgage', balance: 1118400, rate: '6.125', payment: 7840, secured: 'primary' });
}
const SAMPLE_DOCS = [['2025 Form 1040 (with schedules).pdf', 'Tax return', 19, apply1040], ['2025 W-2, Northwind Health.pdf', 'W-2', 2, applyW2], ['Empower 401(k), Q3 2026.pdf', '401(k) statement', 3, apply401k], ['Wells Fargo mortgage, Sep 2026.pdf', 'Mortgage statement', 5, applyMortgage]];
function linkInst(name, picks) {
  for (const acct of INSTITUTIONS[name].filter((_, i) => picks.includes(i))) {
    if (acct.kind === 'debt') {
      S.hasDebts = true; S.debts = S.debts.filter((d) => d.type);
      addRow('debts', { type: acct.type, lender: acct.lender, owner: acct.owner, balance: acct.balance, rate: String(acct.rate), payment: acct.payment });
      S.linked.push({ name: acct.lender, amount: -acct.balance });
      continue;
    }
    if (!S.cats.includes(acct.cat)) S.cats.push(acct.cat);
    const found = S.assets.find((a) => a.cat === acct.cat && !a.value && a.inst && acct.inst.startsWith(a.inst)); // completes an account the 1040 revealed
    if (found) Object.assign(found, { inst: acct.inst, value: acct.value, type: acct.type });
    else addRow('assets', { cat: acct.cat, type: acct.type, inst: acct.inst, owner: acct.owner, value: acct.value });
    S.linked.push({ name: acct.inst, amount: acct.value });
  }
}
function idScan() {
  set('you.middle', 'Alexander'); set('you.dob', '05/22/1979');
  if (!S.home.street) fillAddress('home', ADDRESSES[0]);
}
function goalsFromText(text) {
  const t = text.toLowerCase(), yearsIn = (re) => { const m = t.match(re); return m ? String(THIS_YEAR + +m[1]) : ''; };
  S.goals = S.goals.filter((g) => !g.ai);
  const make = (type, extra = {}) => {
    const g = addRow('goals', { type, ai: true, ...extra });
    const [cost, per] = GOAL_COST[type] || [];
    if (cost) { g.cost = cost; g.per = per; }
    if (!g.when && per === 'year') S.notSure[`goals#${g.id}.when`] = true; // yearly goals start now: 'Flexible'
  };
  const age = t.match(/retire[^0-9]{0,20}(\d{2})/);
  if (age) S.retireAge = age[1];
  if (/college|universit|tuition|education/.test(t)) {
    const kids = S.deps.filter((d) => ['Daughter', 'Son', 'Stepchild'].includes(d.rel));
    if (kids.length) kids.forEach((k) => { const y = /(\d{4})$/.exec(k.dob || ''); make('Education', { name: `${k.name.split(' ')[0]}'s college`, when: y ? String(+y[1] + 18) : '' }); });
    else make('Education');
  }
  if (/lake house|vacation home|beach house|second home|cabin|buy a (house|home)/.test(t)) make('Buy a home', { name: /lake house/.test(t) ? 'Lake house' : '', when: yearsIn(/(?:house|home|cabin)[^.]*?(\d+)\s*years?/) });
  if (/travel|trip/.test(t)) make('Travel');
  if (/wedding/.test(t)) make('Wedding');
  if (/start(ing)? a (business|company)/.test(t)) make('Start a business');
  if (/charit|donat|giving|give more/.test(t)) make('Give to charity');
  if (/inherit|legacy|leave .* (kids|children)/.test(t)) make('Leave an inheritance');
  if (/pay off|debt free/.test(t)) make('Pay off debt');
  if (/emergency|rainy/.test(t)) make('Build an emergency fund');
}
function fillAll() {
  S = fresh();
  SAMPLE_DOCS.forEach(([name, kind, found, fn]) => { fn(); S.docs.push({ name, kind, found, state: 'done' }); });
  linkInst('Chase', [0, 1, 2]); linkInst('Schwab', [0]); linkInst('Fidelity', [0]); linkInst('Vanguard', [0]);
  idScan();
  Object.assign(S.you, { usStatus: 'US citizen' });
  S.taxState = 'NY';
  Object.assign(S.partner, { dob: '11/03/1981', usStatus: 'Green card holder', cits: ['Canada'] });
  S.foreignTax = false;
  ['03/14/2014', '08/02/2017'].forEach((dob, i) => { S.deps[i].dob = dob; });
  Object.assign(S.work, { occupation: 'VP of Product', start: '2019' });
  Object.assign(S.pwork, { occupation: 'Architect', employer: 'Reyes Studio' });
  S.goalsText = GOALS_SAMPLE; goalsFromText(GOALS_SAMPLE);
  S.cats.push('edu', 'crypto', 'valuables');
  addRow('assets', { cat: 'edu', type: '529 plan', inst: "Mia's 529, NY 529 Direct Plan", value: 96200 });
  addRow('assets', { cat: 'edu', type: '529 plan', inst: "Leo's 529, NY 529 Direct Plan", value: 61800 });
  addRow('assets', { cat: 'crypto', type: 'Bitcoin (BTC)', qty: '1.2' });
  addRow('assets', { cat: 'valuables', type: 'Watches', inst: 'Watch collection', value: 85000 });
  normalize();
  S.notSure[`assets#${S.assets.find((a) => a.cat === 'funds').id}.value`] = true;
  addRow('debts', { type: 'Auto loan', lender: 'Toyota Financial Services', balance: 18400, rate: '4.9', payment: 520 });
  Object.assign(S.more, { spending: 22000, hasIns: false, will: true, willYear: '2019', poa: true, trust: false, health: 'Good', ltc: false });
  S.visited = ['welcome', ...STEPS.map((s) => s.id)];
}

// ---------- actions ----------
const stepIdx = () => STEPS.findIndex((s) => s.id === S.step);
const closeBtn = iconBtn('closeDialog', 'Close');
const ACT = {
  next, start: () => go('docs'), skip: () => go(STEPS[stepIdx() + 1].id), goReview: () => go('review'),
  fillAll: () => { fillAll(); go('review'); toast('Filled with sample data.'); },
  reset: () => { S = fresh(); closeDialog(); go('welcome'); },
  save: () => toast(`Saved. We emailed ${S.you.email} a link to pick up where you left off.`),
  questions: () => toast("Prototype: this would message Daniel's team."),
  closeNotice: () => { S.noticeClosed = true; render(); },
  unsure: (a) => { S.notSure[a.dataset.path] = !S.notSure[a.dataset.path]; render(); },
  estimate: (a) => { const g = resolve(a.dataset.path)[0], [cost, per] = GOAL_COST[g.type] || [100000, 'once']; g.cost = cost; g.per = per; render(); },
  add: (a) => { if (a.dataset.list === 'incomes') S.noIncome = false; const base = a.dataset.list === 'ins' ? 'more.ins' : a.dataset.list, r = addRow(a.dataset.list, a.dataset.cat ? { cat: a.dataset.cat } : {}); render(); $(`[data-bind^="${base}#${r.id}"], [data-select^="${base}#${r.id}"]`)?.focus(); },
  rm: (a) => { const list = a.dataset.list === 'ins' ? S.more.ins : S[a.dataset.list]; list.splice(list.findIndex((r) => r.id === a.dataset.id), 1); render(); },
  rmCit: (a) => { const w = S[a.dataset.who]; w.cits = w.cits.filter((c) => c !== a.dataset.c); render(); },
  toggle: (a) => {
    const k = a.dataset.key;
    S[k] = !S[k];
    if (k === 'noIncome' && S[k]) S.incomes = S.incomes.filter((i) => i.source || i.amount !== '' || S.notSure[`incomes#${i.id}.amount`]); // blank rows go; filled ones wait in case it's undone
    render(a.id);
  },
  cat: (a) => {
    const id = a.dataset.cat, on = S.cats.includes(id);
    S.cats = on ? S.cats.filter((c) => c !== id) : [...S.cats, id];
    const c = CATS.find((x) => x.id === id);
    if (!on && !S.assets.some((x) => x.cat === id) && c.how !== 'link' && !(id === 'realestate' && S.home.street)) addRow('assets', { cat: id });
    normalize(); render(a.id);
  },
  pick: () => { if (S.step !== 'docs') toast('Prototype: upload works on the Documents step. Try "Use sample documents" there.'); else $('#file').click(); },
  sampleDocs: () => {
    const todo = SAMPLE_DOCS.filter(([name]) => !S.docs.some((d) => d.name === name));
    if (!todo.length) return;
    S.noticeClosed = false;
    const read = (i) => 1200 + i * 700; // ms per document; the bar fills over exactly this
    todo.forEach(([name, kind, found], i) => S.docs.push({ name, kind, found, state: 'reading', t0: Date.now(), dur: read(i) }));
    render();
    todo.forEach(([name, , , fn], i) => setTimeout(() => {
      fn(); S.docs.find((d) => d.name === name).state = 'done';
      normalize(); if (S.step === 'docs') render(); else refresh();
    }, read(i)));
  },
  connect: () => dialog(`${cardHead('Connect an account', 'Read-only. You sign in at your bank, so we never see your password. You can disconnect anytime.', closeBtn)}
    <div class="inst-list">${Object.keys(INSTITUTIONS).map((n) => `<button type="button" class="inst" data-act="instPick" data-inst="${n}"><span>${n}</span>${INSTITUTIONS[n].length ? `<span class="inst__chev">${ICON.chevron}</span>` : '<span class="muted small">No sample data</span>'}</button>`).join('')}</div>`),
  instPick: (a) => {
    const n = a.dataset.inst, accts = INSTITUTIONS[n];
    if (!accts.length) { toast(`Prototype: no sample accounts for ${n}.`); return; }
    dialog(`${cardHead(`Signing in at ${n}…`, `You'd finish signing in on ${n}'s own page.`)}<div class="bar"><i></i></div>`);
    setTimeout(() => dialog(`${cardHead('Choose accounts to share', `${n} shares balances, never your login.`, closeBtn)}
      <div class="inst-list">${accts.map((x, i) => `<label class="check"><input type="checkbox" checked value="${i}"><span>${esc(x.inst || x.lender)}<br><span class="muted small">${money(x.value ?? -x.balance)}</span></span></label>`).join('')}</div>
      <div class="nav nav--dialog">${btn('Share selected', 'instShare', `data-inst="${n}"`, 'primary')}</div>`), 1100);
  },
  instShare: (a) => {
    const picks = $$('.dialog input:checked').map((i) => +i.value);
    if (!picks.length) { if (!$('.dialog .q__err')) { $('.dialog .inst-list').insertAdjacentHTML('beforeend', '<p class="q__err" role="alert">Choose at least one account</p>'); rise($('.dialog .q__err')); } return; }
    linkInst(a.dataset.inst, picks); closeDialog(); normalize(); render();
    toast(`Connected ${picks.length} account${picks.length === 1 ? '' : 's'} at ${a.dataset.inst}`);
  },
  delegate: (a) => dialog(`${cardHead(`Ask someone to fill in ${esc(a.dataset.sec)}`, 'They get a link to this part only. You see what they add before anything goes to Daniel.', closeBtn)}
    <div class="choices" role="radiogroup" aria-label="Who">${['Partner', 'CPA', 'Assistant', 'Family office', 'Someone else'].map((r, i) => `<button type="button" class="btn btn--secondary" role="radio" aria-checked="${i === 0}" data-act="who">${r}</button>`).join('')}</div>
    <div class="field-wrap"><div class="field" data-empty="true"><label class="field__label" for="dlg-email">Their email</label><div class="field__value"><input id="dlg-email" type="email" class="field__input" data-rule="email" autocomplete="email" autofocus placeholder="name@example.com"></div></div></div>
    <div class="nav nav--dialog">${btn('Send link', 'sendInvite', '', 'primary')}</div>`),
  who: (a) => { $$('.dialog [data-act=who]').forEach((p) => p.setAttribute('aria-checked', p === a)); },
  sendInvite: () => {
    const el = $('#dlg-email'), em = el.value.trim(), err = em ? RULES.email(em) : 'Email is required'; // same messages as the Email field
    if (err) { fieldErr(el.closest('.field'), err); el.focus(); return; }
    closeDialog(); toast(`Link sent to ${em} (prototype, nothing was sent)`);
  },
  idScan: () => { idScan(); render(); toast("Read your driver's license."); },
  goalsSample: () => { S.goalsText = GOALS_SAMPLE; render(); },
  goalsAI: () => { const el = $('#f-goalsText'), t = el.value.trim(); if (!t) { fieldErr(el.closest('.field'), 'Write a sentence or two first'); el.focus(); return; } S.goalsText = t; goalsFromText(t); render(); toast(`Made ${S.goals.filter((g) => g.ai).length} goals from what you wrote`); },
  addCit: (a) => { const who = a.dataset.who; S[who].citOpen = true; render(fid(`${who}.citAdd`)); },
  send: () => {
    S.tried.review = true;
    if (REQ_STEPS.some((id) => missing(id))) { render(); scrollTo({ top: 0, behavior: calm.matches ? 'auto' : 'smooth' }); return; }
    S.sent = true; S.step = 'done'; swap(false);
  },
  closeDialog,
};

// files, drag and drop, details state
document.addEventListener('change', (e) => {
  if (e.target.matches('.dialog .check input:checked')) $('.dialog .q__err')?.remove(); // a tick clears "Choose at least one account"
  if (e.target.id !== 'file') return;
  for (const f of e.target.files) S.docs.push({ name: f.name, state: 'unread' });
  render();
});
document.addEventListener('dragover', (e) => { const d = e.target.closest?.('#drop'); if (d) { e.preventDefault(); d.dataset.over = 'true'; } });
document.addEventListener('dragleave', (e) => { const d = e.target.closest?.('#drop'); if (d) d.dataset.over = 'false'; });
document.addEventListener('drop', (e) => { const d = e.target.closest?.('#drop'); if (!d) return; e.preventDefault(); for (const f of e.dataTransfer.files) S.docs.push({ name: f.name, state: 'unread' }); render(); });
document.addEventListener('toggle', (e) => { if (e.target.matches?.('details.more')) { S.open = S.open || {}; S.open[e.target.dataset.key] = e.target.open; } }, true);

// ---------- boot ----------
S = fresh();
PREFILLED = REQ_STEPS.reduce((t, id) => t + audit(id).given, 0);
if (new URLSearchParams(location.search).has('sample')) fillAll();
const start = location.hash.slice(1);
go(start === 'welcome' || STEPS.some((s) => s.id === start) ? start : 'welcome');
