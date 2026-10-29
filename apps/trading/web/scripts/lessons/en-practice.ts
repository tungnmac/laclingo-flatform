import type { SeedChapter } from './types'

// Hands-on financial statement analysis (en) — goes deeper than "Reading financial statements" and "Key financial ratios".
// Real figures from FPT, HPG, VCB consolidated annual statements (VND billion), compiled from public data (Vietcap), rounded.
// Every "manipulation" example uses a hypothetical company — no real company is implied.
export const EN_PRACTICE: SeedChapter[] = [
  {
    slug: 'hands-on-statement-analysis',
    title: 'Hands-on financial statement analysis',
    description:
      'Read the notes and the audit report, judge earnings quality, spot red flags, dig into cash flows and compare peers within an industry — using real figures from FPT, HPG and VCB.',
    level: 'advanced',
    lessons: [
      {
        slug: 'notes-and-audit-report',
        title: 'Reading the notes and the audit report',
        summary:
          'Which notes matter most, the types of audit opinion, the "emphasis of matter" paragraph, and red flags such as late filings, auditor changes and post-audit adjustments.',
        content_md: `## Why read the small print?

The three primary statements give you **numbers**. The **notes to the financial statements** tell you **how** those numbers were produced — and they are often several times longer than the three statements combined. Professional analysts usually read the **auditor's report** first, then the key notes, and only then go back to the headline totals.

## The notes worth reading first

| Note | What you look for |
|---|---|
| **Significant accounting policies** | When revenue is recognised (on delivery, by percentage of completion?), depreciation method and useful lives. A policy that **changes** between years deserves a "why?". |
| **Trade receivables** | The **ageing schedule** (under 6 months, 6–12 months, over 1 year…) and the **allowance for doubtful debts**. Overdue balances rising without more provisions → profit may be inflated. |
| **Inventories** | Mix of raw materials, finished goods, goods in transit, and the **inventory write-down provision**. In cyclical industries (steel, real estate) this is where hidden losses sit. |
| **Borrowings and finance leases** | Short vs long term, interest rates, currency, **collateral**, maturity schedule. A wall of debt due within 12 months is a liquidity risk. |
| **Related-party transactions** | Sales, purchases, loans and guarantees with major shareholders, sister companies, board members. Large receivables from related parties need scrutiny. |
| **Contingent liabilities and commitments** | Guarantees for third parties, lawsuits, capital commitments — obligations **not yet** on the balance sheet. |
| **Subsequent events** | Share issues, big losses or management changes after the balance-sheet date but before the report was signed. |
| **Segment information** | Revenue and profit by business line or region — shows which segment really makes the money. |

Tip: search the PDF for keywords such as "allowance", "provision", "related party", "guarantee", "collateral", "restated".

## Types of audit opinion

| Opinion | Meaning | Warning level |
|---|---|---|
| **Unmodified (clean)** | The statements are presented fairly in all material respects | Normal |
| **Qualified ("except for")** | A material misstatement confined to one or a few items, or the auditor could not obtain enough evidence for them | High — read what was qualified and how big it is |
| **Adverse** | Misstatements are material and pervasive; the statements are not fair | Very high |
| **Disclaimer of opinion** | The auditor could not obtain enough evidence to conclude at all, and the possible effects are material and pervasive | Very high |

An **"emphasis of matter"** paragraph does **not** change the opinion — it can sit under a clean opinion. But the auditor is deliberately pointing at something: in Vietnam, most often a **material uncertainty related to going concern** (large accumulated losses, current liabilities above current assets), a major unresolved lawsuit, or a related-party receivable that may not be collected. Do not skim past it just because you saw the word "unmodified".

Practical consequence: in Vietnam, shares with an opinion other than unmodified are usually removed from brokers' margin-lending lists, and funds with risk controls tend to avoid them.

## Red flags around the audit

- **Late audited statements** or repeated extension requests: often a sign that management and the auditor have not agreed on the numbers.
- **Unusual auditor changes**, especially mid-year or from a large firm to a little-known one, without a convincing explanation.
- **Pre- vs post-audit differences:** the Q4 report is prepared by the company itself; the audited annual report comes later. If audited profit is **much lower** than the self-reported figure (because the auditor forced extra provisions or removed revenue), the company must publish an explanation — under current disclosure rules (e.g. Circular 96/2020/TT-BTC), whenever net profit before and after the audit differs by 5% or more (up or down) or swings between profit and loss. Once can be a technical difference; year after year it signals poor accounting quality.
- **Reviewed half-year vs audited full-year:** half-year statements are only **reviewed** (a lower level of assurance than an audit). Compare the mid-year review conclusion with the year-end opinion — a qualification that appears at half-year and persists into the annual audit is an unresolved problem.

## Illustrative example (hypothetical)

Hypothetical company XYZ reports full-year net profit of **VND 200 billion** in its self-prepared Q4 statements. After the audit the figure is **VND 150 billion**, because the auditor required an extra VND 50 billion of doubtful-debt provisions. The difference:

> (150 − 200) / 200 = **−25%**

Reading the receivables note, you find that most of the debt older than one year is owed by a **related party**. The three facts together — a large post-audit cut, overdue debt, a related-party counterparty — are far stronger than any one alone.

## Practice

Download the latest audited consolidated annual report of a company you follow and answer: (1) What is the audit opinion, and is there an emphasis-of-matter paragraph? (2) What is the doubtful-debt allowance as a percentage of trade receivables, and how did it change from last year? (3) Are there guarantees or related-party transactions larger than 5% of equity? (4) Compare net profit in the self-prepared Q4 report with the audited annual report — what is the percentage difference?`,
        questions: [
          {
            prompt: 'A report has an unmodified opinion plus an "emphasis of matter" paragraph about going concern. What is the correct reading?',
            options: [
              'The opinion is still unmodified, but the auditor highlights a material going-concern risk — read it carefully',
              'It is effectively an adverse opinion',
              'The emphasis paragraph is a formality and can be ignored',
              'The auditor has disclaimed an opinion',
            ],
            correct_index: 0,
            explanation:
              'An emphasis-of-matter paragraph does not change the type of opinion, but the auditor deliberately draws attention to an important issue — here the risk that the company may not continue as a going concern.',
          },
          {
            prompt: 'Self-reported net profit was VND 200 billion; after the audit it is VND 150 billion. What is the post-audit difference?',
            options: ['−20%', '−25%', '−33%', '−50%'],
            correct_index: 1,
            explanation: '(150 − 200) / 200 = −50 / 200 = −25%. Use the pre-audit figure (200) as the base.',
          },
          {
            prompt: 'You want to know whether profit is being propped up by under-provisioning. Which note should you check first?',
            options: [
              'General company information',
              'Receivables ageing and the allowance for doubtful debts',
              'The list of board members',
              'Charter capital',
            ],
            correct_index: 1,
            explanation:
              'If long-overdue balances grow while the allowance does not, expenses are understated and profit is overstated. The ageing schedule and allowance answer this directly.',
          },
          {
            prompt: 'Which combination is the STRONGEST warning sign?',
            options: [
              'Statements filed on time with a clean opinion',
              'Revenue up 10% with selling expenses up 10%',
              'Late audited filing, a recent auditor change, and audited profit far below the self-reported figure',
              'The company has a foreign subsidiary',
            ],
            correct_index: 2,
            explanation:
              'Each sign alone may have an innocent explanation, but late filing + auditor change + a big post-audit cut together suggest management and the auditor disagreed on the numbers — a reason for strong caution.',
          },
        ],
      },
      {
        slug: 'earnings-quality',
        title: 'Earnings quality',
        summary:
          'Does profit turn into cash? Measure it with multi-year CFO/net profit, compare receivables and inventory growth with revenue, and strip out one-offs — with FPT and HPG examples.',
        content_md: `## Accounting profit vs cash

Profit is prepared on an **accrual basis**: revenue is recognised on delivery (even if not yet paid), expenses when incurred (even if not yet paid). The gap between profit and cash is called **accruals**:

> **Accruals = Net profit after tax − Net cash flow from operating activities (CFO)**

Accruals are not bad — they are the essence of accounting. But **high-quality earnings** are **sustainable** (repeatable) and **convert to cash** over time. Academic research (Sloan, 1996) found that firms with large accruals relative to total assets tend to have weaker future earnings.

## Four core checks

1. **CFO / net profit over several years.** One odd year is normal (timing of collections, seasonality). Summed over 3–5 years, the ratio should be around or above **1.0** for a non-financial company (depreciation is a non-cash expense). Well below 1 for years on end is a warning.
2. **Receivables and inventory vs revenue.** If **trade receivables** grow faster than revenue for several years, the company may be loosening credit to make sales. Inventory outpacing revenue may mean unsold goods.
3. **One-off, non-recurring items:** gains on asset or subsidiary sales, revaluation of investments, spikes in **financial income**, **other income**. Recompute "core profit" without them.
4. **Costs pushed into the future:** **capitalised costs** (interest, software development, long-term prepaid expenses) lower this period's expenses; **provision reversals** raise profit with no cash coming in. Check their size in the notes.

## Example 1: FPT — asset-light services

| Year | Net profit | CFO | CFO/NP | Revenue growth | Receivables growth |
|---|---|---|---|---|---|
| 2021 | 5,349 | 5,840 | 1.09 | — | — |
| 2022 | 6,491 | 5,054 | 0.78 | +23.4% | +28.6% |
| 2023 | 7,788 | 9,517 | 1.22 | +19.6% | +13.4% |
| 2024 | 9,427 | 11,704 | 1.24 | +19.4% | +16.3% |
| 2025 | 11,232 | 10,136 | 0.90 | +11.6% | +20.9% |

Unit: VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.

- **Five-year total:** CFO = 42,251, net profit = 40,287 → CFO/NP = 42,251 / 40,287 ≈ **1.05**. Overall, profit has turned into cash.
- **2025:** accruals = 11,232 − 10,136 = **VND 1,096 billion**, about 1,096 / ((72,000 + 88,142) / 2) ≈ **1.4%** of average total assets — small. 2024 was the opposite: CFO exceeded profit by 11,704 − 9,427 = 2,277 billion.
- **Receivables in 2025** grew 20.9% (10,537 → 12,735) while revenue grew 11.6% (62,849 → 70,113). Days sales outstanding (year-end receivables / revenue × 365) rose from about **61** to **66** days. Over 2021–2025 as a whole, receivables grew ×2.05 versus revenue ×1.97 — broadly in step.

A measured conclusion: one year of receivables outpacing revenue is **not yet** a bad sign — it may reflect large project contracts billed near year-end or a change in customer mix. The analyst's job is to **ask the question**, read the ageing note, and watch whether the trend continues next year.

## Example 2: HPG — cyclical steel

| Year | Net profit | CFO | CFO/NP | Change in inventory |
|---|---|---|---|---|
| 2021 | 34,521 | 26,721 | 0.77 | (year-end inventory 42,134) |
| 2022 | 8,444 | 12,278 | 1.45 | −7,643 |
| 2023 | 6,800 | 8,643 | 1.27 | +13 |
| 2024 | 12,020 | 6,608 | 0.55 | +11,587 |
| 2025 | 15,515 | 17,366 | 1.12 | +6,737 |

Unit: VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.

For a cyclical business, **working capital** (mainly inventory) drives CFO:

- **2022:** profit collapsed, but non-cash depreciation of 6,759 billion plus a 7,643 billion fall in inventory (releasing cash) lifted CFO to 1.45× profit.
- **2024:** inventory rose by 11,587 billion → cash was tied up in stock, CFO was only 0.55× profit; accruals = 12,020 − 6,608 = **5,412 billion**.
- **Five-year total:** CFO 71,616 / net profit 77,300 ≈ **0.93** — acceptable across the cycle.

Lesson: in cyclical industries, judge CFO/NP **across the whole cycle**, not year by year, and always ask "is inventory rising because of deliberate stockpiling or because it isn't selling?".

## Practice

For a non-financial company of your choice, build a 5-year table of net profit, CFO, CFO/NP, revenue growth, and receivables and inventory growth. Compute cumulative CFO/NP. Then open the "other income" and "financial income" notes for the latest year: after removing non-recurring items, by what percentage did core profit grow or shrink versus the prior year?`,
        questions: [
          {
            prompt: 'A company reports net profit of 500 billion and CFO of 300 billion. What are accruals (NP − CFO) and CFO/NP?',
            options: ['200 billion; 0.6', '200 billion; 1.67', '−200 billion; 0.6', '800 billion; 0.6'],
            correct_index: 0,
            explanation: 'Accruals = 500 − 300 = 200 billion. CFO/NP = 300 / 500 = 0.6 — only 60% of profit became cash that year.',
          },
          {
            prompt: "In 2025 FPT's trade receivables rose from 10,537 to 12,735 billion and revenue from 62,849 to 70,113 billion. Which reading is most reasonable?",
            options: [
              'Receivables grew about 20.9%, faster than revenue (about 11.6%) — read the ageing note and watch the trend; not enough to conclude anything bad',
              'Receivables grew slower than revenue, which is very good',
              'This is certainly revenue fraud',
              'Receivables have nothing to do with earnings quality',
            ],
            correct_index: 0,
            explanation:
              '12,735 / 10,537 − 1 ≈ 20.9%; 70,113 / 62,849 − 1 ≈ 11.6%. One year can reflect large contracts billed near year-end; over 2021–2025 receivables (×2.05) and revenue (×1.97) moved broadly together. Ask and verify — do not jump to conclusions.',
          },
          {
            prompt: "Why was HPG's 2022 CFO (12,278 billion) higher than net profit (8,444 billion) even though profit fell sharply?",
            options: [
              'HPG issued new shares',
              'Large non-cash depreciation plus a fall in inventory of about 7,643 billion, releasing cash from working capital',
              'Capital expenditure fell',
              'HPG borrowed more from banks',
            ],
            correct_index: 1,
            explanation:
              'Depreciation of 6,759 billion is added back because it uses no cash, and inventory dropped from 42,134 to 34,491 billion (−7,643), turning stock into cash. Share issues and borrowing are financing cash flows, capex is an investing cash flow — none of them are in CFO.',
          },
          {
            prompt: 'Which item raises this period\'s profit but does NOT reflect repeatable core business performance?',
            options: [
              'Sales to new customers',
              'A gain on selling a subsidiary and a reversal of provisions',
              'Lower cost of goods sold from a better production line',
              'Higher prices thanks to a strong brand',
            ],
            correct_index: 1,
            explanation:
              'A gain on disposal of a subsidiary and a provision reversal are one-offs — they will not recur next year and usually bring no operating cash. Strip them out to get core profit.',
          },
        ],
      },
      {
        slug: 'red-flags-and-manipulation',
        title: 'Red flags and accounting manipulation',
        summary:
          'Common ways to dress up the numbers, the traces they leave on the three statements, the idea behind the Beneish M-score and a practical checklist.',
        content_md: `## What is "cooking the books"?

**Cooking the books** means deliberately presenting figures that misrepresent economic reality to hit a goal: meeting a profit target, supporting the share price, qualifying for a loan or a share issue. The line between **aggressive accounting** (legal but optimistic) and **fraud** is not always clear — but both reduce the quality of the information you rely on. An investor's goal is not to "catch" fraud, but to **recognise when to trust the numbers less** and demand a larger margin of safety.

Note: every example in this lesson is a **hypothetical illustration**, not about any specific company.

## Common techniques and their traces

| Technique | How it works | Traces in the statements |
|---|---|---|
| **Channel stuffing** | Push goods onto distributors at period-end with extended credit or return rights | Q4 revenue spike; receivables growing faster than revenue; sales returns jump in Q1 next year |
| **Aggressive revenue recognition** | Book a multi-year contract up front, or use optimistic percentage-of-completion | Revenue rises but CFO does not; changes in revenue-recognition policy |
| **Related-party round-tripping** | Sell to a "sister" company, then the cash comes back as a loan or advance | Large receivables, advances or loans to related parties; high share of related-party revenue |
| **Hidden debt** | Guarantee others' loans, park debt in unconsolidated entities or business-cooperation contracts | Contingent-liability and guarantee notes; interest expense unusually high relative to reported debt |
| **Big bath** | In a bad year or after a CEO change, book huge provisions, then reverse them in later years | One year of sudden losses, then a profit "recovery" driven by provision reversals |
| **Capitalising costs** | Record operating expenses as assets (construction in progress, long-term prepaid expenses) | Construction in progress or prepayments growing fast; capex rises but the assets add no revenue |

## Signals outside the numbers

- **Frequent restatements:** prior-year figures are re-presented again and again.
- **Qualified audit opinions**, auditor changes, late filings (see lesson 1).
- **Steady insider selling** while management sends very upbeat messages.
- **Profit targets met "exactly"** year after year — real businesses are rarely that smooth.

## The idea behind the Beneish M-score

Professor Messod Beneish built the **M-score**, a statistical model combining 8 ratios to estimate the probability that a company has manipulated earnings. You do not need to memorise the formula; understand the **logic** of its components:

- **Rising days sales in receivables** → risk of premature revenue recognition.
- **Falling gross margin** → pressure to dress up results.
- **Falling asset quality** (soft assets other than fixed and current assets growing) → risk of capitalised costs.
- **Very fast sales growth** → pressure to sustain the pace.
- **Slowing depreciation rate** → useful lives stretched to cut expenses.
- **SG&A growing faster than sales**, **rising leverage**, and **large total accruals** relative to assets.

An M-score above the threshold (a commonly cited cut-off is about −1.78; some sources use −2.22) suggests higher risk. It is a **screening tool, not proof** — the model was built on US company data and produces false alarms, especially for legitimately fast-growing firms.

## Illustrative example (hypothetical): ABC Distribution

| | Year N−1 | Year N | Change |
|---|---|---|---|
| Revenue | 1,000 | 1,300 | +30% |
| Trade receivables | 150 | 325 | +117% |
| Net profit | 80 | 120 | +50% |
| CFO | 70 | −40 | — |

Days sales outstanding: year N−1 = 150 / 1,000 × 365 ≈ **55 days**; year N = 325 / 1,300 × 365 ≈ **91 days**. Profit is up 50%, yet CFO is negative and receivables have more than doubled. If the notes also show that most of the new receivables are owed by a related party, this picture calls for great caution — even though it does not prove fraud.

## A practical checklist

1. Is cumulative CFO / net profit over 3–5 years clearly below 1?
2. Have receivables or inventory grown faster than revenue for several years?
3. Does profit depend on financial income, other income or provision reversals?
4. Are related-party transactions and balances large?
5. Are there guarantees, contingent liabilities or off-balance-sheet commitments?
6. Audit opinion, auditor-change history, late filings, restatements?
7. Are insiders buying or selling?

The more "yes" answers, the more you should discount reported profit — or stay away.

## Practice

Apply the 7-question checklist to a company you follow. For each question, note the specific figure and the page of the notes as evidence, then score it: 0 = no sign, 1 = watch, 2 = worrying. If the total is 5 or more, write down three questions you would ask the company's investor relations team.`,
        questions: [
          {
            prompt: 'Revenue rose from 1,000 to 1,300 billion and receivables from 150 to 325 billion. How did days sales outstanding (receivables / revenue × 365) change?',
            options: ['From about 55 to about 91 days', 'From about 55 down to about 40 days', 'From about 91 down to about 55 days', 'Unchanged at about 55 days'],
            correct_index: 0,
            explanation: '150 / 1,000 × 365 ≈ 54.8 ≈ 55 days; 325 / 1,300 × 365 = 91.25 ≈ 91 days. Customers are paying much more slowly — check credit terms and related parties.',
          },
          {
            prompt: 'A company posts a sudden loss in the year a new CEO arrives because of very large provisions; two years later profit jumps mainly thanks to provision reversals. Which technique does this suggest?',
            options: ['Channel stuffing', 'Big bath', 'Round-tripping', 'Premature revenue recognition'],
            correct_index: 1,
            explanation:
              'A big bath loads costs into one bad year (often under new management) so later years look better through reversals — the "recovery" does not come from the business itself.',
          },
          {
            prompt: 'Which statement about the Beneish M-score is TRUE?',
            options: [
              'An M-score above the threshold is legal proof of fraud',
              'The M-score is only for banks',
              'The M-score is a statistical screen that shows where to look harder, and it can give false alarms',
              'The M-score replaces reading the notes',
            ],
            correct_index: 2,
            explanation:
              'The M-score combines 8 ratios (receivable days, gross margin, asset quality, sales growth, accruals…) to estimate risk. It is only a first filter; conclusions must rest on the notes and specific evidence.',
          },
          {
            prompt: 'You suspect a company has hidden debt. Which part of the report helps most?',
            options: [
              'Gross margin in the income statement',
              'The notes on contingent liabilities, commitments and guarantees given to others',
              'The number of shares outstanding',
              'Head-office information',
            ],
            correct_index: 1,
            explanation:
              'Hidden debt usually does not appear on the balance sheet; it shows up as guarantees, commitments and contingent obligations — all disclosed in the notes.',
          },
        ],
      },
      {
        slug: 'cash-flow-deep-dive',
        title: 'Cash flow deep dive',
        summary:
          'Free cash flow versus dividends, growth funded by debt, the cash conversion cycle and how to read CFO/CFI/CFF sign patterns — with FPT and HPG.',
        content_md: `## Recap, then further

In "Reading financial statements" you learned that **free cash flow (FCF) = CFO − purchases of fixed assets (capex)**. This lesson uses FCF to answer three practical questions: **Are dividends paid from real cash? How is growth funded? How much cash does working capital absorb?**

A note on definitions: capex here is **cash paid to buy and build fixed assets** (an outflow in investing cash flow). Some analysts also deduct proceeds from asset disposals; stick to one method when comparing.

## Example 1: FPT — FCF vs cash dividends

| Year | CFO | Capex | FCF | Dividends paid | FCF − dividends |
|---|---|---|---|---|---|
| 2021 | 5,840 | 2,911 | 2,929 | 2,254 | 675 |
| 2022 | 5,054 | 3,215 | 1,839 | 2,222 | −383 |
| 2023 | 9,517 | 3,978 | 5,539 | 2,931 | 2,608 |
| 2024 | 11,704 | 3,275 | 8,429 | 3,292 | 5,137 |
| 2025 | 10,136 | 5,098 | 5,038 | 4,574 | 464 |
| **Total** | **42,251** | **18,477** | **23,774** | **15,273** | **8,501** |

Unit: VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.

- Over five years FCF covered cash dividends 23,774 / 15,273 ≈ **1.56 times**: dividends were paid from self-generated cash.
- In **2022** FCF (1,839) fell short of dividends (2,222) by 383 billion — one short year is normal when CFO dips; what matters is a shortfall that **persists for years**.
- In 2025 capex rose to 5,098 billion (about 1.75× depreciation of 2,914) → the company is investing to expand, and FCF narrowed.
- Cash and equivalents rose from 5,418 (2021) to 10,522 billion (2025), while total short- and long-term borrowings only edged up from 20,095 to 21,074 billion.

## Example 2: HPG — growth funded with debt

In 2024 HPG invested heavily in a new project:

> FCF 2024 = CFO − capex = 6,608 − 35,495 = **−28,887 billion**

Where did the shortfall come from? The balance sheet shows:

- **Long-term borrowings** rose from 10,399 to 27,080 billion (**+16,681**); total short- plus long-term borrowings rose from 65,381 to 82,963 billion (**+17,582**).
- **Cash** fell from 12,252 to 6,888 billion (**−5,364**).
- The remainder came from other lines in investing and financing cash flows — read the full cash flow statement to reconcile.

Over 2021–2025: cumulative CFO 71,616 billion, capex 108,126 billion → cumulative FCF **−36,510 billion**; total borrowings rose from 57,213 to 92,174 billion. This is **not** automatically bad: adding capacity at the bottom of the cycle can pay off handsomely when the cycle turns. But the risk is higher: if steel prices stay weak for long, the debt still has to be serviced. The right question is: **how much CFO will the new project generate at full capacity, and how long until the debt is repaid?**

## The cash conversion cycle (CCC)

> **CCC = DSO + DIO − DPO**

- **DSO** (days sales outstanding) = Trade receivables / Revenue × 365
- **DIO** (days inventory outstanding) = Inventory / Cost of goods sold × 365
- **DPO** (days payables outstanding) = Trade payables / Cost of goods sold × 365

The CCC is the number of days cash is tied up in working capital. Example: DSO 45, DIO 60, DPO 30 → CCC = 45 + 60 − 30 = **75 days**. A shorter CCC releases cash; a lengthening CCC while the company grows means it needs more capital.

Using 2025 year-end balances (COGS = revenue − gross profit):

| | FPT | HPG |
|---|---|---|
| COGS | 70,113 − 25,889 = 44,224 | 156,116 − 24,498 = 131,618 |
| DSO | 12,735 / 70,113 × 365 ≈ **66 days** | 10,972 / 156,116 × 365 ≈ **26 days** |
| DIO | 2,194 / 44,224 × 365 ≈ **18 days** | 52,828 / 131,618 × 365 ≈ **147 days** |

Two very different models: FPT sells services with almost no inventory but waits for clients to pay; HPG collects quickly but holds ore, coal and finished steel for nearly five months. (You need trade payables from the statements to compute DPO and the full CCC.)

## Reading the sign pattern of the three cash flows

| CFO | CFI | CFF | Usually means |
|---|---|---|---|
| + | − | + | **Growing:** the business generates cash but still borrows or issues shares to invest |
| + | − | − | **Mature:** operating cash covers investment, debt repayment and dividends |
| − | − | + | **Start-up / early expansion:** living on raised capital |
| − | + | + | **Distressed:** selling assets and borrowing to cover an operating cash shortfall |
| + | + | − | **Restructuring:** selling assets to repay debt |

For **banks, brokers and insurers** these patterns **do not apply**: deposits, loans and margin lending are operating activities, so CFO swings wildly. VCB's CFO, for example: −53,766 billion (2021), 185,960 billion (2022), −35,739 billion (2023) — this says nothing about earnings quality the way it would for a manufacturer.

## Practice

Pick a manufacturer or retailer and build a 5-year table: CFO, capex, FCF, cash dividends, year-end total borrowings. Compute cumulative FCF / cumulative dividends. Then take trade payables for the latest year to compute DSO, DIO, DPO and the CCC. Finally, identify the CFO/CFI/CFF sign pattern for the latest year and describe what stage the company is in.`,
        questions: [
          {
            prompt: 'In 2025 FPT had CFO of 10,136 billion, capex of 5,098 billion and paid dividends of 4,574 billion. What were FCF and FCF left after dividends?',
            options: ['FCF 5,038; 464 left', 'FCF 15,234; 10,660 left', 'FCF 5,562; 988 left', 'FCF 5,038; 464 short'],
            correct_index: 0,
            explanation: 'FCF = 10,136 − 5,098 = 5,038 billion. After dividends: 5,038 − 4,574 = 464 billion (positive) — that year\'s FCF covered the dividend.',
          },
          {
            prompt: 'In 2024 HPG had CFO of 6,608 billion and capex of 35,495 billion; long-term borrowings rose from 10,399 to 27,080 billion. Which interpretation is right?',
            options: [
              'FCF was positive and HPG used the surplus to repay debt',
              'FCF was about −28,887 billion; most of the gap was filled by new borrowing (long-term +16,681 billion) and a lower cash balance',
              'Capex is part of operating cash flow, so CFO already includes it',
              'The rise in long-term borrowings is unrelated to capex',
            ],
            correct_index: 1,
            explanation:
              'FCF = 6,608 − 35,495 = −28,887 billion. Long-term borrowings +16,681 (27,080 − 10,399), total borrowings +17,582, cash −5,364 — growth was funded mainly by debt.',
          },
          {
            prompt: 'A company has DSO of 40 days, DIO of 90 days and DPO of 50 days. What is its cash conversion cycle?',
            options: ['180 days', '100 days', '80 days', '0 days'],
            correct_index: 2,
            explanation: 'CCC = DSO + DIO − DPO = 40 + 90 − 50 = 80 days: cash is tied up in working capital for about 80 days.',
          },
          {
            prompt: 'A company shows negative CFO, positive CFI (selling assets) and positive CFF (new borrowing). What does this pattern usually suggest?',
            options: [
              'A mature company with surplus cash',
              'A company in distress: selling assets and borrowing to cover an operating cash shortfall',
              'A company buying back shares',
              'Healthy growth driven by profitable operations',
            ],
            correct_index: 1,
            explanation:
              'The business does not generate cash (CFO negative), so the company sells assets (CFI positive) and borrows (CFF positive) to survive — the classic distress pattern (not applicable to banks, brokers or insurers).',
          },
        ],
      },
      {
        slug: 'peer-comparison-and-workflow',
        title: 'Peer comparison and a full analysis workflow',
        summary:
          'Common-size statements, multi-year CAGR, a DuPont ROE breakdown for FPT, HPG and VCB, and a step-by-step workflow from downloading statements to a one-page thesis.',
        content_md: `## Common-size statements

To compare companies of different sizes, express every line as a **percentage**: income-statement items over **revenue**, balance-sheet items over **total assets**. For 2025:

| % | FPT | HPG |
|---|---|---|
| COGS / revenue | 63.1% | 84.3% |
| Gross profit / revenue | 36.9% | 15.7% |
| Interest expense / revenue | 1.2% | 2.0% |
| Depreciation / revenue | 4.2% | 5.4% |
| Net profit / revenue | 16.0% | 9.9% |
| Cash / total assets | 11.9% | 3.2% |
| Trade receivables / total assets | 14.4% | 4.3% |
| Inventory / total assets | 2.5% | 20.5% |
| Total borrowings / total assets | 23.9% | 35.7% |

Underlying unit: VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.

The common-size view exposes the **business model** at a glance: FPT holds little stock, has large receivables and a high gross margin; HPG holds a lot of stock, earns thin margins and borrows more relative to its assets.

## Compound annual growth rate (CAGR)

> **CAGR = (End value / Start value)^(1 / number of years) − 1**

From 2021 to 2025 is **4 years** of growth (not 5):

- FPT revenue: (70,113 / 35,657)^(1/4) − 1 ≈ 1.966^0.25 − 1 ≈ **18.4% a year**
- FPT net profit: (11,232 / 5,349)^(1/4) − 1 ≈ 2.100^0.25 − 1 ≈ **20.4% a year**
- HPG revenue: (156,116 / 149,680)^(1/4) − 1 ≈ **1.1% a year** — but this hides a full down-and-up cycle (a low of 118,953 in 2023). In cyclical industries, peak-to-peak or trough-to-trough CAGRs mislead easily; always look at the whole series.

## DuPont breakdown of ROE

> **ROE = Net margin × Asset turnover × Financial leverage**
> = (Net profit / Revenue) × (Revenue / Total assets) × (Total assets / Equity)

Using 2025 year-end figures:

| | Net margin | Asset turnover | Leverage | ROE |
|---|---|---|---|---|
| **FPT** | 11,232 / 70,113 = 16.0% | 70,113 / 88,142 = 0.80 | 88,142 / 43,748 = 2.01 | ≈ **25.7%** |
| **HPG** | 15,515 / 156,116 = 9.9% | 156,116 / 257,899 = 0.61 | 257,899 / 131,220 = 1.97 | ≈ **11.8%** |
| **VCB** | ROA = 35,198 / 2,442,279 = 1.44% | (inside ROA) | 2,442,279 / 224,559 = 10.9 | ≈ **15.7%** |

Check (using unrounded inputs): the product of the three parts equals net profit / equity — FPT 11,232 / 43,748 ≈ 25.7%; HPG 15,515 / 131,220 ≈ 11.8%; VCB 35,198 / 224,559 ≈ 15.7%.

Cross-check with TTM ratios as of Q2/2026 (last four quarters): FPT has ROE 26.5%, ROA 12.8% and net margin 17.2% → leverage ≈ 26.5 / 12.8 ≈ **2.07** and asset turnover ≈ 12.8 / 17.2 ≈ **0.74**. VCB has ROE 17.9%, ROA 1.7% → leverage ≈ **10.5×**. HPG's TTM ROE of 17.4% is well above its 2025 figure of 11.8% mainly because profit over the latest four quarters was higher. (TTM figures usually use average equity and four-quarter profit, so they will not match year-end numbers exactly.)

Three different sources of ROE:

- **FPT — asset-light:** high ROE driven mainly by **margin** and turnover, with moderate leverage.
- **HPG — capital-heavy:** thin margins that swing with steel prices; low turnover because of large fixed assets and inventory.
- **VCB — a bank:** ROA of only about 1.4–1.7%; ROE comes from **leverage** of roughly 10–11× — normal for banks, because customer deposits are their raw material.

So **compare only within the same industry**: saying "FPT is better than VCB because its ROE is higher" is meaningless. Compare FPT with tech companies, HPG with steelmakers, VCB with other banks — and use the same method (year-end or average, annual or TTM).

## A step-by-step workflow

1. **Collect:** 5 years of audited consolidated statements, the latest reviewed half-year and quarterly reports, the annual report.
2. **Read the auditor's report** and the key notes (lesson 1).
3. **Build common-size tables** and compute CAGRs for revenue, profit and equity.
4. **Earnings quality:** cumulative CFO/NP, receivables and inventory vs revenue, one-offs (lesson 2).
5. **Red-flag checklist** (lesson 3).
6. **Cash flow:** FCF, dividends, debt, CCC (lesson 4).
7. **DuPont and a comparison with 3–5 industry peers.**
8. **Valuation** using the methods in the "Advanced valuation" chapter (DCF, EV/EBITDA, margin of safety).
9. **Write a one-page thesis:** how the company makes money, 3 strengths backed by numbers, 3 risks, what would change your mind, and the metrics to track every quarter.

## Practice

Pick 3 companies in the same industry. Build a DuPont table for the latest year for all three (net margin, asset turnover, leverage, ROE), check that the product of the three parts matches ROE, and compute each company's 4-year revenue CAGR. Write five sentences explaining why their ROEs differ, then complete a one-page thesis following step 9.`,
        questions: [
          {
            prompt: 'Revenue grew from 100 to 160 over 2021–2025. What is the CAGR, approximately?',
            options: ['12.5% a year', '15.0% a year', '9.9% a year', '16.0% a year'],
            correct_index: 0,
            explanation: '2021 → 2025 is 4 years. CAGR = (160 / 100)^(1/4) − 1 = 1.6^0.25 − 1 ≈ 1.1247 − 1 ≈ 12.5% a year. Dividing by 5 years or taking 60% / 4 = 15% are both wrong.',
          },
          {
            prompt: 'A company has a net margin of 10%, asset turnover of 0.8 and leverage (assets / equity) of 2.5. What is its ROE?',
            options: ['13.3%', '20%', '25%', '8%'],
            correct_index: 1,
            explanation: 'ROE = 10% × 0.8 × 2.5 = 20%. ROA = 10% × 0.8 = 8%; multiplied by leverage of 2.5 gives ROE of 20%.',
          },
          {
            prompt: 'On TTM figures VCB has ROE of 17.9% and ROA of 1.7%. What is the implied leverage, and how should you read it?',
            options: [
              'About 1.05× — the bank barely uses debt',
              'About 10.5× — normal for a bank, because customer deposits are its main source of funds',
              'About 10.5× — proof that VCB is riskier and therefore worse than FPT',
              'It cannot be computed',
            ],
            correct_index: 1,
            explanation:
              'Leverage = ROE / ROA = 17.9 / 1.7 ≈ 10.5×. That is typical for a bank; comparing a bank\'s leverage with a tech company\'s is a cross-industry comparison.',
          },
          {
            prompt: "In 2025 inventory was 20.5% of HPG's total assets but only 2.5% of FPT's. Which conclusion is most reasonable?",
            options: [
              'HPG manages inventory worse than FPT',
              'The gap mainly reflects different business models (steelmaking vs IT services); compare HPG with other steelmakers',
              'FPT is hiding inventory',
              'Inventory share is meaningless for analysis',
            ],
            correct_index: 1,
            explanation:
              'Common-size tables reveal the business model: a steelmaker must hold raw materials and finished goods, a services firm does not. Inventory efficiency only makes sense compared with industry peers.',
          },
        ],
      },
    ],
  },
]
