// Static data for v2/cif-form.html: steps, option lists, sample client, tax tables. Field decisions follow ../CIF-FIELDS.md.
// Welcome is a route, not a step (see go()).

const STEPS = [
  { id: 'docs', name: 'Documents', title: 'Start with your documents' },
  { id: 'you', name: 'About you', title: 'About you' },
  { id: 'work', name: 'Work & income', title: 'Work & income' },
  { id: 'goals', name: 'Goals', title: 'Goals' },
  { id: 'networth', name: 'Net worth', title: 'Net worth' },
  { id: 'more', name: 'Other', title: 'Other' },
  { id: 'review', name: 'Review & Send', title: 'Review & Send' },
];
const ADVISOR = { name: 'Daniel Bennett', role: 'Senior Private Wealth Advisor', photo: 'assets/daniel-bennett.jpg' };

const PARTNERED = ['Married', 'Domestic partnership', 'Living with a partner'];
const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const OPTS = {
  suffix: ['Jr.', 'Sr.', 'II', 'III', 'IV'],
  usStatus: ['US citizen', 'Green card holder', 'Visa holder'],
  sex: ['Female', 'Male', 'Nonbinary', 'Prefer not to say'],
  marital: ['Single', 'Married', 'Domestic partnership', 'Living with a partner', 'Separated', 'Divorced', 'Widowed'],
  rel: ['Daughter', 'Son', 'Stepchild', 'Grandchild', 'Parent', 'Other relative', 'Other'],
  employment: ['Employed', 'Self-employed or business owner', 'Retired', 'Not employed', 'Student', 'Homemaker'],
  income: ['Salary', 'Bonus', 'Business income', 'Rental income', 'Investment income', 'Social Security', 'Pension or annuity', 'Other'],
  goal: ['Retire', 'Buy a home', 'Education', 'Travel', 'Wedding', 'Start a business', 'Give to charity', 'Leave an inheritance', 'Pay off debt', 'Build an emergency fund', 'Other'],
  debt: ['Mortgage', 'Home equity line (HELOC)', 'Auto loan', 'Student loan', 'Credit card', 'Personal loan', 'Margin loan', 'Securities-based line of credit', '401(k) loan', 'Business loan you guarantee', 'Loan from family', 'Taxes owed', 'Other'],
  ins: ['Term life', 'Permanent life', 'Disability', 'Long-term care', 'Umbrella'],
  health: ['Excellent', 'Good', 'Fair', 'Poor'],
  filing: ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household', 'Qualifying surviving spouse'],
  state: STATES,
};

// Long lists use the searchable dropdown (combo): { v: value saved, l: label shown, k: other words people type }.
// Citizenship: the 193 UN members (minus the United States, asked separately) plus Kosovo, Palestine, Taiwan and Vatican City.
const COUNTRIES = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo, Democratic Republic of the', 'Congo, Republic of the', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Türkiye', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];
const COUNTRY_ALIAS = {
  'Cabo Verde': 'Cape Verde', 'Congo, Democratic Republic of the': 'DRC', "Côte d'Ivoire": 'Ivory Coast', 'Czechia': 'Czech Republic', 'Eswatini': 'Swaziland', 'Myanmar': 'Burma',
  'Netherlands': 'Holland', 'Timor-Leste': 'East Timor', 'Türkiye': 'Turkey', 'United Arab Emirates': 'UAE', 'United Kingdom': 'UK Great Britain England Scotland Wales Northern Ireland', 'Vatican City': 'Holy See',
};
const COUNTRY_OPTS = COUNTRIES.map((c) => ({ v: c, l: c, k: COUNTRY_ALIAS[c] }));
const STATE_NAME = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
const STATE_OPTS = STATES.map((s) => ({ v: s, l: STATE_NAME[s], k: s })); // the field shows the code (it fits the narrow State field); the list shows names

// Asset categories: CIF-FIELDS.md A8. how = default automation path.
const CATS = [
  { id: 'cash', name: 'Cash', desc: 'Checking, savings, CDs, money market', types: ['Checking', 'Savings', 'CD', 'Money market'], how: 'link' },
  { id: 'invest', name: 'Investments', desc: 'Brokerage accounts', types: ['Brokerage (individual)', 'Brokerage (joint)', 'Brokerage (trust)'], how: 'link' },
  { id: 'ira', name: 'IRAs', desc: 'Traditional, Roth, SEP, SIMPLE', types: ['Traditional IRA', 'Roth IRA', 'Rollover IRA', 'SEP IRA', 'SIMPLE IRA'], how: 'link' },
  { id: 'work', name: 'Workplace retirement', desc: '401(k), 403(b), 457(b), TSP', types: ['401(k)', '403(b)', '457(b)', 'TSP'], how: 'doc', tip: 'Logins for 401(k) sites often fail. A quarterly statement works better and also shows your match and any loan.' },
  { id: 'pension', name: 'Pensions and annuities', desc: 'Workplace pensions, annuity contracts', types: ['Pension', 'Annuity'], how: 'doc' },
  { id: 'edu', name: 'Education and health', desc: '529 plans, HSAs, UTMA/UGMA', types: ['529 plan', 'HSA', 'UTMA/UGMA'], how: 'doc' },
  { id: 'equity', name: 'Equity compensation', desc: 'RSUs, stock options, ESPP', types: ['RSUs', 'Stock options', 'ESPP'], how: 'doc' },
  { id: 'realestate', name: 'Real estate', desc: 'Your home, vacation homes, rentals, land', types: ['Primary home', 'Vacation home', 'Rental property', 'Land'], how: 'address' },
  { id: 'business', name: 'Private business', desc: 'A company you own all or part of', types: ['Business interest'], how: 'manual' },
  { id: 'funds', name: 'Private funds', desc: 'Private equity, venture, hedge funds, LPs', types: ['Private equity', 'Venture capital', 'Hedge fund', 'Limited partnership'], how: 'doc' },
  { id: 'crypto', name: 'Crypto', desc: 'Coins on exchanges or in your own wallet', types: ['Bitcoin (BTC)', 'Ether (ETH)', 'Solana (SOL)'], how: 'price' },
  { id: 'metals', name: 'Precious metals', desc: 'Gold, silver, platinum you hold', types: ['Gold', 'Silver', 'Platinum'], how: 'price' },
  { id: 'valuables', name: 'Valuables', desc: 'Art, watches, jewelry, cars, wine', types: ['Art', 'Watches', 'Jewelry', 'Cars', 'Wine', 'Other'], how: 'manual' },
  { id: 'owed', name: 'Money owed to you', desc: 'Loans to family, a business or others', types: ['Loan to family', 'Loan to a business', 'Other'], how: 'manual' },
];
// ponytail: sample prices, not live. A real build calls a market-data API.
const PRICE = { 'Bitcoin (BTC)': 110000, 'Ether (ETH)': 4000, 'Solana (SOL)': 200, Gold: 3800, Silver: 45, Platinum: 1500 };

