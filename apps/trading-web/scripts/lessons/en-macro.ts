import type { SeedChapter } from './types'

// Macroeconomics and the business cycle (en) — 6 lessons, same order as vi-macro.ts (lesson i translates lesson i).
// No current rate, CPI or GDP levels: every number in the worked examples is ILLUSTRATIVE (labelled in the text).
// Institutional facts (SBV tools, 8 FOMC meetings/year, PMI construction, statistics office release calendar) are sourced at the end of each lesson.
export const EN_MACRO: SeedChapter[] = [
  {
    slug: 'macro-and-business-cycle',
    title: 'Macroeconomics and the business cycle',
    description:
      'How interest rates, inflation, exchange rates, growth and the business cycle move the stock market — and how to fold macro into an investment process without becoming a headline gambler.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'interest-rates-and-monetary-policy',
        title: 'Interest rates and monetary policy',
        summary:
          "The State Bank of Vietnam's policy tools, spillovers from the Fed, and why interest rates act as the gravity of stock valuation.",
        content_md: `## Why should stock investors care about interest rates?

An interest rate is the **price of money**. It sets companies' borrowing costs, households' ability to buy homes and — most importantly for investors — the **minimum return** you demand from stocks instead of leaving money in a savings account. When rates change, almost every asset has to be **repriced**.

## What tools does the State Bank of Vietnam (SBV) use?

Under the Law on the SBV, the Governor decides on the use of monetary policy instruments including **refinancing, interest rates, the exchange rate, reserve requirements, open market operations** and other tools.

| Tool | How it works | Signal to the market |
|---|---|---|
| **Refinancing rate** | Rate at which the SBV lends to banks against collateral for short-term funding | A key policy rate that anchors the general rate environment |
| **Rediscount rate** | Rate applied when the SBV rediscounts banks' commercial paper and other valuable papers | Usually below the refinancing rate, moves in the same direction |
| **Open market operations (OMO)** | The SBV **buys papers under repo** to inject cash, or **issues SBV bills** to absorb it | Watched daily: net injection or net withdrawal |
| **Reserve requirement** | Share of deposits banks must keep at the SBV | A lower ratio frees up more money for lending |
| **Credit growth quotas** ("credit room") | The SBV assigns each bank a cap on loan growth | Vietnam-specific: wider or tighter room directly hits bank earnings |

A key difference from many countries is that the SBV uses both **price tools** (rates) and **quantity tools** (credit room). So when you read the news, don't look only at the policy rate — also watch credit growth and interbank liquidity. The SBV is studying a roadmap to phase out credit-room allocation, so check which mechanism applies when you read this.

## The Fed and its spillovers

The US Federal Reserve (**the Fed**) sets rates through the Federal Open Market Committee (**FOMC**), which holds **eight regularly scheduled meetings a year** (roughly every six weeks) and can meet unscheduled when needed. The Fed reaches Vietnam through several channels:

- **USD/VND:** higher dollar rates make the dollar more attractive and pressure the dong. The SBV then has to balance keeping rates low for growth against keeping the currency stable.
- **Foreign flows:** a narrower rate gap can push foreign investors to net-sell Vietnamese stocks.
- **Global sentiment:** Fed decisions move global markets, and that mood spills into the VN-Index.

## Rates and valuation: earnings yield vs the deposit rate

A simple way to see the effect is the inverse of P/E — the **earnings yield** = EPS / Price = 1 / P/E.

*Illustrative example (made-up numbers, not actual data):*

| Scenario | Market P/E | Earnings yield | 12-month deposit rate | Gap |
|---|---|---|---|---|
| A | 12 | 8.3% | 5% | +3.3 pts |
| B | 12 | 8.3% | 8% | +0.3 pts |
| C | 10 | 10% | 8% | +2 pts |

In scenario B, stocks pay only 0.3 points more than a near risk-free deposit — too thin a premium, so the pressure is for prices to fall (P/E dropping to C) until the risk premium looks reasonable again. This is also the logic of DCF: **higher rates → higher discount rate → lower present value of future cash flows**, especially for growth stocks whose cash flows lie far in the future.

## Which sectors are rate-sensitive?

As the **Reading financial statements by sector** chapter showed:

- **Banks:** rates and credit room drive loan growth, NIM and bad debt. A fast rate cut usually lowers funding costs first, but can also squeeze NIM if lending rates fall faster.
- **Real estate:** developers borrow heavily and buyers rely on mortgages — high rates slow sales and raise capitalised interest.
- **Securities firms:** market liquidity and margin balances tend to rise when money is cheap, so brokerage and margin earnings follow the rate cycle.
- **Highly leveraged companies (steel, utilities...):** interest expense eats directly into profit.

## Practice

1. On the SBV website (sbv.gov.vn), find the policy rates currently in force and the date of the latest decision. Note them for later lessons.
2. Compute the VN-Index earnings yield from a P/E you look up and compare it with a large bank's 12-month deposit rate. Is the gap wide or narrow?
3. Find this year's FOMC meeting calendar on federalreserve.gov and add it to your calendar.

## Sources

- Fed — FOMC calendar and FAQ: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm — https://www.federalreserve.gov/faqs/about_12844.htm
- Law on the State Bank of Vietnam 2010, Chapter III (Articles 10–15: monetary policy tools, Vietnamese): https://hethongphapluat.com/luat-ngan-hang-nha-nuoc-viet-nam-2010/chuong-3
- State Bank of Vietnam: https://www.sbv.gov.vn`,
        questions: [
          {
            prompt: 'When the SBV issues bills through open market operations, what is the main purpose?',
            options: [
              'To absorb money from the banking system',
              'To inject money into cash-strapped banks',
              'To grant banks more credit room',
              'To raise the value of the dong against gold',
            ],
            correct_index: 0,
            explanation:
              'Issuing bills means the SBV "sells" paper and takes cash back, i.e. it absorbs liquidity. Buying paper under repo does the opposite. Credit room is a separate tool, unrelated to OMO.',
          },
          {
            prompt:
              'Illustrative example: the market P/E is 12 and the 12-month deposit rate rises from 5% to 8%. Which reading is most reasonable?',
            options: [
              'Stocks become more attractive because high rates mean a strong economy',
              "Stocks' premium over deposits shrinks from about 3.3 to 0.3 points, putting pressure on P/E",
              'No effect, because P/E depends only on company earnings',
              'The earnings yield automatically rises to 11%',
            ],
            correct_index: 1,
            explanation:
              'Earnings yield = 1/12 ≈ 8.3%. Against 5% the premium is ~3.3 points; against 8% only ~0.3 points. Such a thin premium makes investors demand lower prices, so P/E comes under pressure.',
          },
          {
            prompt: 'How many regularly scheduled meetings does the FOMC hold each year?',
            options: ['4', '12', '8, plus unscheduled meetings if needed', 'Only during a crisis'],
            correct_index: 2,
            explanation:
              'According to the Fed, the FOMC holds eight regularly scheduled meetings a year (about every six weeks) and may hold unscheduled meetings when needed.',
          },
          {
            prompt: 'Why can a sharp rise in US dollar rates weigh on the Vietnamese stock market?',
            options: [
              "Because the Fed directly sets the SBV's refinancing rate",
              'Because Vietnamese companies are required to borrow in dollars',
              'Because HOSE trades in dollars',
              'Because it pressures USD/VND and can trigger foreign net selling',
            ],
            correct_index: 3,
            explanation:
              'The Fed does not run the SBV, but higher dollar rates make the dollar more attractive, pressuring the currency and foreign flows — the two main spillover channels to the VN-Index.',
          },
        ],
      },
      {
        slug: 'inflation-and-exchange-rates',
        title: 'Inflation and exchange rates',
        summary:
          'CPI, real vs nominal rates, USD/VND and the DXY, how the SBV manages the currency, and who wins and who loses when the exchange rate moves.',
        content_md: `## What is inflation and how is it measured?

**Inflation** is the rate at which the general price level rises. In Vietnam the most common gauge is the **consumer price index (CPI)**, published monthly by the National Statistics Office (formerly the General Statistics Office, placed under the Ministry of Finance from 1 March 2025). Since August 2024, CPI and the socio-economic report are published on the **6th of the following month**.

When reading CPI, distinguish:

- **Month-on-month (MoM):** sensitive and noisy because of seasonality (Tet, fuel prices, school fees...).
- **Year-on-year (YoY):** the figure usually compared with the National Assembly's inflation target.
- **Year-to-date average:** used to judge the full-year target.
- **Core inflation:** excludes food staples, fresh food, energy and state-administered prices (including healthcare and education services) — a better read of the underlying trend.

## Nominal vs real interest rates

**Real rate ≈ nominal rate − inflation.** This is what actually decides whether your money grows stronger or weaker.

*Illustrative example (made-up numbers):*

| | Deposit rate | Inflation | Real rate |
|---|---|---|---|
| Scenario 1 | 6% | 3% | about +3% |
| Scenario 2 | 6% | 7% | about −1% |

In scenario 2, saving actually **loses purchasing power**. Negative real rates tend to push money into other assets (gold, property, stocks) — but they also give the central bank a reason to **raise rates**.

## Why does rising inflation usually pressure P/E?

1. **Rates tend to follow** to fight inflation → higher discount rate → lower fair P/E (see the previous lesson).
2. **Margins get squeezed** if companies cannot pass higher input and wage costs on to prices quickly.
3. **Earnings quality worsens:** nominal profit rises mostly because of prices, not volume, and working-capital needs grow.
4. **Higher uncertainty** → investors demand a bigger risk premium.

Conversely, companies with **pricing power** (strong brands, dominant positions) withstand inflation better.

## USD/VND and the DXY

- **USD/VND** is how many dong buy one dollar. A rising number = a weaker dong.
- The **DXY** measures the dollar against a basket of major currencies (the euro has the largest weight). A strongly rising DXY usually pressures most emerging-market currencies, the dong included.

**How does the SBV manage the rate?** The SBV publishes a **central exchange rate** every day; commercial banks may trade within a **±5% band** around it (widened from ±3% to ±5% in October 2022). Under heavy pressure, the SBV can sell foreign currency from reserves, adjust rates or drain dong liquidity to support the currency — which is why the exchange rate and domestic rates are tightly linked.

## Who wins and who loses when the dong weakens?

| Type of company | Typical effect |
|---|---|
| **Exporters** (textiles, seafood, wood) with USD revenue and VND costs | Usually benefit: converted revenue rises |
| **Importers of inputs** (steel using imported ore/coal, plastics, pharma, animal feed) | Input costs rise, margins squeezed |
| **Companies with foreign-currency debt** (power, airlines, some large groups) | FX losses on revaluing debt, higher repayment cost |
| **Domestic sellers with VND costs** | Little direct effect, but hit indirectly via inflation and rates |

In practice, many firms both export and import (processing), so the net effect is smaller than you might think. Check the **notes to the financial statements** — FX risk and debt by currency — instead of guessing.

## Practice

1. Open the latest CPI report on nso.gov.vn and note: CPI YoY, the year-to-date average and core inflation.
2. Take a large bank's 12-month deposit rate and subtract CPI YoY: is the real rate positive or negative?
3. Pick one exporter and one company with large dollar debt. In the notes to their financial statements, find last year's FX gain or loss.

## Sources

- National Statistics Office — change in CPI/GDP release timing (Vietnamese): https://www.nso.gov.vn/su-kien/2024/06/thay-doi-thoi-gian-cong-bo-so-lieu-cpi-gdp-grdp/
- ±5% exchange-rate band (Tuoi Tre News, Oct 2022): https://news.tuoitre.vn/vietnams-central-bank-widens-usd-vnd-exchange-rate-band-to-5-percent-10369617.htm
- Daily central rate: https://www.sbv.gov.vn`,
        questions: [
          {
            prompt: 'Deposit rate 6% a year, inflation 7% a year (illustrative). What is the real rate, roughly?',
            options: ['+13%', '−1%', '+1%', '+6%, since inflation has nothing to do with deposits'],
            correct_index: 1,
            explanation: 'Real rate ≈ nominal − inflation = 6% − 7% = −1%. Savers are losing purchasing power.',
          },
          {
            prompt: 'When the dong weakens sharply against the dollar, which group is usually hurt most directly?',
            options: [
              'A seafood exporter earning mainly in dollars',
              'A retailer selling only domestic goods',
              'A company with large dollar debt and revenue in dong',
              'People holding dollar deposits',
            ],
            correct_index: 2,
            explanation:
              'Dollar debt is worth more in dong terms while dong revenue does not rise to match — causing FX losses and higher repayment costs. Exporters and dollar holders usually benefit.',
          },
          {
            prompt: 'Which reason does NOT explain why rising inflation usually pressures P/E?',
            options: [
              'Rates tend to rise in response, increasing the discount rate',
              'Margins may be squeezed as costs rise faster than prices',
              'Higher uncertainty makes investors demand a bigger risk premium',
              'Inflation always reduces the number of shares outstanding',
            ],
            correct_index: 3,
            explanation:
              'The first three are valid. There is no mechanism by which inflation reduces shares outstanding — that option is irrelevant.',
          },
          {
            prompt:
              'Under the current framework (since October 2022), within what range may commercial banks trade USD/VND?',
            options: [
              '±5% around the central rate the SBV publishes daily',
              'Fully free-floating with no SBV involvement',
              'A single fixed rate all year',
              '±0.5% around the DXY',
            ],
            correct_index: 0,
            explanation:
              'The SBV publishes a central rate each day and widened the band from ±3% to ±5% in October 2022. The DXY measures dollar strength; it is not the anchor of the band.',
          },
        ],
      },
      {
        slug: 'growth-credit-and-fiscal-policy',
        title: 'Growth, credit and fiscal policy',
        summary:
          'GDP components, PMI, credit growth, public investment disbursement, FDI and exports; leading vs lagging indicators; a Vietnam macro dashboard and where to find the data.',
        content_md: `## What makes up GDP?

**GDP** is the total value of final goods and services an economy produces. By the expenditure approach:

**GDP = C + I + G + (X − M)**

| Component | Meaning | In Vietnam, tracked via |
|---|---|---|
| **C** — Consumption | Household spending | Total retail sales of goods and services |
| **I** — Investment | Business and state investment in assets | Total social investment, disbursed FDI |
| **G** — Government spending | Recurrent spending and public investment | Public investment disbursement |
| **X − M** — Net exports | Sales abroad minus purchases | Monthly trade data |

Vietnam is a **very open** economy: total trade is large relative to GDP, so demand in big markets such as the US, China and the EU strongly affects domestic growth.

## PMI — an early read on manufacturing

Vietnam's manufacturing **PMI (Purchasing Managers' Index)** is published by **S&P Global**, usually on the first working day of the month. It is a diffusion index built from a business survey:

- Each component = % answering "higher" + half the % answering "unchanged", then seasonally adjusted.
- The headline PMI is a weighted average: **new orders 30%, output 25%, employment 20%, suppliers' delivery times 15%** (inverted), **stocks of purchases 10%**.
- **Above 50** = business conditions improved versus the previous month; **below 50** = deteriorated; the distance from 50 shows the degree.

Note: PMI compares with the **previous month**, so a 49 after many months at 52 means a mild deterioration has begun, not that manufacturing has "collapsed".

## Credit, public investment and FDI

- **Credit growth:** Vietnam's economy relies heavily on bank lending (the corporate bond market is still small), so loan growth is the lifeblood of growth. The SBV announces a full-year direction and updates actual figures periodically.
- **Public investment disbursement:** the Ministry of Finance reports progress. Fast disbursement directly supports **infrastructure construction and building materials (steel, cement, aggregates, asphalt)**.
- **FDI:** separate **registered capital** (pledges, volatile) from **disbursed/realised capital** (money that actually arrived). FDI drives demand for industrial-park land, exports and jobs.
- **Exports:** monthly data; new export orders inside the PMI are an even earlier signal.

## Leading, coincident and lagging indicators

| Type | Examples | Used for |
|---|---|---|
| **Leading** | PMI new orders, registered FDI, stock prices | Sensing the direction of the next few months |
| **Coincident** | Index of industrial production (IIP), retail sales, quarterly GDP (though published after the quarter ends) | Confirming the current state |
| **Lagging** | Unemployment, bank bad debt, core inflation | Confirming what already happened |

A common mistake: selling stocks because **just-released quarterly GDP was weak**. But GDP only tells you how the past quarter went and is published after the quarter ends — the market has usually priced it in already.

## A Vietnam macro dashboard: where to get the data

| Group | Source | Frequency |
|---|---|---|
| CPI, GDP, IIP, retail, trade, FDI | **National Statistics Office** — nso.gov.vn (socio-economic report on the 6th of the next month) | Monthly / quarterly |
| Policy rates, central FX rate, credit | **State Bank of Vietnam** — sbv.gov.vn | Daily / periodic |
| Budget revenue and spending, public investment disbursement, government bonds | **Ministry of Finance** — mof.gov.vn | Monthly |
| Manufacturing PMI | **S&P Global** — pmi.spglobal.com | Monthly |

You don't need to track everything. A table of 8–10 indicators, updated once a month, is enough for an individual investor.

## Practice

Build a spreadsheet with columns: Indicator, Source, Latest period, Value, Previous period, Trend (up/down/flat). Fill in at least: PMI, CPI YoY, year-to-date credit growth, public investment disbursement, exports, disbursed FDI. Mark which are leading and which are lagging.

## Sources

- PMI release calendar (S&P Global; methodology is stated in each Vietnam PMI release): https://www.pmi.spglobal.com/Public/Release/ReleaseDates
- National Statistics Office release timing (Vietnamese): https://www.nso.gov.vn/su-kien/2024/06/thay-doi-thoi-gian-cong-bo-so-lieu-cpi-gdp-grdp/
- Statistics office under the Ministry of Finance (functions per Decision 384/QD-BTC, Vietnamese): https://www.nso.gov.vn/gioi-thieu/chuc-nang-nhiem-vu/`,
        questions: [
          {
            prompt: 'The manufacturing PMI reads 48.5. What is the correct interpretation?',
            options: [
              'Output fell 51.5% from last year',
              'Business conditions overall deteriorated versus the previous month',
              "This quarter's GDP will certainly contract",
              'Only 48.5% of companies are still operating',
            ],
            correct_index: 1,
            explanation:
              'PMI is a diffusion index where 50 = no change from the previous month. Below 50 means deterioration, but it does not measure the percentage change in output and is not enough to conclude anything about GDP.',
          },
          {
            prompt: 'Which of these is a LAGGING indicator?',
            options: ['PMI new orders', 'Newly registered FDI', 'Bank bad-debt ratio', 'Stock prices'],
            correct_index: 2,
            explanation:
              'Bad debt typically rises only after the economy has weakened for a while, so it lags. The other three reflect expectations or future plans — they are leading indicators.',
          },
          {
            prompt: 'Faster public investment disbursement usually supports which sectors most directly?',
            options: [
              'Infrastructure construction and building materials such as steel, cement and aggregates',
              'Life insurance',
              'Software exports',
              'Pharmacy retail',
            ],
            correct_index: 0,
            explanation:
              'Public investment flows mainly into roads, bridges and ports, so contractors and building-material producers benefit most directly.',
          },
          {
            prompt: 'When tracking FDI, why focus on disbursed rather than registered capital?',
            options: [
              'Because registered capital is always zero',
              'Because disbursed capital is published years before registered capital',
              'Because registered capital only counts domestic firms',
              'Because disbursed capital is money actually spent, while registered capital is only a pledge and is volatile',
            ],
            correct_index: 3,
            explanation:
              'Registered capital can be revised or never realised; disbursed capital reflects real money that has entered the economy.',
          },
        ],
      },
      {
        slug: 'business-cycle-and-sector-rotation',
        title: 'The business cycle and sector rotation',
        summary:
          'The four phases of the business cycle, which sectors tend to lead in each, why the stock market runs ahead of the economy — and the limits of the model.',
        content_md: `## What is the business cycle?

Economies don't grow in a straight line; they move in **cycles**: expansion, peak, contraction, trough, then expansion again. The US cycle-dating committee (NBER) describes an **expansion** as running from a **trough** to a **peak**, and a **recession** from a **peak** to a **trough**; a recession is "a significant decline in economic activity that is spread across the economy and lasts more than a few months".

| Phase | Typical features | Rates and credit |
|---|---|---|
| **Recovery / early cycle** (after the trough) | Growth rebounds, profits improve fast from a low base | Low rates, easy credit |
| **Expansion / mid cycle** | Steady growth, usually the longest phase | Policy gradually neutral |
| **Peak / late cycle** | Growth slows, inflation rises, tight labour market | Rates being raised |
| **Contraction / recession** | Output and profits fall; bad debt rises | Policy starts easing again |

## Which sectors tend to lead in which phase?

Research such as Fidelity's "Business Cycle Approach to Sector Investing" (US data since 1962) shows the following historical tendencies — **tendencies, not laws**:

| Phase | Groups that often do well | Why |
|---|---|---|
| **Early cycle** | **Financials** (banks, brokers), **real estate**, **consumer discretionary** | Benefit directly from low rates and open credit |
| **Mid cycle** | Information technology; few groups lead clearly | Steady growth, competition on business quality |
| **Late cycle** | **Energy, materials** (steel, chemicals), then defensives | Commodity prices are often high when demand is tight |
| **Recession** | **Defensives**: utilities (power, water), **consumer staples**, **healthcare** | Demand is less cyclical, cash flows stable |

Linking back to the **Reading financial statements by sector** chapter: banks and securities firms are sensitive to rates and liquidity; real estate to credit; **steel** is the textbook cyclical — earnings are magnified both up and down, and the lowest P/E often appears **near peak earnings**, not when the stock is cheapest.

## The stock market runs ahead of the economy

Share prices reflect **expectations** of future profits, so the market tends to:

- **Bottom before** the worst economic data is published — while the news is still terrible.
- **Peak before** a slowdown shows up clearly in GDP — while the news is still good.

So if you wait for GDP to confirm a recovery before buying banks or real estate, much of the rally may already be gone. Conversely, selling when the "worst news" comes out often means selling near the bottom.

## Limits to remember

1. **The cycle isn't linear:** Fidelity itself notes that some cycles skip a phase or move back to an earlier one. You only know a peak or trough for sure **after** it has passed.
2. **Vietnam has its own features:** credit-room policy, public investment, exports and foreign flows can make sector cycles deviate from the US template. For example, the property cycle is tied closely to project approvals and the corporate bond market.
3. **Starting valuation matters:** a sector in the "right phase" but already priced too richly can still disappoint.
4. **Companies differ:** within one sector, strong and weak companies can move in opposite directions.

## Practice

1. Using the macro dashboard you built in the previous lesson (PMI, credit, rates, inflation), try to place the economy in one of the four phases and write down why. If the indicators conflict, say so.
2. On the **Markets › Vietnam stocks** tab, compare the VN-Index chart during a past economic slowdown with the date the worst GDP figure was released. Did prices bottom before or after?

## Sources

- NBER — Business Cycle Dating: https://www.nber.org/research/business-cycle-dating
- Fidelity — The business cycle approach to sector investing: https://institutional.fidelity.com/advisors/insights/spotlights/sector-investing
- Fidelity — Sector investing and the business cycle (sector leaders by phase): https://www.fidelity.com/viewpoints/investing-ideas/sector-investing-business-cycle`,
        questions: [
          {
            prompt: 'Historically, which groups tend to benefit most in the EARLY phase of the cycle?',
            options: [
              'Utilities such as power and water',
              'Consumer staples',
              'Healthcare',
              'Financials, real estate and consumer discretionary',
            ],
            correct_index: 3,
            explanation:
              'Early in the cycle, low rates and easy credit help financials, real estate and consumer discretionary most. The other three are defensives that tend to do well late in the cycle and in recession.',
          },
          {
            prompt: 'Why does the stock market often bottom BEFORE the worst economic data is released?',
            options: [
              'Because prices reflect expected future profits, while GDP describes the past quarter and is published with a delay',
              'Because the exchange knows GDP figures in advance',
              'Because listed companies are immune to recessions',
              'Because the law requires the market to rise when GDP falls',
            ],
            correct_index: 0,
            explanation:
              'Investors look ahead. When they believe the worst is about to pass, prices start rising even though the (backward-looking) data still look bad.',
          },
          {
            prompt: 'A steel stock trades at a very low P/E while earnings are at a record. How should you read this?',
            options: [
              'A certain buy, since a low P/E always means cheap',
              'Possibly a sign of being near the peak of the earnings cycle — a reason for caution rather than a bargain',
              'P/E cannot be applied to steel',
              'It is a recession, so defensives will rise',
            ],
            correct_index: 1,
            explanation:
              'For cyclicals, peak earnings make P/E look low; when the cycle turns, earnings fall sharply and the "true" P/E is much higher. A low P/E near peak earnings is a classic trap.',
          },
          {
            prompt: 'Which statement CORRECTLY reflects a limit of the sector-rotation model?',
            options: [
              'The model gives the exact dates of cycle peaks and troughs',
              'The model applies identically to every country',
              'Cycles can skip or revisit phases, and starting valuation still decides outcomes',
              'Pick the right phase and every stock in the sector will rise',
            ],
            correct_index: 2,
            explanation:
              'The model describes historical tendencies, not precise forecasts. Cycles are non-linear, countries differ, and a sector in the "right phase" but priced too richly can still disappoint.',
          },
        ],
      },
      {
        slug: 'reading-the-macro-calendar',
        title: 'Reading a macro calendar',
        summary:
          'Key domestic and international macro events, comparing expectations with actual results, how markets react, and how to avoid over-trading the news.',
        content_md: `## What is a macro calendar?

An **economic calendar** lists upcoming data releases and policy decisions, together with analysts' **expectations (consensus forecast)** and the **actual result** once published. Your goal is not to trade every release, but to **know in advance when the market might move sharply** so you are not caught off guard.

## Events to know

| Event | Publisher | Usual timing |
|---|---|---|
| **Monthly socio-economic report** (CPI, IIP, retail, trade, FDI) | Vietnam National Statistics Office | 6th of the following month |
| **Quarterly GDP** | Vietnam National Statistics Office | 6th of the month after the quarter ends |
| **Vietnam manufacturing PMI** | S&P Global | First working day of the month |
| **Policy rates, credit room, central FX rate** | State Bank of Vietnam | No fixed schedule; central rate daily |
| **US CPI** | US Bureau of Labor Statistics (BLS) | Monthly, per the BLS schedule |
| **US jobs report (NFP)** | BLS — Employment Situation | Monthly, usually the first Friday, 8:30 a.m. US Eastern time |
| **Fed rate decision (FOMC)** | Federal Reserve | 8 scheduled meetings a year; minutes about 3 weeks later |

Note: these timings can change — always check each agency's official calendar. For US events, mind the time zone: news released in the Vietnamese evening or night usually shows up in the VN-Index in the **next morning's session**.

## Expectations matter more than the number

Markets react to the **surprise** (actual − expected), not to the absolute figure.

*Illustrative example (made-up numbers):*

| Case | Expected US CPI (YoY) | Actual | Typical reaction |
|---|---|---|---|
| A | 3.0% | 3.0% | Little movement — already priced in |
| B | 3.0% | 3.4% | Fear of tighter Fed policy → stocks under pressure, dollar stronger |
| C | 3.0% | 2.6% | Hopes of Fed easing → risk assets often supported |

"Good news" can even push prices down: a very strong jobs report may make markets fear higher rates for longer. Beyond the headline, look at the details (revisions to prior months, core inflation, the tone of the Fed statement).

## Reading the market's reaction

1. **The first reaction often overshoots**, especially in the first minutes or hours when liquidity is thin.
2. **The follow-through** tells you whether the market really changed its view.
3. **One release rarely changes a long-term trend**; only a run of data in the same direction over several months is meaningful.

## Avoid over-trading the news

- **Don't place "guess" orders** just before a release — you are betting on a surprise nobody knows.
- **Plan ahead:** if the data miss expectations by a lot, what will you do (or not do)? Decide while calm, not while the chart is jumping.
- **Respect costs:** every trade costs fees and tax; trading the news repeatedly erodes returns.
- **Know whether you are an investor or a trader:** for long-term investors, the macro calendar is mainly for understanding context and avoiding chasing during volatility, not for jumping in and out.
- **Keep a journal:** after each major event, note the expectation, the actual and the VN-Index reaction. After a few months you will know which news the market cares about.

## Practice

1. Build a calendar for next month with: the statistics office's monthly report date, the Vietnam PMI release, the US CPI and NFP dates (look them up on bls.gov), and the next FOMC meeting.
2. For each event, write down the expectation before the release (from any economic calendar), then fill in the actual result and the VN-Index reaction in the next session.

## Sources

- BLS — Employment Situation release schedule: https://www.bls.gov/schedule/news_release/empsit.htm
- Fed — FOMC meeting calendar: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- Vietnam statistics office release timing (Vietnamese): https://www.nso.gov.vn/su-kien/2024/06/thay-doi-thoi-gian-cong-bo-so-lieu-cpi-gdp-grdp/`,
        questions: [
          {
            prompt:
              'Expected CPI is 3.0% and the actual is exactly 3.0% (illustrative). What is the most likely market reaction?',
            options: [
              'A huge rally, because inflation in line with expectations is good news',
              'A limit-down crash, because inflation is still above 2%',
              'Usually little movement, since the information was already priced in',
              'Trading halts until the Fed meets',
            ],
            correct_index: 2,
            explanation:
              'Markets react to the surprise. When actual matches expected, the surprise is close to zero, so the move is usually small.',
          },
          {
            prompt: 'Why can a very strong US jobs report sometimes push stocks down?',
            options: [
              'Because markets fear the Fed will keep rates high for longer',
              'Because job growth always reduces corporate profits',
              'Because the BLS published wrong numbers',
              'Because NFP only measures farm jobs',
            ],
            correct_index: 0,
            explanation:
              'An overheating labour market can fuel inflation and keep the Fed on hold at high rates, raising discount rates. NFP means non-farm payrolls, not farm jobs.',
          },
          {
            prompt: 'Which habit helps you avoid over-trading the news?',
            options: [
              'Placing a large buy order right before a release to front-run it',
              'Planning your action before the event and waiting for the follow-through after the first reaction',
              'Selling the entire portfolio before every FOMC meeting',
              'Watching the minute chart and trading every move',
            ],
            correct_index: 1,
            explanation:
              'Deciding before the news keeps emotions out, and the first reaction often overshoots. The other options are betting or over-trading.',
          },
          {
            prompt: 'US macro news released in the Vietnamese evening usually shows up in the VN-Index when?',
            options: [
              'Immediately, because HOSE trades 24/7',
              'Never, because the VN-Index is unrelated to the US',
              'A month later, when the statistics office publishes its data',
              'Usually from the next morning session',
            ],
            correct_index: 3,
            explanation: 'HOSE is closed in the evening, so any impact usually appears from the next session.',
          },
        ],
      },
      {
        slug: 'macro-in-the-investment-process',
        title: 'Putting macro into your investment process',
        summary:
          'Top-down vs bottom-up, base/bull/bear scenario thinking, adjusting cash and sector weights instead of predicting, plus a one-page macro checklist.',
        content_md: `## What is macro for — and not for?

After five lessons you know how rates, inflation, exchange rates, growth and the cycle affect stocks. But here is an important truth: **accurate macro forecasting is very hard**, even for professionals. So the goal is not to guess next quarter's rate correctly, but to:

- **Understand the context** so you don't chase into places where risk is building.
- **Prepare for several scenarios** instead of betting on one.
- **Adjust your risk level** (cash, sector weights) gradually and with discipline.

## Top-down vs bottom-up

| | **Top-down** | **Bottom-up** |
|---|---|---|
| Starts from | Economy → sector → company | A specific company |
| Key question | Which context favours which sector? | Is this company good and cheap? |
| Strength | Avoids sectors facing headwinds | Finds excellent companies regardless of the cycle |
| Weakness | Easily turns into macro guessing | Can overlook systemic risk |

A practical approach for individual investors is to **combine** them: use macro to set your **risk level** and **sectors to favour or be cautious on**, then use fundamental analysis (financial statements, ratios, valuation) to pick **specific companies**.

## Scenario thinking

Instead of one forecast, write **three scenarios** for the next 6–12 months and ask: how would my portfolio fare in each?

*Illustrative example (not a forecast):*

| Scenario | Description | Sectors that may benefit | Sectors that may suffer |
|---|---|---|---|
| **Base** | Steady growth, rates flat | Companies with steady earnings growth | — |
| **Bull** | Credit opens up, public investment accelerates, exports recover | Banks, brokers, building materials | Defensives may lag |
| **Bear** | Inflation rises, FX pressure, rates rise | Defensives (utilities, staples), low-debt companies, exporters | Highly leveraged real estate, firms with dollar debt |

The aim is not precise probabilities but making sure **no scenario hurts the portfolio beyond what you can bear**.

## Adjust rather than predict

Macro should affect the portfolio through **moderate adjustments** with limits set in advance:

- **Cash weight:** e.g. set a range of 10–30%; when the checklist shows many risks, move toward the top; when conditions are favourable, move toward the bottom. Never go "all in" on one view.
- **Sector weights:** tilt slightly (e.g. add or trim a few percentage points) rather than piling everything into one sector.
- **Company quality:** when macro risk rises, favour low-debt companies with strong cash flow.
- **Periodic rebalancing** (see the Portfolio management chapter) enforces discipline and avoids emotional reactions.

## A one-page macro checklist

Update once a month and rate each line: **favourable / neutral / unfavourable**.

| Area | Question | Source |
|---|---|---|
| Rates | Are policy and deposit rates rising, falling or flat? | SBV, bank websites |
| Valuation | How does the VN-Index earnings yield compare with the 12-month deposit rate? | Market data |
| Inflation | Where are CPI YoY and core inflation heading? | Statistics office |
| Currency | Is there heavy pressure on USD/VND and the DXY? | SBV, market data |
| Growth | Is PMI above or below 50? How are exports and retail? | S&P Global, statistics office |
| Credit & fiscal | Credit growth and public investment disbursement vs plan? | SBV, Ministry of Finance |
| Global | Is the Fed tightening or easing? Are foreigners net buying or selling? | Fed, exchange data |
| Cycle | Which phase does the context most resemble? Do indicators conflict? | Summary of the lines above |

The checklist's conclusion should lead to **one of three actions** only: hold steady, tilt slightly defensive, or tilt slightly offensive.

## Practice

1. Open the **Markets › Vietnam stocks** tab in the app and look at the **VN-Index** and **VN30** charts over the past 1–3 years. Mark the periods of rising or falling rates you have studied and see how the indices reacted.
2. Fill in the one-page checklist for this month and write three short scenarios for your portfolio.
3. Review the lessons **Valuation ratios: EPS, P/E and P/B** and **DCF — discounted cash flow valuation** to see where interest rates enter valuation.

This lesson is for education only and is not investment advice.

## Sources

- Fidelity — The business cycle approach to sector investing: https://institutional.fidelity.com/advisors/insights/spotlights/sector-investing
- NBER — Business Cycle Dating: https://www.nber.org/research/business-cycle-dating
- State Bank of Vietnam: https://www.sbv.gov.vn`,
        questions: [
          {
            prompt: 'Which approach does the lesson recommend for individual investors?',
            options: [
              'Use only macro to pick stocks and ignore financial statements',
              'Use only financial statements and treat macro as meaningless',
              'Use macro to set risk level and favoured sectors, then use fundamentals to pick companies',
              "Predict next quarter's rate precisely and put all capital behind that prediction",
            ],
            correct_index: 2,
            explanation:
              'Combining top-down and bottom-up uses the strengths of both: avoiding sectors in headwinds while still picking good companies.',
          },
          {
            prompt: 'What is the main purpose of base/bull/bear scenario thinking?',
            options: [
              'Making sure the portfolio is not hurt beyond tolerance in any scenario',
              'Finding the scenario that will certainly happen',
              'Replacing company analysis entirely',
              'Assigning probabilities accurate to the percentage point',
            ],
            correct_index: 0,
            explanation:
              'Scenarios prepare you for several possibilities instead of betting on one forecast. Nobody knows for sure which will happen.',
          },
          {
            prompt:
              "This month's checklist shows rising inflation, FX pressure and PMI below 50. Which response fits the process in this lesson?",
            options: [
              'Sell every stock and wait until all indicators turn good',
              'Buy more on margin because you should be "greedy when others are fearful"',
              'Do nothing, since macro does not affect stocks',
              'Tilt slightly defensive within pre-set limits: raise cash moderately and favour low-debt companies',
            ],
            correct_index: 3,
            explanation:
              'The process calls for moderate adjustments within pre-set limits. Selling everything or buying on margin are all-in bets; ignoring it wastes the risk monitoring.',
          },
          {
            prompt: 'Why does the checklist compare the VN-Index earnings yield with the 12-month deposit rate?',
            options: [
              'Because the two numbers are always equal',
              'To judge the premium stocks pay over a near risk-free alternative',
              'Because the deposit rate decides how many shares are listed',
              'To calculate the exact year-end VN-Index',
            ],
            correct_index: 1,
            explanation:
              'Earnings yield (1/P/E) minus the deposit rate shows how much extra stocks pay for risk. A thin premium signals less attractive valuation — it is not a tool for forecasting the index.',
          },
        ],
      },
    ],
  },
]
