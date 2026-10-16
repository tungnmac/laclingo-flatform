import type { SeedChapter } from './types'

// Advanced (en) — the valuation chapter keeps using the 2025 figures of "Acme Corp" from the Fundamental analysis chapter
// ($ million: revenue 1,000, EBIT 200, depreciation 60, interest 25, net income 140, FCF 50, borrowings 350, cash 100, 100 million shares, price $21).
// The portfolio chapter uses a $100,000 example portfolio. Every calculation has been double-checked.
export const EN_ADVANCED: SeedChapter[] = [
  {
    slug: 'advanced-valuation',
    title: 'Advanced valuation',
    description: 'DCF, EV/EBITDA, margin of safety and the common traps when estimating a business’s intrinsic value.',
    level: 'advanced',
    lessons: [
      {
        slug: 'dcf-discounted-cash-flow',
        title: 'DCF — discounted cash flow valuation',
        summary: 'Project free cash flow, choose a discount rate, compute a terminal value and test how sensitive the result is.',
        content_md: `## The core idea

The P/E ratio tells you what the market **is paying** for earnings. The **DCF (discounted cash flow)** method answers a different question: **what is the business worth**, based on all the cash it will generate in the future, translated into today's money.

Why "translate into today's money"? Because **$1 today is worth more than $1 next year**: you can invest it, and future cash always carries risk. If you require a 9% annual return, $109 received in one year is worth only $100 today.

> Present value (PV) = Cash flow in year n / (1 + r)^n

## Step 1: pick the starting cash flow

In the previous chapter Acme Corp had **FCF = CFO − capital expenditure = 140 − 90 = $50 million**. That figure is after interest, so it belongs to shareholders. To value the **whole business** (lenders and shareholders together) we use **FCFF — free cash flow to the firm**, by adding back after-tax interest:

> FCFF ≈ 50 + 25 × (1 − 20%) = 50 + 20 = **$70 million**

## Step 2: project five years

In 2025 Acme spent $90 million expanding its factory, more than its $60 million of depreciation. Base-case assumption: once the project is finished, capital spending eases and the new capacity lifts FCFF to $100 million in 2026, then adds $15 million each year. Discounting at 9%:

| Year | FCFF ($m) | Discount factor 1/(1.09)^n | Present value |
|---|---|---|---|
| 2026 | 100 | 0.9174 | 91.7 |
| 2027 | 115 | 0.8417 | 96.8 |
| 2028 | 130 | 0.7722 | 100.4 |
| 2029 | 145 | 0.7084 | 102.7 |
| 2030 | 160 | 0.6499 | 104.0 |
| **Total** | | | **495.6** |

## Step 3: the discount rate — WACC intuition

The discount rate is **the return that the providers of capital demand**. For FCFF we use **WACC — the weighted average cost of capital** of shareholders and lenders:

- Shareholders take more risk, so they demand about **9.5%**.
- Lenders receive 25 / 350 ≈ 7.1%; because interest is tax-deductible, the true cost is ≈ 7.1% × 0.8 ≈ **5.7%**.
- At market values, $2,100 million of equity is about 86% of the total and $350 million of borrowings about 14%.

> WACC ≈ 0.86 × 9.5% + 0.14 × 5.7% ≈ 8.17% + 0.80% ≈ **9%**

The riskier the business, the higher the discount rate and the lower the present value.

## Step 4: terminal value

The business does not stop after 2030. Everything from 2031 onwards is captured in one number using the **Gordon growth model**, assuming FCFF grows at g = 3% a year forever:

> TV = FCFF 2030 × (1 + g) / (WACC − g) = 160 × 1.03 / (0.09 − 0.03) = 164.8 / 0.06 ≈ **$2,746.7 million**

In today's money: 2,746.7 × 0.6499 ≈ **$1,785.1 million**. The formula only makes sense when **g is below WACC**, and long-run g should not exceed the nominal growth rate of the economy.

## Step 5: from enterprise value to value per share

> Enterprise value (EV) = 495.6 + 1,785.1 = **$2,280.7 million**
>
> Equity value = EV − net debt = 2,280.7 − (350 − 100) = **$2,030.7 million**
>
> Value per share = $2,030.7 million / 100 million shares ≈ **$20.30**

## Sensitivity: the result is a range, not a number

| WACC (rows) / g (columns) | g = 2% | g = 3% | g = 4% |
|---|---|---|---|
| 8% | $21.10 | $25.00 | $30.90 |
| 9% | $17.60 | **$20.30** | $24.10 |
| 10% | $15.00 | $16.90 | $19.50 |

Move WACC or g by one percentage point and the value swings from $15.00 to $30.90. The $21 market price sits near the middle of the table — a DCF does not declare a stock "cheap" or "expensive" in absolute terms; it shows you **what the current price is quietly assuming**.

## Practice

Take a company you follow and project its FCFF for five years under three sets of assumptions (cautious, base, optimistic). Note in your [Journal](/journal) which assumption moves the result the most.`,
        questions: [
          {
            prompt: 'Why does a DCF discount future cash flows back to the present?',
            options: ['Because $1 today can be invested and carries no waiting risk, so it is worth more than $1 in the future', 'Because accounting rules require it', 'Because future cash flows are always negative', 'So that the value always equals the market price'],
            correct_index: 0,
            explanation: 'The time value of money: cash received later has an opportunity cost and risk, so it must be discounted.',
          },
          {
            prompt: 'Final-year FCFF = $160 million, g = 3%, WACC = 9%. Roughly what is the (undiscounted) Gordon terminal value?',
            options: ['$1,777.8 million', '$2,746.7 million', '$2,666.7 million', '$5,333.3 million'],
            correct_index: 1,
            explanation: 'TV = 160 × 1.03 / (0.09 − 0.03) = 164.8 / 0.06 ≈ $2,746.7 million.',
          },
          {
            prompt: 'When does the Gordon growth model give a meaningful result?',
            options: ['When g is greater than WACC', 'When g equals WACC', 'When g is below WACC and at a sustainable long-run level', 'When the company has no debt'],
            correct_index: 2,
            explanation: 'The denominator is WACC − g; if g ≥ WACC the formula gives an infinite or negative value — meaningless.',
          },
          {
            prompt: 'DCF enterprise value = $2,280.7 million, net debt = $250 million, 100 million shares. Roughly what is the value per share?',
            options: ['≈ $22.80', '≈ $25.30', '≈ $2.03', '≈ $20.30'],
            correct_index: 3,
            explanation: 'Equity value = 2,280.7 − 250 = $2,030.7 million; divided by 100 million shares ≈ $20.30.',
          },
        ],
      },
      {
        slug: 'ev-ebitda-and-relative-valuation',
        title: 'EV, EV/EBITDA and relative valuation',
        summary: 'Bridge from market cap to enterprise value, why EV/EBITDA complements P/E and how to value a company with peer multiples.',
        content_md: `## Market cap is not "the price of the whole company"

Market capitalisation = share price × shares outstanding. For Acme Corp: $21 × 100 million shares = **$2,100 million**. But if you bought all of Acme, you would also **take on its borrowings** and at the same time **get the cash** in its bank account. It is like buying a house with a mortgage on it: the real price includes the loan still owed to the bank.

## The bridge from market cap to EV

| Item | $ million |
|---|---|
| Market capitalisation | 2,100 |
| + Borrowings (interest-bearing) | 350 |
| − Cash and cash equivalents | (100) |
| **= Enterprise value (EV)** | **2,350** |

> EV = Market cap + Borrowings − Cash = 2,100 + 350 − 100 = **$2,350 million**

The "borrowings − cash" part, $250 million, is called **net debt**. A company holding more cash than debt has negative net debt and an EV below its market cap. In practice analysts also add minority interests and preferred shares where they exist.

## EBITDA and the EV/EBITDA multiple

**EBITDA** is earnings before interest, taxes, depreciation and amortisation:

> EBITDA = EBIT + Depreciation = 200 + 60 = **$260 million**
>
> EV/EBITDA = 2,350 / 260 ≈ **9.0x**

Compare that with **P/E = 21 / 1.40 = 15x**. The two multiples measure different things: P/E compares **the price of the shares** with **the earnings that belong to shareholders**; EV/EBITDA compares **the price of the whole business** with **the operating profit of the whole business**.

## Why use EV/EBITDA alongside P/E?

- **Not distorted by capital structure:** two companies own identical factories with the same $260 million of EBITDA; company M has no debt, company N borrows heavily. N pays more interest, so its net income is lower and its P/E looks very different even though the businesses are the same. EV/EBITDA puts them on equal footing.
- **Less affected by different depreciation and tax policies** across companies and countries.
- **Fits mergers and acquisitions**, because a buyer of the whole company has to account for the debt.

But EBITDA has a blind spot: it **ignores capital expenditure**. Acme spent $90 million on fixed assets, more than its $60 million of depreciation — EBITDA does not show that real cash outflow. For capital-heavy businesses also look at EV/EBIT or EV/FCFF. EV/EBITDA is also **not used for banks**, because for a bank, debt is the raw material of the business.

## Relative valuation with peers

The idea: similar businesses should trade at similar multiples. Suppose three (fictional) companies in the same industry:

| Company | EV/EBITDA |
|---|---|
| Company X | 8.0x |
| Company Y | 10.0x |
| Company Z | 11.0x |
| **Peer median** | **10.0x** |
| Acme Corp | 9.0x |

Applying the median multiple to Acme:

> Implied EV = 10.0 × 260 = $2,600 million → Equity = 2,600 − 250 = $2,350 million → **$23.50 per share**

At the lowest multiple (8.0x): EV = 2,080, equity = $1,830 million → $18.30. At the highest multiple (11.0x): EV = 2,860, equity = $2,610 million → $26.10. The result is a **range of $18.30–$26.10**, not a single number.

Note: use the **median** rather than the average so that one unusual company does not skew the result, and only compare with businesses that are genuinely similar in size, growth and margins. Relative valuation only tells you whether Acme is **cheap or expensive versus its peers** — if the whole industry is overvalued, a "relatively cheap" Acme can still be expensive.

## Practice

Pick three companies in the same industry and compute EV and EV/EBITDA for each from their financial statements. Which company gets conflicting signals from P/E and EV/EBITDA? Try to explain it with their debt levels.`,
        questions: [
          {
            prompt: 'Market cap $2,100 million, borrowings $350 million, cash and equivalents $100 million. What is EV?',
            options: ['$2,550 million', '$2,350 million', '$1,850 million', '$2,000 million'],
            correct_index: 1,
            explanation: 'EV = market cap + borrowings − cash = 2,100 + 350 − 100 = $2,350 million.',
          },
          {
            prompt: 'EV = $2,350 million, EBIT = $200 million, depreciation = $60 million. Roughly what is EV/EBITDA?',
            options: ['11.8x', '15.0x', '9.0x', '39.2x'],
            correct_index: 2,
            explanation: 'EBITDA = 200 + 60 = $260 million; EV/EBITDA = 2,350 / 260 ≈ 9.0x.',
          },
          {
            prompt: 'Why is EV/EBITDA useful when comparing two companies with very different debt levels?',
            options: ['Because EBITDA already deducts all capital expenditure', 'Because EV/EBITDA is not distorted by interest costs and capital structure the way P/E is', 'Because EV always equals market cap', 'Because EV/EBITDA works for every bank'],
            correct_index: 1,
            explanation: 'EV includes debt and EBITDA is profit before interest — so companies with different capital structures stay comparable.',
          },
          {
            prompt: 'The peer median EV/EBITDA is 10x. Acme has EBITDA of $260 million, net debt of $250 million and 100 million shares. What value per share does this multiple imply?',
            options: ['$26.00', '$28.50', '$15.00', '$23.50'],
            correct_index: 3,
            explanation: 'EV = 10 × 260 = $2,600 million; equity = 2,600 − 250 = $2,350 million; divided by 100 million shares = $23.50.',
          },
        ],
      },
      {
        slug: 'margin-of-safety-and-intrinsic-value',
        title: 'Margin of safety and intrinsic value',
        summary: 'Intrinsic value is a range, scenario analysis, and using a margin of safety to cover your own estimation errors.',
        content_md: `## Intrinsic value is a range

**Intrinsic value** is what a business is "really" worth, based on its ability to generate cash in the future. Because the future is uncertain, nobody knows the exact number. The last two lessons gave us several estimates for Acme Corp:

| Method | Result (per share) |
|---|---|
| DCF base case | $20.30 |
| DCF with WACC 8–10%, g 2–4% | $15.00 – $30.90 |
| Peer EV/EBITDA (8–11x) | $18.30 – $26.10 |

The $21 market price sits **inside** this range. To make a decision we need two more tools: **scenario analysis** and a **margin of safety**.

## Scenario analysis

Instead of only nudging WACC and g, we tell three different "stories" about the business, each with its own set of assumptions:

| Scenario | Key assumptions | Value per share | Probability |
|---|---|---|---|
| Bear | New project underdelivers: FCFF 85 → 105, WACC 10%, g 2% | $9.40 | 25% |
| Base | As in the DCF lesson: FCFF 100 → 160, WACC 9%, g 3% | $20.30 | 50% |
| Bull | Wins market share: FCFF 105 → 185, WACC 8.5%, g 3.5% | $28.60 | 25% |

Probability-weighted expected value:

> 0.25 × 9.40 + 0.50 × 20.30 + 0.25 × 28.60 = 2.35 + 10.15 + 7.15 = **$19.65**

Against the $21 price: if the bull case happens, the stock could rise (28.60 − 21) / 21 ≈ **+36.2%**; if the bear case happens, it could fall (9.40 − 21) / 21 ≈ **−55.2%**. The downside is larger than the upside — something the single "$20.30" figure does not reveal.

## Margin of safety

Benjamin Graham — the teacher of many value investors — suggested buying only when the price is **well below** your estimate of intrinsic value. That gap is the **margin of safety**:

> Margin of safety = (Intrinsic value − Market price) / Intrinsic value

For Acme at $21 versus the $20.30 base value:

> (20.30 − 21) / 20.30 ≈ **−3.4%** → no margin of safety

If you require a 25% margin of safety, the maximum purchase price is 20.30 × (1 − 25%) ≈ **$15.20**. If a market panic pushed the price down to $15, the margin of safety would then be (20.30 − 15) / 20.30 ≈ **26.1%**.

## Why you need a margin of safety

- **You might be wrong:** FCFF projections, WACC and g are all guesses. The margin of safety is a cushion for those errors.
- **Surprises always happen:** a big customer leaves, regulation changes, interest rates rise.
- **Better returns when you are right:** buying below value means extra profit as the price converges towards value.

The margin should be larger for hard-to-predict businesses (cyclicals, young companies) and can be smaller for stable, low-debt businesses with long track records.

## Turn the analysis into a plan

A disciplined investor writes things down **before** the market moves: the estimated intrinsic value, the price zone to buy in, and what would change the assumptions. When the price reaches the buy zone, you act on the plan rather than on emotion. This is a lesson in method, not a recommendation to buy or sell any stock.

## Practice

For the company you modelled in the DCF lesson, build a three-scenario table with probabilities, compute the expected value and the purchase price that gives a 25% margin of safety. Record the plan in your [Journal](/journal).`,
        questions: [
          {
            prompt: 'Estimated intrinsic value is $20, the market price is $15. What is the margin of safety?',
            options: ['25%', '33.3%', '75%', '5%'],
            correct_index: 0,
            explanation: 'Margin of safety = (20 − 15) / 20 = 25% (divide by intrinsic value, not by price).',
          },
          {
            prompt: 'Three scenarios: $9.40 (25% probability), $20.30 (50%), $28.60 (25%). What is the expected value?',
            options: ['$19.43', '$20.30', '$19.65', '$28.60'],
            correct_index: 2,
            explanation: '0.25 × 9.40 + 0.5 × 20.30 + 0.25 × 28.60 = 2.35 + 10.15 + 7.15 = $19.65. $19.43 is the unweighted average.',
          },
          {
            prompt: 'Why should intrinsic value be treated as a range rather than an exact number?',
            options: ['Because intrinsic value changes every minute with the price', 'Because the result depends on uncertain assumptions, and small changes move it a lot', 'Because accounting allows rounding', 'Because companies publish their own intrinsic value'],
            correct_index: 1,
            explanation: 'Cash flow projections, WACC and g are all estimates; the sensitivity table shows a very wide spread of values.',
          },
          {
            prompt: 'The base value is $20.30 and you require a 25% margin of safety. Roughly what is the maximum purchase price?',
            options: ['$25.40', '$16.24', '$20.30', '$15.20'],
            correct_index: 3,
            explanation: 'Maximum price = 20.30 × (1 − 25%) ≈ $15.20.',
          },
        ],
      },
      {
        slug: 'valuation-pitfalls',
        title: 'Valuation pitfalls',
        summary: 'Garbage in, garbage out; a dominant terminal value; peak cyclical earnings; forgetting debt and dilution; and anchoring.',
        content_md: `## A neat model is not necessarily a right one

A DCF spreadsheet looks precise, with dozens of cells of numbers, but the precision of a spreadsheet is no substitute for correct assumptions. Here are the most common traps, illustrated with Acme Corp itself.

## 1. Garbage in, garbage out

The output is only as good as the inputs. In the sensitivity table the same business is worth **$15.00** (WACC 10%, g 2%) or **$30.90** (WACC 8%, g 4%) — more than double. Signs that assumptions have gone too far:

- Revenue growth of 20–30% a year for a whole decade while the industry grows at 8%.
- Projected margins far above every competitor with no clear reason.
- A discount rate below the long-term government bond yield plus a sensible risk premium.

The defence: always compare assumptions with **the company's own history** and **the industry average**, and ask yourself "what has to happen for this assumption to be true?".

## 2. Terminal value dominates

In Acme's DCF the present value of the terminal value is $1,785.1 million out of a total EV of $2,280.7 million:

> 1,785.1 / 2,280.7 ≈ **78.3%** of the value comes from after year 5

So most of the result rests on the two hardest numbers to know: long-run g and WACC. Raising g from 3% to 4% lifts the value per share from about $20.30 to $24.10 (almost +19%). If the terminal value is 85–90% of EV, treat it as a sign that the result depends too heavily on belief. Also, **g must not exceed** the long-run nominal growth rate of the economy — no company can outgrow the whole economy forever.

## 3. Peak cyclical earnings

In steel, fertiliser or shipping, one year's profit can be double the cycle average. Suppose Acme's $140 million of 2025 net income is a peak and the cycle average is only about $100 million:

> P/E on this year's earnings = 2,100 / 140 = 15x
>
> P/E on cycle-average earnings = 2,100 / 100 = **21x**

The stock only looks "cheap" because the denominator is at its peak. For cyclical businesses use **average earnings across the whole cycle** (5–10 years), and be especially careful when the P/E is at a historical low.

## 4. Forgetting debt and dilution

- **Forgetting net debt:** divide the $2,280.7 million EV straight by 100 million shares and you get about $22.80 instead of $20.30 — **about $2.50 too high**, exactly the $250 million of net debt divided by 100 million shares. Enterprise value also belongs to lenders; shareholders only get what is left.
- **Forgetting dilution:** if Acme has employee stock options and convertible bonds equivalent to 10 million new shares, the fully diluted count is 110 million: $2,030.7 million / 110 million ≈ **$18.50**, about 9.1% lower. Always use the **fully diluted share count**.

## 5. Anchoring

The human brain clings to the first number it sees:

- **Anchoring on your purchase price:** "I bought at $30, I'll sell when it gets back there" — while the market neither knows nor cares what you paid.
- **Anchoring on an old high:** "It used to be $35, so $21 is cheap" — the old high may have been a bubble.
- **Anchoring on someone else's price target**, or tweaking assumptions until the DCF produces the number you wanted (confirmation bias).

The defence: build the model **before looking at the price**, write your assumptions down, and actively look for reasons you might be wrong.

## A checklist before trusting a valuation

| Question | If "yes"… |
|---|---|
| Is assumed growth above history and the industry? | Lower it, or be able to explain why |
| Is the terminal value above 80% of EV? | Revisit g, WACC and the forecast period |
| Are this year's earnings unusually high? | Use cycle-average earnings |
| Have you subtracted net debt and used diluted shares? | Mandatory |
| Does the result "happen" to match what you hoped? | Ask someone else to challenge the assumptions |

## Practice

Reopen the DCF model you built, run it through the checklist above and record in your [Journal](/journal) at least one assumption you had to fix.`,
        questions: [
          {
            prompt: 'In a DCF model the terminal value is about 78% of EV. What does that mean?',
            options: ['The result is very sensitive to long-run assumptions such as g and WACC', 'The model is certainly accurate', 'The company has no debt left', 'The first five years of cash flow do not need projecting'],
            correct_index: 0,
            explanation: 'Most of the value comes from beyond the forecast period, so small changes to g or WACC move the result a lot.',
          },
          {
            prompt: 'EV = $2,280.7 million, net debt = $250 million, 100 million shares. If you forget net debt and divide EV straight by the share count, how wrong is the result?',
            options: ['About $2.50 per share too low', 'Not wrong, because EV belongs to shareholders', 'About $2.50 per share too high', 'About $0.25 per share too high'],
            correct_index: 2,
            explanation: '2,280.7 / 100 million ≈ $22.80 instead of (2,280.7 − 250) / 100 million ≈ $20.30 — about $2.50 too high.',
          },
          {
            prompt: 'Market cap $2,100 million. This year’s net income is $140 million (a cyclical peak); cycle-average net income is $100 million. What is the P/E on cycle-average earnings?',
            options: ['15x', '21x', '14x', '10x'],
            correct_index: 1,
            explanation: 'Cyclical P/E = 2,100 / 100 = 21x — much more expensive than the 15x based on peak earnings.',
          },
          {
            prompt: 'Which situation is an example of anchoring?',
            options: ['Using cycle-average earnings to compute P/E', 'Subtracting net debt when computing equity value', 'Comparing assumptions with the industry average', 'Refusing to sell because you want to "wait until it gets back to my $30 purchase price" even though intrinsic value has fallen'],
            correct_index: 3,
            explanation: 'Your purchase price is a number you anchor on; it has nothing to do with what the business is worth now.',
          },
        ],
      },
    ],
  },
  {
    slug: 'portfolio-management',
    title: 'Portfolio management',
    description: 'Diversification, asset allocation, rebalancing, DCA and how to measure the performance of a whole portfolio.',
    level: 'advanced',
    lessons: [
      {
        slug: 'diversification-and-correlation',
        title: 'Diversification and correlation',
        summary: 'Correlation, systematic versus idiosyncratic risk, and how many holdings are enough.',
        content_md: `## Don't put all your eggs in one basket

A familiar saying that is often misunderstood. Diversification is not about **buying lots of things**; it is about buying things that **do not rise and fall together**. The measure for that is **correlation**.

## The correlation coefficient

The correlation coefficient (written ρ, "rho") measures how much two assets move in the same direction, on a scale from −1 to +1:

| Coefficient | Meaning | Illustration |
|---|---|---|
| +1 | Always rise and fall together | Two very similar bank stocks |
| 0 | Unrelated | Two assets with completely different drivers |
| −1 | Always move in opposite directions | Rare in practice |

Example: two assets each have 20% annual volatility and you split your money 50/50. The portfolio's volatility depends on their correlation:

> Portfolio volatility = 20% × √((1 + ρ) / 2)

| Correlation ρ | Portfolio volatility |
|---|---|
| +1 | 20% — no reduction at all |
| +0.5 | ≈ 17.3% |
| 0 | ≈ 14.1% |
| −1 | 0% |

The portfolio's expected return is still the average of the two assets, but risk falls as correlation falls. That is why diversification is called **"the only free lunch"** in investing.

## Systematic and idiosyncratic risk

The risk of a single stock has two parts:

- **Idiosyncratic (company-specific) risk:** affects one company only — a CEO resigns, a major contract is lost, a factory has an accident. This part **can be reduced** by diversifying, because bad news at one company tends to be offset by good news at another.
- **Systematic (market) risk:** affects almost the whole market — rising interest rates, recessions, financial crises. This part **cannot be removed** by buying more stocks; it can only be reduced by holding **other asset classes** (bonds, cash) or a smaller share of risky assets.

## How many holdings are enough?

Academic research generally finds that about **20–30 stocks across different industries** removes most idiosyncratic risk; beyond that the benefit fades. Three caveats:

1. **Number is no substitute for difference:** 20 real-estate stocks are still one bet on real estate.
2. **Crypto assets tend to be highly correlated with each other:** when Bitcoin falls sharply, most altcoins follow. Ten different coins are still a very concentrated portfolio.
3. **Correlations rise in a crisis:** when markets panic, many risky assets fall at the same time. Diversification helps, but it is not an absolute shield.

On the other hand, holding too many things you neither understand nor follow — sometimes jokingly called "diworsification" — only makes your portfolio look like the market index while costing more fees and effort. If you want broad diversification, an index fund is usually the simpler route.

## Practice

List the assets you hold (including in your simulated trading account) and group them by industry and asset class. Does any group make up more than 40% of the total value? Do the assets inside that group tend to rise and fall together?`,
        questions: [
          {
            prompt: 'Adding an asset with which correlation to your current portfolio reduces risk the most?',
            options: ['+1', '+0.5', '0', '−0.5'],
            correct_index: 3,
            explanation: 'The lower (more negative) the correlation, the more the movements offset each other and the more portfolio risk falls.',
          },
          {
            prompt: 'Which type of risk CANNOT be removed by buying more different stocks?',
            options: ['The risk that one company’s CEO resigns', 'Systematic risk such as rising interest rates or a recession', 'The risk of an accident at one factory', 'The risk that one company loses a major contract'],
            correct_index: 1,
            explanation: 'Systematic risk affects almost the whole market, so adding more stocks cannot diversify it away.',
          },
          {
            prompt: 'Two assets each have 20% volatility, split 50/50, with zero correlation. Roughly what is the portfolio volatility?',
            options: ['20%', '10%', '14.1%', '0%'],
            correct_index: 2,
            explanation: '20% × √((1 + 0) / 2) = 20% × 0.707 ≈ 14.1%.',
          },
          {
            prompt: 'Is a portfolio of 10 different crypto coins well diversified?',
            options: ['Yes, because 10 assets are enough', 'Yes, because each coin has a different name', 'No, because crypto carries no risk', 'Not really, because crypto coins tend to be highly correlated and fall sharply together when the market drops'],
            correct_index: 3,
            explanation: 'Diversification depends on correlation, not on count; crypto assets usually move in the same direction.',
          },
        ],
      },
      {
        slug: 'asset-allocation-and-rebalancing',
        title: 'Asset allocation and rebalancing',
        summary: 'Split money across stocks, bonds, cash and crypto to match your risk profile, then rebalance on a calendar or by thresholds.',
        content_md: `## The most important decision

Which stocks to pick gets the most attention, but for most investors the decision with the biggest long-term impact is **asset allocation**: what percentage goes into stocks, bonds, cash and high-risk assets such as crypto. That mix determines how deep the portfolio can fall when markets turn bad.

## The four asset classes in our example

- **Stocks:** the best long-term growth of the three traditional classes, but they can fall 30–50% in a crisis.
- **Bonds:** lower returns, less volatility, usually make the portfolio "smoother".
- **Cash / deposits:** almost no volatility; an emergency fund and "dry powder" for opportunities.
- **Crypto:** extremely volatile and can fall more than 70% — if held at all, usually only a small slice.

## Allocation by risk profile

Three illustrative mixes (not recommendations):

| Profile | Stocks | Bonds | Cash | Crypto |
|---|---|---|---|---|
| Conservative | 30% | 50% | 18% | 2% |
| Balanced | 50% | 35% | 10% | 5% |
| Growth | 70% | 15% | 5% | 10% |

There is no "correct" mix — every source suggests its own. The [Investment plans](/learn/plans) tool uses its own templates for 4 profiles (including "Aggressive"); the numbers differ slightly from this table but follow the same idea: the more risk you accept, the more stocks/crypto.

When choosing, ask yourself:

1. **Time horizon:** money you need within 2 years should not sit mostly in assets that can fall 40%.
2. **Your real tolerance for losses:** if the portfolio dropped 25%, could you sleep and avoid panic selling?
3. **Emergency fund:** keep a few months of spending in cash before investing.

TradeLab's [Investment plans](/learn/plans) page lets you try different allocations and see how the portfolio might behave.

## Portfolios drift away from the plan

Suppose you have **$100,000** in the Balanced mix. After a year, stocks are up 20%, bonds up 4%, cash earned 2% and crypto rose 60%:

| Asset class | Start of year | End of year | End-of-year weight | Target (50/35/10/5) | Action |
|---|---|---|---|---|---|
| Stocks | 50,000 | 60,000 | 52.4% | 57,300 | Sell 2,700 |
| Bonds | 35,000 | 36,400 | 31.8% | 40,110 | Buy 3,710 |
| Cash | 10,000 | 10,200 | 8.9% | 11,460 | Add 1,260 |
| Crypto | 5,000 | 8,000 | 7.0% | 5,730 | Sell 2,270 |
| **Total** | **100,000** | **114,600** | 100% | **114,600** | |

(in $). Total sales of 2,700 + 2,270 = $4,970 exactly match total purchases of 3,710 + 1,260 = $4,970. Without rebalancing the portfolio quietly becomes **riskier** than planned, because the parts that rose most are also the riskiest.

## Two ways to rebalance

- **Calendar:** every 6 or 12 months, bring weights back to target. Simple and easy to stick to.
- **Threshold:** rebalance only when an asset class drifts beyond a preset band. For example, with a band of ±20% of the target weight, crypto at a 5% target may range from 4–6%; at 7.0% it has broken the band, while stocks (allowed 40–60%) are still fine. Small, volatile asset classes usually hit their bands first.

Rebalancing forces you to **trim what just rose and add to what just lagged** — the opposite of crowd emotion. Watch trading fees and taxes: rebalancing too often can be costly. A cheaper way is to use **new contributions** to buy what is underweight instead of selling what is overweight.

## Practice

Open [Investment plans](/learn/plans) and try two different allocation mixes. Write down your rebalancing rule: calendar or threshold, and what the threshold is.`,
        questions: [
          {
            prompt: 'What is the main purpose of rebalancing a portfolio?',
            options: ['To maximise short-term profit', 'To bring the portfolio’s risk back to the allocation you chose', 'To always buy more of the best-performing asset', 'To avoid every possible loss'],
            correct_index: 1,
            explanation: 'Portfolios drift towards whatever rose most (usually riskier assets); rebalancing pulls risk back to plan.',
          },
          {
            prompt: 'The portfolio is worth $114,600, the stock target is 50% and you currently hold $60,000 of stocks. How much stock do you sell to get back to target?',
            options: ['$10,000', '$4,970', '$7,300', '$2,700'],
            correct_index: 3,
            explanation: 'Target = 50% × 114,600 = $57,300; sell 60,000 − 57,300 = $2,700.',
          },
          {
            prompt: 'What does "threshold" rebalancing mean?',
            options: ['Rebalancing only when an asset class’s weight drifts from target beyond a preset band', 'Rebalancing every day', 'Selling everything when the market falls', 'Buying only the lowest-priced asset'],
            correct_index: 0,
            explanation: 'Threshold rebalancing sets an allowed band in advance and acts only when a weight moves outside it.',
          },
          {
            prompt: 'Which factor should determine your asset allocation?',
            options: ['Whichever asset rose most last month', 'Advice on social media', 'Your time horizon and your real tolerance for losses', 'The number of tickers on the exchange'],
            correct_index: 2,
            explanation: 'Allocation must fit your goals, when you need the money and how big a drop you can bear without panic selling.',
          },
        ],
      },
      {
        slug: 'dca-vs-lump-sum',
        title: 'DCA vs lump-sum investing',
        summary: 'Dollar-cost averaging versus investing everything at once: a worked example, the behavioural benefits and the limits of DCA.',
        content_md: `## Two ways to invest the same money

You have **$12,000** to put into a stock fund. You have two options:

- **Lump sum:** invest the whole $12,000 today.
- **DCA (dollar-cost averaging):** split it evenly, investing **$2,000** a month for 6 months, whether prices rise or fall.

## Scenario 1: the market falls, then recovers

The fund's unit price over 6 months ($): 100, 80, 50, 80, 100, 125.

| Month | Price | Invested | Units bought |
|---|---|---|---|
| 1 | 100 | $2,000 | 20 |
| 2 | 80 | $2,000 | 25 |
| 3 | 50 | $2,000 | 40 |
| 4 | 80 | $2,000 | 25 |
| 5 | 100 | $2,000 | 20 |
| 6 | 125 | $2,000 | 16 |
| **Total** | | **$12,000** | **146** |

> Average cost = $12,000 / 146 ≈ **$82.19 per unit**

The simple average of the 6 prices is (100 + 80 + 50 + 80 + 100 + 125) / 6 ≈ $89.17, but the DCA cost is lower — because the same amount of money **buys more units when prices are low**.

At the end of month 6, at a price of $125:

- **DCA:** 146 × 125 = $18,250 → a gain of **+52.1%**.
- **Lump sum:** $12,000 bought 120 units at $100 → 120 × 125 = $15,000 → a gain of **+25%**.

## Scenario 2: the market rises steadily

Prices over 6 months: 100, 105, 110, 115, 120, 125. Each $2,000 buys 20; 19.05; 18.18; 17.39; 16.67; and 16 units — about **107.29** units in total.

- **DCA:** 107.29 × 125 ≈ $13,411 → a gain of about **+11.8%**.
- **Lump sum:** still $15,000 → a gain of **+25%**.

When prices rise steadily, the money DCA keeps waiting on the sidelines misses the rally, so the lump sum clearly wins.

## So which is better?

- **Mathematically:** for an asset that trends upward over the long run, a lump sum **usually** comes out ahead in most periods, because the money starts working sooner.
- **Behaviourally:** DCA has a big advantage. It removes the pressure to "buy the bottom", reduces regret if the market drops right after you buy, and turns investing into an **automatic habit**. An average plan you stick to for years beats an optimal plan you abandon after the first drop.
- **With a monthly income:** most working people already dollar-cost average naturally — investing part of every pay cheque.

A middle path: when you receive a large sum, split it into 3–6 parts and invest them over a few months, balancing the mathematical edge against peace of mind.

## The limits of DCA

- **DCA does not turn a bad asset into a good one.** If an asset keeps falling and never recovers, DCA only makes you lose more slowly — and possibly lose more, since you keep buying as it falls.
- **Trading fees:** splitting into tiny amounts lets fees eat into returns; choose a sensible frequency.
- **It is not a timing strategy:** DCA is a discipline for putting money in, not a price forecast.

## Practice

Use the simulated account: choose an asset, record its price each week for 6 weeks and simulate buying a fixed amount every week. Compare your average cost with the simple average of the 6 weekly prices, then write your observations in your [Journal](/journal).`,
        questions: [
          {
            prompt: 'You invest $2,000 a month for 6 months and buy 146 fund units in total. Roughly what is your average cost per unit?',
            options: ['$89.17', '$82.19', '$100', '$125'],
            correct_index: 1,
            explanation: 'Average cost = $12,000 / 146 ≈ $82.19; $89.17 is the simple average of the prices, not your cost.',
          },
          {
            prompt: 'When the market rises steadily throughout the investing period, which approach usually does better?',
            options: ['DCA, because it always buys cheaper', 'Both always give the same result', 'The lump sum, because all the money benefits from the rise from the start', 'Not investing at all'],
            correct_index: 2,
            explanation: 'In the steady-rise scenario the lump sum gained +25% versus about +11.8% for DCA.',
          },
          {
            prompt: 'What is the main behavioural benefit of DCA?',
            options: ['It guarantees you never lose money', 'It reduces the pressure to time the market and helps you keep investing consistently', 'It always beats a lump sum', 'It has no trading fees'],
            correct_index: 1,
            explanation: 'DCA turns investing into an automatic habit, reducing regret and emotion when markets swing.',
          },
          {
            prompt: 'Which statement about DCA is TRUE?',
            options: ['DCA does not protect you if an asset loses its value permanently', 'DCA turns every asset into a profitable investment', 'DCA is a way to forecast the market bottom', 'DCA only works for crypto'],
            correct_index: 0,
            explanation: 'DCA is a discipline for investing money; if an asset keeps falling and never recovers, DCA still loses.',
          },
        ],
      },
      {
        slug: 'measuring-portfolio-performance',
        title: 'Measuring portfolio performance',
        summary: 'Total return, CAGR, maximum drawdown, volatility, the intuition behind the Sharpe ratio and comparing with a benchmark.',
        content_md: `## "How much did I make this year?" is not enough

A 30% gain sounds great — but if the overall market rose 50%, or if earning that 30% meant living through losing half your money along the way, the picture changes completely. Measuring performance properly takes several angles.

## Example: a three-year portfolio

You start with **$100,000** and make no deposits or withdrawals:

| Point in time | Value ($ thousand) | Annual return |
|---|---|---|
| Start of year 1 | 100 | |
| End of year 1 | 125 | +25% |
| End of year 2 | 100 | −20% |
| End of year 3 | 133.1 | +33.1% |

## 1. Total return

> Total return = (133.1 − 100) / 100 = **+33.1%** over 3 years

Total return must include **dividends and interest received** and deduct **fees and taxes**. Note: money you deposit **is not profit** — if you add $20,000 halfway through, separate it out before calculating.

## 2. CAGR — compound annual growth rate

Total returns are hard to compare across different time spans. CAGR converts them into **an even growth rate per year**:

> CAGR = (Ending value / Starting value)^(1 / years) − 1 = (133.1 / 100)^(1/3) − 1 = **10% a year**

Check: 100 × 1.1 × 1.1 × 1.1 = 133.1. Notice that the simple average of the yearly returns is (25 − 20 + 33.1) / 3 = 12.7% — **higher** than the CAGR. The simple average overstates the real experience, because a 20% fall needs a 25% rise just to get back to where you were.

## 3. Maximum drawdown

This measures the biggest fall from a peak to a trough:

> Max drawdown = (Trough − Peak) / Peak = (100 − 125) / 125 = **−20%**

It answers the question "in the worst stretch, how much did I lose from the top?". With daily data the true drawdown is usually deeper than year-end figures show.

## 4. Volatility

Volatility is the **standard deviation of returns** — how widely returns swing around their average. The portfolio above had years of +25%, −20% and +33.1%: a very wide swing. Of two portfolios with the same 10% CAGR, the less volatile one is easier to hold and less likely to push you into panic selling at the wrong time.

## 5. The Sharpe ratio — return per unit of risk

> Sharpe = (Portfolio return − Risk-free return) / Volatility

A separate example, with a risk-free return (for instance a bank deposit rate) of 4% a year:

| Portfolio | Return | Volatility | Sharpe |
|---|---|---|---|
| A | 10% | 15% | (10 − 4) / 15 = **0.40** |
| B | 12% | 25% | (12 − 4) / 25 = **0.32** |

B earns more, but A delivers **more return for each unit of risk**. A higher Sharpe ratio means the reward is better justified by the risk taken.

## 6. Compare with a benchmark

Always ask: **if I had just bought a simple index fund, how would I have done?** Suppose that over the same 3 years the market index went from 100 to 135, down to 94.5, then up to 140.5:

- The index CAGR is ≈ 12% a year (because 1.12³ ≈ 1.405), higher than your portfolio (10%).
- But the index's maximum drawdown was (94.5 − 135) / 135 = −30%, deeper than the portfolio's (−20%).

A balanced conclusion: the portfolio trailed the index by about 2 percentage points a year in exchange for lower risk. Whether that is worth it depends on your goals — but if for years you earn less than the index while taking similar risk, an index fund may be the more sensible choice. Pick a benchmark that matches the portfolio: a 50% stock, 50% bond portfolio should not be compared with a 100% stock index.

## Practice

For your simulated account, record the portfolio value at the end of each month. After a few months, compute total return and maximum drawdown and compare them with a benchmark index; write your observations in your [Journal](/journal).`,
        questions: [
          {
            prompt: 'A portfolio grows from $100,000 to $133,100 over 3 years. What is the CAGR?',
            options: ['11.03% a year', '33.1% a year', '10% a year', '12.7% a year'],
            correct_index: 2,
            explanation: 'CAGR = (133.1 / 100)^(1/3) − 1 = 10%, because 1.1³ = 1.331.',
          },
          {
            prompt: 'A portfolio peaks at $125,000 and then falls to $100,000. What is the maximum drawdown?',
            options: ['−20%', '−25%', '−80%', '−12.5%'],
            correct_index: 0,
            explanation: 'Max drawdown = (100 − 125) / 125 = −20% (measured from the peak, not the trough).',
          },
          {
            prompt: 'Portfolio return 10%, risk-free return 4%, volatility 15%. What is the Sharpe ratio?',
            options: ['0.67', '0.27', '2.5', '0.4'],
            correct_index: 3,
            explanation: 'Sharpe = (10% − 4%) / 15% = 0.4.',
          },
          {
            prompt: 'Why compare portfolio performance with a suitable benchmark?',
            options: ['To see whether your stock-picking effort beat a simple alternative with similar risk', 'Because the index always makes money', 'To prove the portfolio never loses', 'Because the law requires it'],
            correct_index: 0,
            explanation: 'The benchmark is the easiest alternative; if you cannot beat it (risk included), it is time to rethink the strategy.',
          },
        ],
      },
    ],
  },
]
