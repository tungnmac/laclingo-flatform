import type { SeedChapter } from './types'

// Reading statements by sector (en) — goes deeper than the "Reading financial statements" and "Key financial ratios" chapters.
// Real figures (VCB, SSI, BVH, HPG, FPT): consolidated annual statements, VND billion, compiled from public data (Vietcap), rounded.
// The real estate and retail lessons use illustrative numbers (labelled in the text).
// Lesson order matches vi-sectors.ts (lesson i in each file is a translation of the other).
export const EN_SECTORS: SeedChapter[] = [
  {
    slug: 'statements-by-sector',
    title: 'Reading financial statements by sector',
    description:
      'Each industry has its own statement structure and its own ratios: banks, real estate developers, brokers, insurers, cyclical manufacturers and retailers — illustrated with real listed-company data.',
    level: 'advanced',
    lessons: [
      {
        slug: 'bank-statements',
        title: 'Banks: net interest income, bad debt and capital adequacy',
        summary: 'Why a bank has no revenue or cost of goods sold, why 10x leverage is normal, and how to read NIM, CIR, NPLs, loan-loss coverage, CASA and CAR.',
        content_md: `## Why you cannot read a bank like an ordinary company

In the **Reading financial statements** chapter we read the income statement from revenue, minus cost of goods sold, down to gross profit. A bank has neither line. A bank's "product" is **money** itself: it takes in deposits at one interest rate and lends them out at a higher one. So its income statement is organised by **source of income**:

| Line on a bank income statement | What it means |
|---|---|
| Interest income − interest expense = **Net interest income (NII)** | The rate spread — the bank's core "gross profit" |
| **Net fee and commission income** | Payments, cards, guarantees, bancassurance |
| Net gains from FX, securities and other activities | Volatile and less repeatable |
| = **Total operating income (TOI)** | "Revenue" in the broad sense |
| − Operating expenses | Staff, premises, technology |
| − **Credit loss provisions** | The line where management has the most discretion |
| = Profit before tax | |

For **Vietcombank (VCB)** in 2025: net interest income was **VND 58,771 billion** out of total operating income of **VND 72,455 billion** — about **81%** of income came from the interest spread. Net profit after tax was **VND 35,198 billion**.

## The balance sheet: 10x leverage is normal

A bank's largest asset is **loans to customers**; its largest liability is **customer deposits**. At the end of 2025 VCB had gross customer loans of **VND 1,673,526 billion**, customer deposits of **VND 1,672,535 billion** and total assets of **VND 2,442,279 billion** — but equity of only **VND 224,559 billion**. Equity is about **9%** of assets, and liabilities are almost **10 times** equity.

In the **Financial health** lesson, a debt-to-equity ratio below 1 counted as comfortable for an industrial company, with a note that banks are an exception. For a bank, high leverage *is* the business model. It also explains the ROA–ROE gap: VCB's ROA is about **1.7%** but its ROE about **17.9%** (trailing twelve months to Q2 2026) — leverage of roughly 10x turns a thin return on assets into a solid return on equity. So the right question is not "how much debt?" but **is there enough capital to absorb losses** and **how good is the loan book?**

## The bank-specific ratios

| Ratio | Formula | How to read it |
|---|---|---|
| **NIM** | NII / average interest-earning assets | The lending margin; VCB about 2.75% (TTM). Higher is not better if it comes from riskier lending |
| **CIR** | Operating expenses / TOI | Efficiency; lower is better |
| **NPL ratio** | Group 3–5 loans / total loans | Asset quality |
| **Loan-loss coverage (LLR)** | Loan-loss reserve / NPLs | The cushion already set aside; above 100% means reserves exceed bad loans |
| **CASA** | Current and savings (non-term) deposits / total deposits | Cheap funding — high CASA supports a high NIM |
| **LDR** | Loans / deposits | How fully the bank has deployed its funding |
| **CAR** | Regulatory capital / risk-weighted assets | Capital adequacy |

A few regulatory notes:

- **CAR** under the **Basel II** framework applied by the State Bank of Vietnam (Circular 41/2016 and its amendments and successors) has a minimum of **8%**. A fast-growing bank must keep topping up capital — through retained earnings, stock dividends or new share issues.
- The **regulatory LDR** uses the SBV's own formula (not simply loans divided by deposits on the balance sheet), and the cap has changed over time; the same goes for the limit on using short-term funding for medium- and long-term loans. VCB's "raw" 2025 ratio of about 100% **cannot** be compared directly with the legal cap.
- **Credit growth quotas** are allocated by the SBV to each bank and revised each year. Banks that receive larger quotas tend to grow earnings faster. VCB's loan book grew about **15.5%** in 2025 (from 1,449,199 to 1,673,526 billion).

## Reading the loan classification note

The "Loans to customers" note splits the loan book into **five groups**: group 1 (standard), group 2 (special mention), group 3 (substandard), group 4 (doubtful) and group 5 (loss). **NPLs = groups 3 + 4 + 5.** Banks set aside **specific provisions** at rates that rise with each group (up to 100% for group 5, net of collateral value), plus a **general provision** on the loan book.

How to use the note in practice:

1. **Track group 2 quarter by quarter** — it is the waiting room for bad debt. A jump in group 2 often comes before a rise in NPLs.
2. **Compare the reserve with NPLs** to get coverage. For VCB in 2025 the reserve is roughly gross loans minus net loans: 1,673,526 − 1,648,550 ≈ **VND 24,976 billion** (about 1.5% of loans).
3. **Watch the provision charge**: profit that rises because the bank provisioned less while NPLs were climbing is profit borrowed from the future.
4. Look for **restructured loans kept in their original group** under support policies (applied in 2020–2024) — they do not appear in NPLs even though their risk may be higher.

## Why operating cash flow tells you almost nothing

For a bank, deposits received and loans disbursed both sit in **operating activities**. A big deposit inflow at year-end sends operating cash flow sharply positive; a big lending push sends it deeply negative. VCB's operating cash flow was **−53,766 / +185,960 / −35,739 billion** in 2021–2023, while net profit rose steadily from 22,017 to 33,122 billion. The "operating cash flow versus profit" test from the earlier chapter **does not work** for banks — use asset quality and capital adequacy instead.

*Data: consolidated annual statements, compiled from public data (Vietcap), rounded.*

## Practice

Open the latest annual consolidated statements of a listed bank. (1) Work out NII as a share of TOI. (2) In the loan classification note, add up groups 3–5 and divide by total loans to get the NPL ratio. (3) Divide the loan-loss reserve by NPLs to get coverage. (4) Compare group 2 with a year earlier and write one sentence on the direction of asset quality.`,
        questions: [
          {
            prompt: 'Why are liabilities of about 10x equity at a large bank NOT automatically a danger sign?',
            options: [
              'Because banks pay no interest on deposits',
              'Because intermediating deposits is the business model; safety is measured by CAR and asset quality',
              'Because bank liabilities are kept off the balance sheet',
              'Because the higher the leverage, the safer the bank',
            ],
            correct_index: 1,
            explanation:
              'Customer deposits are the raw material of banking, so high leverage is the normal structure. What matters is whether capital is a sufficient cushion (minimum CAR of 8% under Basel II) and whether the loans are sound (NPLs, coverage).',
          },
          {
            prompt: 'Which loan groups make up the NPL ratio of a Vietnamese bank?',
            options: ['Group 5 only', 'Groups 2 to 5', 'Groups 3, 4 and 5', 'All collateralised loans'],
            correct_index: 2,
            explanation:
              'NPLs are group 3 (substandard), group 4 (doubtful) and group 5 (loss). Group 2 (special mention) is not yet bad debt, but it is an early warning worth tracking.',
          },
          {
            prompt: 'A bank reports 30% profit growth while net interest income and operating expenses are roughly flat. What should you check first?',
            options: [
              'Last week’s share price',
              'Whether the provision charge fell sharply, and whether NPLs, group 2 loans and loan-loss coverage deteriorated',
              'How many new branches it opened',
              'Whether operating cash flow was positive',
            ],
            correct_index: 1,
            explanation:
              'With core income flat, the profit jump most likely came from lower provisioning. If NPLs rose and coverage fell at the same time, that profit is not sustainable. A bank’s operating cash flow says almost nothing about this.',
          },
          {
            prompt: 'Why does a bank’s operating cash flow swing so wildly and carry so little meaning?',
            options: [
              'Because banks do not have to prepare a cash flow statement',
              'Because customer deposits and loan disbursements are both classified as operating activities',
              'Because bank profits are always zero',
              'Because dividends are recorded in operating activities',
            ],
            correct_index: 1,
            explanation:
              'Movements in deposits and loans — huge relative to profit — run through operating activities. VCB: −53,766 billion (2021), +185,960 billion (2022), −35,739 billion (2023) while profit rose steadily.',
          },
        ],
      },
      {
        slug: 'real-estate-developer-statements',
        title: 'Real estate developers: revenue at handover, inventory and customer advances',
        summary:
          'Why property developers report lumpy profits, how to read the land bank inside inventory, customer advances, borrowings and bonds, and how NAV/RNAV thinking works.',
        content_md: `## Revenue is recognised only at handover

Developers sell apartments, townhouses and land plots early — as soon as a project is cleared for sale — and collect cash in instalments as construction progresses. But under Vietnamese accounting standards, **revenue is recognised only when the significant risks and rewards pass to the buyer**, which in practice usually means at **handover**. The consequences:

- In a year when a big project is handed over, revenue and profit **spike**; in a year with no handovers, profit **collapses** even if sales are going well.
- One year of EPS growth or a single-year P/E (see **Valuation ratios: EPS, P/E and P/B**) says very little — look at several years and the handover schedule.

An **illustrative** example (hypothetical figures, VND billion) for Developer X:

| Year | Revenue | Net profit | Customer advances (year-end) | Inventory (year-end) |
|---|---|---|---|---|
| Y1 | 800 | 90 | 1,500 | 6,000 |
| Y2 | 4,500 | 1,100 | 600 | 4,800 |
| Y3 | 600 | 40 | 2,800 | 7,500 |
| Y4 | 300 | 10 | 4,200 | 9,000 |
| Y5 | 5,200 | 1,300 | 1,200 | 7,000 |

In Y3–Y4 profit is close to zero — yet customer advances are piling up, signalling a large handover in Y5.

## Customer advances: a leading indicator

**Advances from customers** (current and non-current, under liabilities) are cash buyers have paid for units **not yet handed over**. Think of it as revenue waiting to be recognised: at handover this liability falls and revenue rises. So:

- **Rising customer advances** → real sales are strong, and future profit has a base (as long as the project is completed and handed over).
- **Advances shrinking with no new launches** → the pipeline of future profit is drying up.

Use the notes to see which projects the advances belong to and where each project stands legally.

## Inventory is the main asset

At a manufacturer, inventory means raw materials and finished goods. At a developer, **inventory is the land bank and the projects**: land use fees, site clearance costs, construction in progress, and completed but unsold units. It is often the bulk of total assets.

What to look for in the inventory note:

1. **The breakdown by project** — which projects dominate and what stage they are at.
2. **Assets pledged** as collateral for borrowings.
3. **Inventory write-downs** — needed when net realisable value falls below cost (a falling market, a stalled project).

Because buying land and building projects for sale goes through inventory, **operating cash flow is usually negative** while a developer is accumulating land and building — unlike the general rule in **The cash flow statement** that persistently negative operating cash flow is a bad sign. The real question is whether that cash comes back at handover.

## Borrowings, bonds and capitalised interest

Projects need large amounts of capital for years, so developers borrow from banks and issue **corporate bonds**. Two things are easy to miss:

- **Capitalised interest**: under the borrowing-costs standard, interest on loans used for a project under construction is **added to the cost of inventory** instead of being expensed immediately. Interest expense on the income statement can therefore look tiny, making interest cover look deceptively safe. That interest only reaches cost of sales at handover. Compare total interest paid in the cash flow statement (part of the capitalised interest may be shown under investing cash flow) with the capitalised interest disclosed in the notes.
- **The bond maturity schedule**: the stress in Vietnam's corporate bond market in 2022–2023 showed that a developer's biggest risk is usually **liquidity**, not accounting losses. The borrowings and bonds note shows what falls due in the next 12 months.

## Legal and handover risk

A project can sit in inventory for years because of **legal hold-ups**: land use fees not yet finalised, zoning changes not yet approved, ownership certificates not yet issued to buyers. Capital is locked up, interest keeps accruing, and revenue cannot be recognised. Read the annual report and the notes to find out which step each project has reached.

## Valuation: why P/B misleads, and NAV/RNAV thinking

The land bank is carried at **historical cost** — sometimes bought decades ago, sometimes bought expensively at the top of the market. Book equity can therefore be far from economic value, and P/B is less reliable here than in other sectors. Analysts often use **RNAV (revalued net asset value)**:

> RNAV = Sum of the present value of each project's net cash flows + other assets − net debt

Each project gets estimates of revenue, remaining costs, sales and handover timing, then discounted to today. The result is very sensitive to selling-price assumptions and to how long legal approvals take — treat RNAV as a range, not a precise number.

*The figures in the table are illustrative, not those of a real company.*

## Practice

Pick a listed property developer and build a five-year table of revenue, net profit, customer advances, inventory, and total borrowings plus bonds. Answer: (1) In which year did profit jump, and did it coincide with a major handover? (2) Are customer advances currently rising or falling? (3) How much debt and bonds fall due in the next 12 months compared with the cash on hand?`,
        questions: [
          {
            prompt: 'A property developer’s revenue rises sevenfold in one year. What is the most likely reason?',
            options: [
              'Apartment prices across the market rose sevenfold',
              'It handed over a large project and recognised revenue accumulated over several years of sales',
              'It switched to a different accounting standard',
              'Its inventory rose sharply',
            ],
            correct_index: 1,
            explanation:
              'Developers recognise revenue at handover, so units sold over several years all land in revenue in the handover year. That is why profits in this sector are so lumpy.',
          },
          {
            prompt: 'What does a strong rise in customer advances over two consecutive years usually signal?',
            options: [
              'The developer is making heavy losses',
              'The developer is about to refund buyers',
              'Real sales are strong, and this is revenue that will be recognised when the project is handed over',
              'The developer has capitalised its interest',
            ],
            correct_index: 2,
            explanation:
              'This is cash buyers have paid for units not yet delivered — a leading indicator of future revenue, provided the project clears its legal steps and is handed over on time.',
          },
          {
            prompt: 'A developer capitalises most of its interest into project costs. How does this affect your analysis?',
            options: [
              'It makes no difference because the interest is waived',
              'Interest expense on the income statement is low, so interest cover looks safer than it is; the interest reaches cost of sales at handover',
              'This year’s gross profit will be lower',
              'The borrowings are removed from the balance sheet',
            ],
            correct_index: 1,
            explanation:
              'Capitalised interest sits in inventory rather than in this period’s finance costs. Check interest actually paid in the cash flow statement and the borrowing-costs note to see the true interest burden.',
          },
          {
            prompt: 'Why is P/B often unreliable for valuing a property developer?',
            options: [
              'Because developers have no equity',
              'Because the land bank is carried at historical cost, which can differ greatly from market value; a project-by-project RNAV is needed',
              'Because property share prices never change',
              'Because P/B only applies to banks',
            ],
            correct_index: 1,
            explanation:
              'Book value reflects the historical cost of land. RNAV estimates the present value of each project’s cash flows minus net debt, although the result is highly sensitive to price and legal-timing assumptions.',
          },
        ],
      },
      {
        slug: 'securities-firm-statements',
        title: 'Securities firms: brokerage, margin lending and proprietary trading',
        summary:
          'Where a broker’s income comes from, why its profit tracks market turnover, why mark-to-market (FVTPL) gains reverse easily, and why operating cash flow is usually negative.',
        content_md: `## How does a securities firm make money?

A Vietnamese securities firm prepares its income statement in an industry-specific format that splits income by **business line** rather than sales and cost of goods sold:

| Business line | Line on the statements | Driven by |
|---|---|---|
| **Brokerage** | Brokerage fee income | Market trading value and market share |
| **Margin lending** | Interest from loans and receivables | Margin loan balance and lending rate |
| **Proprietary trading** | Gains on financial assets at fair value through profit or loss (FVTPL), held-to-maturity (HTM) investments, available-for-sale (AFS) assets | Share and bond prices, deposit rates |
| **Investment banking (IB)** | Underwriting and issuance agency; financial advisory | Activity in the capital markets |

The three main buckets of financial assets:

- **FVTPL**: remeasured at market value every period, with the difference going **straight into profit** — even if nothing has been sold.
- **HTM**: typically term deposits and certificates of deposit; steady income.
- **AFS**: also remeasured, but the difference goes to **other comprehensive income** in equity and only reaches profit when the asset is sold.

## Profit follows market turnover

Brokerage and margin lending both expand and contract with market **trading value**: when turnover halves, brokerage fees fall with it and investors borrow less. Take **SSI**:

| Year | Revenue | Net profit | Short-term borrowings (year-end) | Interest expense |
|---|---|---|---|---|
| 2021 | 7,443 | 2,695 | 31,121 | 1,030 |
| 2022 | 6,336 | 1,698 | 27,892 | 1,031 |
| 2023 | 7,158 | 2,294 | 43,169 | 1,570 |
| 2024 | 8,529 | 2,845 | 45,502 | 1,506 |
| 2025 | 12,931 | 4,107 | 60,161 | 2,562 |

*VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.*

In 2022 the market fell sharply and SSI's profit dropped about **37%**; by 2025, with liquidity back, profit reached **VND 4,107 billion**. Brokers are **cyclical with the market**: buying a broker because "this year's profit is a record" often means buying at the top of the liquidity cycle.

## Margin loans are funded by short-term borrowing

Margin lending is a credit business: the broker borrows (mostly short-term bank loans and short-term paper) and lends to investors at a higher rate. At the end of 2025 SSI had short-term borrowings of **VND 60,161 billion** against total assets of **VND 94,050 billion** and equity of **VND 32,066 billion** — assets of about 2.9x equity. The margin loan book is capped relative to equity by the State Securities Commission's rules, so a broker that wants to grow margin lending has to **raise capital**.

Risks to watch:

- **The interest spread**: interest expense rose from 1,506 billion (2024) to 2,562 billion (2025) along with the borrowing. If funding costs rise faster than margin rates, the spread is squeezed.
- **Loan quality**: in a sharp sell-off, collateral loses value fast; if forced selling cannot keep up, the broker has to **provision** against margin loans.

## FVTPL gains: marked to market

Because FVTPL assets are remeasured every period, a strong quarter for the market can produce **large unrealised trading gains**, and a weak quarter can **turn them into losses**. When reading:

1. Split FVTPL gains into **realised gains on disposal** and **revaluation differences** (the notes give the detail).
2. Check **what the FVTPL book holds**: certificates of deposit and bonds (stable) or listed shares (volatile).
3. Don't extrapolate one quarter of exceptional trading gains into long-term earning power.

## Why operating cash flow is usually negative

For a broker, **disbursing margin loans** and **buying financial assets** for the proprietary book are both operating activities. When the firm grows, operating cash flow goes negative and borrowing shows up as **positive financing cash flow** — SSI's financing cash flow was **+VND 15,973 billion** in 2025. That is a feature of the business model, not a red flag in itself. The right questions are whether the extra assets (margin loans, bonds, shares) are of good quality and whether the funding is stable.

## Practice

Take the latest annual statements of a listed securities firm. (1) Work out the shares of brokerage fees, margin interest and FVTPL gains in total operating income. (2) Divide the margin loan balance by equity. (3) In the FVTPL note, find how much is listed shares versus bonds and certificates of deposit. If market turnover fell 40%, which business line would be hit hardest?`,
        questions: [
          {
            prompt: 'Average market trading value halves. Which income lines of a securities firm are hit most directly?',
            options: ['Interest on HTM deposits', 'Brokerage fees and margin lending interest', 'Office rental income', 'Foreign exchange differences'],
            correct_index: 1,
            explanation:
              'Brokerage fees are proportional to trading value, and in a quiet market investors also borrow less on margin. That is why SSI’s profit fell about 37% in 2022.',
          },
          {
            prompt: 'A securities firm reports an exceptional FVTPL trading gain this quarter. What should make you cautious?',
            options: [
              'FVTPL gains are always cash already received',
              'FVTPL gains can include unrealised revaluation that may reverse when the market falls',
              'FVTPL gains are excluded from profit',
              'FVTPL gains only come from bank deposits',
            ],
            correct_index: 1,
            explanation:
              'FVTPL assets are marked to market every period and the difference goes straight to profit, so one quarter’s gain can become the next quarter’s loss. Separate realised and revaluation gains using the notes.',
          },
          {
            prompt: 'A broker is profitable but shows large negative operating cash flow and large positive financing cash flow. What is the most reasonable reading?',
            options: [
              'The firm is definitely faking its profits',
              'It is expanding margin lending and its financial asset book (classified as operating), funded by borrowing',
              'It has repaid all its borrowings',
              'It has stopped its brokerage business',
            ],
            correct_index: 1,
            explanation:
              'Margin disbursements and purchases of financial assets are operating activities for a broker, so CFO turns negative as it grows. What to check is the quality of the new assets and how stable the funding is.',
          },
          {
            prompt: 'To grow its margin loan book substantially, what does a securities firm usually have to do?',
            options: [
              'Cut brokerage fees to zero',
              'Raise equity (because margin lending is capped relative to equity) and increase short-term borrowing',
              'Sell its entire HTM portfolio',
              'Stop paying interest on its loans',
            ],
            correct_index: 1,
            explanation:
              'Regulation caps the margin book relative to equity, and most of the funding comes from short-term borrowing. That is why capital raises tend to come before a margin expansion phase.',
          },
        ],
      },
      {
        slug: 'insurer-statements',
        title: 'Insurers: premiums, claims, technical reserves and the float',
        summary:
          'How to read an insurer’s results and the combined ratio, why an insurer can lose money on underwriting yet still profit from investments, and how life and non-life differ.',
        content_md: `## The model: collect now, pay later

An insurer collects **premiums** when it sells a policy but pays **claims** (or policy benefits) only when the insured event happens — months, years or, for life insurance, decades later. That gap creates a pool of money known as the **float**, which the insurer invests. Profit therefore has two sources:

1. **The underwriting result**: premiums minus claims, commissions, acquisition costs and reserve charges.
2. **Investment income** on the float: interest on deposits and bonds, dividends, gains on securities.

## Reading an insurer's income statement

| Line | Meaning |
|---|---|
| Gross written premiums | Premiums on direct policies |
| − Reinsurance premiums ceded | Risk passed on to reinsurers |
| = **Net insurance revenue** | |
| − Claims and policy benefits paid | |
| − **Increase in technical reserves** | Amounts set aside for future obligations to policyholders |
| − Commissions and acquisition costs | |
| = **Gross profit from insurance business** | The underwriting result |
| + Financial (investment) income | |

## The combined ratio

For non-life insurance the central metric is the **combined ratio**:

> Combined ratio = Loss ratio (claims / net premiums) + Expense ratio (acquisition and admin costs / net premiums)

- **Below 100%**: underwriting makes a profit before any investment income.
- **Above 100%**: underwriting loses money, and the insurer relies on investments to make a profit.

The loss ratio can jump in a year of major natural disasters (such as Typhoon Yagi in northern Vietnam in 2024) or when an insurer cuts prices to win market share. Compare the combined ratio over several years and against peers, line by line (motor, health, property…) where the notes allow.

## Bao Viet (BVH): underwriting losses, investment profits

| Year | Net insurance revenue | Gross profit from insurance | Total assets | Equity |
|---|---|---|---|---|
| 2021 | 36,830 | 614 | 169,505 | 22,031 |
| 2022 | 40,688 | 105 | 201,664 | 21,271 |
| 2023 | 40,085 | −2,532 | 221,160 | 22,280 |
| 2024 | 39,823 | −969 | 251,286 | 23,566 |
| 2025 | 40,948 | 1,238 | 291,806 | 25,480 |

*VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.*

On roughly VND 40,000 billion of net insurance revenue, the underwriting result hovers around zero and was **negative** in 2023–2024. Yet BVH stayed profitable, with ROE of about **13.3%** (TTM to Q2 2026), because most of its profit comes from **investing the float**. Its investing cash flow is deeply negative almost every year (−24,150 billion in 2025): premiums keep flowing in and keep being put to work in deposits, bonds and shares.

An important nuance: in **life insurance** (a large part of BVH), a negative underwriting result is partly **by design** — the savings portion of premiums goes into reserves (booked as an expense), while the investment income earned on those reserves appears further down, in financial income. You must read **both halves** together.

## The balance sheet: the "debt" is mostly technical reserves

BVH's total assets in 2025 were about **11.5 times** its equity. But most of its liabilities are not bank loans — they are **technical reserves**, estimates of future obligations to policyholders (unearned premium reserves, claims reserves and, for life business, mathematical reserves). The risks lie in two places:

- **Are reserves adequate?** Under-reserving inflates today's profit and gets paid for later.
- **Is the investment portfolio sound?** A defaulted corporate bond or a slump in share prices eats straight into a thin equity base.

## Life versus non-life

| | Life | Non-life |
|---|---|---|
| Policy term | Long (10–20 years or more) | Short (usually one year) |
| Reserves | Very large and growing | Smaller, turning over quickly |
| Key metrics | New business premiums, persistency, investment spread | Combined ratio |
| Sensitive to | Long-term **interest rates** | Natural disasters, repair and medical cost inflation |

When **interest rates fall**, a life insurer earns lower yields when it reinvests and may also have to add reserves because of the returns it has promised policyholders — its margin gets squeezed from both sides.

## Practice

Using the latest annual statements of a listed non-life insurer: (1) compute the loss ratio = net retained claims / net premium revenue; (2) compute the expense ratio and add them to get the combined ratio; (3) compare the underwriting result with financial income. Does this insurer make its money mainly from underwriting or from investing?`,
        questions: [
          {
            prompt: 'A non-life insurer has a combined ratio of 103%. What does that mean?',
            options: [
              'It certainly made a net loss for the year',
              'Underwriting lost about 3% of net premiums before investment income',
              'Its profit equals 103% of revenue',
              'It ceded 103% of premiums to reinsurers',
            ],
            correct_index: 1,
            explanation:
              'A combined ratio above 100% means claims plus expenses exceeded net premiums. The insurer can still make a net profit if investment income on the float covers the gap.',
          },
          {
            prompt: 'How could Bao Viet post negative underwriting results in 2023–2024 and still be profitable?',
            options: [
              'By selling an office building every year',
              'Through investment income on the float and the reserves',
              'Because insurers pay no tax',
              'Because underwriting losses are not reported',
            ],
            correct_index: 1,
            explanation:
              'Premiums collected in advance are invested in deposits, bonds and shares. In life insurance, reserve charges are booked as underwriting expenses while the investment income on them sits in financial income — read both.',
          },
          {
            prompt: 'An insurer’s liabilities are more than 10 times its equity. What is the main risk to assess?',
            options: [
              'Its ability to pay interest on bank loans',
              'Whether technical reserves are adequate and whether the investment portfolio is sound',
              'The size of its sales force',
              'Inventory as a share of total assets',
            ],
            correct_index: 1,
            explanation:
              'Most of the liabilities are technical reserves — obligations to policyholders, not borrowings. Under-reserving inflates profit, and losses on investments hit a thin equity base directly.',
          },
          {
            prompt: 'How does a prolonged fall in interest rates affect a life insurer?',
            options: [
              'It is purely positive because borrowing costs fall',
              'No effect, because life policies are fixed',
              'Lower reinvestment yields, and possibly extra reserves for guaranteed returns, squeeze its margin',
              'The combined ratio automatically drops below 100%',
            ],
            correct_index: 2,
            explanation:
              'A life insurer earns the spread between its investment yield and the returns it has promised. Falling rates cut the yield on new investments while the old obligations remain.',
          },
        ],
      },
      {
        slug: 'cyclical-manufacturer-statements',
        title: 'Manufacturing and cyclicals: lessons from steel',
        summary:
          'Gross margins that swing with input and output prices, inventory risk, capex cycles and depreciation, working capital, and why a low P/E at the peak of the cycle is a trap — illustrated with HPG.',
        content_md: `## What is a cyclical business?

A **cyclical** company sells products whose prices are set by the market — steel, fertiliser, chemicals, cement, rubber — and buys commodity inputs too (iron ore, coal, gas, power). Its profit does not grow in a straight line; it follows the **spread between selling prices and input costs**, which rises and falls with the economy, construction activity and the global cycle.

## The gross margin tells the story — Hoa Phat (HPG)

| Year | Revenue | Gross profit | Gross margin | Net profit | Inventory | Capex | Operating cash flow |
|---|---|---|---|---|---|---|---|
| 2021 | 149,680 | 41,108 | 27.5% | 34,521 | 42,134 | 11,621 | 26,721 |
| 2022 | 141,409 | 16,763 | 11.9% | 8,444 | 34,491 | 17,888 | 12,278 |
| 2023 | 118,953 | 12,938 | 10.9% | 6,800 | 34,504 | 17,374 | 8,643 |
| 2024 | 138,855 | 18,498 | 13.3% | 12,020 | 46,091 | 35,495 | 6,608 |
| 2025 | 156,116 | 24,498 | 15.7% | 15,515 | 52,828 | 25,748 | 17,366 |

*VND billion. Data: consolidated annual statements, compiled from public data (Vietcap), rounded.*

From 2021 to 2022 revenue fell only about **5.5%**, but gross profit fell almost **60%** and net profit more than **75%**. Why? Steel prices dropped while input costs (bought at high prices) had not yet come down — the **price spread** narrowed. By 2023 net profit was just **VND 6,800 billion**, roughly **one fifth** of the 2021 peak. This is **operating leverage** (fixed costs such as depreciation and labour) combined with **financial leverage** (interest): together these fixed costs turn a small change in revenue and margin into a very large swing in profit.

## Inventory: an asset and a risk

A steelmaker holds months of raw materials and finished goods. At the end of 2025 HPG's inventory reached **VND 52,828 billion**; with cost of sales of about 131,600 billion, that is roughly **147 days** of inventory (days inventory = inventory / cost of sales × 365). Two risks:

- **Write-downs**: if steel prices fall hard, net realisable value can drop below cost, forcing an **inventory write-down** charged to cost of sales. Stockpiling expensive raw materials just before prices fall is the fastest way to crush a gross margin.
- **Cash tied up**: rising inventory absorbs cash and is usually financed with **short-term borrowing**. HPG's short-term debt grew from 43,748 billion (2021) to **64,695 billion** (2025).

The reverse also holds: when output prices are rising, cheap inventory bought earlier inflates the gross margin — part of peak-cycle profit comes from this effect and **will not repeat**.

## Capex cycles and depreciation

Cyclicals tend to add capacity in big waves. In 2024 HPG's capex reached **VND 35,495 billion** (while building the Dung Quat 2 complex), against operating cash flow of only **6,608 billion** — **free cash flow** (see **The cash flow statement**) of roughly **−29,000 billion**, covered by borrowing: long-term debt rose from 10,399 billion to **27,080 billion**.

Read capex in three stages:

1. **Construction**: the assets sit in construction in progress and are not yet depreciated; interest on project loans may be capitalised. Profit does not yet reflect the full cost.
2. **Start of operations**: depreciation and interest start hitting the income statement. HPG's depreciation rose from 6,916 billion (2024) to **8,471 billion** (2025).
3. **Real returns** only arrive if the new capacity runs at high utilisation with a decent spread. If a project comes on stream just as the cycle turns down, depreciation and interest weigh heavily on profit.

## The low-P/E trap at the peak

In **Combining ratios and common pitfalls** we saw that a low P/E is not automatically cheap. For cyclicals the point is sharper: **at the peak of the cycle, earnings (E) are abnormally high, so the P/E looks very low** — exactly when risk is greatest. When the cycle turns, E falls 70–80% and yesterday's "cheap" P/E becomes expensive. Conversely, at the bottom of the cycle, depressed earnings push the P/E up, yet that is often the less risky point to be looking.

A more careful approach to cyclicals:

- Use **average earnings across the cycle** (say five to seven years) rather than the latest year.
- Combine **P/B** with average through-cycle ROE.
- Track the leading indicators: selling prices, raw material prices, industry inventories, construction demand.

## Practice

Using the HPG table above: (1) Calculate average net profit over 2021–2025. (2) Suppose one investor in 2021 valued the company on net profit of 34,521 billion and another used the five-year average — at the same market capitalisation, how many times lower is the first investor's P/E? (3) Calculate free cash flow (operating cash flow − capex) for each year and note in which year the company relied most on borrowing.`,
        questions: [
          {
            prompt: 'Why is buying a cyclical stock at a very low P/E during record profits often a trap?',
            options: [
              'Because P/E does not apply to manufacturers',
              'Because earnings are at the cyclical peak; when the price spread narrows, profit falls sharply and the real P/E rises',
              'Because cyclical companies never pay dividends',
              'Because a low P/E always means the company is about to go bankrupt',
            ],
            correct_index: 1,
            explanation:
              'A low P/E at the peak reflects abnormally high E. HPG is a case in point: net profit fell from 34,521 billion (2021) to 6,800 billion (2023) — about one fifth. Use average earnings across the cycle.',
          },
          {
            prompt: 'HPG’s revenue fell only about 5.5% in 2022, but gross profit fell almost 60%. What was the main cause?',
            options: [
              'Its headcount doubled',
              'The spread between steel prices and input costs narrowed, amplified by large fixed costs',
              'It changed its tax method',
              'Its inventory doubled',
            ],
            correct_index: 1,
            explanation:
              'Gross margin fell from 27.5% to 11.9% because output prices fell faster than input costs. With high fixed costs, a shrinking margin cuts profit far more than revenue.',
          },
          {
            prompt: 'A steelmaker builds up inventory sharply just before steel prices may fall. What is the biggest risk?',
            options: [
              'Inventory write-downs, a lower gross margin, and cash locked in stock financed by short-term debt',
              'Revenue is certain to rise',
              'Depreciation rises immediately',
              'There is no risk because inventory is an asset',
            ],
            correct_index: 0,
            explanation:
              'When net realisable value falls below cost, the company must write inventory down through cost of sales. Large inventories also absorb cash and usually come with higher short-term borrowing.',
          },
          {
            prompt: 'A manufacturer is in a record capex year with deeply negative free cash flow. What is most reasonable to expect in the following years?',
            options: [
              'Profit will certainly double next year',
              'Depreciation and interest expense will rise once the project runs; profit only improves if the new capacity is well utilised at a decent spread',
              'Depreciation will fall because the assets are new',
              'The debt will be written off automatically when the project is completed',
            ],
            correct_index: 1,
            explanation:
              'New assets start depreciating once in use (HPG’s depreciation rose to 8,471 billion in 2025) and interest is no longer capitalised. The payoff depends on where the cycle is when the project is completed.',
          },
        ],
      },
      {
        slug: 'retail-consumer-statements',
        title: 'Retail and consumer: same-store sales, inventory turnover and negative working capital',
        summary:
          'Split a retailer’s growth into existing and new stores, read inventory days, store economics, negative working capital and rent commitments — and contrast it with an asset-light services business such as FPT.',
        content_md: `## Where does the growth come from?

A retail chain's revenue can grow for two very different reasons:

1. **Same-store sales growth (SSSG)**: how much revenue at stores **open for at least a year** grew versus the same period last year. This is the true health check of the format.
2. **New stores**: revenue rises because there are more outlets — this takes capital, and each new store needs time to reach mature sales.

An **illustrative** example (hypothetical figures) for Chain Y:

| | Year N−1 | Year N |
|---|---|---|
| Stores at year-end | 1,000 | 1,200 |
| Revenue (VND billion) | 20,000 | 23,000 |
| Revenue growth | | +15% |
| SSSG (as reported) | | −2% |

Revenue up 15% looks good, but **existing stores sold 2% less** — all the growth came from openings. If the chain stopped opening stores, revenue would go backwards. SSSG usually is not in the financial statements but in the annual report or investor presentations; if the company does not disclose it, **average revenue per store** gives a rough proxy.

## Store economics

The key question in retail: **does the gross margin cover the cost of running each store?**

| Per 100 dong of revenue (illustrative) | |
|---|---|
| Gross margin | 22 |
| Store rent | 6 |
| Staff costs | 7 |
| Utilities, logistics, depreciation, other | 5 |
| = Operating profit | **4** |

Margins are thin and most costs are **fixed** (rent, wages). On the figures above, a 10% fall in same-store sales can more than halve store profit, and a fall of about 18% wipes it out — **operating leverage** much like the cyclicals in the previous lesson, but driven by rent and staff rather than plant.

## Inventory turnover and negative working capital

Retail lives on **fast stock turns**. The **Financial health** lesson used the current and quick ratios; for a retailer you need to go further and think in **days**: inventory days = inventory / cost of sales × 365, payable days = trade payables / cost of sales × 365, receivable days = receivables / revenue × 365. Put together, they give the **cash conversion cycle**:

> Cash conversion cycle = Inventory days + Receivable days − Payable days

Illustrative figures for Chain Y in year N: cost of sales 17,940 billion, inventory 3,000 billion (≈ **61 days**), receivables close to zero (customers pay on the spot), payables to suppliers 3,700 billion (≈ **75 days**) → a cash conversion cycle of about **−14 days**.

A negative cycle means **suppliers are financing the inventory**: the chain sells the goods and collects the cash before it has to pay for them. That is a big advantage while the chain is growing — the bigger it gets, the more "free" funding it has. But there is a flip side:

- When sales stall or suppliers shorten payment terms, payables shrink and **cash drains out very quickly**.
- **Rising inventory days** are an early sign of slow-moving stock that may need markdowns and write-downs.
- A current ratio below 1 at a retailer is not necessarily bad — look at the working-capital structure first.

## Rent and lease obligations

Under Vietnamese accounting standards, rent on **operating leases** is charged straight to selling expenses; it is **not** recognised as a right-of-use asset and a lease liability on the balance sheet as it would be under IFRS 16. The consequences:

- A Vietnamese retailer's balance sheet looks "lighter" on debt than a comparable chain reporting under IFRS.
- Read the note on **operating lease commitments** — the minimum future rent payable is a debt-like obligation that cannot easily be cancelled when a store underperforms.

## Contrast: an asset-light services business (FPT)

Not every business revolves around inventory like a retailer. **FPT** — mainly technology services — has a very different structure. In 2025: revenue of **VND 70,113 billion**, a gross margin of about **37%**, inventory of only **2,194 billion**, but trade receivables of **12,735 billion** (≈ **66 days** of revenue). Operating cash flow was **10,136 billion** against net profit of **11,232 billion**; ROE was about **26.5%** (TTM to Q2 2026).

| | Retailer (illustrative) | IT services (FPT) |
|---|---|---|
| Main working-capital asset | Inventory | Trade receivables |
| Gross margin | Low (~20%) | High (~35–39%) |
| Working-capital funding | Suppliers (payables) | Own funds, short-term debt |
| Metrics to watch | SSSG, inventory days, cash conversion cycle | Receivable days, new contract wins, operating cash flow / net profit |

*FPT data: consolidated annual statements, compiled from public data (Vietcap), rounded. Chain Y figures are illustrative.*

## Practice

Pick a listed retail chain. (1) Find the year-end store count and calculate average revenue per store over three years. (2) Calculate inventory days, payable days and the cash conversion cycle. (3) Read the operating lease commitments note and compare total lease obligations with equity. Is this chain's growth coming mainly from existing stores or from new ones?`,
        questions: [
          {
            prompt: 'A retail chain’s revenue grew 20% but same-store sales growth (SSSG) was −3%. What does this tell you?',
            options: [
              'The format is very healthy because revenue grew strongly',
              'Growth came from new stores while existing stores are selling less',
              'The chain closed some stores',
              'The gross margin must have risen',
            ],
            correct_index: 1,
            explanation:
              'Negative SSSG means existing stores sold less than a year earlier. Total revenue only grew because of new outlets — which cost capital and will stall if expansion stops.',
          },
          {
            prompt: 'A retail chain has a negative cash conversion cycle. What are the strength and the risk of this structure?',
            options: [
              'It means nothing because retailers hold no inventory',
              'Suppliers are financing the inventory; but if growth stalls or suppliers shorten terms, cash drains out quickly',
              'The company is certainly insolvent',
              'The company gives customers too much credit',
            ],
            correct_index: 1,
            explanation:
              'A negative cycle means the chain collects cash from sales before paying suppliers. It is free funding during expansion but reverses fast when sales or payment terms change.',
          },
          {
            prompt: 'Under Vietnamese accounting standards, how is store rent on operating leases usually presented?',
            options: [
              'As a lease liability and right-of-use asset on the balance sheet, as under IFRS 16',
              'As an expense in the period; future lease obligations appear only in the operating lease commitments note',
              'It is not recorded anywhere',
              'As a direct deduction from equity',
            ],
            correct_index: 1,
            explanation:
              'Under VAS, operating lease rent is a period expense and there is no lease liability on the balance sheet. When comparing with an IFRS 16 reporter, add back the lease obligations from the notes for a fair comparison.',
          },
          {
            prompt: 'For a technology services company like FPT, which working-capital item deserves closer attention than inventory?',
            options: [
              'Trade payables to suppliers',
              'Trade receivables (days to collect) and operating cash flow relative to profit',
              'Finished goods in the warehouse',
              'Retail store rent',
            ],
            correct_index: 1,
            explanation:
              'An asset-light services business holds little inventory (FPT: 2,194 billion) but large receivables (12,735 billion, about 66 days of 2025 revenue). If receivables grow faster than revenue, operating cash flow falls behind profit.',
          },
        ],
      },
    ],
  },
]
