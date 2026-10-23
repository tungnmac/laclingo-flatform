import type { SeedChapter } from './types'

// Market sentiment (en) — follows the 'risk-and-psychology' chapter (stop-loss, position sizing, journaling & FOMO):
// this chapter zooms out from your own emotions to the crowd's. No current readings of any indicator are given.
export const EN_PSYCHOLOGY: SeedChapter[] = [
  {
    slug: 'market-sentiment',
    title: 'Market sentiment and crowd behaviour',
    description:
      'The emotion cycle, reading sentiment in Vietnam and global markets, behavioural biases, news and expectations, and contrarian thinking.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'market-emotion-cycle',
        title: 'The market emotion cycle',
        summary:
          'Markets move through a recurring loop of emotions, from optimism to euphoria to panic. Knowing roughly where you are in that loop helps you avoid buying tops and selling bottoms.',
        content_md: `## Prices are collective emotion

In the **Risk management and psychology** chapter you learned to control **your own** emotions with stop-losses, position sizing and a journal. This chapter zooms out to the emotions of **the whole crowd**. Every price is where thousands of buyers and sellers meet, each carrying hope, greed and fear. When most of them feel the same thing at once, prices are pushed further than the fundamentals alone would justify.

## The cycle of market emotions

A very popular illustration is the **"cycle of market emotions"**, usually traced back to a chart published by Westcore Funds in the late 1990s and later reused by asset managers such as Russell Investments. It splits the loop into these main stages (the original has 14, adding phases such as desperation, panic and depression):

**Optimism → Excitement → Thrill → Euphoria → Anxiety → Denial → Fear → Capitulation → Despondency → Hope → Relief → (Optimism again)**

Treat it as an **illustrative model**, not a law: no two cycles are identical, a phase can last weeks or years, and markets sometimes skip a phase entirely.

## What each phase typically looks like

| Phase | Price | Volume | News flow & social media |
|---|---|---|---|
| **Optimism, excitement** | Steady rise, shallow pullbacks | Rising gradually | Good news starts to get attention |
| **Thrill** | Rising faster | High | People share gains, "this time is different" |
| **Euphoria** | Near-vertical rise | Spikes, record turnover | Media and chat groups everywhere; newcomers pour in |
| **Anxiety, denial** | First sharp drop, weak bounce | Falls on the bounce | "Just a healthy correction", averaging down |
| **Fear** | Lower lows | Rises on down days | Bad news multiplies, heated debates |
| **Capitulation** | Deep drop, many limit-down sessions | Very high (forced selling) | Panic, selling at any price, margin calls |
| **Despondency** | Flat at low levels | Dried up | Nobody wants to talk about markets |
| **Hope, relief** | Starts making higher lows | Picking up slightly | Scepticism: "probably just a bounce" |

Two points stand out:

- **Risk is usually highest during euphoria** — exactly when people feel safest.
- **Potential opportunity is usually greatest during capitulation and despondency** — when people feel least safe. But a bottom is only obvious in hindsight; while you are in it, you cannot know how much further price will fall.

## "The crowd is right in the middle, wrong at the extremes"

This phrase sums up how to use crowd sentiment:

- **In the middle of a trend**, the crowd is usually **right**: price rises because many people buy, and more buying pushes it higher. Fighting the crowd here is standing in front of a train.
- **At the extremes**, the crowd is usually **wrong**: when almost everyone has already bought (euphoria), few new buyers are left to push prices up; when almost everyone has already sold (capitulation), little selling pressure remains.

So crowd sentiment is **not a daily entry/exit signal**. It is context that tells you when to be more careful and when to be more patient.

## Why it is hard to see your own phase

You are part of the crowd. In euphoria everyone around you is making money, so staying out feels "stupid". In capitulation your losing account makes objectivity almost impossible. Three self-checks:

1. **Reread your journal**: what emotions have you logged most in recent weeks — confidence, FOMO or fear?
2. **Watch the people around you**: are friends who never invested asking what to buy? Or does everyone avoid the subject?
3. **Compare with data**: do volume and market breadth (next lesson) confirm your feeling?

## Practice

Pick a market you know (for example an index or BTC) in [Markets](/markets), switch to the weekly timeframe and review the last 2–3 years. Mark by hand the stretches you think match **euphoria**, **capitulation** and **hope**. In your journal, note what volume looked like, how you (or people you know) felt at the time, and how you would adjust your position size if you could do it again.

## Sources

- [Russell Investments — Keep calm in volatile markets: the cycle of market emotions](https://russellinvestments.com/au/insights/library/keep-calm-in-volatile-markets-cycle-of-emotions)
- [StockBrokers.com — Trading psychology: stages of investor emotions](https://www.stockbrokers.com/education/trading-psychology-stages-investor-emotions)`,
        questions: [
          {
            prompt: 'According to the emotion-cycle model, in which phase is risk usually highest?',
            options: ['Despondency', 'Euphoria', 'Hope', 'Capitulation'],
            correct_index: 1,
            explanation:
              'In euphoria prices have risen steeply, almost everyone has bought and people feel safest — which is when downside risk is greatest. Despondency and capitulation sit near the bottom.',
          },
          {
            prompt: 'What does "the crowd is right in the middle, wrong at the extremes" suggest about using sentiment?',
            options: [
              'Always do the opposite of the majority every session',
              'Always follow the majority because it is always right',
              'Follow the trend when sentiment is normal; become cautious or consider contrarian moves only at extremes',
              'Ignore sentiment entirely because it never affects price',
            ],
            correct_index: 2,
            explanation:
              'Mid-trend, continued buying keeps pushing price, so fighting it usually loses. Only at extremes — when nearly everyone has bought or sold — does crowd sentiment become a warning sign.',
          },
          {
            prompt: 'Which description best fits capitulation?',
            options: [
              'Flat prices, dried-up volume, nobody cares',
              'Steady rise with shallow pullbacks',
              'Deep drop on very high volume, investors selling at any price',
              'Near-vertical rise with media coverage everywhere',
            ],
            correct_index: 2,
            explanation:
              'Capitulation is panic selling: sharp falls, very heavy volume, margin calls. Flat prices with dried-up volume describe the despondency phase that follows.',
          },
          {
            prompt: 'Lan notices that friends who never invested keep asking what to buy, and turnover keeps hitting records. What is the most reasonable response?',
            options: [
              'Borrow more on margin to ride the wave',
              'Treat it as a sign of hot sentiment, review stop-losses and consider not adding to positions',
              'Short everything immediately because a crash is certain',
              'Do nothing, since crowd sentiment has nothing to do with risk',
            ],
            correct_index: 1,
            explanation:
              'Newcomers flooding in and record turnover are typical of euphoria. That is a reason to tighten risk management and avoid extra leverage — not proof that a crash is imminent.',
          },
        ],
      },
      {
        slug: 'reading-vietnam-market-sentiment',
        title: 'Reading sentiment in the Vietnamese stock market',
        summary:
          'Turnover, margin debt, new trading accounts, foreign flows, market breadth and limit-up/limit-down counts — each tells part of the story about Vietnamese investor sentiment.',
        content_md: `## Why Vietnam needs its own gauges

Vietnam's stock market has features that make crowd psychology especially powerful: **retail investors** account for a large share of trading, **margin** lending is widespread, and there are **daily price limits** (normally ±7% on HOSE, ±10% on HNX and ±15% on UPCoM, with some special cases). Price limits make waves of euphoria or panic very visible through the number of **limit-up (trần) and limit-down (sàn)** stocks.

No single gauge is enough. Treat each one below as a thermometer measuring a different aspect.

## 1. Turnover (trading value — GTGD)

**How to read it:** compare a session's or week's trading value with **its own 20-session (or 50-session) average**. Do not compare absolute numbers across years, because the size of the market keeps changing.

- Rising prices + turnover several times above average for a sustained period → eager money, possibly overheating.
- Sharp fall + turnover spike → possible panic selling, sometimes near capitulation.
- Turnover drying up for weeks at low prices → despondency.

## 2. Margin debt

**How to read it:** track the margin loan balances that brokerages report quarterly (in their financial statements), relative to their own history and to market capitalisation.

- Balances rising fast to record levels → lots of leverage; the market becomes fragile because **margin calls and forced liquidation** can create a selling spiral.
- Balances falling sharply after a sell-off → leverage has been flushed out, and forced selling pressure eases.

Note: quarterly data **lags**.

## 3. New trading accounts — "F0 waves"

**F0** is Vietnamese slang for brand-new investors. The monthly count of new accounts published by VSDC (the Vietnam Securities Depository and Clearing Corporation) is a good gauge of how far market enthusiasm has spread. A big F0 wave usually accompanies strong rallies and "everyone is making money" stories; when new accounts jump to rarely seen levels, sentiment has spread beyond the usual investing crowd.

## 4. Foreign net buying/selling (khối ngoại)

**How to read it:** accumulate foreign investors' net buy/sell value by week and month.

- Foreign flows are often driven by **global macro factors** (USD rates, exchange rate, ETF allocation), not only local sentiment.
- One big net-buy or net-sell session may just be an **ETF rebalance** or a negotiated block trade — do not over-read a single day.
- Locals selling while foreigners keep buying (or the reverse) for weeks shows the two groups disagree — worth investigating why.

## 5. Market breadth

- **Advancers vs decliners** each session: if the index rises while decliners outnumber advancers, the rally is narrow and depends on a few heavyweights.
- **% of stocks above their 200-day moving average (MA200)**: very high means most stocks have already rallied — the market is "well bought"; very low means most stocks are in long-term downtrends — near pessimistic territory.

## 6. Limit-up / limit-down counts

Thanks to price limits, this is a very intuitive emotional thermometer for Vietnam:

- Hundreds of stocks at limit-down, many with **no bids at all** (trắng bên mua) → panic, selling at any price.
- Lots of consecutive limit-up sessions, especially in small speculative stocks → euphoria, widespread speculation.

## 7. Retail vs institutional share

When retail's share of trading rises and money concentrates in small caps, the market tends to be more volatile and more sensitive to rumours. Institutions (funds, proprietary desks) trade by process and move more slowly.

## Summary table (illustrative thresholds)

| Gauge | Suggests "hot" | Suggests "cold" |
|---|---|---|
| Turnover vs 20-session average | Several times higher, sustained | Clearly lower, sustained |
| Margin debt | Record high, rising fast | Falling sharply after forced selling |
| New accounts | Surging, rarely seen levels | Back to low levels |
| % stocks above MA200 | Illustrative example: above 80% | Illustrative example: below 20% |
| Limit-up / limit-down counts | Mass limit-ups in small caps | Mass limit-downs, no bids |

The 80%/20% levels are **illustrative only**, not standards. Suitable thresholds **depend on context**: today's market is a different size from five years ago, margin rules change, and markets can stay "hot" for quite a while.

## Practice

Build a table with five columns: turnover vs 20-session average, foreign net flow for the week, advancers/decliners, limit-up/limit-down counts, and a news note. Fill it for **4 consecutive weeks** from your broker's price board. Each weekend, judge the market as "hot", "neutral" or "cold", then check after 1–2 months whether that judgement helped your position-size decisions.

## Sources

- [DSC Securities — Trading bands on HOSE, HNX and UPCoM (Vietnamese)](https://www.dsc.com.vn/kien-thuc/bien-do-giao-dich-san-chung-khoan-hose-hnx-upcom)
- [DNSE — Stock price bands explained (Vietnamese)](https://www.dnse.com.vn/hoc/bien-do-dao-dong-gia-co-phieu)`,
        questions: [
          {
            prompt: 'Why compare turnover with its own 20-session average instead of comparing absolute figures across years?',
            options: [
              'Because market size changes over time, so absolute figures are hard to compare',
              'Because regulations require the 20-session average',
              'Because absolute turnover never changes',
              'Because the 20-session average predicts tomorrow\'s price exactly',
            ],
            correct_index: 0,
            explanation:
              'The number of listed companies, investors and market cap change over the years. Comparing with a recent average shows whether turnover is relatively high or low, which is what matters for current sentiment.',
          },
          {
            prompt: 'Why does margin debt rising quickly to a record make the market more fragile?',
            options: [
              'Because margin doubles trading fees',
              'Because a drop can trigger margin calls and forced liquidation, adding selling pressure',
              'Because foreigners are banned from buying when margin is high',
              'Because stocks cannot hit limit-up when margin is high',
            ],
            correct_index: 1,
            explanation:
              'With heavy leverage, falling prices leave accounts under-margined; brokers force-sell, which pushes prices lower and can create a forced-selling spiral.',
          },
          {
            prompt: 'The VN-Index closes higher, but decliners clearly outnumber advancers. What does this suggest?',
            options: [
              'A very broad and healthy rally',
              'Foreigners must be net buyers',
              'A narrow rally that may rely on a few heavyweight stocks',
              'There were no block trades that day',
            ],
            correct_index: 2,
            explanation:
              'Breadth shows how many stocks participate in a move. An index lifted by a few large caps while most stocks fall is a less durable advance.',
          },
          {
            prompt: 'Foreign investors post a very large net sell in one session. What is the most careful interpretation?',
            options: [
              'The market will certainly fall hard for weeks',
              'Check whether it was an ETF rebalance or block trade, and look at the multi-week cumulative trend',
              'Sell the whole portfolio within the session',
              'Ignore it because foreign flows never affect prices',
            ],
            correct_index: 1,
            explanation:
              'Foreign flows are shaped by ETFs, exchange rates and global rates. A single session may be technical; the cumulative weekly or monthly trend is more meaningful.',
          },
        ],
      },
      {
        slug: 'global-sentiment-gauges',
        title: 'Global sentiment gauges',
        summary:
          'VIX, the CNN Fear & Greed Index, the AAII survey, the put/call ratio, fund-manager surveys and the Crypto Fear & Greed Index: what each measures, its limits, and why contrarian use only makes sense at extremes.',
        content_md: `## Why Vietnamese investors should know them too

Sentiment in US equities and crypto spreads everywhere through foreign capital flows, exchange rates and social media. The gauges below are public and have long histories, which makes them great for practising sentiment reading. This lesson explains how to read them — it gives no current readings.

## 1. VIX — the "fear gauge"

**VIX**, calculated by Cboe, measures the **market's expectation of S&P 500 volatility over the next 30 days**, derived from S&P 500 index option prices. It is **implied** (forward-looking) volatility, unlike **realised** volatility measured from past prices.

- VIX spiking → investors pay up for protection (puts); the market is fearful.
- VIX very low for a long time → complacency, few people hedging.

**Limits:** VIX measures expected volatility, not direction; a low VIX can persist for a long time in an uptrend.

## 2. CNN Fear & Greed Index

A scale from **0 (extreme fear) to 100 (extreme greed)**, with 50 as neutral, built from **seven equally weighted components**:

| Component | What it measures |
|---|---|
| Market momentum | S&P 500 vs its 125-day moving average |
| Stock price strength | Stocks at 52-week highs vs 52-week lows (NYSE) |
| Stock price breadth | Volume in rising vs declining stocks |
| Put and call options | Put/call ratio |
| Junk bond demand | Yield spread between junk and investment-grade bonds |
| Market volatility | VIX vs its 50-day moving average |
| Safe-haven demand | Stock returns vs Treasury returns over the past 20 trading days |

**Limits:** many components overlap (they all react to price), so the index often just "confirms" what has already happened.

## 3. The AAII sentiment survey

The **American Association of Individual Investors (AAII)** asks its members **every week** (since 1987) whether they think the US stock market will be up, down or flat over the **next six months**. The result is three percentages: **bullish / neutral / bearish**. According to AAII, the long-term average bullish reading is around 37.5% — a running average that shifts slightly over time.

**Limits:** a small sample of opinions, not real money; readings jump around week to week. Only readings far from the average deserve attention.

## 4. Put/call ratio

**Put/call ratio** = put option volume / call option volume. High → many people buying downside protection (fear); low → many people betting on gains (greed). **Limits:** some put buying is routine institutional hedging, not a bet; compare with the ratio's own history.

## 5. Fund-manager surveys

A well-known example is **Bank of America's monthly Global Fund Manager Survey**. Commentary often focuses on **cash levels**: very low cash means funds are nearly fully invested with little dry powder left — something the bank uses as a contrarian warning signal. **Limits:** full results are only available to the bank's clients, and the track record of the signal is mostly published by the bank itself, based on a fairly small number of past signals.

## 6. Crypto Fear & Greed Index

The popular version from alternative.me also uses a 0–100 scale, combining Bitcoin **volatility** and **momentum/volume**, **social media**, **surveys** (currently paused), **Bitcoin dominance** and **Google Trends**. **Limits:** crypto is very volatile, so the index can sit at extremes for long stretches; the method is defined by one website and can change.

## Contrarian use — at extremes only

| Situation | Sensible reading |
|---|---|
| Gauge in the middle range | Almost no information — follow the trend and your plan |
| Extreme fear | More downside is still possible, but pessimism is already heavy — time to prepare a watchlist, not to bottom-fish with everything |
| Extreme greed | Does not mean an immediate drop — time to tighten stops and limit leverage |

Rule of thumb: **extremes can last longer than you expect**. Sentiment tells you **which way risk is leaning**, not **when** a reversal will happen.

## Practice

Choose two gauges from this lesson (for example VIX and the Crypto Fear & Greed Index). For 4 weeks, every Monday, log their readings in your journal together with the previous week's move in the S&P 500 or BTC. At the end, answer: did the gauge move **before** or **after** price? Did it ever reach an extreme?

## Sources

- [Cboe — VIX FAQs](https://www.cboe.com/tradable_products/vix/faqs)
- [CNN — Fear & Greed Index (with an explanation of the seven indicators)](https://www.cnn.com/markets/fear-and-greed)
- [AAII — Sentiment Survey](https://www.aaii.com/sentimentsurvey)
- [Alternative.me — Crypto Fear & Greed Index](https://alternative.me/crypto/fear-and-greed-index/)`,
        questions: [
          {
            prompt: 'What does VIX measure?',
            options: [
              'Expected S&P 500 returns over the next year',
              'Expected S&P 500 volatility over the next 30 days, derived from option prices',
              'The number of rising stocks on the NYSE',
              'Realised S&P 500 volatility over the past 30 days',
            ],
            correct_index: 1,
            explanation:
              'VIX is implied, forward-looking 30-day volatility calculated from S&P 500 option prices. It measures neither returns nor direction, and differs from realised volatility based on past data.',
          },
          {
            prompt: 'Which of these is NOT one of the seven components of the CNN Fear & Greed Index?',
            options: ['Put/call ratio', 'Junk bond demand', 'Google search volume for stocks', 'S&P 500 vs its 125-day average'],
            correct_index: 2,
            explanation:
              'Google Trends is a component of the alternative.me Crypto Fear & Greed Index, not CNN\'s. CNN uses momentum, price strength, breadth, put/call, junk bonds, volatility and safe-haven demand.',
          },
          {
            prompt: 'The AAII bullish reading is only slightly above its long-term average. What is the best interpretation?',
            options: [
              'A strong contrarian sell signal',
              'Almost no contrarian information — only readings far from the average matter',
              'The market will certainly rise over the next six months',
              'You must buy more because retail investors are always right',
            ],
            correct_index: 1,
            explanation:
              'Sentiment gauges are only useful contrarian signals at extremes. A small deviation from the average is ordinary noise for a weekly survey.',
          },
          {
            prompt: 'The Crypto Fear & Greed Index is in "extreme fear". Which action fits the spirit of this lesson?',
            options: [
              'Put all your capital in now because the bottom is certain',
              'Sell everything because fear always leads to further falls',
              'Treat it as context: review your watchlist and plan staged entries with clear stop-losses',
              'Increase leverage to exploit the volatility',
            ],
            correct_index: 2,
            explanation:
              'Extremes tell you which way risk leans but not the timing. The sensible approach is to prepare a plan and enter in stages with risk management, rather than making all-in decisions.',
          },
        ],
      },
      {
        slug: 'behavioural-biases-in-trading',
        title: 'Behavioural biases in investing',
        summary:
          'Loss aversion, the disposition effect, anchoring, confirmation bias, overconfidence, recency bias, herding, sunk cost and mental accounting — each with a trading example and a concrete counter-measure.',
        content_md: `## Your brain was not built for markets

**Behavioural finance** studies how people actually make decisions — often deviating from the "rational investor" of textbook models. A cornerstone is **prospect theory**, published by Daniel Kahneman and Amos Tversky in **1979** in the journal Econometrica. It shows that people judge outcomes as **gains or losses relative to a reference point**, and that **losses hurt more than equal-sized gains feel good**.

Knowing about biases is not enough — you need **pre-written rules** to block them when emotions run high. That is why every bias below comes with a concrete counter-measure.

## 1. Loss aversion

The pain of a loss is commonly estimated at **roughly twice** the pleasure of a gain of the same size (a widely cited figure from later work by Tversky and Kahneman, not an exact law). **Example:** refusing to cut a 5% loss because "it is not a loss until I sell". **Counter-measure:** set a stop-loss when you enter, and never move it further away.

## 2. Disposition effect

Shefrin and Statman (1985) described the tendency to **sell winners too early and ride losers too long**. **Example:** a portfolio that ends up full of losers because every winner was sold. **Counter-measure:** exit by **plan** (take-profit, trailing stop), not by whether the trade is green or red; add a journal field: "If I had no position today, would I buy this?"

## 3. Anchoring

Clinging to an arbitrary number — usually your **entry price** or an **old high**. **Example:** "it used to trade at 60,000, so 30,000 is cheap". **Counter-measure:** re-value from current data; write your buy reason **without mentioning past prices**.

## 4. Confirmation bias

Seeking only information that supports your existing view. **Example:** after buying, reading only articles that praise the company. **Counter-measure:** your journal must list **3 reasons this trade could be wrong** before entry.

## 5. Overconfidence

Overrating your own skill. Barber and Odean (2000), studying more than 66,000 households at a US discount broker, found that the most active traders earned noticeably lower net returns than the market. **Example:** after 5 wins in a row, tripling position size. **Counter-measure:** cap risk per trade (the 1–2% rule) and cap the number of trades per week.

## 6. Recency bias

Assuming whatever just happened will continue. **Example:** after three months of gains, believing "risk is low". **Counter-measure:** always check a **higher timeframe** (weekly, monthly) before deciding on a lower one.

## 7. Herd behaviour

Following the majority out of fear of being left behind — the root of the FOMO you already studied. **Example:** buying a stock the whole chat group is hyping. **Counter-measure:** a **24-hour rule** for every idea that comes from a group; enter only if you can still find a clear setup.

## 8. Sunk cost

Continuing because you have "already put in too much". **Example:** repeatedly averaging down on a losing stock because "I've lost so much already". **Counter-measure:** no averaging down unless it was in the original plan with a fixed total risk.

## 9. Mental accounting

Treating money differently depending on where it came from. **Example:** treating profits as "house money" and taking bigger risks with it. **Counter-measure:** every unit in your account is your capital — size risk on your **current total equity**.

## Summary table

| Bias | Familiar inner voice | Counter-measure |
|---|---|---|
| Loss aversion | "Not a loss until I sell" | Fixed stop-loss |
| Disposition effect | "Lock in the profit" | Exit by plan |
| Anchoring | "It used to be 60,000" | Re-value from scratch |
| Confirmation | "Everyone says it's great" | List 3 ways it could be wrong |
| Overconfidence | "This one is a sure thing" | Cap risk and trade count |
| Recency | "It's only gone up lately" | Check the higher timeframe first |
| Herding | "The whole group is buying" | 24-hour rule |
| Sunk cost | "Lost too much to quit now" | No unplanned averaging down |
| Mental accounting | "It's only profit, so play" | Size risk on total equity |

## Practice

Open your [Journal](/journal) and review your last 10 trades. Tag each with any bias that may have influenced it (for example *anchoring*, *herding*, *sunk-cost*). Pick the **one** bias that appears most often, write a rule against it, and apply that rule strictly for the next two weeks.

## Sources

- [Econometric Society — Prospect Theory: An Analysis of Decision under Risk (1979)](https://www.econometricsociety.org/publications/econometrica/1979/03/01/prospect-theory-analysis-decision-under-risk)
- [Wikipedia — Disposition effect](https://en.wikipedia.org/wiki/Disposition_effect)
- [Barber & Odean — The Common Stock Investment Performance of Individual Investors](https://faculty.haas.berkeley.edu/odean/papers/returns/Returns.html)`,
        questions: [
          {
            prompt: 'What behaviour does the disposition effect describe?',
            options: [
              'Spreading capital equally across all stocks',
              'Selling winners too early and holding losers too long',
              'Buying only high-dividend stocks',
              'Always following broker recommendations',
            ],
            correct_index: 1,
            explanation:
              'Shefrin & Statman (1985) described the tendency to "sell winners, ride losers" — a consequence of loss aversion: banking gains for certainty while avoiding realising losses.',
          },
          {
            prompt: 'Minh thinks: "this stock used to be 60,000; at 30,000 it is a bargain." Which bias is this?',
            options: ['Overconfidence', 'Mental accounting', 'Anchoring', 'Recency bias'],
            correct_index: 2,
            explanation:
              'Minh uses an old high as a reference point (anchor) instead of re-valuing the business from current data. A past price says nothing about present value.',
          },
          {
            prompt: 'Which counter-measure directly targets confirmation bias?',
            options: [
              'Writing at least 3 reasons the trade could be wrong before entering',
              'Increasing size after a winning streak',
              'Reading news only about stocks you own',
              'Averaging down when price falls',
            ],
            correct_index: 0,
            explanation:
              'Confirmation bias makes you seek supporting evidence only. Forcing yourself to write counter-arguments actively brings in opposing information.',
          },
          {
            prompt: 'After a big win, Ha treats the profit as "house money" and risks 10% of the account on one trade. Which bias, and which fix?',
            options: [
              'Sunk cost — average down',
              'Mental accounting — size risk per trade on current total equity',
              'Herding — 24-hour rule',
              'Anchoring — check the old high',
            ],
            correct_index: 1,
            explanation:
              'Labelling money by its source is mental accounting. Profits are already your capital; risk per trade should be a fixed share of total equity, such as 1–2%.',
          },
        ],
      },
      {
        slug: 'news-expectations-and-hype',
        title: 'News, expectations and "buy the rumour, sell the news"',
        summary:
          'Prices reflect expectations, not just results. This lesson explains why good news can still sink a stock, how to read earnings surprises, and the warning signs of pump-and-dump schemes.',
        content_md: `## What is already "priced in"?

Markets look ahead. When news is widely anticipated, the price has usually **moved in advance** — the news is said to be **priced in**. So the key question is not "is this news good or bad?" but **"is this news better or worse than what the market expected?"**

## Surprise matters more than the absolute result

An illustrative example with a hypothetical company:

| Case | Quarterly profit | Market expectation | Possible price reaction |
|---|---|---|---|
| A | Up 30% | Up 50% | Falls — below expectations |
| B | Down 10% | Down 30% | Rises — better than feared |
| C | Up 20% | Up 20% | Little change — as expected |

An **earnings surprise** = actual result − expectation (usually the average analyst forecast). Beyond past numbers, markets also react strongly to the **guidance** management gives for coming periods.

## Why good news can make a stock fall

1. **Expectations were too high:** the result was good, but not as good as the rumours suggested.
2. **Buy the rumour, sell the news:** early buyers who bought on the rumour are in profit and **take profits exactly when the official news lands** — just as late buyers rush in.
3. **Weaker outlook:** this quarter was strong, but management warns the next will slow.
4. **Earnings quality:** profit grew thanks to one-offs (asset sales, provision reversals), not the core business.

Conversely, bad news can lift a stock if it is **less bad** than what was priced in, or if it **removes a long-running uncertainty**.

## Narrative cycles

Markets often run on **stories**: public infrastructure spending, market upgrades, AI, industrial parks, a blockchain upgrade... A story typically moves through stages: **few people know → it spreads, prices jump → everyone knows, saturation coverage → real results cannot keep up with expectations → the story cools**. When a story is everywhere in the media and chat groups, much of the expectation may already be in the price.

## Social media, chat groups and pump-and-dump

The US Securities and Exchange Commission (SEC) describes a **pump-and-dump** as having two parts: promoters **pump the price** with false or misleading statements, then **sell** to the late buyers. Targets are often small-cap stocks or illiquid tokens.

**Warning signs:**

- Pressure to **buy now**, "don't miss out", countdown timers.
- Claims of **inside information** or a method that "never fails".
- **Specific price targets** and "guaranteed" profits.
- **Illiquid** names hitting limit-up repeatedly with no official news.
- Promoters who do not disclose that they **hold** the stock or token.
- Closed groups charging for "VIP rooms" and banning sceptics.

## How to trade around scheduled news

Earnings dates, policy meetings and index reviews are known in advance, so you can plan for them instead of reacting:

- **Know the date.** Note upcoming announcements for every position you hold.
- **Decide before, not during.** Write down whether you will hold through the event, reduce size, or stay out — and why.
- **Respect the gap risk.** Price can jump past your stop-loss when news lands, so the real loss can exceed what you planned. A smaller position is often the simplest protection.
- **Wait for the dust to settle.** The first reaction is frequently noisy; a reaction that holds for several sessions tells you more than the first hour.

## Verifying sources

Before acting on any news, run through this checklist:

1. **Origin:** does it appear in the company's, exchange's or regulator's **official disclosures**?
2. **Timing:** is it new, or old news being recycled?
3. **Motive:** what does the messenger gain if you buy or sell?
4. **Priced in:** how much has price already moved before the news?
5. **Reverse scenario:** if the news is true but price still falls, what is your plan?

## Practice

Pick a company that has just reported earnings. Find the expectations beforehand (analyst notes or broker forecasts), compare them with the actual results, and record the price reaction over the next 3 sessions. Write 3–5 sentences in your journal: was there a real surprise, and did the price reaction match it?

## Sources

- [Investor.gov (SEC) — Pump and Dump Schemes](https://www.investor.gov/protect-your-investments/fraud/types-fraud/pump-and-dump-schemes)
- [Investor.gov (SEC) — Social Media and Investing: Avoiding Fraud](https://www.investor.gov/news-alerts/investor-alerts/investor-alert-social-media-investing-avoiding-fraud)`,
        questions: [
          {
            prompt: 'A company reports a 30% profit increase, yet its stock falls. What is the most plausible reason?',
            options: [
              'The exchange miscalculated the price',
              'The market expected a bigger increase, so the result disappointed',
              'Profit growth always makes stocks fall',
              'Stocks are not allowed to rise after earnings',
            ],
            correct_index: 1,
            explanation:
              'Prices reflect expectations. If the market expected +50%, a +30% result is a negative surprise even though the absolute number is good.',
          },
          {
            prompt: 'What does "buy the rumour, sell the news" mean?',
            options: [
              'Only buy once news is official',
              'Early buyers who bought on expectations often take profits when the official news is released',
              'Rumours are always false, so you should short them',
              'Never trade around announcement dates',
            ],
            correct_index: 1,
            explanation:
              'Price rises in advance on expectations; when the news arrives there is no surprise left, and early buyers take profits just as late buyers pile in.',
          },
          {
            prompt: 'Which is the clearest warning sign of a pump-and-dump?',
            options: [
              'The company publishes audited financial statements',
              'A large-cap stock rises slightly along with the market',
              'A chat group urgently pushes an illiquid stock with "inside information" and a guaranteed price target',
              'A broker publishes a research report that also lists risks',
            ],
            correct_index: 2,
            explanation:
              'Urgency to buy, claims of inside information and guaranteed profits on an illiquid name are among the warning signs the SEC lists for pump-and-dump schemes.',
          },
          {
            prompt: 'A chat group says "company X is about to win a huge contract". What should you check FIRST?',
            options: [
              'Buy immediately before the price rises',
              'Forward the message to friends to see what they think',
              'The company\'s and the exchange\'s official disclosure channels',
              'Increase margin for more buying power',
            ],
            correct_index: 2,
            explanation:
              'Origin comes first: news that is not in official disclosures is not yet reliable. Then consider timing, motive and how much is already priced in.',
          },
        ],
      },
      {
        slug: 'contrarian-thinking-sentiment-dashboard',
        title: 'Contrarian thinking and your own sentiment dashboard',
        summary:
          'When to go against the crowd and when not to, and how to combine 3–5 gauges into a weekly score that adjusts position size and cash level instead of making all-in/all-out calls.',
        content_md: `## Contrarian does not mean "always opposite"

A **contrarian** investor does not simply buy when others sell. They look for moments when **sentiment has gone too far relative to reality**, and act only with additional evidence. Being contrarian at the wrong time — for example shorting a strong uptrend just because "it has gone up a lot" — is a fast way to lose money.

## Trend or extreme?

| State | Characteristics | Sensible attitude |
|---|---|---|
| **Normal trend** | Sentiment gauges mid-range, price making highs/lows in one direction | Follow the trend, manage risk as usual |
| **Extreme greed** | Several gauges "hot" at once, newcomers flooding in, high margin | Gradually more cautious: cut leverage, take partial profits, raise cash |
| **Extreme fear** | Several gauges "cold" at once, forced selling, everyone avoiding the market | Prepare: watchlist, plan staged entries |

Two minimum conditions before thinking contrarian:

1. **Several gauges at extremes**, not just one.
2. **Price starts to confirm** — for example it stops making lower lows, or breaks a trendline — rather than guessing the top or bottom.

## Build your own sentiment dashboard

Choose **3–5 gauges** you can get easily each week. An example for someone trading Vietnamese stocks:

| Gauge | −1 (cold) | 0 (neutral) | +1 (hot) |
|---|---|---|---|
| Turnover vs 20-session average | Clearly lower | Around average | Much higher, sustained |
| % stocks above MA200 (illustrative) | Below 20% | 20–80% | Above 80% |
| Limit-down / limit-up counts this week | Mass limit-downs | Balanced | Mass limit-ups in small caps |
| Chat groups, media tone | Nobody talks about it | Normal | Everyone is showing off gains |
| Your own emotion log | Fear, despondency | Calm | FOMO, overconfidence |

Crypto traders could swap in the Crypto Fear & Greed Index, funding rates, Google Trends and so on. The thresholds above are **illustrative examples** only — adjust them to the data and context you observe.

The **total score** runs from −5 to +5. Do not keep changing the set of gauges — consistency matters more than perfection.

## Use the score to adjust, not to go all-in

A common mistake is turning sentiment into all-in buy or sell orders. A more durable approach is to use the score to **adjust your level of risk**:

| Total score | Example adjustment |
|---|---|
| +4 to +5 | No new margin positions, tighter stops, lower risk per trade (e.g. from 1% to 0.5%) |
| +2 to +3 | Stick to the plan, favour partial profit-taking at targets |
| −1 to +1 | Trade your system normally |
| −2 to −3 | Review your watchlist, prepare buy plans |
| −4 to −5 | Deploy capital in small stages once price confirms, always with stop-losses |

These numbers are **examples**, not recommendations. The core idea: the sentiment dashboard only **adjusts** your trading system (position size, cash level, leverage); it does not replace it. Every trade still needs a stop-loss and a position size that follows the rules you have learned.

## A worked example (hypothetical)

Suppose over one week turnover runs well above its average (+1), most stocks are above their MA200 (+1), small caps hit limit-up repeatedly (+1), chat groups are full of profit screenshots (+1), but you personally feel calm (0). Total: **+4**.

Under the example rules above, you would keep your existing positions with their stop-losses, avoid opening anything new on margin and cut risk per new trade. You are **not** predicting a crash — you are simply accepting that the odds of a sharp, sentiment-driven drop are higher than usual and sizing accordingly. If the market keeps rising, you still participate; if it reverses, the damage is smaller.

## Log your own emotions

Sometimes the most important gauge is **you**. If you feel eager, want to borrow more, or get irritated sitting on the sidelines, count that as a "+1". If you cannot bear to open your trading app, that may be a "−1". Logging this regularly lets you compare your feelings with market data over time.

## Practice

1. Choose 4 gauges for your dashboard and write clear −1/0/+1 thresholds for each.
2. Every weekend, score them and record the total in your [Journal](/journal) together with one line about your **emotions** that week (use a tag such as *weekly-sentiment*).
3. After 8 weeks, review: did the score help you avoid chasing or panic-selling? Which gauge is redundant, and which should you add?`,
        questions: [
          {
            prompt: 'Which conditions should be in place before considering a contrarian move?',
            options: [
              'Just one gauge reaching an extreme',
              'Several gauges at extremes and price starting to confirm',
              'Price rising three sessions in a row',
              'A social media celebrity recommending it',
            ],
            correct_index: 1,
            explanation:
              'A single gauge is noisy, and extremes can persist. Agreement between several gauges plus confirmation from price reduces the risk of guessing tops and bottoms.',
          },
          {
            prompt: 'Your dashboard total is +5. Which response fits this lesson?',
            options: [
              'Short your entire account',
              'Borrow on margin to buy more because the market is strong',
              'Reduce risk: no new margin, tighter stops, gradually raise cash',
              'Delete the dashboard because it no longer works',
            ],
            correct_index: 2,
            explanation:
              'A high score means sentiment is hot on several fronts. The dashboard is for adjusting risk gradually, not for making all-in decisions in either direction.',
          },
          {
            prompt: 'Why is shorting a strong uptrend just because "it has risen a lot" a badly timed contrarian move?',
            options: [
              'Because mid-trend the crowd is usually right and buying pressure can keep pushing price',
              'Because short selling is banned in every market',
              'Because prices never fall after rising',
              'Because sentiment gauges are always neutral',
            ],
            correct_index: 0,
            explanation:
              '"Up a lot" is not a sentiment extreme. Mid-trend, money can keep flowing in; going against it without extreme readings and price confirmation is high risk.',
          },
          {
            prompt: 'Why keep the same set of gauges in your dashboard rather than changing them often?',
            options: [
              'Because changing gauges locks your account',
              'Because consistency lets you compare scores over time and judge whether the dashboard helps',
              'Because older gauges are always more accurate',
              'Because exchange rules require it',
            ],
            correct_index: 1,
            explanation:
              'If you keep swapping gauges (often to match how you currently feel), weeks are no longer comparable and you slide into confirmation bias.',
          },
        ],
      },
    ],
  },
]