// 2026 federal brackets (Rev. Proc. 2025-32, per NerdWallet/LPL tables): [top of band, rate]. Standard deduction applied first.
const BRACKETS = {
  'Single': { std: 16100, b: [[12400, 10], [50400, 12], [105700, 22], [201775, 24], [256225, 32], [640600, 35], [Infinity, 37]] },
  'Married filing jointly': { std: 32200, b: [[24800, 10], [100800, 12], [211400, 22], [403550, 24], [512450, 32], [768700, 35], [Infinity, 37]] },
  'Married filing separately': { std: 16100, b: [[12400, 10], [50400, 12], [105700, 22], [201775, 24], [256225, 32], [384350, 35], [Infinity, 37]] },
  'Head of household': { std: 24150, b: [[17700, 10], [67450, 12], [105700, 22], [201750, 24], [256200, 32], [640600, 35], [Infinity, 37]] },
};
BRACKETS['Qualifying surviving spouse'] = BRACKETS['Married filing jointly']; // same bands and deduction

const ADDRESSES = [
  { street: '48 Orchard Lane', city: 'Rye', state: 'NY', zip: '10580' },
  { street: '48 Orchard Street', city: 'Cambridge', state: 'MA', zip: '02140' },
  { street: '480 Orchard Road', city: 'Greenwich', state: 'CT', zip: '06830' },
  { street: '12 Bayshore Drive', city: 'Sarasota', state: 'FL', zip: '34236' },
  { street: '1200 Ocean Avenue', city: 'Santa Monica', state: 'CA', zip: '90401' },
  { street: '77 Lakeview Terrace', city: 'Lake Placid', state: 'NY', zip: '12946' },
];
// ponytail: fake home-value model keyed by street.
const HOME_VALUE = { '48 Orchard Lane': 2150000, '12 Bayshore Drive': 640000, '48 Orchard Street': 1380000, '480 Orchard Road': 3900000, '1200 Ocean Avenue': 1750000, '77 Lakeview Terrace': 820000 };

// Linking: sample accounts per institution (read-only aggregator, simulated).
const INSTITUTIONS = {
  Chase: [
    { kind: 'asset', cat: 'cash', type: 'Checking', inst: 'Chase Total Checking ··4821', owner: 'Joint', value: 62410 },
    { kind: 'asset', cat: 'cash', type: 'Savings', inst: 'Chase Premier Savings ··7310', owner: 'Joint', value: 145000 },
    { kind: 'debt', type: 'Credit card', lender: 'Chase Sapphire ··1009', owner: 'You', balance: 7860, rate: 27.49, payment: 240 },
  ],
  Schwab: [{ kind: 'asset', cat: 'invest', type: 'Brokerage (joint)', inst: 'Schwab Brokerage ··1190', owner: 'Joint', value: 1286540 }],
  Fidelity: [{ kind: 'asset', cat: 'ira', type: 'Rollover IRA', inst: 'Fidelity Rollover IRA ··7765', owner: 'You', value: 612320 }],
  Vanguard: [{ kind: 'asset', cat: 'invest', type: 'Brokerage (individual)', inst: 'Vanguard Brokerage ··3302', owner: 'Partner', value: 184900 }],
  'Bank of America': [], 'Wells Fargo': [], 'Morgan Stanley': [], 'American Express': [],
};

const GOALS_SAMPLE = "Retire at 60. Pay for both kids' college. Buy a lake house in about 5 years. Give more to charity every year.";
// ponytail: placeholder benchmark costs in today's dollars; a real build uses Nevis planning assumptions.
const GOAL_COST = { 'Buy a home': [750000, 'once'], Education: [240000, 'once'], Travel: [25000, 'year'], Wedding: [40000, 'once'], 'Start a business': [150000, 'once'], 'Give to charity': [20000, 'year'], 'Leave an inheritance': [1000000, 'once'], 'Build an emergency fund': [60000, 'once'] };
