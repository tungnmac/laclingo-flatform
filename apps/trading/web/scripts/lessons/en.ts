import type { SeedChapter } from './types'
import { EN_ADVANCED } from './en-advanced'
import { EN_ASSETS } from './en-assets'
import { EN_FUNDAMENTALS } from './en-fundamentals'
import { EN_HISTORY } from './en-history'
import { EN_MACRO } from './en-macro'
import { EN_PRACTICE } from './en-practice'
import { EN_PSYCHOLOGY } from './en-psychology'
import { EN_SECTORS } from './en-sectors'

// English starter curriculum — numbers match TradeLab: 0.1% fee, 10,000 USDT wallet, no leverage, shorts at 100% margin.
export const EN: SeedChapter[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    description: 'The crypto market, order types, fees and the two directions: long and short.',
    lessons: [
      {
        slug: 'crypto-market-and-trading-pairs',
        title: 'The crypto market and trading pairs',
        summary: 'How an exchange works, what BTC/USDT means and where prices come from.',
        content_md: `## What is a market?

A market is simply a place where buyers and sellers meet. On a crypto exchange, people submit **buy orders** and **sell orders**; whenever a buyer and a seller agree on a price, a trade happens. The price you see on screen is the **price of the most recent trade**. Nobody sets it — supply and demand move it second by second.

Crypto trades **24/7**, including weekends and holidays. That is very different from the stock market, which only trades during business hours, and it is why crypto prices can move sharply while you are asleep.

## Trading pairs

Every symbol on an exchange is a **pair**: a base asset and a quote asset. **BTCUSDT** means:

- **BTC** (Bitcoin) is what you buy or sell.
- **USDT** (Tether) is what you pay with — a stablecoin that tracks roughly 1 US dollar.

A BTCUSDT price of 65,000 means one bitcoin costs 65,000 USDT. You do not have to buy a whole coin: 0.01 BTC costs about 650 USDT.

## Why do prices move?

- **Supply and demand:** more eager buyers than sellers pushes the price up, and vice versa.
- **News:** regulation, exchange incidents, money flowing in from large funds.
- **Crowd psychology:** fear and greed regularly push prices further than any "fair value".

## Reading the market table

| Column | Meaning |
|---|---|
| Price | Last traded price |
| 24h | Percentage change versus 24 hours ago |
| 24h High / Low | The price range over the last 24 hours |
| 24h Volume | Total amount traded — bigger means a busier market |

High volume usually comes with good **liquidity**: you can buy and sell easily without pushing the price around. As a beginner, start with high-volume pairs such as BTC and ETH, where your orders fill close to the price you expect.

## Try it in TradeLab

Open [Markets](/markets) and compare the 24h change and volume of a few symbols. Click **BTCUSDT** to see its candlestick chart and ask yourself: are buyers or sellers in control today?`,
        questions: [
          {
            prompt: 'In the pair BTCUSDT, what role does USDT play?',
            options: ['The asset you buy', 'The currency used to quote and pay', 'The trading fee', 'The name of the exchange'],
            correct_index: 1,
            explanation: 'USDT is the quote currency: the BTCUSDT price tells you how many USDT one BTC costs.',
          },
          {
            prompt: 'Where does the price shown on an exchange come from?',
            options: ['The exchange sets it every morning', 'The most recent trade matched between a buyer and a seller', 'The central bank', 'It is fixed for 24 hours'],
            correct_index: 1,
            explanation: 'Prices come from supply and demand: every matched buy and sell creates a new price.',
          },
          {
            prompt: 'When is the crypto market open?',
            options: ['Business hours only', 'Monday to Friday', '24/7, including weekends', 'Evenings only'],
            correct_index: 2,
            explanation: 'Crypto trades around the clock, so prices can move at any time.',
          },
          {
            prompt: 'What does a large 24h volume usually indicate?',
            options: ['The price will definitely rise', 'Good liquidity — easy to trade with little slippage', 'Higher fees', 'The symbol is about to be delisted'],
            correct_index: 1,
            explanation: 'High volume means many participants, so your orders fill close to the displayed price.',
          },
        ],
      },
      {
        slug: 'market-vs-limit-orders',
        title: 'Market vs Limit orders',
        summary: 'When to fill immediately at the market price and when to wait for your own price.',
        content_md: `## The two basic order types

Every trade starts with an **order**. The two you will use most are **Market** and **Limit** orders.

### Market orders

A market order says: *"buy or sell right now, at whatever the best available price is"*. It fills almost instantly.

- **Pro:** it always fills, and fast.
- **Con:** you do not control the exact price. In a fast or thin market, the fill can differ from the price you just saw — this is called **slippage**.

Use a market order when getting in or out **immediately** matters more than a few dollars, for example when you need to exit on bad news.

### Limit orders

A limit order says: *"buy only at this price or lower"* (or *"sell only at this price or higher"*). It waits in the order book until the market reaches your price.

- **Pro:** full control over the price, no slippage.
- **Con:** it may **never fill** if the price never comes back.

**Example:** BTC trades at 65,000. You expect a pullback to 63,000 before the next leg up, so you place a **limit buy** for 0.01 BTC at 63,000. If the price dips to 63,000, you are filled. If it rallies straight to 70,000, your order keeps waiting and you miss the move.

## Reserved funds

When you place a limit buy, the exchange **reserves** the money needed (plus the fee) so you can pay when it fills. In TradeLab this shows up as **Reserved** on the Portfolio page. Cancel the order and the money is released immediately.

## Which one should you use?

| Situation | Use |
|---|---|
| You must enter or exit right now | Market |
| You have a clear target price and no rush | Limit |
| The market is volatile and you fear slippage | Limit |

Beginners tend to overuse market orders because they are impatient. Build the habit of **planning your entry price first**, then placing a limit order and letting the market come to you.

## Try it in TradeLab

Open any symbol from [Markets](/markets) and place a **limit buy** 1–2% below the current price. Watch it appear under **Open orders**, check the **Reserved** amount, then try cancelling it.`,
        questions: [
          {
            prompt: 'What is the key feature of a market order?',
            options: ['It only fills at your exact price', 'It fills immediately at the best available price', 'It never suffers slippage', 'It can only be used to sell'],
            correct_index: 1,
            explanation: 'Market orders trade price control for speed: they fill right away.',
          },
          {
            prompt: 'BTC is at 65,000 and you place a limit buy at 63,000. The price rallies straight to 70,000. What happens?',
            options: ['It fills at 70,000', 'It fills at 65,000', 'It stays open and unfilled', 'It turns into a market order'],
            correct_index: 2,
            explanation: 'A limit buy only fills at 63,000 or lower; if the price never gets there, the order keeps waiting.',
          },
          {
            prompt: 'What is slippage?',
            options: ['The difference between the expected price and the actual fill price', 'A withdrawal fee', 'An order cancelled automatically', 'A price drop over 24 hours'],
            correct_index: 0,
            explanation: 'Slippage mostly hits market orders when the market moves fast or liquidity is thin.',
          },
          {
            prompt: 'Why are some funds "reserved" when you place a limit buy?',
            options: ['The fee is charged upfront', 'To make sure you can pay when the order fills', 'The money is locked forever', 'To pay you interest'],
            correct_index: 1,
            explanation: 'Reserved funds guarantee you can pay (including the fee) on fill; cancelling releases them.',
          },
        ],
      },
      {
        slug: 'fees-and-profit-and-loss',
        title: 'Fees and how profit & loss is calculated',
        summary: 'A 0.1% fee sounds tiny but adds up fast — and real profit is always measured after fees.',
        content_md: `## Trading fees

Every time an order fills, the exchange charges a **fee** as a percentage of the order value. In TradeLab the fee is **0.1%** per fill, on both buys and sells.

**Example:** buy 0.02 BTC at 50,000 USDT.

- Order value = 0.02 × 50,000 = **1,000 USDT**
- Fee = 1,000 × 0.1% = **1 USDT**

A full round trip (buy, then sell) costs **two fees**. If you sell for roughly 1,000 USDT as well, you pay about 2 USDT in total — so the price has to rise more than **0.2%** before you make any money at all.

## Unrealized vs realized P/L

- **Unrealized P/L:** your position is still open and valued at the current price. It changes constantly and is **not real money yet**.
- **Realized P/L:** created when you close all or part of a position. This is the actual result.

For a long position:

> P/L = (Exit price − Entry price) × Quantity − Fees

**Full example:** buy 0.02 BTC at 50,000 (fee 1 USDT), sell at 52,000.

- Sale value = 0.02 × 52,000 = 1,040 USDT, sell fee = 1.04 USDT
- Price gain = (52,000 − 50,000) × 0.02 = 40 USDT
- Net profit = 40 − 1 − 1.04 = **37.96 USDT**

## Average entry price

If you buy several times at different prices, the exchange tracks a volume-weighted **average entry price**. Buying 0.01 BTC at 50,000 and another 0.01 BTC at 52,000 gives an average entry of 51,000.

## Why fees matter so much

The more often you trade, the more you pay. Someone who enters and exits ten times a day with 1,000 USDT orders pays roughly **20 USDT a day** in fees — over 600 USDT a month — before earning a single cent. That is why fewer, higher-quality trades usually beat constant activity.

## Try it in TradeLab

Before submitting a small order, look at the **Est. fee** line in the order panel. Then open your [Journal](/journal) and check **Total fees** and **Net P/L** — the net figure already subtracts every fee you have paid.`,
        questions: [
          {
            prompt: 'What is a 0.1% fee on a 1,000 USDT order?',
            options: ['0.1 USDT', '1 USDT', '10 USDT', '100 USDT'],
            correct_index: 1,
            explanation: '1,000 × 0.1% = 1 USDT.',
          },
          {
            prompt: 'How does unrealized P/L differ from realized P/L?',
            options: ['They are the same', 'Unrealized belongs to open positions and moves with price; realized is the result when you close', 'Unrealized already includes fees, realized does not', 'Realized only applies to limit orders'],
            correct_index: 1,
            explanation: 'Only closing a position turns P/L into an actual result; until then it is a moving estimate.',
          },
          {
            prompt: 'You buy 0.01 BTC at 50,000 and 0.01 BTC at 52,000. What is your average entry?',
            options: ['50,000', '51,000', '52,000', '102,000'],
            correct_index: 1,
            explanation: 'Equal quantities, so the average is (50,000 + 52,000) / 2 = 51,000.',
          },
          {
            prompt: 'With a 0.1% fee on each side, roughly how far must the price rise before a round trip turns profitable?',
            options: ['0.01%', 'About 0.2%', '1%', '10%'],
            correct_index: 1,
            explanation: 'You pay 0.1% to buy and 0.1% to sell, so you need a move of about 0.2% just to cover fees.',
          },
        ],
      },
      {
        slug: 'long-vs-short',
        title: 'Long vs Short',
        summary: 'Profit from rising prices by going long and from falling prices by going short — and the extra risk of shorts.',
        content_md: `## Going long — betting the price rises

**Going long** is the familiar way to trade: buy first, sell later at a higher price.

> Buy 0.1 ETH at 3,000 → sell at 3,300 → profit (3,300 − 3,000) × 0.1 = 30 USDT before fees.

Without leverage, the most a long can lose is the money you put in, if the price goes to zero.

## Going short — betting the price falls

**Going short** flips the order: **sell first, buy back later**. You profit when the price drops.

> Short 0.1 ETH at 3,000 → buy back at 2,700 → profit (3,000 − 2,700) × 0.1 = 30 USDT before fees.

In TradeLab, if you **sell more than you hold**, the excess opens a short position. Shorts use **100% margin**: an amount equal to the position value is set aside as collateral, and there is no leverage.

## The special risk of shorting

A price can only fall to zero, but it can **rise without limit**. That makes the theoretical loss on a short unlimited. If the price climbs far enough above your entry, your collateral can no longer cover the loss and the position is **liquidated** (closed automatically). TradeLab draws the **liquidation price** on the chart so you always know how much room you have.

| | Long | Short |
|---|---|---|
| Profits when | Price rises | Price falls |
| Order of actions | Buy → sell | Sell → buy back |
| Maximum loss (no leverage) | Your stake | Large; can be liquidated |

## When does a short make sense?

- A clear downtrend (each high lower than the last).
- Price rejected at a strong resistance zone.
- **Always** use a stop-loss — even more important on a short than on a long.

Get comfortable with longs first, then try shorts with small sizes once you understand how they behave.

## Try it in TradeLab

Pick any symbol in [Markets](/markets) and open a small short by selling when you hold none of that coin. Watch the **Short** side, the **liquidation price** on the chart, and your unrealized P/L moving opposite to the price.`,
        questions: [
          {
            prompt: 'When does a short position make money?',
            options: ['When the price rises', 'When the price falls', 'When the price is flat', 'When volume rises'],
            correct_index: 1,
            explanation: 'A short sells high first and buys back lower, so it profits from falling prices.',
          },
          {
            prompt: 'You short 0.1 ETH at 3,000 and buy back at 2,700. What is the profit before fees?',
            options: ['3 USDT', '30 USDT', '300 USDT', 'A 30 USDT loss'],
            correct_index: 1,
            explanation: '(3,000 − 2,700) × 0.1 = 30 USDT.',
          },
          {
            prompt: 'Why is shorting riskier than going long?',
            options: ['Short fees are double', 'Prices can rise without limit, so losses can be very large', 'Shorts cannot be closed', 'Shorts only fill with limit orders'],
            correct_index: 1,
            explanation: 'A price can only fall to zero but can keep rising; a short loses as the price rises.',
          },
          {
            prompt: 'In TradeLab, what happens if you sell more coins than you hold?',
            options: ['The order is rejected', 'The excess opens a short with 100% margin', 'You get 10x leverage', 'It becomes a limit order'],
            correct_index: 1,
            explanation: 'Selling beyond your holdings opens a short, with collateral equal to 100% of the position value.',
          },
        ],
      },
    ],
  },
  {
    slug: 'technical-analysis',
    title: 'Technical analysis basics',
    description: 'Read candlesticks, find support and resistance, and recognise trends.',
    lessons: [
      {
        slug: 'reading-candlesticks',
        title: 'Reading candlesticks',
        summary: 'Every candle tells the story of the fight between buyers and sellers over one period.',
        content_md: `## Anatomy of a candle

Each candle shows price over **one time period** — one minute, one hour, one day. It records four prices:

- **Open:** the price at the start of the period.
- **Close:** the price at the end of the period.
- **High** and **Low:** the extremes reached during the period.

The **body** spans the open and the close. The thin **wicks** (shadows) stretch to the high and the low.

- **Green (bullish) candle:** the close is above the open.
- **Red (bearish) candle:** the close is below the open.

## What the body tells you

- **Long body:** one side clearly dominated that period.
- **Short body:** buyers and sellers were evenly matched; the market is undecided.

## What the wicks tell you

A long wick means the price travelled far but was **pushed back**.

- **Long lower wick:** sellers drove the price down, but buyers pulled it back up — a sign of buying pressure.
- **Long upper wick:** buyers pushed it up, but sellers knocked it back down — a sign of selling pressure.

## Common patterns

| Pattern | Shape | What it suggests |
|---|---|---|
| Doji | Tiny body, open ≈ close | Indecision; the trend may pause |
| Hammer | Small body on top, long lower wick | After a decline: possible bullish reversal |
| Shooting star | Small body at the bottom, long upper wick | After a rally: possible bearish reversal |
| Bullish engulfing | Large green body swallowing the previous red one | Buyers taking back control |

## An important caveat

A single candle is **never enough** to make a decision. Patterns matter much more when they appear at **important price zones** (support and resistance — next lesson) and on higher timeframes: a daily candle is far more meaningful than a one-minute candle. Use candles to confirm an idea, not to guess the future.

## Try it in TradeLab

Open the **BTCUSDT** chart from [Markets](/markets) and switch between the 1-hour and 1-day timeframes. Find a candle with a long lower wick and look at what the price did afterwards.`,
        questions: [
          {
            prompt: 'What does a green (bullish) candle mean?',
            options: ['Volume increased', 'The close is higher than the open', 'The high broke the previous high', 'Fees were low'],
            correct_index: 1,
            explanation: 'Candle colour only compares the close with the open within the same period.',
          },
          {
            prompt: 'What does a very long lower wick suggest?',
            options: ['Sellers completely dominated', 'The price fell sharply but buyers pushed it back up', 'The market was closed', 'The price will certainly rise'],
            correct_index: 1,
            explanation: 'A long lower wick shows lower prices were rejected — buying pressure appeared.',
          },
          {
            prompt: 'What does a doji (very small body) usually represent?',
            options: ['A strong uptrend', 'Indecision between buyers and sellers', 'A data error', 'A liquidation'],
            correct_index: 1,
            explanation: 'When open and close are nearly equal, neither side won that period.',
          },
          {
            prompt: 'What is the most sensible way to use candlestick patterns?',
            options: ['Enter as soon as you see one', 'Combine them with key price zones and higher timeframes for confirmation', 'Only use the 1-minute chart', 'Ignore the wicks'],
            correct_index: 1,
            explanation: 'Single candles are noisy; patterns are more reliable at support/resistance and on higher timeframes.',
          },
        ],
      },
      {
        slug: 'support-and-resistance',
        title: 'Support and resistance',
        summary: 'Price levels the market "remembers", where buying or selling pressure tends to appear.',
        content_md: `## What is support?

**Support** is a price zone where a falling market tends to **stop or bounce**, because many traders see it as cheap and are ready to buy. Think of it as a floor.

## What is resistance?

**Resistance** is a zone where a rising market tends to **stall or reverse**, because many traders want to take profit or sell. Think of it as a ceiling.

## How to find them

1. **Previous highs and lows:** places where the price has turned before.
2. **Round numbers:** 60,000 or 3,000 — people love placing orders at round numbers.
3. **Long sideways ranges:** where buyers and sellers were balanced for a while.

Draw **zones**, not razor-thin lines. Prices regularly poke slightly through a level and then snap back.

## Do more touches make a level stronger?

A zone that has held several times gets noticed by more traders. But each test also uses up some of the orders waiting there, so a level that is hit again and again can also be close to breaking.

## Role reversal

When the price **breaks** a resistance zone and closes above it, that zone often becomes the new **support** — and the other way round. For example, if BTC was rejected at 60,000 several times, then broke out to 62,000, a later dip back to 60,000 is often bought.

## Using it in your trades

| Idea | How |
|---|---|
| Buy near support | Limit buy inside the support zone, stop-loss just below it |
| Take profit near resistance | Take-profit just below the resistance zone |
| Trade the breakout | Wait for a candle to close clearly beyond the zone instead of entering on the first touch |

The key benefit: support and resistance tell you **where to put your stop-loss** for a reason, instead of picking a random number.

## Try it in TradeLab

On any chart in [Markets](/markets), find two nearby lows at the same price area (support) and two highs at the same area (resistance). Practise placing a limit buy near that support zone.`,
        questions: [
          {
            prompt: 'What is support?',
            options: ['A zone where rallies usually get sold', 'A zone where falling prices usually find buyers', 'The lowest fee tier', 'The daily opening price'],
            correct_index: 1,
            explanation: 'Support acts like a floor: many traders are willing to buy there.',
          },
          {
            prompt: 'After the price breaks and closes above resistance, what does that zone often become?',
            options: ['Stronger resistance', 'New support', 'Meaningless', 'The liquidation price'],
            correct_index: 1,
            explanation: 'This is role reversal: broken resistance often turns into support.',
          },
          {
            prompt: 'Why should support and resistance be drawn as zones rather than exact lines?',
            options: ['It looks nicer', 'Prices often poke slightly through and then return', 'The exchange requires it', 'Zones never break'],
            correct_index: 1,
            explanation: 'Many traders’ orders sit around a level, so the reaction happens across a range.',
          },
          {
            prompt: 'When buying near support, where is a sensible stop-loss?',
            options: ['Just above resistance', 'Just below the support zone', 'At your entry price', 'No stop-loss needed'],
            correct_index: 1,
            explanation: 'If support clearly breaks, the trade idea is wrong — a stop just below the zone cuts the loss early.',
          },
        ],
      },
      {
        slug: 'trends-and-moving-averages',
        title: 'Trends and moving averages',
        summary: 'Trade with the trend and use moving averages to filter out the noise.',
        content_md: `## The three market states

1. **Uptrend:** each high is higher than the last, and each low is higher than the last.
2. **Downtrend:** lower highs and lower lows.
3. **Range (sideways):** the price swings between two levels without making clear new highs or lows.

There is a famous saying: **"the trend is your friend"**. Buying in an uptrend (or shorting in a downtrend) gives you better odds than fighting the current.

## Moving averages (MA)

A **moving average** is the average closing price of the last N candles, drawn as a line. On a daily chart, the MA20 is the average close of the last 20 days.

> Five daily closes: 100, 102, 104, 103, 106 → MA5 = (100 + 102 + 104 + 103 + 106) / 5 = **103**

The MA **smooths** price action so you can see the main direction instead of every noisy candle.

## Reading signals from an MA

- **Price above a rising MA:** uptrend.
- **Price below a falling MA:** downtrend.
- **Flat MA with price crossing back and forth:** a range — MA signals are unreliable here.

In an uptrend, the MA often works as **dynamic support**: the price pulls back to it and then bounces.

## Short and long moving averages

| | Short MA (e.g. 20) | Long MA (e.g. 50, 200) |
|---|---|---|
| Reacts | Quickly | Slowly |
| Noise | More | Less |
| Use for | Short-term swings | The big-picture trend |

When a short MA crosses **above** a long MA, many traders read it as bullish; crossing **below** is read as bearish. But moving averages are **lagging** indicators — they confirm what has already happened, so do not expect them to catch the exact bottom or top.

## Try it in TradeLab

Open the daily chart of a symbol in [Markets](/markets). Decide for yourself: is the recent sequence of highs and lows rising, falling or flat? If you place an order, write that view down as your entry reason.`,
        questions: [
          {
            prompt: 'What identifies an uptrend?',
            options: ['Each high is lower than the last', 'Higher highs and higher lows', 'A flat price', 'Zero volume'],
            correct_index: 1,
            explanation: 'An uptrend is a sequence of rising highs and rising lows.',
          },
          {
            prompt: 'Five closes are 100, 102, 104, 103, 106. What is the MA5?',
            options: ['100', '103', '104', '106'],
            correct_index: 1,
            explanation: 'The sum is 515; 515 / 5 = 103.',
          },
          {
            prompt: 'Why is a moving average called a lagging indicator?',
            options: ['It updates one day late', 'It is calculated from past prices, so it only confirms what already happened', 'The exchange computes it wrong', 'It only works in the evening'],
            correct_index: 1,
            explanation: 'An MA averages past prices, so it always reacts after the price does.',
          },
          {
            prompt: 'The MA is flat and the price keeps crossing it. What does that suggest?',
            options: ['A strong uptrend', 'A ranging market where MA signals are unreliable', 'An imminent liquidation', 'You should increase position size'],
            correct_index: 1,
            explanation: 'In a range, the price crosses the MA constantly and produces many false signals.',
          },
        ],
      },
    ],
  },
  {
    slug: 'risk-and-psychology',
    title: 'Risk management and psychology',
    description: 'Stop-losses, position sizing, journaling and keeping emotions in check.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'stop-loss-and-take-profit',
        title: 'Stop-loss and take-profit',
        summary: 'Decide where you exit before you enter — and understand the reward-to-risk ratio.',
        content_md: `## Why you need a stop-loss

Nobody is right every time. A **stop-loss (SL)** automatically closes your position when the price moves against you to a level you chose in advance. It turns an **unknown** loss into a **planned** one.

Without a stop-loss, a small mistake can grow into a large loss because you keep hoping the price "will come back".

## What is a take-profit?

A **take-profit (TP)** automatically closes the position when your target is reached. It stops greed from making you hold too long and watch a winning trade turn into a losing one.

## Where to place them

Use the **structure of the chart**, not arbitrary numbers:

- **Long:** SL just below the nearest support; TP just below the next resistance.
- **Short:** SL just above resistance; TP just above support.

## Reward-to-risk ratio (R:R)

> R:R = (TP − Entry) / (Entry − SL)

**Example:** buy ETH at 3,000, SL 2,900, TP 3,300.

- Risk = 100, potential reward = 300 → **R:R = 1:3**

With a 1:3 ratio you only need to win about **one trade in four** to break even (before fees). That is why many professional traders only take trades with an R:R of 1:2 or better.

| R:R | Minimum win rate to break even |
|---|---|
| 1:1 | 50% |
| 1:2 | ~33% |
| 1:3 | 25% |

## Common mistakes

- **Moving the stop further away** as the price approaches it — turning a small planned loss into a big one.
- **Setting the stop too tight**, so normal price noise knocks you out.
- **Never setting a target**, then watching profits evaporate.

## Try it in TradeLab

When you place a market order in [Markets](/markets), fill in both **Stop-loss** and **Take-profit**. The SL and TP lines appear on the chart. Work out the trade's R:R beforehand and write it in your entry reason.`,
        questions: [
          {
            prompt: 'What is the main purpose of a stop-loss?',
            options: ['To increase profit', 'To cap the loss at a level planned in advance', 'To reduce fees', 'To open another position'],
            correct_index: 1,
            explanation: 'A stop-loss closes the trade automatically when the price hits your planned level, so the loss cannot grow beyond your plan.',
          },
          {
            prompt: 'Entry 3,000, SL 2,900, TP 3,300. What is the R:R?',
            options: ['1:1', '1:2', '1:3', '3:1'],
            correct_index: 2,
            explanation: 'Risk is 100 and reward is 300, so R:R = 1:3.',
          },
          {
            prompt: 'With an R:R of 1:2, roughly what win rate do you need to break even (before fees)?',
            options: ['10%', 'About 33%', '50%', '75%'],
            correct_index: 1,
            explanation: 'One win of 2R covers two losses of 1R, so you need to win about a third of your trades.',
          },
          {
            prompt: 'Which is a stop-loss mistake?',
            options: ['Placing the SL below support', 'Moving the SL further away as the price approaches it', 'Calculating R:R before entering', 'Setting the SL when you open the trade'],
            correct_index: 1,
            explanation: 'Moving the stop breaks your plan and often turns a small loss into a large one.',
          },
          {
            prompt: 'Where should the stop-loss go on a short trade?',
            options: ['Just below support', 'Just above resistance', 'At the entry price', 'No stop needed'],
            correct_index: 1,
            explanation: 'A short loses when the price rises, so its stop belongs above — just over the nearest resistance.',
          },
        ],
      },
      {
        slug: 'position-sizing-and-the-1-2-rule',
        title: 'Position sizing and the 1–2% rule',
        summary: 'How much should you buy? Work out the size from the amount you are willing to lose.',
        content_md: `## The most important question

New traders ask "what should I buy?". Experienced traders ask **"how much should I buy?"**. Position size decides whether a wrong trade stings a little or wipes out your account.

## The 1–2% rule

Risk only **1–2% of your total capital** on any single trade. "Risk" means the amount you lose **if your stop-loss is hit** — not the total value of the position.

With TradeLab's 10,000 USDT wallet:

- 1% risk = **100 USDT** per trade
- 2% risk = **200 USDT** per trade

## The sizing formula

> Quantity = Risk amount / (Entry price − Stop-loss price)

**Example:** capital 10,000 USDT, 1% risk = 100 USDT. Buy BTC at 60,000 with a stop at 58,000.

- Distance to the stop = 2,000 USDT per BTC
- Quantity = 100 / 2,000 = **0.05 BTC** (a 3,000 USDT position)

If the stop is hit you lose about 100 USDT plus fees — exactly the 1% you planned.

Notice that a wider stop means a smaller position and a tighter stop means a bigger one. **The amount of money at risk stays the same.**

## Why 1–2% matters

Losing streaks are normal, even for good strategies.

| Losses in a row | 1% risk per trade | 10% risk per trade |
|---|---|---|
| 5 | ~95% of capital left | ~59% left |
| 10 | ~90% left | ~35% left |

Lose 65% of your account and you need a gain of almost **190%** just to get back to where you started. Keeping risk small lets you **survive long enough** for your edge to play out.

## Things to avoid

- Putting your whole account on one "sure thing".
- Increasing size to win back the last loss.
- Opening several trades at once on assets that move together (BTC and ETH often rise and fall together) — your real total risk is bigger than it looks.

## Try it in TradeLab

Before your next trade in [Markets](/markets), choose your stop-loss level first, then calculate the quantity so the risk is exactly 1% of your wallet. Use the **Enter quantity** mode to type it precisely.`,
        questions: [
          {
            prompt: 'Under the 1% rule, how much should you risk per trade with a 10,000 USDT wallet?',
            options: ['10 USDT', '100 USDT', '1,000 USDT', '10,000 USDT'],
            correct_index: 1,
            explanation: '1% of 10,000 is 100 USDT — the amount you lose if your stop-loss is hit.',
          },
          {
            prompt: 'Risk 100 USDT, entry 60,000, stop 58,000. What quantity should you buy?',
            options: ['0.005 BTC', '0.05 BTC', '0.5 BTC', '1 BTC'],
            correct_index: 1,
            explanation: '100 / (60,000 − 58,000) = 0.05 BTC.',
          },
          {
            prompt: 'What does "risk" mean in the 1–2% rule?',
            options: ['The total value of the position', 'The amount lost if the stop-loss is hit', 'The trading fee', 'The expected profit'],
            correct_index: 1,
            explanation: 'Risk is the loss when the stop is hit, not the size of the whole position.',
          },
          {
            prompt: 'If you widen your stop-loss but keep risk at 1%, what happens to the position size?',
            options: ['It increases', 'It decreases', 'It stays the same', 'It is unrelated'],
            correct_index: 1,
            explanation: 'A wider stop means each unit loses more, so you buy fewer units to keep total risk constant.',
          },
        ],
      },
      {
        slug: 'trading-journal-and-fomo',
        title: 'The trading journal and FOMO',
        summary: 'A trader’s worst enemy is often themselves — a journal makes that visible.',
        content_md: `## Psychology drives results

Two people using exactly the same strategy can get very different results, because one **follows the plan** and the other lets emotions take over. The most dangerous emotions are:

- **FOMO** (fear of missing out): chasing a coin after a big move, usually buying near the top.
- **Greed:** refusing to take profit, sizing up far too much.
- **Fear:** cutting good trades too early, or skipping trades your plan says to take.
- **Revenge trading:** jumping straight into a bigger trade after a loss to win it back — the fastest way to lose big.

## Signs you are trading on FOMO

- You enter because "everyone is buying", with no technical reason.
- You cannot name your stop-loss before entering.
- The price is already far from the nearest support, so the reward-to-risk is poor.

The cure is a simple rule: **no plan, no trade**. Missing an opportunity costs you nothing; buying the top does.

## The trading journal

A journal turns vague feelings into **data**. For every trade, record:

1. **Why you entered:** which setup? Where are the SL and TP, and what is the R:R?
2. **How you felt:** calm, confident, or chasing?
3. **Outcome and lesson:** what went right or wrong, and what will you do differently?
4. **Tags:** such as *breakout*, *support* or *fomo*, so you can filter later.

After 20–30 trades, review them: how do trades tagged with *FOMO* or *revenge* perform compared with the rest? Most traders discover that a handful of repeated bad habits cause most of their biggest losses.

## Metrics worth tracking

| Metric | Tells you |
|---|---|
| Win rate | What percentage of closing trades made money |
| Profit factor | Gross profit / gross loss — above 1 means profitable |
| Max drawdown | The deepest fall from a previous peak |

## Try it in TradeLab

Open your [Journal](/journal), pick a recent trade and write down your **reason, emotion and lesson**, then rate it with stars. Next time you place an order, use the **Reason for entry** box in the order panel to record your plan from the start.`,
        questions: [
          {
            prompt: 'What is FOMO in trading?',
            options: ['A trend-following strategy', 'Fear of missing out that leads you to chase a big move', 'An order type', 'A hidden exchange fee'],
            correct_index: 1,
            explanation: 'FOMO makes traders enter without a plan, often at a very poor price.',
          },
          {
            prompt: 'Why is revenge trading dangerous?',
            options: ['Fees are higher', 'You take bigger, emotional trades after a loss and tend to lose more', 'Your account gets locked', 'It only works for shorts'],
            correct_index: 1,
            explanation: 'After a loss, emotions drive decisions; sizing up to win it back usually magnifies losses.',
          },
          {
            prompt: 'Which of these does NOT belong in a trading journal entry?',
            options: ['Why you entered', 'How you felt', 'The lesson learned', 'Last year’s BTC price'],
            correct_index: 3,
            explanation: 'A journal focuses on your decisions: reason, emotion, outcome and lesson.',
          },
          {
            prompt: 'What does a profit factor above 1 mean?',
            options: ['Gross profit exceeds gross loss', 'A win rate above 100%', 'No losing trades', 'Zero fees'],
            correct_index: 0,
            explanation: 'Profit factor = gross profit / gross loss; above 1 means the strategy is profitable.',
          },
        ],
      },
    ],
  },
  ...EN_FUNDAMENTALS,
  ...EN_ADVANCED,
  ...EN_SECTORS,
  ...EN_PRACTICE,
  ...EN_HISTORY,
  ...EN_PSYCHOLOGY,
  ...EN_MACRO,
  ...EN_ASSETS,
]
