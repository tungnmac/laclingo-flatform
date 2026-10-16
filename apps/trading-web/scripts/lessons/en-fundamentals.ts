import type { SeedChapter } from './types'

// Fundamental analysis (en) — every lesson shares the 2025 figures of "Acme Corp" ($ million, 100 million shares, $21 share price)
// so the numbers tie out across the three statements and the ratios.
export const EN_FUNDAMENTALS: SeedChapter[] = [
  {
    slug: 'reading-financial-statements',
    title: 'Reading financial statements',
    description: 'The three core statements: income statement, balance sheet and cash flow statement.',
    lessons: [
      {
        slug: 'financial-statements-overview',
        title: 'Financial statements: an overview',
        summary: 'What financial statements are, what they contain, where to find them and why investors read them.',
        content_md: `## What is fundamental analysis?

Technical analysis looks at **price charts** to read crowd behaviour. Fundamental analysis asks a different question: **what is this business actually worth?** When you buy a share, you buy a small piece of a company — so you need to know how it makes money, how much it owes and where its cash goes. The answers live in its **financial statements**.

## What is in a set of financial statements?

| Statement | Answers the question | Analogy |
|---|---|---|
| **Income statement** | How much profit or loss did the company make over the period? | A video of a period of time |
| **Balance sheet** | On a given date, what does the company own and owe? | A photo at one moment |
| **Cash flow statement** | How much cash actually came in and went out? | A bank statement |
| **Notes to the statements** | How were the numbers calculated? | The detailed footnotes |

The three statements are tightly linked: net income on the income statement increases equity on the balance sheet, and the cash flow statement explains how the opening cash balance became the closing one.

## Reporting periods and audits

- **Quarterly reports:** published after each quarter and not audited — fast but less reliable.
- **Half-year reports:** usually **reviewed** by the auditor.
- **Annual reports:** fully **audited** — the most reliable. Read the **auditor's opinion**: an "unqualified" (clean) opinion is good; a "qualified" opinion is a warning sign; an "adverse" opinion or a "disclaimer of opinion" is a serious red flag.

Companies with subsidiaries publish both **parent-only** and **consolidated** statements. Investors normally use the **consolidated** statements because they reflect the whole group.

## Where to find them

- The "Investor relations" section of the company website.
- Stock exchange websites and financial data portals.
- For US stocks: the annual **10-K** and quarterly **10-Q** filings on the SEC's EDGAR system.

## The example company for this chapter

The following lessons share the 2025 figures of **Acme Corp** (in $ million): revenue **1,000**, net income **140**, total assets **1,200**, shareholders' equity **700**, **100 million** shares outstanding and a market price of **$21 per share**. Using one company lets you see exactly how the statements fit together.

## Practice

Pick a listed company you know (a bank, a retailer, a consumer brand), download its latest annual report and find three things: total revenue, net income and the auditor's opinion.`,
        questions: [
          {
            prompt: 'Which statement shows what a company owns and owes at ONE point in time?',
            options: ['Income statement', 'Balance sheet', 'Cash flow statement', 'Shareholder meeting minutes'],
            correct_index: 1,
            explanation: 'The balance sheet is a "photo" of assets, liabilities and equity on the reporting date.',
          },
          {
            prompt: 'Which report is the most reliable?',
            options: ['A quarterly report', 'The audited annual report', 'An internal newsletter', 'Next year’s business plan'],
            correct_index: 1,
            explanation: 'The annual report is checked by an independent auditor, which makes it the most reliable.',
          },
          {
            prompt: 'Which auditor’s opinion is a GOOD sign?',
            options: ['Disclaimer of opinion', 'Adverse opinion', 'Unqualified (clean) opinion', 'Qualified opinion'],
            correct_index: 2,
            explanation: 'An unqualified opinion means the auditor believes the statements are presented fairly.',
          },
          {
            prompt: 'For a company with many subsidiaries, which statements should investors focus on?',
            options: ['The parent-only statements', 'The consolidated statements', 'A competitor’s annual report', 'News headlines only'],
            correct_index: 1,
            explanation: 'Consolidated statements combine the whole group — everything shareholders actually own.',
          },
        ],
      },
      {
        slug: 'income-statement',
        title: 'The income statement',
        summary: 'From revenue down to net income: gross profit, operating profit and the costs in between.',
        content_md: `## Read it top to bottom

The income statement starts with **revenue** at the top, subtracts each type of cost and ends with **net income** at the bottom. Here is Acme Corp's 2025 income statement ($ million):

| Line item | Amount |
|---|---|
| Net revenue | 1,000 |
| − Cost of goods sold | (600) |
| **= Gross profit** | **400** |
| − Selling, general and administrative expenses | (200) |
| **= Operating profit (EBIT)** | **200** |
| − Interest expense | (25) |
| **= Profit before tax** | **175** |
| − Income tax (20%) | (35) |
| **= Net income** | **140** |

## What each profit level tells you

- **Net revenue:** sales after discounts and returns. Revenue growing steadily over the years shows the market wants the product.
- **Gross profit:** revenue minus the direct cost of making the product. It shows how profitable the product is before running the organisation.
- **EBIT:** profit from **core operations**, before interest and tax. Use EBIT to compare companies with different amounts of debt.
- **Net income:** the final profit that belongs to shareholders — the "bottom line" the press talks about.

## Per share: EPS

Divide net income by the shares outstanding to get **EPS — earnings per share**:

> EPS = $140 million / 100 million shares = **$1.40 per share**

Note: with consolidated statements, reported EPS uses net income **attributable to the parent's shareholders** divided by the **weighted average** shares outstanding, so your own calculation may differ slightly. EPS is the foundation of the P/E ratio in the next chapter.

## Things to watch out for

- **One-off gains:** selling land, disposing of a subsidiary or reversing provisions can boost net income once without repeating. Separate "other income" and financial income to see the health of the core business.
- **Revenue up but gross profit down:** the company may be cutting prices to win market share, or input costs may be rising.
- **Compare like for like:** many industries are seasonal (retail peaks at the holidays), so compare Q4 this year with **Q4 last year**, not with Q3.

## Practice

Using Acme's income statement, recalculate: if cost of goods sold rises to $650 million (everything else unchanged), what are gross profit, profit before tax and net income? (Hint: net income falls by $40 million to $100 million.)`,
        questions: [
          {
            prompt: 'How is gross profit calculated?',
            options: ['Net revenue − cost of goods sold', 'Revenue − tax', 'Net income + interest', 'Total assets − liabilities'],
            correct_index: 0,
            explanation: 'Gross profit is net revenue minus the direct cost of making the product.',
          },
          {
            prompt: 'A company has net income of $140 million and 100 million shares. What is its EPS?',
            options: ['$0.14', '$1.40', '$14.00', '$140'],
            correct_index: 1,
            explanation: 'EPS = 140,000,000 / 100,000,000 = $1.40 per share.',
          },
          {
            prompt: 'Why use EBIT to compare two companies in the same industry?',
            options: ['Because EBIT is always larger than revenue', 'Because EBIT strips out differences in interest and tax, showing core operations', 'Because EBIT includes dividends', 'Because EBIT is never audited'],
            correct_index: 1,
            explanation: 'EBIT is profit before interest and tax, so companies with more or less debt can still be compared on their core business.',
          },
          {
            prompt: 'Net income jumped 80%, mostly from selling a plot of land. How should an investor read this?',
            options: ['The company is certainly growing sustainably', 'It is a one-off gain that is unlikely to repeat — look at the core business', 'Buy immediately because EPS rose', 'The report must be wrong'],
            correct_index: 1,
            explanation: 'A gain from selling an asset happens once; the real strength is in profit from core operations.',
          },
        ],
      },
      {
        slug: 'balance-sheet',
        title: 'The balance sheet',
        summary: 'Assets = Liabilities + Equity: what the company owns, what it owes and what belongs to shareholders.',
        content_md: `## The balance sheet equation

Every balance sheet follows one equation:

> **Assets = Liabilities + Shareholders' equity**

The left side shows what the company **holds**; the right side shows **where the money to buy those assets came from** — borrowing (liabilities) or shareholders (equity). The two sides are always equal, hence the name.

## Acme Corp's balance sheet at 31 Dec 2025 ($ million)

| Assets | | Liabilities and equity | |
|---|---|---|---|
| Cash and equivalents | 100 | Accounts payable | 150 |
| Accounts receivable | 200 | Short-term borrowings | 250 |
| Inventory | 300 | **Current liabilities** | **400** |
| **Current assets** | **600** | Long-term borrowings | 100 |
| Property, plant and other long-term assets | 600 | **Total liabilities** | **500** |
| | | **Shareholders' equity** | **700** |
| **Total assets** | **1,200** | **Total liabilities and equity** | **1,200** |

## Current vs non-current

- **Current assets:** can be turned into cash within 12 months — cash, receivables, inventory.
- **Non-current assets:** factories, machinery, land… used over many years.
- **Current liabilities:** due within 12 months. If current liabilities exceed current assets, the company may struggle to pay its bills.
- **Long-term liabilities:** loans running for several years.

Note that **liabilities are not all borrowings**. Acme's $150 million of accounts payable is money owed to suppliers and carries no interest. The **interest-bearing debt** is only 250 + 100 = **$350 million**.

## Equity and book value

Equity = total assets − total liabilities = 1,200 − 500 = **$700 million**. This is what (in theory) would belong to shareholders if every asset were sold and every debt repaid. Divided by the share count, it gives **book value per share (BVPS)**:

> BVPS = $700 million / 100 million shares = **$7.00 per share**

Net income that is not paid out as dividends is retained and added to equity — so a well-run company shows equity growing steadily year after year.

## Things to watch out for

- **Receivables growing faster than revenue:** the company may be offering loose credit to "push" sales, with a risk of never collecting the cash.
- **Ballooning inventory:** goods are selling slowly and may have to be discounted or written down.
- **Negative equity:** accumulated losses have wiped out shareholders' capital — very high risk.

## Practice

Compare one company's balance sheet across two consecutive years: did equity rise or fall? Did receivables and inventory grow faster or slower than revenue?`,
        questions: [
          {
            prompt: 'What is the basic balance sheet equation?',
            options: ['Revenue = Costs + Profit', 'Assets = Liabilities + Equity', 'Cash = Revenue − Tax', 'Equity = Assets + Liabilities'],
            correct_index: 1,
            explanation: 'Assets are always funded either by liabilities or by shareholders, so the two sides always balance.',
          },
          {
            prompt: 'Total assets are $1,200 million and total liabilities are $500 million. What is equity?',
            options: ['$1,700 million', '$500 million', '$700 million', '$2.4 million'],
            correct_index: 2,
            explanation: 'Equity = assets − liabilities = 1,200 − 500 = $700 million.',
          },
          {
            prompt: 'Which of these is a current asset?',
            options: ['A factory', 'Inventory', 'Long-term borrowings', 'Owners’ contributed capital'],
            correct_index: 1,
            explanation: 'Inventory is expected to be sold and turned into cash within 12 months, so it is a current asset.',
          },
          {
            prompt: 'Receivables grew 60% while revenue grew only 10%. What does this suggest?',
            options: ['The company is collecting cash faster', 'The company may be extending loose credit, with a risk of not collecting', 'A big dividend is coming', 'Nothing at all'],
            correct_index: 1,
            explanation: 'Receivables outpacing revenue means more cash is tied up with customers — keep an eye on sales quality.',
          },
        ],
      },
      {
        slug: 'cash-flow-statement',
        title: 'The cash flow statement',
        summary: 'Profit is not cash: operating, investing and financing cash flows, plus free cash flow.',
        content_md: `## Profit is not cash

Accounting records revenue when a **sale is made**, not when **cash is received**. A company can therefore report a big profit and still run out of cash — if customers have not paid yet or cash is locked up in inventory. The cash flow statement shows the **real cash** coming in and going out.

## The three cash flows

Acme Corp's 2025 cash flow statement ($ million):

| Line item | Amount |
|---|---|
| Net income | 140 |
| + Depreciation (a non-cash cost) | 60 |
| − Increase in accounts receivable | (30) |
| − Increase in inventory | (40) |
| + Increase in accounts payable | 10 |
| **Cash flow from operations (CFO)** | **140** |
| Purchase of property and equipment | (90) |
| **Cash flow from investing (CFI)** | **(90)** |
| Dividends paid | (40) |
| Net new borrowing | 10 |
| **Cash flow from financing (CFF)** | **(30)** |
| **Net change in cash** | **20** |

Opening cash of 80 + 20 = **$100 million** at year end — exactly the cash line on the balance sheet. The three statements tie out.

## What each flow means

- **CFO (operating):** cash generated by the core business. A healthy company has CFO that is **positive and roughly equal to or above net income** over many years.
- **CFI (investing):** usually **negative**, because the company spends on equipment and expansion. Negative is not bad — as long as the investment pays off.
- **CFF (financing):** borrowing and repaying debt, issuing shares, paying dividends.

## Free cash flow (FCF)

> **FCF = CFO − capital expenditure = 140 − 90 = $50 million**

FCF is the cash left after maintaining and growing the business — the money available for dividends, debt repayment or buybacks without borrowing. Acme paid $40 million in dividends, less than its $50 million FCF → the dividend is funded by cash it actually earned.

## Things to watch out for

- **Positive net income but negative CFO for several years:** profit "on paper", with cash stuck in receivables or inventory. This is one of the most important warning signs.
- **Large dividends while FCF is negative:** the company is borrowing to pay dividends — hard to sustain.
- **Large, persistently positive CFF:** the company lives on new loans (growing debt) or new shares (diluting your ownership).

## Practice

Take a company's cash flow statements for the last three years and compare CFO with net income each year. If CFO is often far below net income, look at the balance sheet to see where the cash is stuck.`,
        questions: [
          {
            prompt: 'Why can a profitable company still be short of cash?',
            options: ['Because revenue is recorded at the sale, while the cash may not be collected yet or may be tied up in inventory', 'Because profit always equals cash', 'Because tax is paid twice', 'Because shareholders withdraw capital daily'],
            correct_index: 0,
            explanation: 'Profit is an accounting figure; real cash can be stuck in receivables and inventory.',
          },
          {
            prompt: 'CFO is $140 million and capital expenditure is $90 million. What is free cash flow?',
            options: ['$230 million', '$50 million', '$140 million', '−$90 million'],
            correct_index: 1,
            explanation: 'FCF = CFO − capital expenditure = 140 − 90 = $50 million.',
          },
          {
            prompt: 'What does a negative cash flow from investing (CFI) usually mean?',
            options: ['The company is about to go bankrupt', 'The company is spending on assets to grow the business', 'The company made a loss', 'The company pays no dividend'],
            correct_index: 1,
            explanation: 'CFI is negative because cash goes out to buy machinery and facilities — normal for a growing business.',
          },
          {
            prompt: 'Which of these warning signs is the most serious?',
            options: ['Negative CFI for one year', 'Positive net income but negative CFO for several years in a row', 'CFO above net income', 'Paying a cash dividend'],
            correct_index: 1,
            explanation: 'Paper profits that never turn into cash over several years point to very poor earnings quality.',
          },
        ],
      },
    ],
  },
  {
    slug: 'key-financial-ratios',
    title: 'Key financial ratios',
    description: 'Valuation (EPS, P/E, P/B), profitability (ROE, ROA, margins) and financial health.',
    lessons: [
      {
        slug: 'eps-pe-pb',
        title: 'Valuation ratios: EPS, P/E and P/B',
        summary: 'Is a stock cheap or expensive relative to the company’s earnings and assets?',
        content_md: `## A high share price is not necessarily expensive

A $100 stock is not automatically more expensive than a $10 stock. What matters is **how much earnings and assets you get for your money**. Valuation ratios answer that question.

## EPS — earnings per share

> **EPS = Net income / Shares outstanding**

Acme Corp: $140 million / 100 million shares = **$1.40**. EPS **rising steadily over many years** is a sign of real growth. Note: when a company issues new shares, EPS can fall even if total profit is unchanged — this is called **dilution**.

## P/E — price to earnings

> **P/E = Share price / EPS**

Acme: 21 / 1.40 = **15×**. Put simply, you are paying **$15 for every $1 of annual earnings**; if earnings stayed flat, it would take about 15 years for earnings to "pay back" the purchase price.

- A **low** P/E may mean cheap — or that the market expects earnings to fall.
- A **high** P/E may mean expensive — or that investors expect strong growth.
- P/E **does not work** when the company is losing money (negative EPS).

So P/E only makes sense in **comparison**: with peers in the same industry, with the company's own historical P/E, and with its earnings growth rate.

## P/B — price to book

> **P/B = Share price / Book value per share (BVPS)**

Acme: BVPS = $7.00 → P/B = 21 / 7 = **3×**. The market pays three times the book value of equity because Acme earns a strong return on it (ROE 20% — see the next lesson).

P/B is especially useful for **banks, insurers and brokers**, whose assets are mostly financial and whose book value is close to real value. For software or technology companies P/B means little, because their main assets (brand, people) are not on the balance sheet.

## Market capitalisation

> **Market cap = Share price × shares outstanding = $21 × 100 million = $2,100 million**

Another route to the same result: P/E = market cap / net income = 2,100 / 140 = 15.

## Practice

A company trades at $30, with EPS of $2.00 and BVPS of $15.00. Calculate its P/E and P/B. (Answer: P/E = 15, P/B = 2.) Then look up the P/E of two companies in the same industry and ask yourself: why does the market price them differently?`,
        questions: [
          {
            prompt: 'The share price is $21 and EPS is $1.40. What is the P/E?',
            options: ['1.5', '15', '29.4', '0.067'],
            correct_index: 1,
            explanation: 'P/E = price / EPS = 21 / 1.40 = 15.',
          },
          {
            prompt: 'What does a P/E of 15 mean?',
            options: ['The stock rises 15% a year', 'Investors pay $15 for every $1 of annual earnings', 'The company is 15 years old', 'The dividend is 15%'],
            correct_index: 1,
            explanation: 'P/E measures how much investors are willing to pay for each dollar of the company’s earnings.',
          },
          {
            prompt: 'In which industry is the P/B ratio especially useful?',
            options: ['Software', 'Banking', 'Video games', 'Fashion brands'],
            correct_index: 1,
            explanation: 'A bank’s assets are mostly financial, so book value is a close proxy for real value.',
          },
          {
            prompt: 'Why can’t a low P/E alone prove that a stock is cheap?',
            options: ['A low P/E is always a scam', 'The market may expect earnings to fall', 'P/E only applies to crypto', 'P/E cannot be calculated'],
            correct_index: 1,
            explanation: 'A low P/E can reflect poor prospects; compare it with peers, history and growth.',
          },
        ],
      },
      {
        slug: 'roe-roa-margins',
        title: 'Profitability: ROE, ROA and margins',
        summary: 'How much profit the company generates from its revenue, its assets and its shareholders’ capital.',
        content_md: `## Big is not the same as good

Two companies that each earn $140 million are not equally good if one needs $700 million of capital and the other needs $3,000 million. **Profitability ratios** measure profit **relative to the resources used**.

## Three margins

From Acme Corp's income statement (revenue $1,000 million):

| Ratio | Formula | Acme |
|---|---|---|
| Gross margin | Gross profit / Revenue | 400 / 1,000 = **40%** |
| Operating margin | EBIT / Revenue | 200 / 1,000 = **20%** |
| Net margin | Net income / Revenue | 140 / 1,000 = **14%** |

- A **high, stable gross margin** often signals a competitive advantage: a strong brand, a differentiated product, customers who accept higher prices.
- **Operating margin** shows how lean the organisation is.
- Margins **differ hugely between industries**: supermarkets have net margins of a few percent, software companies can exceed 20%. Only compare within an industry.

## ROA — return on assets

> **ROA = Net income / Total assets = 140 / 1,200 ≈ 11.7%**

ROA shows how much profit each $100 of assets generates — it measures how efficiently **all** assets are used, however they are funded. Banks typically have an ROA of only 1–2% because their balance sheets are huge, so don't compare a bank's ROA with a manufacturer's.

## ROE — return on equity

> **ROE = Net income / Shareholders' equity = 140 / 700 = 20%**

ROE is the ratio shareholders care about most: **how much profit every $100 of their capital earns each year**. An ROE **above 15% sustained over many years** is often the mark of a high-quality business.

## DuPont analysis: where does ROE come from?

> **ROE = Net margin × Asset turnover × Financial leverage**
>
> = (Net income / Revenue) × (Revenue / Total assets) × (Total assets / Equity)
>
> = 14% × 0.83 × 1.71 ≈ **20%**

The same 20% ROE is far more durable when it comes from **high margins** than when it comes from **heavy borrowing** (high leverage). An unusually high ROE is a cue to check how much debt the company carries.

## Practice

Company X has revenue of $2,000 million, net income of $100 million, total assets of $2,500 million and equity of $500 million. Calculate net margin, ROA and ROE. (Answers: 5%, 4%, 20%.) Its ROE matches Acme's — but how does X achieve it? (Hint: leverage of 2,500 / 500 = 5×.)`,
        questions: [
          {
            prompt: 'Net income is $140 million and equity is $700 million. What is ROE?',
            options: ['14%', '20%', '11.7%', '5%'],
            correct_index: 1,
            explanation: 'ROE = net income / equity = 140 / 700 = 20%.',
          },
          {
            prompt: 'What does a high gross margin that stays stable for years usually indicate?',
            options: ['A competitive advantage and pricing power', 'Heavy borrowing', 'An upcoming share issue', 'No taxes paid'],
            correct_index: 0,
            explanation: 'Keeping a high gross margin means customers accept the price — a sign of a strong brand or differentiated product.',
          },
          {
            prompt: 'Why shouldn’t you compare a supermarket’s net margin with a software company’s?',
            options: ['Supermarkets make no profit', 'Each industry’s business model has very different typical margins', 'Software companies have no revenue', 'Margins only apply to banks'],
            correct_index: 1,
            explanation: 'Every industry has its own cost structure; compare margins only between companies in the same industry.',
          },
          {
            prompt: 'In a DuPont analysis, what does a high ROE driven mainly by financial leverage mean?',
            options: ['The company carries no risk at all', 'ROE comes from heavy borrowing — less durable and riskier', 'Margins are very high', 'The company has no debt'],
            correct_index: 1,
            explanation: 'Leverage magnifies both gains and losses; debt-driven ROE can fall sharply when business turns down.',
          },
        ],
      },
      {
        slug: 'financial-health-ratios',
        title: 'Financial health: debt and liquidity',
        summary: 'Debt-to-equity, short-term liquidity and the ability to cover interest payments.',
        content_md: `## Why look at debt?

Profitability tells you how **good the company is at making money**; financial health ratios tell you whether it **can survive hard times**. Plenty of profitable companies go bankrupt because they **cannot repay debts when they fall due**.

## Debt-to-equity (D/E)

> **D/E = Interest-bearing debt / Shareholders' equity = (250 + 100) / 700 = 0.5**

For every $1 of shareholders' capital, Acme has borrowed another $0.50. Some sources compute D/E with **total liabilities** / equity (500 / 700 ≈ 0.71) — check the definition before comparing.

- A D/E **below 1** is generally considered safe for manufacturers and traders.
- **Banks and real estate** use high leverage by nature — compare within the industry.
- Debt is not bad in itself: borrowing for projects that earn more than the interest rate raises ROE. But when profits fall or rates rise, debt becomes a burden.

## Short-term liquidity

> **Current ratio = Current assets / Current liabilities = 600 / 400 = 1.5**

For every $1 due within 12 months, Acme has $1.50 of current assets. Below 1 is a signal to pay attention.

But inventory cannot always be sold quickly. The **quick ratio** leaves inventory out:

> **Quick ratio = (Current assets − Inventory) / Current liabilities = (600 − 300) / 400 = 0.75**

At 0.75, if Acme could not sell its inventory, its cash and receivables would not cover all its short-term liabilities — so keep an eye on operating cash flow.

## Interest coverage

> **Interest coverage = EBIT / Interest expense = 200 / 25 = 8×**

Operating profit is eight times the interest bill — very comfortable. Coverage **below 1.5–2×** is worrying: a small drop in profit could leave the company unable to pay interest.

## Acme Corp summary

| Ratio | Value | Assessment |
|---|---|---|
| D/E (borrowings) | 0.5 | Safe |
| Current ratio | 1.5 | Fine |
| Quick ratio | 0.75 | Relies on selling inventory |
| Interest coverage | 8× | Very good |

## Practice

Find a real estate developer and a retailer, and calculate D/E and interest coverage for both. Which one is more fragile if interest rates rise sharply?`,
        questions: [
          {
            prompt: 'Borrowings are $350 million and equity is $700 million. What is D/E?',
            options: ['2', '0.5', '1.05', '0.35'],
            correct_index: 1,
            explanation: 'D/E = borrowings / equity = 350 / 700 = 0.5.',
          },
          {
            prompt: 'How does the quick ratio differ from the current ratio?',
            options: ['It adds fixed assets', 'It removes inventory from current assets', 'It only counts long-term debt', 'There is no difference'],
            correct_index: 1,
            explanation: 'Inventory may be hard to sell quickly, so the quick ratio leaves it out for a more conservative view.',
          },
          {
            prompt: 'EBIT is $200 million and interest expense is $25 million. What is interest coverage?',
            options: ['8×', '0.125×', '175×', '225×'],
            correct_index: 0,
            explanation: 'Interest coverage = EBIT / interest = 200 / 25 = 8.',
          },
          {
            prompt: 'Why can a profitable company still go bankrupt?',
            options: ['Profit is always taxed at 100%', 'It doesn’t have enough cash to repay debts when they fall due', 'Its share price falls', 'It has too many shareholders'],
            correct_index: 1,
            explanation: 'Bankruptcy happens when debts cannot be repaid on time — cash flow and debt structure matter as much as profit.',
          },
        ],
      },
      {
        slug: 'combining-ratios-and-pitfalls',
        title: 'Combining ratios and common pitfalls',
        summary: 'Read ratios in context: compare with peers, look at multi-year trends and avoid valuation traps.',
        content_md: `## There is no "magic" ratio

Each ratio is just one angle. A stock with a low P/E but heavy debt and negative cash flow can be a trap; a stock with a high P/E but durable ROE and strong growth may still be reasonable. Read ratios **as a group** and **in context**.

## Quick checklist

Applied to Acme Corp:

| Area | Question | Acme |
|---|---|---|
| Growth | Have revenue and EPS grown steadily for 3–5 years? | Check the history |
| Profitability | ROE above 15%? Stable margins? | ROE 20%, net margin 14% |
| Earnings quality | CFO roughly equal to or above net income? | CFO 140 = net income 140 |
| Health | Reasonable D/E? Comfortable interest coverage? | D/E 0.5; coverage 8× |
| Valuation | P/E and P/B versus peers and history? | P/E 15, P/B 3 |

## Three rules of comparison

1. **Against itself over time:** one good year is not enough — a 3–5 year trend shows real quality.
2. **Against peers in the same industry:** banks, retailers and tech companies have very different "normal" ratios.
3. **Against expected growth:** a P/E of 25 for a company growing earnings 30% a year can be cheaper than a P/E of 10 for a company in decline.

## Common pitfalls

- **Value trap:** the P/E is low because the industry is declining or this year's profit includes a one-off gain. The stock is cheap and keeps getting cheaper.
- **Peak-cycle earnings:** steel, fertiliser and shipping have highly volatile profits. P/E looks very low exactly when profits peak — often the worst time to buy.
- **ROE flattered by debt:** always check leverage with a DuPont breakdown.
- **Share dilution:** issuing lots of new shares can lower EPS even when total profit rises.
- **Reading headlines instead of reports:** "record profit" may come from a one-time asset sale.

## Fundamentals and crypto

The ratios in this chapter apply to **stocks** — companies with revenue, profit and audited financial statements. Most crypto assets have **no** such statements; to evaluate crypto, investors use other measures such as market cap, circulating supply, token unlock schedules and real usage of the network. The mindset is the same: **understand where the thing you buy gets its value, and how much you are paying for that value**.

## Combining with technical analysis

Many investors use fundamental analysis to decide **what to buy** and technical analysis to decide **when to buy**. Whichever method you use, the risk rules from the previous chapter still apply: stop-losses, 1–2% position sizing and a trading journal.

## Practice

Pick two companies in the same industry and fill in the quick checklist above for both. Record your conclusion in the [Journal](/journal) as an investment plan: which company would you choose, why, and what would make you change your mind?`,
        questions: [
          {
            prompt: 'What is a "value trap"?',
            options: ['A stock with a low P/E because its prospects are poor, so the price keeps falling', 'A stock rising too fast', 'A type of stop-loss order', 'A hidden fee when buying shares'],
            correct_index: 0,
            explanation: 'A value trap looks cheap on the ratios but is cheap for a bad reason — future earnings may keep falling.',
          },
          {
            prompt: 'In a cyclical industry (steel, fertiliser), what does a very low P/E at peak earnings usually mean?',
            options: ['It is certainly the best time to buy', 'It may be a risky time because earnings are about to fall with the cycle', 'The company has no debt', 'A large dividend is guaranteed'],
            correct_index: 1,
            explanation: 'Peak-cycle earnings make the P/E look low; when the cycle turns, earnings fall and the P/E jumps.',
          },
          {
            prompt: 'Which way of judging financial ratios makes the most sense?',
            options: ['Look only at one year’s P/E', 'Compare with the company’s own multi-year history and with peers in the same industry', 'Compare with the Bitcoin price', 'Read only the news headlines'],
            correct_index: 1,
            explanation: 'Ratios mean something only in context: multi-year trends and industry norms.',
          },
          {
            prompt: 'Why don’t ratios like P/E and ROE apply directly to most crypto assets?',
            options: ['Because crypto trades 24/7', 'Because most crypto assets have no revenue, profit or audited statements like a company', 'Because crypto has no price', 'Because crypto always goes up'],
            correct_index: 1,
            explanation: 'Financial ratios are built on company statements; crypto needs other measures such as market cap, supply and network usage.',
          },
        ],
      },
    ],
  },
]
