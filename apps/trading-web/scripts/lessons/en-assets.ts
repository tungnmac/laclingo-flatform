import type { SeedChapter } from './types'

// Investment asset classes (en) — every number is illustrative, not a current price/rate, and not a recommendation.
export const EN_ASSETS: SeedChapter[] = [
  {
    slug: 'asset-classes',
    title: 'Investment asset classes',
    description: 'Bonds, mutual funds and ETFs, derivatives, gold, deposits, real estate, crypto — and how to compare and combine them.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'bonds-yield-and-credit-risk',
        title: 'Bonds: yield, risk and market lessons',
        summary: 'Government vs corporate bonds, coupon, yield to maturity, the inverse price–yield relationship, duration and credit risk.',
        content_md: `## What is a bond?

Buying a stock makes you an **owner** of part of a business. Buying a bond makes you a **lender**. The issuer borrows your money, promises to pay **periodic interest (the coupon)** and to repay the **face value** on the **maturity date**. Your return is therefore capped at what was promised — in exchange, the cash flows are more predictable than a stock's, as long as the borrower **can actually pay**.

## Government vs corporate

| Feature | Government bonds | Corporate bonds |
|---|---|---|
| Borrower | The state (in Vietnam, issued by the State Treasury) | Joint-stock companies, banks, groups… |
| Credit risk | Lowest in the domestic economy | From low to very high, depending on the issuer |
| Yield | Lower | Higher, to compensate for risk |
| Main buyers | Banks, insurers, funds | Institutions and individuals |

The extra yield over a government bond of the same maturity is the **credit spread** — the "price" of default risk.

## Coupon is not yield to maturity

- **Coupon rate:** fixed on face value. A bond with face value 100 and an 8% annual coupon pays 8 a year, whatever its market price.
- **Yield to maturity (YTM):** the annual return you earn if you **buy at today's price** and hold to maturity. Technically, YTM is the rate that makes the present value of all cash flows (coupons + face value) **equal the purchase price**.

Buy below face value and YTM is above the coupon; buy above face value and YTM is below the coupon.

## Price and yield always move in opposite directions

The coupon is fixed. When market rates rise, an older bond pays less than newly issued ones, so **its price must fall** until a new buyer earns the new market yield. Illustrative example — face value 100, 8% coupon paid at the end of each year, 5 years left, trading at par (YTM = 8%):

> Price = 8/(1+y) + 8/(1+y)² + 8/(1+y)³ + 8/(1+y)⁴ + 108/(1+y)⁵

| Market yield y | Bond price | Change |
|---|---|---|
| 6% | 108.42 | +8.42% |
| 8% | 100.00 | — |
| 10% | 92.42 | −7.58% |

A 2-percentage-point rise in yield cuts the price by 7.58%. This is **interest-rate risk** — even a government bond with no credit risk can lose money if you must sell before maturity after rates rise.

## Duration: measuring rate sensitivity

**Duration** tells you how sensitive a bond's price is to interest rates. For the bond above, Macaulay duration ≈ 4.31 years and **modified duration** ≈ 4.31 / 1.08 ≈ 3.99. The rule of thumb:

> % price change ≈ − modified duration × change in yield

Yield +2%: price ≈ −3.99 × 2% ≈ −7.99%, i.e. ≈ 92.0 — close to the exact 92.42 (the gap comes from **convexity**). Remember: **longer maturity and lower coupon → higher duration → bigger price swings**.

## Credit risk, ratings and collateral

- **Credit ratings** (AAA, BBB, B…) from rating agencies help compare the ability to repay; below "investment grade" are **high-yield/high-risk** bonds.
- **Secured** (backed by assets such as property or shares) vs **unsecured**. Collateral is not a guarantee: assets can be overvalued, hard to sell, or be shares of the same business group — which fall exactly when the issuer is in trouble.

## Lessons from Vietnam's private-placement bonds, 2022–2023

Before 2022, many **privately placed** corporate bonds with attractive yields were distributed widely to individual investors, sometimes presented almost like "savings products". When some violations were prosecuted and liquidity tightened, a number of issuers delayed principal and interest payments and the market nearly froze. The government issued **Decree 65/2022/ND-CP** (16 September 2022), tightening issuance conditions, use of proceeds, disclosure and the test for which professional securities investors may buy; **Decree 08/2023/ND-CP** (5 March 2023) then suspended some of those provisions until the end of 2023 and allowed issuers to negotiate with bondholders to extend maturities (by up to 2 years) or pay in other assets.

General lessons, not about any single company:

1. **High yield always comes with high risk** — there is no "high-interest savings with no risk".
2. Private bonds are often **hard to resell**: when you need cash, there may be no buyer.
3. Study the **issuer's financial health**, the collateral and buy-back terms — not just the coupon.
4. Distinguish **who issues** from **who merely distributes**: a broker does not guarantee repayment.

## How individuals can access bonds

- **Publicly offered bonds** listed on an exchange, bought through a securities account.
- **Government bonds** trade on HNX — a mainly institutional market, in large lots.
- **Bond funds** (open-end funds): diversified across many bonds, with a credit-analysis team, suitable for small amounts.
- **Private-placement bonds:** only for professional securities investors as defined by law.

## Practice

Using the formula above, compute the price of the face-value-100, 8%-coupon, 5-year bond when the market yield is 9%. Is it above or below 100, and why? Then write in your [Journal](/journal) three questions you would ask before buying any corporate bond.

## Sources

- FINRA — Brush Up on Bonds: Interest Rate Changes and Duration: https://www.finra.org/investors/insights/bonds-interest-rate-changes-duration
- Dien dan Doanh nghiep — Decree 65/2022 and the corporate bond market (Vietnamese): https://diendandoanhnghiep.vn/nghi-dinh-65-2022-khoi-lai-huyet-mach-thi-truong-trai-phieu-doanh-nghiep-230867.html
- Allen & Gledhill — Decree 08/2023 amends, supplements and suspends key provisions on private corporate bonds: https://www.allenandgledhill.com/vn/publication/articles/23488/amends-supplements-and-suspends-implementation-of-key-provisions-on-private-offering-and-trading-of-corporate-bonds`,
        questions: [
          {
            prompt: 'Market interest rates rise sharply. What happens to the price of an existing fixed-coupon bond?',
            options: ['It rises, because rates are higher', 'It falls, because its fixed coupon is less attractive than new bonds', 'It stays unchanged until maturity', 'It immediately returns to face value'],
            correct_index: 1,
            explanation: 'Price and yield move inversely: the old bond’s price must fall so a new buyer earns a yield in line with the new market rate.',
          },
          {
            prompt: 'A bond has a modified duration of about 4. If its yield rises by 1 percentage point, its price changes by roughly…',
            options: ['+4%', '−1%', '−4%', '−40%'],
            correct_index: 2,
            explanation: '% price change ≈ −modified duration × yield change = −4 × 1% = −4%.',
          },
          {
            prompt: 'What is the most important lesson from Vietnam’s 2022–2023 private-placement bond episode?',
            options: ['Corporate bonds are always as safe as deposits', 'Secured bonds can never lose money', 'Simply pick the bond with the highest coupon', 'High yield comes with credit and liquidity risk, so study the issuer carefully'],
            correct_index: 3,
            explanation: 'High yield is compensation for risk. Private bonds are also hard to resell, and collateral can lose value exactly when the issuer struggles.',
          },
          {
            prompt: 'You buy a bond BELOW face value. Compared with the coupon rate, your yield to maturity is…',
            options: ['Higher than the coupon', 'Lower than the coupon', 'Always equal to the coupon', 'Zero'],
            correct_index: 0,
            explanation: 'Besides the coupons you also gain the difference when you receive the full face value at maturity, so YTM exceeds the coupon.',
          },
        ],
      },
      {
        slug: 'mutual-funds-and-etfs',
        title: 'Mutual funds and ETFs',
        summary: 'Open-end funds vs ETFs vs closed-end funds; NAV, expense ratio, tracking error and the impact of fees over 20 years.',
        content_md: `## Why investment funds exist

With a small amount of money, buying 20–30 stocks to diversify is hard and costly. An **investment fund** pools money from many people and hands it to a **fund management company** that invests according to a published strategy. The fund's assets are held separately by a **supervisory/custodian bank**, apart from the manager's own assets.

## Three common fund types

| Feature | Open-end fund | ETF (exchange-traded fund) | Closed-end fund |
|---|---|---|---|
| Who you trade with | The fund itself | Other investors on the exchange, like a stock | Other investors on the exchange |
| Trading price | NAV of the dealing period | Market price, hovering around NAV | Market price, can drift far from NAV |
| Frequency | On the fund's dealing days | Continuously during the session | Continuously during the session |
| Number of units | Grows/shrinks with inflows/outflows | Grows/shrinks via creation/redemption | Fixed after issuance |

**NAV (net asset value) per unit** = (total assets − liabilities) / units outstanding. It is the "true value" of one fund unit at the time it is calculated.

## How ETFs work

An ETF usually tracks an **index**. Its key feature is **creation and redemption**: authorized participants (usually large brokerages) can deliver **a basket of stocks** in exchange for **a block of ETF units** (creation), or the reverse (redemption). If the ETF trades above NAV, they create units to sell; if below, they buy ETF units and redeem them for stocks. This keeps the ETF price close to NAV.

In Vietnam, ETFs listed on HOSE track indices such as **VN30** (the 30 largest, most liquid HOSE stocks — several ETFs track it), **VNFIN LEAD** (leading financial-sector stocks), **VNDiamond** (stocks that have nearly reached their foreign-ownership limit), **VNFIN SELECT** and **VN100**. This lesson does not recommend any particular fund.

## How index rebalancing affects stocks

Indices are reviewed **periodically** (quarterly or semi-annually, depending on the index). When a stock is **added** or its weight increased, tracking ETFs must **buy**; when it is **removed**, they must **sell** — usually concentrated in the last session before the effective date. Because the new constituents are announced in advance, the market often "front-runs" the change and prices may already reflect part of it. For long-term investors this is short-term flow, not a change in the company's value.

## Passive or active?

- **Passive (index) funds:** simply try to match the index at low cost. The quality measure is **tracking error** — how much the fund's return deviates from the index; smaller is better.
- **Active funds:** managers pick stocks to try to **beat** the index, at higher cost. Research in many markets shows that after fees, most active funds struggle to outperform consistently over the long run — but that is not true of every fund in every period.

## Fees: small each year, large after 20 years

The **total expense ratio (TER)** — management, supervisory, custody fees and so on — is charged as a % of assets each year and deducted directly from NAV. There may also be subscription/redemption fees. An **illustrative** example: invest 100 million VND in a portfolio earning 8% a year before fees, held for 20 years:

| Annual cost | Net return | Value after 20 years |
|---|---|---|
| 0% | 8.0% | 100 × 1.08²⁰ ≈ 466.1 million |
| 0.5% | 7.5% | 100 × 1.075²⁰ ≈ 424.8 million |
| 2.0% | 6.0% | 100 × 1.06²⁰ ≈ 320.7 million |

The gap between a 0.5% and a 2% fee is about **104.1 million VND** — more than the original investment. (The example simplifies fees by subtracting them from each year's return; the 8% is illustrative, not a forecast.)

## Practice

Pick any open-end fund or ETF and find in its prospectus or periodic report: its benchmark index (if any), total expense ratio, latest NAV and tracking error. Write in your [Journal](/journal): how much would that fee erode from 100 million VND over 20 years?

## Sources

- Thi truong Tai chinh Tien te — SSI estimates trades of 6 domestic ETFs after the Q1/2024 index review (Vietnamese): https://thitruongtaichinhtiente.vn/ssi-uoc-tinh-giao-dich-cua-6-quy-etfs-noi-sau-khi-hose-cong-bo-danh-muc-chi-so-quy-i-2024-55608.html
- Thi truong Tai chinh Tien te — ETF portfolio review results, Q2/2023 (Vietnamese): https://thitruongtaichinhtiente.vn/ket-qua-tai-co-cau-danh-muc-etf-ky-quy-ii-2023-vn-diamond-loai-eib-vn30-khong-co-thay-doi-ve-thanh-phan-45287.html
- Thi truong Tai chinh Tien te — VNFIN Lead review, Q1/2022 (Vietnamese): https://thitruongtaichinhtiente.vn/vnfin-lead-bo-sung-vnd-nang-ty-trong-tcb-vpb-ssi-trong-ky-quy-i-2022-38996.html`,
        questions: [
          {
            prompt: 'What is the main difference between an open-end fund and an ETF?',
            options: ['An ETF trades continuously on the exchange like a stock; an open-end fund is bought from and sold to the fund at the dealing-period NAV', 'Open-end funds have no fees', 'ETFs always return more than open-end funds', 'Open-end funds only invest in crypto'],
            correct_index: 0,
            explanation: 'ETFs are listed and matched on the exchange during the session; open-end funds deal with the fund itself at the NAV of the dealing period.',
          },
          {
            prompt: 'Which mechanism keeps an ETF’s market price close to its NAV?',
            options: ['The exchange fixes the ETF price', 'Creation/redemption: authorized participants swap baskets of stocks for ETF units and back when prices diverge', 'The custodian bank buys to support the price', 'The fund bans selling when prices are low'],
            correct_index: 1,
            explanation: 'When the price deviates from NAV, authorized participants create or redeem units to capture the gap, pulling the price back toward NAV.',
          },
          {
            prompt: '100 million VND growing at a net 6% a year for 20 years ends up at roughly…',
            options: ['220 million', '466 million', '321 million', '120 million'],
            correct_index: 2,
            explanation: '100 × 1.06²⁰ ≈ 320.7 million VND. 220 million would be the result with simple, not compound, interest.',
          },
          {
            prompt: 'A stock is added to an index tracked by many ETFs. What typically happens around the rebalancing date?',
            options: ['The ETFs must sell the stock', 'Nothing happens', 'The company is guaranteed to earn more', 'The ETFs must buy the stock, adding short-term demand'],
            correct_index: 3,
            explanation: 'Passive funds must hold the index constituents, so they buy; this is short-term flow and does not change the company’s value.',
          },
        ],
      },
      {
        slug: 'derivatives-vn30-futures-and-warrants',
        title: 'Derivatives: VN30 futures and covered warrants',
        summary: 'VN30 index futures specs, leverage and margin, covered warrants, and hedging a portfolio with futures.',
        content_md: `## What are derivatives?

A **derivative** is an instrument whose value **depends** on another asset (the underlying), such as an index or a stock. In Vietnam, the most common products for individual investors are **VN30 index futures** (traded on HNX) and **covered warrants** (traded on HOSE). Since October 2025 HNX has also listed VN100 index futures; this lesson focuses on VN30.

## VN30 index futures

A futures contract is an agreement to buy/sell the index at a set price on a future date. You can **go long** if you expect a rise or **go short** if you expect a fall, even without owning any stocks.

| Spec | Detail (per the HNX contract template) |
|---|---|
| Underlying | VN30 Index |
| Multiplier | 100,000 VND per index point |
| Tick size | 0.1 point (= 10,000 VND) |
| Price limit | ±7% of the reference price |
| Contract months | Current month, next month and the last months of the next two quarters |
| Last trading day | Third Thursday of the expiry month |
| Final settlement | Cash, at a final settlement price derived from the index |
| Margin | Rate set by VSDC from time to time (it has been 17% in some periods) |

Two points to understand:

- **T+0:** you can open and close a position on the same day, unlike cash stocks that must wait for settlement.
- **Daily settlement:** at the end of each day positions are marked to the **daily settlement price**; gains are credited and losses debited directly to your margin account. If the account falls below the requirement, you must **post more margin** or face **forced liquidation**.

## Leverage maths (illustrative)

Suppose the contract is at **1,300 points** and the margin rate is **17%** (illustrative numbers):

- Contract value = 1,300 × 100,000 = **130 million VND**.
- Margin needed ≈ 17% × 130 = **22.1 million VND** → leverage ≈ 1 / 0.17 ≈ **5.9×**.
- The index moves 2% against you (26 points): loss 26 × 100,000 = **2.6 million**, about **11.8%** of your margin.
- The index moves 10% against you (130 points): loss **13 million**, about **58.8%** of your margin.

## Why most retail traders lose

1. **Zero-sum before costs:** one side's gain is the other's loss; after fees and taxes the total is negative.
2. **Leverage magnifies mistakes:** an ordinary move can wipe out a large part of your margin.
3. **T+0 encourages overtrading** and emotional decisions.
4. **The other side is often institutional**, with better data, systems and discipline.

If you try it, apply the 1–2% risk rule and always use a stop-loss — see [Position sizing and the 1–2% rule](/learn/position-sizing-and-the-1-2-rule).

## Covered warrants

A **covered warrant (CW)** is issued by a securities company and gives the holder the right to the difference when the underlying stock rises above the **exercise price**. In Vietnam the common type is the **European-style call warrant settled in cash**. The **conversion ratio** tells you how many warrants correspond to one share.

Illustrative example: exercise price 25,000 VND, conversion ratio 5:1, you buy the warrant at 1,000 VND.

- **Break-even** = exercise price + CW price × ratio = 25,000 + 1,000 × 5 = **30,000 VND**.
- Settlement price at expiry 32,000: each CW receives (32,000 − 25,000) / 5 = **1,400 VND** → a 40% gain.
- Settlement price 29,000: each CW receives (29,000 − 25,000) / 5 = **800 VND** → a 20% loss even though the stock is above the exercise price.
- Settlement price ≤ 25,000: the warrant **expires worthless** — a 100% loss.

The maximum loss is limited to what you paid, but **time value** erodes as expiry approaches.

## Hedging a portfolio with futures (illustrative)

You hold a **1 billion VND** portfolio that moves much like VN30 (beta ≈ 1). You fear a decline but do not want to sell your stocks. With the contract at 1,300 points:

> Contracts to short ≈ 1,000,000,000 / 130,000,000 ≈ 7.7 → round to **8 contracts**

If VN30 falls 5% (from 1,300 to 1,235, i.e. 65 points): the portfolio loses about **50 million**, while the short position gains 8 × 65 × 100,000 = **52 million**. The two nearly offset. Conversely, if the market rises, the short eats most of the stock gains — hedging is **buying insurance**, not extra profit. In practice there is also a gap between futures and index prices (basis), the portfolio is not identical to VN30, and positions must be rolled at expiry.

## Practice

Compute: contract at 1,250 points, 17% margin. What are the contract value, the margin and the loss if the index moves 3% against you? Record the results and how you feel about leverage in your [Journal](/journal).

## Sources

- HSC — VN30 Index Futures Contract Template: https://hsc.com.vn/en/transaction-regulations/31-vn30-index-futures-contract-template-1.html
- Vietstock — Derivatives rules and guides (Vietnamese): https://finance.vietstock.vn/chung-khoan-phai-sinh/qui-dinh-huong-dan.htm
- Vietstock — Covered warrant market information: https://finance.vietstock.vn/derivatives/covered-warrant.htm`,
        questions: [
          {
            prompt: 'VN30 futures have a multiplier of 100,000 VND per point. At 1,200 points, what is one contract worth?',
            options: ['12 million VND', '1.2 billion VND', '1.2 million VND', '120 million VND'],
            correct_index: 3,
            explanation: '1,200 × 100,000 = 120,000,000 VND.',
          },
          {
            prompt: 'What does "daily settlement" mean for futures?',
            options: ['Gains and losses are only counted at expiry', 'Each day gains/losses are booked to the margin account; if margin is short you must top up or be liquidated', 'You must buy a new contract every day', 'The exchange covers investors’ losses'],
            correct_index: 1,
            explanation: 'Positions are marked to the daily settlement price; losses hit margin immediately, so leverage can force you to add money quickly.',
          },
          {
            prompt: 'Call warrant: exercise price 20,000 VND, ratio 2:1, CW price 1,500 VND. What is the break-even price?',
            options: ['23,000 VND', '21,500 VND', '20,750 VND', '30,000 VND'],
            correct_index: 0,
            explanation: 'Break-even = 20,000 + 1,500 × 2 = 23,000 VND.',
          },
          {
            prompt: 'What does shorting index futures against a stock portfolio achieve?',
            options: ['Doubles profits when the market rises', 'Eliminates all trading costs', 'Offsets most stock losses when the market falls, at the cost of giving up gains when it rises', 'Guarantees the portfolio always profits'],
            correct_index: 2,
            explanation: 'A hedge works like insurance: it reduces downside risk but also cancels most of the upside if the market rises.',
          },
        ],
      },
      {
        slug: 'gold-deposits-and-alternatives',
        title: 'Gold, deposits and alternative assets',
        summary: 'Domestic gold bars vs world gold, savings deposits, real estate vs REITs, and crypto as a speculative asset.',
        content_md: `## Beyond stocks and bonds

Most Vietnamese household wealth sits in **deposits, gold and real estate**, not securities. Understanding each one helps you put it in the right place in your financial plan.

## Gold: domestic vs world

The **world gold price** is quoted in USD per ounce on international markets. The **domestic gold bar price** (VND per tael, or "lượng") is also affected by the exchange rate, costs, taxes and especially **local supply and demand**. When the supply of gold bars is restricted while demand is strong, the domestic price can sit well above the converted world price — the **premium**.

Points to know:

- For many years, under **Decree 24/2012/ND-CP**, the state held a monopoly on producing gold bars and SJC was chosen by the State Bank as the national gold bar brand; the premium over the world price was at times very large.
- **Decree 232/2025/ND-CP** (effective 10 October 2025) removed that monopoly (including the monopoly on exporting and importing raw gold for bar production), turning gold bar production into a conditional business: enterprises and commercial banks that meet capital requirements and hold a gold bar trading licence can apply to the State Bank for a production licence. The real effect on the premium depends on how licensing and new supply unfold.
- For investors: if you buy when the premium is high, you can **lose money even if the world price is unchanged** once the premium narrows. There is also the dealer's **buy–sell spread**.

**Gold as a hedge:** gold pays no interest or dividends, but people buy it to preserve value during high inflation, currency weakness or crises. That protection is **not reliable**: there have been long periods when gold went sideways or fell sharply. Treat gold as a small diversifying slice, not an "asset that never falls".

## Savings deposits and certificates of deposit

- **Savings deposits:** a fixed rate for a set term, with almost no price fluctuation. Withdrawing early usually earns only the very low demand-deposit rate.
- **Certificates of deposit:** issued by banks, sometimes paying more than savings, but with stricter early-withdrawal terms — read the conditions.
- **Deposit insurance:** from 13 July 2026, under Circular 05/2026/TT-NHNN, the payout limit is **350 million VND per person per insured institution** (principal plus interest), up from the 125 million VND limit applied since late 2021. Limits can change — check the current figure before relying on it.
- **The main risk is inflation:** if the deposit rate is below inflation, your purchasing power falls even as your balance grows.

Deposits suit your **emergency fund** and money needed in the short term.

## Real estate and REITs

**Direct real estate** (homes, land) can produce rental income and long-term appreciation, but:

| Feature | Direct real estate | REITs / listed property funds |
|---|---|---|
| Minimum capital | Very large | Small, bought as fund units |
| Liquidity | Low; selling takes weeks to months | Traded on an exchange (though liquidity may be thin) |
| Diversification | Concentrated in one property | Many income-producing properties |
| Transaction costs | High (taxes, notary, brokerage) | Brokerage fees and fund expenses |
| Leverage | Bank loans are common | Depends on fund policy |

A **REIT** (real estate investment trust) owns income-producing properties (offices, shopping centres…) and distributes most of the income to investors. Vietnam currently has **very few** such products, and liquidity is limited. Also, do not confuse REITs with **property developer stocks** — the latter depend on project sales, the credit cycle and legal approvals (see [Real estate developer statements](/learn/real-estate-developer-statements)).

## Crypto: a highly volatile speculative asset

Crypto (such as Bitcoin and Ethereum) trades 24/7, has no financial statements or business cash flows, and its price is driven mainly by expectations and speculative flows. History shows crypto can **fall more than 70%** in bear markets. Extra risks include exchange collapses, lost wallet keys, scams and regulatory frameworks that are still taking shape in many countries.

If you want to learn, the safest route is to **practise with virtual money**: the simulated account in TradeLab's [Markets](/markets) lets you place crypto orders, use stop-losses and watch volatility without risking real money.

## Practice

List your (or your family's) assets in four groups: deposits, gold, real estate, securities/crypto. Which group is more than half? Could it be sold quickly in an emergency? Then open [Markets](/markets), take a small simulated crypto position and observe its swings for a week.

## Sources

- SGGP — State monopoly on gold bar production officially abolished (Vietnamese): https://www.sggp.org.vn/chinh-thuc-xoa-bo-co-che-nha-nuoc-doc-quyen-san-xuat-vang-mieng-post810260.html
- Thi truong Tai chinh Tien te — Decree 232/2025/ND-CP (Vietnamese): https://thitruongtaichinhtiente.vn/nghi-dinh-so-232-2025-nd-cp-dat-nen-mong-minh-bach-on-dinh-cho-thi-truong-vang-70129.html
- Luat su Viet Nam — Deposit insurance limit raised to 350 million VND (Vietnamese): https://lsvn.vn/nang-han-muc-bao-hiem-tien-gui-len-350-trieu-dong-a176030.html`,
        questions: [
          {
            prompt: 'You buy gold bars when the premium over the world price is very high. What specific risk does this create?',
            options: ['Gold will pay a lower dividend', 'You can lose money when the premium narrows, even if the world price is unchanged', 'There is no risk because gold always rises', 'The bank will confiscate the gold'],
            correct_index: 1,
            explanation: 'Domestic price = converted world price + premium. When the premium shrinks, the domestic price falls even if the world price stands still.',
          },
          {
            prompt: 'What is the main risk of keeping most of your wealth in savings deposits for many years?',
            options: ['Deposit prices swing wildly every day', 'Banks pay no interest', 'Purchasing power can fall if the interest rate is below inflation', 'You cannot withdraw at maturity'],
            correct_index: 2,
            explanation: 'Your balance grows, but if prices rise faster your real purchasing power still falls — that is inflation risk.',
          },
          {
            prompt: 'Compared with buying property directly, what is an advantage of a REIT?',
            options: ['Smaller capital and diversification across many rental properties', 'It never falls in price', 'Its returns are guaranteed by the state', 'It has no costs at all'],
            correct_index: 0,
            explanation: 'A REIT lets you own part of many income-producing properties with little capital, though its price still fluctuates and liquidity may be thin.',
          },
          {
            prompt: 'What is the most suitable way for a beginner to learn about crypto?',
            options: ['Borrow money to buy as much as possible', 'Put the whole emergency fund into one coin', 'Buy whatever social media recommends', 'Practise with a simulated account and only ever risk a small amount you can afford to lose'],
            correct_index: 3,
            explanation: 'Crypto is extremely volatile; practising with virtual money helps you understand the risk before using real money.',
          },
        ],
      },
      {
        slug: 'comparing-and-combining-asset-classes',
        title: 'Comparing and combining asset classes',
        summary: 'A risk/return/liquidity comparison, correlation intuition, and matching assets to goals and time horizons.',
        content_md: `## There is no "best" asset

Every asset class is a **trade-off** between expected return, risk, liquidity and the effort needed to follow it. The right question is not "which asset is best?" but "**which asset fits this money, for this goal, over this time frame?**"

## A qualitative comparison

The table below is **qualitative and relative** — not measured data or a forecast:

| Asset class | Long-run expected return | Volatility | Liquidity | Specific risk |
|---|---|---|---|---|
| Deposits | Low | Very low | High (lose interest if withdrawn early) | Inflation |
| Government bonds | Low–medium | Low–medium | Medium for individuals | Interest rates |
| Corporate bonds | Medium | Medium | Low–medium | Credit, liquidity |
| Stocks / equity ETFs | High | High | High | Market, company |
| Gold | Unreliable | Medium–high | High (with a buy–sell spread) | Domestic premium |
| Direct real estate | Medium–high | Hard to measure (rarely traded) | Low | Legal, concentration, leverage |
| Derivatives | Zero-sum before costs | Very high (leverage) | High | Leverage, margin calls |
| Crypto | Uncertain | Very high | High (24/7) | Speculation, exchanges, regulation |

Note: real estate looks "less volatile" partly because it is **rarely revalued**, not necessarily because it is safer.

## Correlation intuition

Combining assets that **don't move together** smooths a portfolio — the formula is in [Diversification and correlation](/learn/diversification-and-correlation). Some common intuitions (tendencies, not fixed laws):

- **Stocks and government bonds** often react differently in a recession when rates are cut: stocks fall, bonds may rise in price. But when **high inflation pushes rates up**, both can **fall together**.
- **Gold** sometimes rises when risky assets fall, but not consistently.
- **Crypto** assets tend to be highly correlated with each other, and in some periods move with tech stocks.
- In a **crisis**, correlations among risky assets tend to **rise** — exactly when you need diversification most.

## Matching assets to goals and horizons

Split your money by **goal**, one "bucket" per goal:

| Goal | Horizon | Assets that usually fit better |
|---|---|---|
| Emergency fund (3–6 months of expenses) | Could be needed any time | Deposits, money-market funds |
| Car, tuition | 1–3 years | Deposits, high-quality bonds/bond funds |
| Home purchase | 3–7 years | Bonds plus some stocks, reducing stocks as the date approaches |
| Retirement, financial freedom | Over 10 years | Higher share of stocks/ETFs, plus bonds and a small slice of other assets |

The principle: **the sooner you need the money, the less of it should sit in volatile assets**. Long-term money has time to recover from short-term swings — but only if you are **never forced to sell** at the bottom.

## A 4-step reference framework (not advice)

1. **Foundation:** an emergency fund in deposits; pay down high-interest debt before taking investment risk.
2. **Core:** most long-term money in diversified, low-cost holdings (for example equity index funds and bond funds), in proportions that match your risk tolerance.
3. **Satellite:** a small slice for hand-picked stocks, gold or crypto — money whose loss would not derail your main goals.
4. **Discipline:** set a rebalancing rule and review once a year or whenever your circumstances change.

Derivatives, if used at all, should be treated as **hedging tools or tightly capped short-term trading**, never part of the "core".

To choose specific weights and learn how to rebalance, read [Asset allocation and rebalancing](/learn/asset-allocation-and-rebalancing) in the Portfolio management chapter, then experiment with TradeLab's [Investment plans](/learn/plans) tool.

## Practice

Open [Investment plans](/learn/plans) and create a plan for one concrete goal (for example retiring in 20 years). Write down: the goal, the horizon, your current emergency fund, your core/satellite split, and one asset class you will **not** use — with your reason.

## Sources

- Investor.gov (SEC) — Beginners' Guide to Asset Allocation, Diversification, and Rebalancing (PDF): https://www.investor.gov/sites/investorgov/files/2019-02/Beginners-Guide-to-Asset-Allocation.pdf
- Investor.gov (SEC) — Asset Allocation and Diversification: https://www.investor.gov/introduction-investing/getting-started/asset-allocation`,
        questions: [
          {
            prompt: 'You need money for a car in 18 months. Which choice is most reasonable?',
            options: ['Everything in futures contracts', 'Mostly deposits or high-quality bonds', 'Everything in crypto', 'Everything in one sector’s stocks'],
            correct_index: 1,
            explanation: 'A short horizon leaves no time to recover from a market fall, so low-volatility assets should come first.',
          },
          {
            prompt: 'Why does direct real estate sometimes "look" less volatile than stocks?',
            options: ['Because property never falls in price', 'Because the state fixes property prices', 'Because it is covered by deposit insurance', 'Because it is revalued far less often than listed stocks'],
            correct_index: 3,
            explanation: 'Stocks are priced every minute; property rarely trades, so its volatility is hidden rather than necessarily lower.',
          },
          {
            prompt: 'When are stocks and bonds most likely to fall TOGETHER?',
            options: ['When high inflation drives interest rates sharply higher', 'When rates are cut during a recession', 'When companies report strong profits', 'Never'],
            correct_index: 0,
            explanation: 'Rising rates push bond prices down and also lower stock valuations — the correlation can turn positive.',
          },
          {
            prompt: 'In a "core–satellite" framework, what should the satellite be?',
            options: ['The entire emergency fund', 'Most of your retirement money', 'A small slice for higher-risk assets whose loss would not derail your main goals', 'A bank loan used for investing'],
            correct_index: 2,
            explanation: 'The core is diversified and low-cost; the satellite is a small, clearly capped portion for experimentation.',
          },
        ],
      },
    ],
  },
]
