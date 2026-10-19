import type { SeedTerm } from './types'

// 40 terms — same order as glossary-vi.ts
export const GLOSSARY_EN: SeedTerm[] = [
  // Market basics
  {
    term: 'Trading pair',
    definition_md: 'A symbol made of two assets: base asset / quote asset. For example, **BTC/USDT** tells you how many USDT it takes to buy 1 BTC.',
    lesson_slug: 'crypto-market-and-trading-pairs',
  },
  {
    term: 'Liquidity',
    definition_md: 'How easily an asset can be bought or sold without moving the price much. High trading volume usually comes with good liquidity.',
    lesson_slug: 'crypto-market-and-trading-pairs',
  },
  {
    term: 'Bid–ask spread',
    definition_md: 'The gap between the highest bid and the lowest ask. The narrower the spread, the lower the hidden cost of a market order.',
    lesson_slug: 'market-vs-limit-orders',
  },
  {
    term: 'Market order',
    definition_md: 'An order to buy or sell immediately at the best available price. It fills fast, but you do not control the exact fill price.',
    lesson_slug: 'market-vs-limit-orders',
  },
  {
    term: 'Limit order',
    definition_md: 'An order that fills only at your chosen price or better. You control the price, but the order may never fill.',
    lesson_slug: 'market-vs-limit-orders',
  },
  {
    term: 'Trading fee',
    definition_md: 'What the exchange charges on each filled order, usually a % of the order value. For example, a 0.1% fee on a 1,000 USDT order is 1 USDT.',
    lesson_slug: 'fees-and-profit-and-loss',
  },
  {
    term: 'Long position',
    definition_md: 'Buying an asset expecting its price to rise. You profit when you sell higher than you bought (after fees).',
    lesson_slug: 'long-vs-short',
  },
  {
    term: 'Short position',
    definition_md: 'Selling a borrowed asset expecting its price to fall, then buying it back to return it. You profit when you buy back lower than you sold.',
    lesson_slug: 'long-vs-short',
  },
  {
    term: 'Margin',
    definition_md: 'Money you post as collateral to open a position, especially a short or leveraged one. The smaller the margin relative to the position, the higher the risk.',
    lesson_slug: 'long-vs-short',
  },
  // Technical analysis
  {
    term: 'Candlestick',
    definition_md: 'A way to show the open, high, low and close prices for one time period. A green body means the close was above the open; a red body means the opposite.',
    lesson_slug: 'reading-candlesticks',
  },
  {
    term: 'Support',
    definition_md: 'A price zone where buying pressure is often strong enough to halt a decline. The more times price bounces from a zone, the more it matters.',
    lesson_slug: 'support-and-resistance',
  },
  {
    term: 'Resistance',
    definition_md: 'A price zone where selling pressure is often strong enough to halt a rise. Once clearly broken, old resistance can become new support.',
    lesson_slug: 'support-and-resistance',
  },
  {
    term: 'Trend',
    definition_md: 'The main direction of price over time: up (higher highs and higher lows), down (lower highs and lower lows) or sideways.',
    lesson_slug: 'trends-and-moving-averages',
  },
  {
    term: 'Moving average (MA)',
    definition_md: 'A line of the average price over the last N periods that smooths out noise and helps spot the trend. For example, MA20 = the average close of the last 20 periods.',
    lesson_slug: 'trends-and-moving-averages',
  },
  // Risk management
  {
    term: 'Stop-loss',
    definition_md: 'A preset price that automatically exits a trade when the market moves against you, capping your maximum loss.',
    lesson_slug: 'stop-loss-and-take-profit',
  },
  {
    term: 'Take-profit',
    definition_md: 'A preset price that automatically exits a trade once your profit target is reached, so hesitation does not cost you the gain.',
    lesson_slug: 'stop-loss-and-take-profit',
  },
  {
    term: 'Risk/reward ratio (R:R)',
    definition_md: 'Compares the expected gain with the loss you accept. R:R = (take-profit − entry) / (entry − stop-loss). For example, 1:2 means risking 1 to potentially make 2.',
    lesson_slug: 'stop-loss-and-take-profit',
  },
  {
    term: 'Position size',
    definition_md: 'How much of an asset you buy or sell in one trade, ideally derived from how much you are willing to lose. Position size = amount at risk / distance to stop-loss.',
    lesson_slug: 'position-sizing-and-the-1-2-rule',
  },
  {
    term: 'Drawdown',
    definition_md: 'The drop in account value from its highest peak to the lowest point that follows, usually in %. The deeper the drawdown, the harder it is to recover.',
    lesson_slug: 'position-sizing-and-the-1-2-rule',
  },
  {
    term: 'Fear of missing out (FOMO)',
    definition_md: 'The fear of being left behind that pushes you to chase a price after a big rise, often off-plan and near the top.',
    lesson_slug: 'trading-journal-and-fomo',
  },
  {
    term: 'Trading journal',
    definition_md: 'A record of each trade: the reason for entry, entry/exit points, result and how you felt. Reviewing it regularly reveals repeated mistakes.',
    lesson_slug: 'trading-journal-and-fomo',
  },
  // Fundamentals
  {
    term: 'Financial statements',
    definition_md: 'The set of reports a company publishes periodically: the income statement, the balance sheet and the cash flow statement.',
    lesson_slug: 'financial-statements-overview',
  },
  {
    term: 'Revenue',
    definition_md: 'The total money a company earns from selling goods and services in a period, before costs. Usually the top line of the income statement.',
    lesson_slug: 'income-statement',
  },
  {
    term: 'Net income',
    definition_md: 'The profit left after all expenses, interest and taxes. It belongs to shareholders and is also called net profit.',
    lesson_slug: 'income-statement',
  },
  {
    term: 'Earnings per share (EPS)',
    definition_md: 'Net income attributable to one share. EPS = net income to common shareholders / shares outstanding.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Price-to-earnings ratio (P/E)',
    definition_md: 'Shows how much investors pay for 1 unit of earnings. P/E = share price / EPS. Compare it with companies in the same industry.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Price-to-book ratio (P/B)',
    definition_md: 'Compares market price with the book value of equity. P/B = share price / book value per share.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Market capitalization',
    definition_md: 'The total market value of a company. Market cap = share price × shares outstanding.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Return on equity (ROE)',
    definition_md: 'Measures the profit earned on each unit of shareholder capital. ROE = net income / average shareholders\' equity.',
    lesson_slug: 'roe-roa-margins',
  },
  {
    term: 'Return on assets (ROA)',
    definition_md: 'Measures how efficiently a company uses all its assets to generate profit. ROA = net income / average total assets.',
    lesson_slug: 'roe-roa-margins',
  },
  {
    term: 'Debt-to-equity ratio (D/E)',
    definition_md: 'Shows how much debt a company uses relative to equity. D/E = total debt / shareholders\' equity. Higher means more financial risk.',
    lesson_slug: 'financial-health-ratios',
  },
  {
    term: 'Free cash flow (FCF)',
    definition_md: 'Cash left after a company pays for operations and investment in fixed assets. FCF = operating cash flow − capital expenditure (capex).',
    lesson_slug: 'cash-flow-statement',
  },
  // Advanced
  {
    term: 'Discounted cash flow (DCF)',
    definition_md: 'A valuation method that converts expected future cash flows into present value using a discount rate. The result is very sensitive to assumptions.',
    lesson_slug: 'dcf-discounted-cash-flow',
  },
  {
    term: 'EV/EBITDA',
    definition_md: 'Compares enterprise value (EV = market cap + debt − cash) with earnings before interest, taxes, depreciation and amortization. Useful for comparing companies with different debt levels.',
    lesson_slug: 'ev-ebitda-and-relative-valuation',
  },
  {
    term: 'Margin of safety',
    definition_md: 'The gap between estimated value and purchase price. Buying well below your estimate gives you a cushion if your analysis is wrong.',
    lesson_slug: 'margin-of-safety-and-intrinsic-value',
  },
  {
    term: 'Diversification',
    definition_md: 'Spreading capital across different assets, sectors or asset classes so that one loss does not hurt the whole portfolio too much.',
    lesson_slug: 'diversification-and-correlation',
  },
  {
    term: 'Portfolio rebalancing',
    definition_md: 'Periodically buying and selling to bring asset weights back to your original targets, for example 60% stocks and 40% bonds.',
    lesson_slug: 'asset-allocation-and-rebalancing',
  },
  {
    term: 'Dollar-cost averaging (DCA)',
    definition_md: 'Investing a fixed amount on a regular schedule regardless of price. It removes the pressure of timing and smooths your average cost.',
    lesson_slug: 'dca-vs-lump-sum',
  },
  {
    term: 'Compound annual growth rate (CAGR)',
    definition_md: 'The average yearly growth rate assuming steady growth. CAGR = (ending value / beginning value)^(1/years) − 1.',
    lesson_slug: 'measuring-portfolio-performance',
  },
  {
    term: 'Sharpe ratio',
    definition_md: 'Measures excess return per unit of risk. Sharpe = (portfolio return − risk-free rate) / standard deviation of returns. Higher is better.',
    lesson_slug: 'measuring-portfolio-performance',
  },
  // ── Forex (thị trường ngoại hối) ──
  {
    term: 'Foreign exchange market (Forex)',
    definition_md: 'The market for trading currencies against each other, open almost 24 hours on weekdays and the most liquid market in the world. Note: leveraged forex trading through overseas brokers may not be permitted where you live — check current regulations before taking part.',
    lesson_slug: null,
  },
  {
    term: 'Currency pair',
    definition_md: 'Forex is always quoted in pairs, e.g. EUR/USD = 1.0850 means 1 euro buys 1.0850 US dollars. Buying the pair means buying the first currency and selling the second.',
    lesson_slug: 'crypto-market-and-trading-pairs',
  },
  {
    term: 'Base and quote currency',
    definition_md: 'In EUR/USD, EUR is the base currency (what you buy/sell) and USD is the quote currency (the unit for the price and for profit and loss).',
    lesson_slug: null,
  },
  {
    term: 'Major pairs (Majors)',
    definition_md: 'Pairs of USD with another large currency, such as EUR/USD, USD/JPY, GBP/USD, USD/CHF, AUD/USD, USD/CAD and NZD/USD. They are the most liquid, so spreads are usually the tightest.',
    lesson_slug: null,
  },
  {
    term: 'Minor and exotic pairs',
    definition_md: 'Minors pair large currencies without USD (e.g. EUR/GBP). Exotics pair a large currency with one from a smaller economy (e.g. USD/TRY) — wider spreads and sharper moves.',
    lesson_slug: null,
  },
  {
    term: 'Cross rate',
    definition_md: 'An exchange rate between two currencies derived through a third (usually USD). For example EUR/JPY ≈ EUR/USD × USD/JPY.',
    lesson_slug: null,
  },
  {
    term: 'Pip',
    definition_md: 'The conventional smallest price step: the 4th decimal for most pairs (0.0001) and the 2nd for JPY pairs (0.01). EUR/USD moving from 1.0850 to 1.0870 is a 20-pip rise.',
    lesson_slug: null,
  },
  {
    term: 'Pipette',
    definition_md: 'One tenth of a pip — the 5th decimal (3rd for JPY pairs) that many platforms show for finer quotes.',
    lesson_slug: null,
  },
  {
    term: 'Pip value',
    definition_md: 'The profit or loss when price moves 1 pip, which depends on size. For EUR/USD, 1 standard lot (100,000 EUR) × 0.0001 = 10 USD per pip; 20 pips = 200 USD.',
    lesson_slug: 'fees-and-profit-and-loss',
  },
  {
    term: 'Lot',
    definition_md: 'The unit of forex trade size: a standard lot = 100,000 units of the base currency, a mini lot = 10,000, a micro lot = 1,000. Size sets the value of each pip, and therefore your profit and loss.',
    lesson_slug: 'position-sizing-and-the-1-2-rule',
  },
  {
    term: 'Leverage',
    definition_md: 'Lets you open a position many times larger than your margin, e.g. 1:100 means 1,000 USD controls a 100,000 USD position. Leverage magnifies gains AND losses: a 1% adverse move can wipe out the whole margin.',
    lesson_slug: 'long-vs-short',
  },
  {
    term: 'Required margin',
    definition_md: 'The deposit needed to open a position = position value ÷ leverage. For example 1 lot of EUR/USD at 1.0850 is worth 108,500 USD; at 1:100 leverage it needs about 1,085 USD of margin.',
    lesson_slug: null,
  },
  {
    term: 'Margin level',
    definition_md: 'Ratio = equity ÷ used margin × 100%. As losses grow, equity and the margin level fall; below the broker\'s threshold you get a margin call or forced closing.',
    lesson_slug: null,
  },
  {
    term: 'Margin call',
    definition_md: 'A warning when the margin level drops below a set threshold (often around 100%, broker-dependent): you must add funds or reduce positions, or they will be closed for you.',
    lesson_slug: null,
  },
  {
    term: 'Stop out',
    definition_md: 'The margin level (e.g. 50%, broker-dependent) at which the system automatically closes losing positions so the account does not go further negative. This is why high-leverage trading so often "blows up" accounts.',
    lesson_slug: null,
  },
  {
    term: 'Swap (rollover)',
    definition_md: 'An amount credited or charged for holding a position overnight, based on the interest-rate difference between the two currencies plus the broker\'s fee. Over long holding periods swaps can eat noticeably into profits.',
    lesson_slug: null,
  },
  {
    term: 'Carry trade',
    definition_md: 'Borrowing (selling) a low-interest currency to buy a high-interest one and collect the interest difference via swaps. Risk: an adverse exchange-rate move can wipe out the interest earned.',
    lesson_slug: null,
  },
  {
    term: 'Slippage',
    definition_md: 'The difference between the price you asked for and the price your order actually fills at, common during sharp moves (news releases) or thin liquidity. Stop-loss orders can slip too.',
    lesson_slug: 'market-vs-limit-orders',
  },
  {
    term: 'Forex trading sessions',
    definition_md: 'The market runs through the Asian (Tokyo, Sydney), European (London) and US (New York) sessions. The overlap of the European and US sessions usually has the highest volume and volatility.',
    lesson_slug: null,
  },
  {
    term: 'Economic calendar',
    definition_md: 'A schedule of macro data and events (central-bank rate decisions, CPI, US non-farm payrolls…). Currencies often move sharply around these releases.',
    lesson_slug: null,
  },
]
