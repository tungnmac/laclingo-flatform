import type { SeedChapter } from './types'

// Market history (en) — index levels are rounded and checked against the sources listed at the end of each lesson.
// Index figures are price-only (excluding dividends) unless stated otherwise.
export const EN_HISTORY: SeedChapter[] = [
  {
    slug: 'lessons-from-market-turmoil',
    title: 'Lessons from market turmoil',
    description: 'A look back at the bubbles, crashes and long gloomy stretches of Vietnamese and global markets — and how to survive them.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'vietnam-2006-2009-bubble-and-crash',
        title: 'Vietnam 2006–2009: bubble and crash',
        summary: 'The VN-Index soared to about 1,170 points in 2007 and then lost nearly 80% by early 2009 — lessons on leverage, valuation and liquidity.',
        content_md: `## The young market's first fever

Vietnam's stock market opened in 2000 with a handful of listed shares. By 2006 several forces arrived at once: a wave of **equitisation** (state-owned enterprises selling shares to the public), hopes around Vietnam joining the **WTO** (which it did in early 2007), foreign money flowing in, and huge numbers of individuals opening a brokerage account for the first time. The VN-Index soared in little more than a year and peaked at **about 1,170 points on 12 March 2007**.

The mood was the one every bubble shares: people quitting jobs to trade, queues for IPO shares, and the story that "everyone who buys makes money". Many **borrowed from banks, pledging the very shares they bought** as collateral — in other words, they used **leverage**.

## Timeline

| When | What happened |
|---|---|
| 2006 – early 2007 | Equitisation, WTO hopes, hot money; share prices multiply |
| 12 March 2007 | VN-Index peaks at about **1,170 points** |
| April 2007 | The index is already back near 900 within weeks |
| 2007 | The State Bank tells banks to cut lending for securities trading to below **3% of total loans** (Directive 03/2007) |
| 2008 | Inflation reaches about **28% year-on-year** in August; the base rate is raised to **14%**; the global financial crisis erupts |
| Full year 2008 | VN-Index falls about **66%**, among Asia's worst performers |
| 24 February 2009 | Bottom at about **235 points** — nearly **80%** below the 2007 peak |
| 2009 | Strong rebound, above 500 and then above 600 points within the year |

## Why did the bubble burst?

**1. Credit was squeezed just as the market was "addicted" to borrowed money.** With inflation running hot, monetary policy had to tighten. Limits on securities lending and sharply higher interest rates pulled back the borrowed money that had fuelled the rally.

**2. High inflation and rates made shares less attractive.** When savings deposits pay high rates, investors demand higher returns from stocks, so the price they are willing to pay falls. Inflation for the whole of 2008 was about 23%.

**3. A global shock.** The US financial crisis spread worldwide in late 2008, foreign investors pulled money out and sentiment collapsed.

**4. Valuations at the peak were already too high.** At the 2007 top, many share prices reflected years of expected growth. When expectations returned to reality, prices did not just fall — they **overshot**.

## Leverage turned a fall into a disaster

Suppose you have 100 million dong and borrow another 100 million to buy 200 million worth of shares. The market falls 50% → the portfolio is worth 100 million; after repaying the loan you have **nothing left**. Someone without debt loses half and still owns shares to wait for the recovery.

Worse, as prices fall, the lender demands **more collateral** or **sells your shares**. A wave of forced sales pushes prices down further, triggering the next round of forced sales — a **selling spiral**.

## Liquidity disappears when you need it most

In the worst months there were many sessions with long queues of sell orders at the daily floor price and almost no buyers. The lesson: **liquidity is a fair-weather friend**. A stock that is easy to buy in euphoria may be impossible to sell in panic, especially a small one.

## Lessons that still hold

- **Leverage doesn't make you better, it makes outcomes more extreme.** It can force you to sell right at the bottom.
- **A big price rise doesn't make a stock cheap.** Ask how many times earnings the business is valued at, not just how much the price has risen.
- **Watch the macro picture:** inflation, interest rates and credit policy can turn the market faster than any good company news.
- **Recoveries can arrive suddenly:** in 2009 the VN-Index more than doubled from its low — but only those who still had capital and composure benefited.

## Sources

- VnExpress — Milestones of the VN-Index (in Vietnamese): https://vnexpress.net/nhung-dau-moc-de-doi-cua-vn-index-2822965.html
- Bao Phap luat — VN-Index, 9 years in review (1,170.67 peak on 12/3/2007, 235.5 low on 24/2/2009; in Vietnamese): https://baophapluat.vn/vn-index-9-nam-nhin-lai-co-dinh-moi-at-co-day-moi-post15363.html
- Vietnam Briefing — A Look at Vietnam's Stock Index (VN-Index down 66% in 2008): https://www.vietnam-briefing.com/news/a-look-vietnams-stock-index.html/
- Lanka Business Online/AFP — Vietnam inflation at 28.3% (August 2008): https://lankabusinessonline.com/vietnam-inflation-at-28-3-pct-after-sterilized-intervention-blunder
- State Bank Decision 1434/QD-NHNN on the 14% base rate: https://dulieuphapluat.vn/van-ban/tien-te-ngan-hang-van-ban/decision-no-1434qd-nhnn-of-june-26-2008-on-the-base-interest-rate-in-vietnam-dong-1108585.html
- Tap chi Cong Thuong — Implementing Directive 03/2007/CT-NHNN (in Vietnamese): https://tapchicongthuong.vn/thuc-hien-chi-thi-03-2007-ct-nhnn--lieu-cac-ngan-hang-co-ve-kip-dich-5546.htm

## Practice

Open **Markets › Vietnam stocks** and view the VN-Index on the longest time frame available. If the data doesn't reach back to 2007, use the longest period you have: mark the **peak**, the **trough** and measure the **% decline** between them. Then ask yourself: if I had used 1:1 margin at the peak, how much capital would I have left at the bottom?`,
        questions: [
          {
            prompt: 'Why did leverage (borrowing to buy shares) make the 2008 crash so much worse for many investors?',
            options: [
              'Because borrowers pay higher trading fees',
              'Because as prices fell, borrowers could be force-sold, wiped out, and their selling pushed prices lower still',
              'Because shares bought with borrowed money receive no dividends',
              'Because banks forbid borrowers from selling',
            ],
            correct_index: 1,
            explanation: 'With leverage, the portfolio’s fall is magnified against your own capital. Margin calls force selling at low prices, and those forced sales drag prices down further.',
          },
          {
            prompt: 'Which macro factor played a big role in turning the market in 2007–2008?',
            options: [
              'Overheating inflation that forced credit tightening and higher interest rates',
              'Interest rates falling to 0%',
              'A sharp fall in the number of listed companies',
              'A ban on foreign investors buying shares',
            ],
            correct_index: 0,
            explanation: 'High inflation led to monetary tightening: rates rose and securities lending was capped, cutting off the borrowed money that had inflated the market.',
          },
          {
            prompt: 'What liquidity lesson does 2008 teach?',
            options: [
              'Shares can always be sold instantly at the market price',
              'Liquidity that is plentiful in euphoria can vanish when the market panics',
              'Small caps are more liquid than large caps in a falling market',
              'Liquidity has nothing to do with risk',
            ],
            correct_index: 1,
            explanation: 'In the worst sessions, sell orders queued at the floor price with no buyers. Never assume you can exit a position exactly when you want to.',
          },
          {
            prompt: 'A stock has tripled in a year. Which question is most useful before buying?',
            options: [
              'Can it triple again?',
              'Have my friends bought it?',
              'How many times earnings does the current price value the business at, and are those expectations realistic?',
              'Is it near an all-time high — and if so, isn’t that better?',
            ],
            correct_index: 2,
            explanation: 'At a bubble peak, prices reflect very distant expectations. Comparing valuation with real earnings helps you avoid buying just because the price has gone up.',
          },
        ],
      },
      {
        slug: 'vietnam-2011-2012-and-2018-tightening-and-correction',
        title: 'Vietnam 2011–2012 and 2018: tightening, bad debt and correction',
        summary: 'High interest rates, bank bad debt and years of gloomy markets; then a correction of about 26% after the 2018 peak amid global trade tensions.',
        content_md: `## Not every bad stretch is a "crash"

After the 2009 rebound, Vietnam's market entered a **long, gloomy period**: each year's high was lower than the last, liquidity dried up and investors lost interest. This kind of market hurts in a different way — not with a limit-down session but by **wearing down your patience**.

## 2011: inflation and tightening

Inflation surged again in 2011, to about **18.6%** for the year. In February 2011 the government issued **Resolution 11**, prioritising inflation control and macro stability: tighter monetary policy and cuts to public investment. Very high interest rates made borrowing hard for companies, squeezed profits and turned savings deposits into a strong competitor for stocks.

The result: the VN-Index **fell about 27–28% in 2011**, from around 486 to around 352 points, and trading volumes slumped. In early January 2012 the index dipped below **340 points**.

## 2012: bad debt and bank restructuring

Years of rapid credit growth had left a pile of **bad debt** in the banking system. According to figures reported by the lenders themselves, non-performing loans were about **4.9% of total loans** at the end of September 2012 — and many experts believed the true figure was higher. In early 2012 the government approved a **plan to restructure credit institutions for 2011–2015**, and in 2013 it set up **VAMC** (the Vietnam Asset Management Company) to buy and work out bad debts.

In August 2012, the arrest of a former executive and co-founder of a large joint-stock commercial bank sent the VN-Index **down about 10% in just three sessions**. The lesson is not about any individual but about **systemic risk**: when confidence in banks — the economy's bloodstream — wobbles, the whole market is sold, good stocks included.

## 2018: a new peak and a correction

It took **11 years** for the VN-Index to climb back above its 2007 peak (in March 2018). The 2017 – early 2018 rally was led by large caps, and the index peaked at **about 1,204 points (close) on 9 April 2018**.

Then the market turned quickly:

| When | What happened |
|---|---|
| 5 February 2018 | The VN-Index fell more than 56 points in one session as global markets wobbled |
| 9 April 2018 | Peak at about **1,204 points** |
| 28 May 2018 | Closes near 932 points, more than 22% below the peak |
| 11 July 2018 | Falls below **900 points**, roughly **26%** below the peak |
| End of 2018 | Closed near 893 points, down about 9% for the year |

Commonly cited causes: **Fed rate hikes**, **trade tensions** between the US and its partners, foreign net selling, MSCI not upgrading Vietnam, and many large caps having become expensive after a strong year. Notably, Vietnam's GDP growth in 2018 was still strong — **a good economy does not guarantee rising stocks** in the short run.

## Takeaways

- **Interest rates are the "gravity" of valuation.** When rates stay high, stocks struggle to rise sustainably even if companies keep operating.
- **Bank health affects the whole market.** Bad debt and confidence shocks in banks spread to every sector.
- **A peak can take a very long time to come back.** Buyers at the 2007 top waited more than a decade (excluding dividends) — so **what price you pay** matters as much as **what you buy**.
- **Corrections of 20–30% are normal**, even within long-term uptrends. Prepare your mindset and position sizes before they happen.
- **External factors** (US rates, global trade, foreign flows) can drive Vietnam's market in the short term.

## Sources

- SSI — 2011 operation report (inflation 18.58%, VN-Index down 27.7%): https://www.ssi.com.vn/upload/files/Presentation/SSI%20-%202011%20operation%20report%20and%202012%20plan%20at%20annual%20GSM.pdf
- VietnamPlus — Bad debt ratio slashed to 3.21 percent (4.93% in September 2012): https://en.vietnamplus.vn/bad-debt-ratio-slashed-to-321-percent-post82707.vnp
- Vietstock — Vietnam stock market loses $3.85 bln in 3 days (August 2012): https://en.vietstock.vn/2012/08/vietnam-stock-market-loses-$3-85-bln-in-3-days-36-134110.htm
- SGGP — VN-Index officially breaks its all-time high (22 March 2018, in Vietnamese): https://www.sggp.org.vn/chung-khoan-viet-nam-chinh-thuc-pha-dinh-lich-su-post470068.html
- Thi truong Tai chinh Tien te — VN-Index misses its 1,204 record (in Vietnamese): https://thitruongtaichinhtiente.vn/vn-index-lo-hen-dinh-lich-su-1-204-diem-33115.html
- Viet Nam News — VN stocks set new low since December (28 May 2018): https://vietnamnews.vn/economy/448816/vn-stocks-set-new-low-since-december.html
- VCSC Daily — Banks drag stocks down to eight-month low (11 July 2018, down 26% from the record): https://vietcap.com.vn/en/research-center/vcsc-daily-banks-drag-stocks-down-to-eight-month-low-hvn-vjc
- Viet Nam News — A disappointing year for VN stocks (2018 recap): https://vietnamnews.vn/economy/483001/a-disappointing-year-for-vn-stocks.html

## Practice

On **Markets › Vietnam stocks**, find the most recent period in which the VN-Index moved **sideways** for more than 6 months. Mark the range, then note in your journal: were savings rates high or low at the time, and was market liquidity rising or falling?`,
        questions: [
          {
            prompt: 'Why do persistently high interest rates (as in 2011) usually weigh on share prices?',
            options: [
              'Because stocks are banned from trading when rates are high',
              'Because companies’ cost of capital rises and savings deposits become a competing alternative to stocks',
              'Because high rates always bankrupt companies',
              'Because high rates force companies to raise dividends',
            ],
            correct_index: 1,
            explanation: 'High rates raise borrowing costs and cut profits; investors also demand a higher return from stocks, so the valuation they will accept falls.',
          },
          {
            prompt: 'A confidence shock at one large bank in 2012 dragged the whole market down. Which concept does this illustrate?',
            options: ['Systemic risk', 'Cash dividends', 'The January effect', 'Candlestick analysis'],
            correct_index: 0,
            explanation: 'Banks are the economy’s bloodstream. When trust in the banking system wobbles, investors sell broadly — systemic risk that diversification cannot fully remove.',
          },
          {
            prompt: 'In 2018 Vietnam’s GDP still grew strongly, yet the VN-Index fell about 26% from its peak. Which lesson fits best?',
            options: [
              'GDP figures are always wrong',
              'A good economy doesn’t guarantee rising stocks in the short run; valuation, capital flows and global factors matter too',
              'Sell everything whenever GDP grows',
              'Stocks and the economy are never related',
            ],
            correct_index: 1,
            explanation: 'Share prices reflect expectations and valuation. After a strong rally, rising US rates, trade tensions and foreign selling were enough to cause a correction despite a healthy economy.',
          },
          {
            prompt: 'The VN-Index took about 11 years to regain its 2007 peak. What does that remind investors of?',
            options: [
              'Your entry price matters: buying at extreme valuations can mean a very long wait to break even',
              'Indices always regain their peak within a year',
              'You should never invest in stocks',
              'An old peak is always a cheap price',
            ],
            correct_index: 0,
            explanation: 'How long it takes to break even depends heavily on the price you pay. Buying at a bubble peak can take a decade or more (excluding dividends) to recover.',
          },
        ],
      },
      {
        slug: 'vietnam-2020-2022-covid-new-investors-and-slump',
        title: 'Vietnam 2020–2022: Covid, the new-investor wave and the slump',
        summary: 'From the Covid low in March 2020 to a peak of about 1,530 points in early 2022 on retail money and margin, then a fall of about 43% by November 2022.',
        content_md: `## A full cycle in three years

2020–2022 is a "compressed lesson" in market cycles: panic → euphoria → collapse → recovery, all within about three years, with millions of new investors taking part.

## Timeline

| When | What happened |
|---|---|
| End of 2019 | VN-Index around **960 points** |
| Late March 2020 | Covid panic; the index falls to about **660 points** (down about 31%) |
| End of 2020 | Recovery; closes near **1,104 points**, up about 15% for the year |
| 2021 | Up about **36%**; about 1.5 million new individual accounts; record liquidity and margin debt |
| Early January 2022 | Peak at about **1,530 points** |
| March–April 2022 | Cases of share-price manipulation and bond-issuance violations are prosecuted; the market falls sharply |
| September–October 2022 | The State Bank raises policy rates twice (the first hikes since 2011) |
| 16 November 2022 | Intraday low of about **874 points**, roughly **43%** below the peak |
| End of 2022 | Closes near 1,007 points, down about 33% for the year |
| 2023 | Policy rates are cut four times and the market recovers |

## 2020: panic, then a V-shaped recovery

In early 2020 the pandemic sent global stocks tumbling. In Vietnam the VN-Index dropped to around 660 points in late March. But rates were cut, support packages rolled out and the domestic outbreak was contained relatively early, so the market rebounded quickly and ended 2020 **higher than it started**. Anyone who sold in fear in March locked in a loss just before a strong rally.

## 2021: the wave of new ("F0") investors

Low deposit rates, people stuck at home during lockdowns and easy online trading brought a flood of **new investors** — nicknamed "F0" in Vietnam. About **1.53 million** new domestic individual accounts were opened in 2021, almost four times as many as in 2020. Average daily trading value on HOSE more than tripled from 2020, and **margin lending** reached a record of nearly 180 trillion dong by year-end.

The signs of euphoria were obvious: weak small caps multiplied in price, stock-tip chat groups mushroomed, and many people came to think 5–10% a week was normal.

## 2022: when everything turned at once

- **Crackdown on manipulation and violations:** from late March 2022, the authorities prosecuted a series of cases involving share-price manipulation and fraud in bond issuance. Stocks that had run hot hit the daily floor for many sessions in a row.
- **The corporate bond market froze:** private placements for the year fell about 60%, and issuance rules were tightened (Decree 65 from September 2022). Companies, especially property developers, ran short of funding as maturities loomed.
- **Rising rates:** global inflation pushed central banks into aggressive hikes; the dong came under pressure and the State Bank raised policy rates in September and October 2022.
- **Forced selling:** as prices fell, many margin accounts were liquidated — in some cases brokers force-sold shares held by companies' own leaders — feeding the downward spiral.

From about 1,530 points, the VN-Index fell to an intraday low of about 874 points on 16 November 2022. Right at the point of maximum gloom, foreign investors became strong **net buyers** from early November, while individual investors were record net sellers.

## Recovery

In 2023 the State Bank **cut policy rates four times**, measures to ease the bond market were introduced and the market gradually recovered. But many of 2021's "hot" stocks stayed far below their old highs — **an index recovery doesn't mean every stock recovers**.

## Lessons

- **Euphoric crowds + record margin = accumulating risk**, even if nobody knows when it will break.
- **Stocks driven up by speculation fall fastest** when the money leaves.
- **Panic-selling (2020) and FOMO-buying (2021)** are two sides of the same mistake: letting emotions decide.
- **Watch credit and rates:** corporate bonds, margin debt and policy rates are the "thermometer" of Vietnam's market.

## Sources

- Vietstock — VN-Index ends the year at over 1,100 points (2020): https://en.vietstock.vn/2021/01/vn-index-ends-the-year-at-over-1100-points-36-432581.htm
- VnBusiness — Brokerage stocks and margin money (2021 accounts and margin debt, in Vietnamese): https://vnbusiness.vn/co-phieu-chung-khoan-bat-day-cung-dong-tien-margin.html
- The Investor — Vietnam stock market up, down with many records in 2022: https://theinvestor.vn/vietnam-stock-market-up-down-with-many-records-in-2022-d3045.html
- The Investor — Vietnam's 2022 stock market provides investors mixed emotions (16 November 2022 low): https://theinvestor.vn/vietnams-2022-stock-market-provides-investors-mixed-emotions-d3139.html
- VinaCapital — Vietnam's interest rate cuts are boosting stock prices (2023): https://vinacapital.com/wp-content/uploads/2023/08/VinaCapital-Insights-Vietnams-Interest-Rate-Cuts-are-Boosting-Stock-Prices.pdf

## Practice

On **Markets › Vietnam stocks**, open the VN-Index weekly chart and mark four phases: **2020 panic**, **2021 euphoria**, **2022 collapse**, **2023 recovery**. For each phase write one sentence: what might I have felt at the time, and which rule would have stopped me acting on that feeling?`,
        questions: [
          {
            prompt: 'An investor sold everything in late March 2020 out of fear of Covid. What is the main lesson?',
            options: [
              'Panic-selling often locks in losses just before a recovery',
              'You should always sell on bad news',
              'Markets never recover after a pandemic',
              'You should borrow on margin to buy immediately',
            ],
            correct_index: 0,
            explanation: 'In 2020 the market made a V-shaped recovery and ended the year higher than it began. Decisions made in panic often turn a temporary loss into a real one.',
          },
          {
            prompt: 'Which 2021 sign showed risk was building up?',
            options: [
              'Savings rates rising sharply',
              'Record margin debt and weak companies’ shares multiplying on speculation',
              'Falling market liquidity',
              'Fewer new accounts being opened',
            ],
            correct_index: 1,
            explanation: 'High leverage and prices detached from value are classic signs of euphoria. They don’t tell you when the turn comes, but they tell you how painful the fall will be.',
          },
          {
            prompt: 'Why did 2021’s hottest stocks often fall the most in 2022?',
            options: [
              'Because they paid high dividends',
              'Because their prices were driven by speculative money and borrowing; when the money left and margin was liquidated, no underlying value held them up',
              'Because they were delisted immediately',
              'Because foreigners were banned from buying them',
            ],
            correct_index: 1,
            explanation: 'When a price rests only on expectations and borrowed money, outflows and forced selling create a downward spiral with no earnings base to stop it.',
          },
          {
            prompt: 'After the November 2022 low, the VN-Index recovered. Which statement is true?',
            options: [
              'Every stock returned to its old high',
              'An index recovery doesn’t mean every stock recovers; many speculative names stayed far below their highs',
              'The recovery was driven by further rate hikes',
              'Individual investors were record net buyers at the bottom',
            ],
            correct_index: 1,
            explanation: 'The index is led by large caps. Stocks that rose on speculation in 2021 may never regain their peaks — which is why business quality matters when going through a crisis.',
          },
        ],
      },
      {
        slug: 'global-crises-from-1929-to-2022',
        title: 'Global crises: from 1929 to 2022',
        summary: 'The Great Depression, Black Monday, the dot-com bust, the 2008 financial crisis, Covid and 2022 — how far markets fell and how long they took to recover.',
        content_md: `## Why study world history?

Vietnam's stock market is young. The US market has nearly a century of data, which shows patterns that repeat: **every crisis has different causes, but human behaviour looks remarkably similar**.

Note: the figures below are **price-only index levels, excluding dividends and inflation**, measured peak to trough on closing prices. Including dividends, recovery times are usually shorter.

## Summary table

| Event | Index | Peak-to-trough fall | Time to regain the old peak (price) |
|---|---|---|---|
| Great Depression 1929–1932 | Dow Jones | about **89%** | about **25 years** (1954) |
| Black Monday, 19 Oct 1987 | Dow Jones | **22.6% in one day** | under 2 years (1989) |
| Dot-com bust 2000–2002 | Nasdaq | nearly **78%** | about **15 years** (2015) |
| Dot-com bust 2000–2002 | S&P 500 | about **49%** | about 7 years (2007) |
| Global financial crisis 2007–2009 | S&P 500 | about **57%** | about 5.5 years (2013) |
| Covid 2020 | S&P 500 | about **34%** in just over a month | about 5 months (August 2020) |
| Inflation and rate hikes 2022 | S&P 500 | about **25%** | about 2 years (January 2024) |

## 1929: leverage and the Great Depression

The 1920s were boom years in the US. Investors often paid only about **10% of a share's price** and borrowed the rest, using the shares as collateral. The Dow peaked in September 1929; it crashed in October and had lost almost half its value by mid-November. The final low came in July 1932, about 89% below the peak. In nominal price terms the Dow didn't regain its high until 1954 — although researchers point out that, counting dividends and deflation, diversified investors broke even much sooner. The lesson: **heavy leverage plus policy mistakes** can turn a downturn into a catastrophe.

## 1987: a crash in a single day

On 19 October 1987 the Dow fell **22.6%** — the largest one-day percentage drop in its history. "Portfolio insurance" strategies that automatically sold futures as prices fell amplified the plunge. The Fed quickly pledged to provide liquidity, and the market surpassed its old high less than two years later. The lesson: **a crash doesn't need a recession** — market structure and cascading selling can be enough.

## 2000–2002: a great story at an absurd price

The internet really did change the world — but tech stock prices in the late 1990s ran years ahead of reality. The Nasdaq peaked at about 5,048 points in March 2000 and fell to about 1,114 in October 2002. Many dot-com companies disappeared entirely. The lesson: **a technology can be right and still be a bad investment if you pay too much**.

## 2007–2009: a credit crisis

Loose mortgage lending, complex financial products and extreme leverage at investment banks. When house prices fell, the whole credit system froze; the S&P 500 fell about 57% from October 2007 to March 2009 and only closed above its old high in March 2013. The lesson: **when the crisis is inside the banking system, recovery tends to be slow**.

## 2020: the fastest on record

The S&P 500 fell about 34% in roughly a month (19 February – 23 March 2020) — the fastest bear market ever recorded. Thanks to massive monetary and fiscal support, it hit a new high on 18 August 2020. The lesson: **policy response can shorten a crisis dramatically**.

## 2022: when rates came back

The highest inflation in decades forced the Fed to raise rates aggressively. The S&P 500 fell about 25% from early January to October 2022; expensive growth stocks and bonds fell together. The lesson: **interest rates change the valuation of every asset**.

## What they have in common

- Falls of 30–50% are not rare; falls of 80–90% usually come with **extreme bubbles and leverage**.
- Recovery times **vary enormously** — from months to decades — depending on starting valuations and the policy response.
- Nobody calls the exact bottom; the strongest up-days often arrive in the middle of the chaos.

## Sources

- Federal Reserve History — Stock Market Crash of 1929: https://www.federalreservehistory.org/essays/stock-market-crash-of-1929
- Federal Reserve History — Stock Market Crash of 1987: https://www.federalreservehistory.org/essays/stock-market-crash-of-1987
- BizNews/AFP — Nasdaq shakes off dot-com losses 15 years later: https://www.biznews.com/briefs/nasdaq-shakes-off-dot-com-losses-15-years-later
- Wikipedia — Closing milestones of the S&P 500 (2000, 2007, 2009, 2013, 2020 and 2022 highs and lows): https://en.wikipedia.org/wiki/Closing_milestones_of_the_S%26P_500
- Boston Globe/AP — S&P 500 closes at record, erasing last of pandemic losses: https://www.bostonglobe.com/2020/08/18/business/sp-500-closes-record-erasing-last-pandemic-losses/
- NBC News — S&P 500 hits all-time high, surpassing previous record set in 2022 (19 January 2024): https://www.nbcnews.com/business/markets/sp-500-hits-time-high-surpassing-previous-record-set-2022-rcna134839
- History News Network — Mark Hulbert: 25 years to bounce back? Try 4 1/2 (1929 with dividends and deflation): https://historynewsnetwork.org/article/79770

## Practice

Pick two events in the table with **similar declines** but **very different recovery times** (for example the dot-com bust on the S&P 500 and Covid 2020). Write 3–4 lines in your journal explaining why: how did the starting valuation, the cause of the crisis and the policy response differ? Then open **Markets › Vietnam stocks** and compare with the VN-Index's 2022 decline.`,
        questions: [
          {
            prompt: 'Why did the Nasdaq take about 15 years to regain its 2000 peak, while the S&P 500 needed only months after the 2020 fall?',
            options: [
              'Because fewer companies were listed in 2000',
              'Because valuations in early 2000 were extremely high relative to earnings, while 2020 was a temporary shock met with strong policy support',
              'Because the Nasdaq has no tech stocks',
              'Because nobody sold shares in 2020',
            ],
            correct_index: 1,
            explanation: 'Recovery time depends heavily on starting valuation and the nature of the shock. A valuation bubble needs years for earnings to "catch up" with prices; a temporary shock with strong support can recover quickly.',
          },
          {
            prompt: 'What does Black Monday 1987 show?',
            options: [
              'Crashes only happen in recessions',
              'Market structure and cascading selling (such as automatic selling) can cause a crash without a recession',
              'The Fed never intervenes in markets',
              'Markets take decades to recover',
            ],
            correct_index: 1,
            explanation: 'There was no major recession in 1987. Automatic selling strategies amplified the fall, and the market surpassed its old high in under two years.',
          },
          {
            prompt: 'When you read “the Dow took 25 years to regain its 1929 high”, what should you keep in mind?',
            options: [
              'The figure is in nominal price terms, excluding dividends and deflation, so a diversified investor’s real break-even may have come sooner',
              'The figure already includes dividends',
              'The figure applies to every stock',
              'The figure proves stocks never make money',
            ],
            correct_index: 0,
            explanation: 'Index figures are usually price-only. Dividends and changes in the price level can change the real picture significantly — always ask “what exactly does this number measure?”.',
          },
          {
            prompt: 'What do the historic 80–90% declines (1929, Nasdaq 2000) have in common?',
            options: [
              'They all happened in summer',
              'They all grew out of extreme valuation bubbles and/or heavy leverage',
              'Each was caused by a single company',
              'They all recovered within a year',
            ],
            correct_index: 1,
            explanation: 'The deepest falls tend to follow periods when prices detach from real value and borrowed money is everywhere — just like Vietnam’s 2007 bubble.',
          },
        ],
      },
      {
        slug: 'anatomy-of-a-crash-and-gloomy-markets',
        title: 'Anatomy of a crash and of gloomy markets',
        summary: 'The recurring phases of a crash — from leverage build-up to slow recovery — signs of a top, signs of a bottom, and why timing is so hard.',
        content_md: `## History doesn't repeat, but it rhymes

Look back at Vietnam in 2007 or the US in 2000 and 2008 and you see a common "script". The economist **Hyman Minsky** captured it in one idea: **stability breeds instability** — because calm periods encourage people to borrow more and take bigger risks.

## The seven phases of a crash cycle

| Phase | What happens | Typical mood |
|---|---|---|
| 1. **A new story** | Technology, reforms, easy policy — real reasons for optimism | "This time is different" |
| 2. **Credit and leverage build-up** | Low rates; margin and borrowing grow fast | "Not borrowing is a waste" |
| 3. **Euphoria** | Newcomers pour in, the weakest stocks rise most, valuation is ignored | "Everyone is getting rich" |
| 4. **Trigger** | Rate hikes, credit squeeze, a blow-up, an external shock | "It's just a correction" |
| 5. **Forced selling** | Margin calls, liquidations, fund redemptions — selling at any price | "It'll bounce" → anxiety |
| 6. **Capitulation** | Volume spikes on heavy down days, bad news everywhere | "I'm never touching stocks again" |
| 7. **Policy response and slow recovery** | Rate cuts, liquidity, bad-debt clean-up; prices drift sideways for a long time | Boredom, disbelief |

Not every cycle has all seven phases, and their length varies enormously. In 2020 phases 4–7 played out in weeks; in Vietnam, 2008–2012 lasted years.

## Long gloomy markets

After a crash, markets often don't bounce straight back but **move sideways or drift lower** for a long time: low liquidity, nobody cares about the news, and those who stayed are exhausted. This phase is **dangerous in a different way**: you don't lose much on any one day, but it's easy to give up, overtrade out of boredom, or sell just before a new trend begins.

## How long do bear markets last?

According to Hartford Funds' statistics on the S&P 500 since 1928:

- A bear market (a fall of 20% or more) has lasted about **289 days (about 9.6 months)** on average, with an average decline of about **35%**.
- A bull market has lasted about **2.7 years** on average, with an average gain of about **112%**.
- There have been about **27** bear markets since 1928 — on average one every few years.

In other words: **bear markets are usually shorter than bull markets**, but the time to **regain the old peak** can be much longer than the decline itself. Emerging markets such as Vietnam are typically more volatile than these US averages.

## Signs near a top and near a bottom

| Often seen near a top | Often seen near a bottom |
|---|---|
| Record margin and borrowing | Margin already slashed by liquidations |
| Surging new accounts; people with no interest in finance talk stocks | Gloomy media; many people announce they are quitting the market |
| Low-quality stocks rise the most | Good stocks are sold alongside bad ones |
| Valuations high versus history | Valuations low versus history |
| Central banks start tightening | Central banks switch to easing |

**But be honest:** these signs can persist for months, even years, before the real top or bottom arrives. An "expensive" market can get more expensive; a "bottom" can have several lower bottoms. According to Hartford Funds, about **42%** of the S&P 500's strongest days in the last 20 years came during bear markets — the best and worst days often **sit right next to each other**.

So use these signs to **adjust your level of risk** (less leverage in euphoria, discipline in pessimism), not to bet everything on one moment.

## Sources

- Hartford Funds — Bear Markets (S&P 500 statistics since 1928): https://hartfordfunds.com/practice-management/client-conversations/managing-volatility/bear-markets.html
- Federal Reserve History — Stock Market Crash of 1929: https://www.federalreservehistory.org/essays/stock-market-crash-of-1929
- The Investor — Vietnam stock market up, down with many records in 2022: https://theinvestor.vn/vietnam-stock-market-up-down-with-many-records-in-2022-d3045.html

## Practice

On **Markets › Vietnam stocks**, pick a large decline in the VN-Index chart and try to map the **seven phases** above onto the price action. Note: which phase is clearest, and which would be hardest to recognise while it is happening? Then write one personal rule, for example: "When I see signs of euphoria, I don't use margin."`,
        questions: [
          {
            prompt: 'According to Minsky’s idea, why can a long period of stability lead to a crisis?',
            options: [
              'Because stability makes people confident enough to borrow more and take bigger risks',
              'Because stability automatically raises interest rates',
              'Because companies stop operating when markets are stable',
              'Because no one buys stocks in a stable market',
            ],
            correct_index: 0,
            explanation: 'Long calm makes risk look small, so leverage and speculation build up — setting the stage for a collapse once a trigger arrives.',
          },
          {
            prompt: 'Why is the “forced selling” phase of a crash so dangerous?',
            options: [
              'Because sellers get to choose the best price',
              'Because sellers must sell regardless of price (liquidations, redemptions), pushing prices lower and triggering more selling',
              'Because it increases dividends',
              'Because it only happens in bull markets',
            ],
            correct_index: 1,
            explanation: 'Forced selling creates a spiral: prices fall → liquidations → more selling → prices fall further. That is how leverage amplifies a crisis.',
          },
          {
            prompt: 'How should you use “signs of a top” such as record margin and a flood of newcomers?',
            options: [
              'Short everything immediately',
              'As a signal to reduce leverage and manage risk, because they don’t tell you exactly when the top will come',
              'Ignore them completely',
              'Borrow more to buy before prices rise further',
            ],
            correct_index: 1,
            explanation: 'Such signs can last for months before a top appears. Using them to adjust your risk is more sensible than betting on a specific moment.',
          },
          {
            prompt: 'Based on long-term S&P 500 statistics, which statement is true?',
            options: [
              'Bear markets last longer than bull markets on average',
              'Bear markets are shorter than bull markets on average, and many of the strongest days fall within bear markets',
              'Bear markets only happen every 50 years',
              'The strongest days always come when markets are calm',
            ],
            correct_index: 1,
            explanation: 'On average bear markets last about 9–10 months and bull markets about 2.7 years. Big up and down days cluster in turbulent periods, so stepping out to “dodge” them easily means missing the rebound.',
          },
        ],
      },
      {
        slug: 'surviving-and-acting-in-market-storms',
        title: 'Surviving and acting in market storms',
        summary: 'Position sizing, no margin, a cash buffer, DCA, rebalancing, a journal and a “storm checklist” so you are never forced to sell at the bottom.',
        content_md: `## Goal number one: stay in the game

The previous lessons show that the biggest losers in a crisis are usually not those who picked the wrong stock, but those **forced to sell at the bottom** — because of debt, an urgent need for cash, or simply being unable to bear it. The maths of losses is also brutal:

| Decline | Gain needed to break even |
|---|---|
| 20% | 25% |
| 33% | 50% |
| 50% | 100% |
| 80% | 400% |

So a good storm strategy starts **before the storm arrives**.

## 1. Position sizing and no margin

As in the lesson **Position sizing and the 1–2% rule**, decide the maximum amount you are willing to lose. In a crisis individual stocks can fall 50–80%; if one stock is 40% of your portfolio, that alone is enough to make you panic. **Not using margin** (or using very little) is the simplest way to never be liquidated.

## 2. An emergency cash fund

Keep **living-expense cash** (many experts suggest a few months of spending) outside your brokerage account. Financial crises often come with economic hardship — job losses, lower income. If you must sell shares to pay rent right at the market bottom, that is forced selling even though nobody issued a margin call. Some **cash inside the portfolio** also gives you the option to buy when prices are low.

## 3. DCA or lump sum?

- **DCA (dollar-cost averaging):** invest in equal amounts each month. Its biggest advantage is **psychological**: you don't need to guess the bottom, and falling prices buy you more shares.
- **Lump sum:** Vanguard's research across several markets found that investing a lump sum beat DCA in about **two-thirds** of periods, because markets rise more often than they fall.

There's no "always right" choice. If a large sum would keep you awake at night, spreading it over a few months is a reasonable trade-off between expected return and your ability to stay disciplined.

## 4. Rebalancing

Set a target allocation in advance, for example 60% stocks – 40% deposits/bonds. When stocks fall sharply their weight drops; **rebalancing** means moving some money from the safe part into stocks to restore the target — automatically "buying low" without guessing the bottom. In euphoria it forces you to trim.

## 5. Focus on quality

A crisis is a test of the **balance sheet**. Companies with little debt, real cash flow and essential products are more likely to survive and recover. 2022 showed that stocks driven up by speculation may never return to their highs.

## 6. A storm journal

Write it down **before you act**: what you plan to do, why, and how you feel. Rereading it 3–6 months later gives you real data on your own reactions — worth more than any forecast.

## Behavioural traps

- **Panic-selling with the crowd** when bad news piles up, then sitting out the entire recovery.
- **Catching a falling knife with borrowed money**, or throwing everything into the first "bottom".
- **Anchoring to your purchase price**: "I'll sell once I'm back to break-even" instead of reassessing the business.
- **Undisciplined averaging down** into a deteriorating stock.
- **Boredom in sideways markets**: trading constantly to feel something, switching strategy every month, or giving up just before a new trend begins.
- **Checking prices every minute**: the more you watch, the more likely you are to act on emotion.

## Storm checklist

1. Am I using margin? If so, how much further can prices fall before a margin call?
2. Do I have a few months of living expenses in cash outside my brokerage account?
3. What % of my portfolio is my largest holding? If it fell 50%, what % of my total wealth would I lose?
4. Are the businesses I own still sound on debt and cash flow, or is it only their price that has fallen?
5. How far is my stock allocation from target? Do I need to rebalance?
6. Is my plan for buying more (if any) split into several tranches with amounts set in advance?
7. Have I written down my reasons and feelings before placing the order?
8. Would I make this decision if the market were calm?

## Sources

- Hartford Funds — Bear Markets (S&P 500 statistics since 1928): https://hartfordfunds.com/practice-management/client-conversations/managing-volatility/bear-markets.html
- A Wealth of Common Sense — The Lump Sum vs. Dollar Cost Averaging Decision (summarising Vanguard's research): https://awealthofcommonsense.com/2018/05/the-lump-sum-vs-dollar-cost-averaging-decision/
- Federal Reserve History — Stock Market Crash of 1929 (margin leverage): https://www.federalreservehistory.org/essays/stock-market-crash-of-1929

## Practice

Answer the **storm checklist** for your current portfolio in the [Journal](/journal). Then open **Markets › Vietnam stocks**, pick the deepest decline you can see on the VN-Index chart and simulate it: if your portfolio fell by exactly that much, what would you do at each step of the checklist?`,
        questions: [
          {
            prompt: 'A portfolio falls 50%. What % gain is needed to get back to the starting value?',
            options: ['50%', '75%', '100%', '150%'],
            correct_index: 2,
            explanation: 'From 100 down to 50, getting back to 100 needs a gain of 50 on a base of 50 — that is 100%. That’s why avoiding big losses matters more than chasing big gains.',
          },
          {
            prompt: 'Why does a living-expense cash fund outside your brokerage account matter in a crisis?',
            options: [
              'Because cash always earns more than stocks',
              'Because it means you won’t have to sell shares at the bottom if you hit personal financial trouble',
              'Because brokers require it',
              'Because cash is tax-free',
            ],
            correct_index: 1,
            explanation: 'Financial crises often bring economic hardship. A cash buffer helps you avoid “forced selling” for personal needs right when prices are lowest.',
          },
          {
            prompt: 'What does rebalancing during a sharp market fall achieve?',
            options: [
              'It automatically buys more stocks when they are cheap to restore the target allocation, without guessing the bottom',
              'It sells all stocks to hold cash',
              'It increases margin to buy more',
              'It has no effect at all',
            ],
            correct_index: 0,
            explanation: 'When stocks fall, their weight drops below target. Rebalancing moves money from the safe part into stocks — a disciplined rule in place of emotion.',
          },
          {
            prompt: 'Which statement about DCA versus lump-sum investing is most sensible?',
            options: [
              'DCA always earns more than a lump sum',
              'A lump sum has statistically tended to do better, but DCA can help you stay disciplined and reduce regret',
              'You should never buy when the market is falling',
              'DCA only works with borrowed money',
            ],
            correct_index: 1,
            explanation: 'Vanguard’s research found lump-sum investing won in about two-thirds of periods, but a plan you can actually stick to in a storm matters more than the optimal plan on paper.',
          },
        ],
      },
    ],
  },
]
