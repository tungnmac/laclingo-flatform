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
]
