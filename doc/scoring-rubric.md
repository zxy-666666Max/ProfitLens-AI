# ProfitLens-AI: Shop Health Scoring Rubric (v0.2)

Built on the `ShopData` fields in `lib/types.ts`. A shop gets six `DimensionScore`s (0-100 each); `overallScore` is their weighted average, adjusted by the caps below. Dimension `key`s and `label`s are fixed so the rule-based scorer and the LLM step stay aligned.

## Dimensions and weights

| key | label | weight | inputs from `ShopData` |
|---|---|---|---|
| `price` | Price Competitiveness | 20 | `priceMin`, `priceMax`, `marketAvgPrice` (+ `reviewAvg`, `refundRate` for the premium bonus) |
| `reviews` | Review Quality | 20 | `reviewAvg`, `reviewCount` |
| `salesTrend` | Sales Trend | 20 | `sales30d`, `salesPrev30d` |
| `listings` | Listing Completeness | 10 | `listingCount`, `listingsWithFullInfo` |
| `service` | Service Quality | 20 | `responseRate`, `refundRate` |
| `activity` | Recent Activity | 10 | `daysSinceLastSale` |

Weights sum to 100. They are a proposal; tune them once real shops are scored.

**Conventions:** `clamp(x)` limits x to 0-100. "Anchors" are linear-interpolated between points and flat beyond the ends.

---

## 1. Price Competitiveness (20)

`mid = (priceMin + priceMax) / 2`, `r = mid / marketAvgPrice`. If `mid <= 0` or `marketAvgPrice <= 0`, score = 50 (cannot assess).

| r | score | meaning |
|---|---|---|
| 0.85 to 1.10 | 100 | in the market sweet spot |
| 1.30 | 60 | premium, may lose buyers |
| 1.60+ | 20 | clearly overpriced |
| 0.60 | 55 | underpriced, thin margins |
| 0.40 or less | 20 | racing to the bottom |

**Justified premium:** if `r > 1.10` and `reviewAvg >= 4.6` and `refundRate <= 0.05`, add 10 (cap 100).

## 2. Review Quality (20)

```
ratingScore = clamp((reviewAvg - 3.0) / 1.8 * 100)     // 4.8 -> 100, 3.9 -> 50, 3.0 -> 0
volumeScore = clamp(log10(reviewCount + 1) / 3 * 100)  // ~1000 reviews -> 100
base        = 0.7 * ratingScore + 0.3 * volumeScore
c           = min(1, reviewCount / 30)                 // trust in the rating
score       = c * base + (1 - c) * 50                  // few reviews -> pulled toward neutral
```

`reviewCount = 0` -> 50.

## 3. Sales Trend (20)

`g = sales30d / salesPrev30d - 1`

| g | score |
|---|---|
| +25% or more | 100 |
| +10% | 85 |
| 0% | 65 |
| -10% | 45 |
| -25% | 20 |
| -50% or worse | 0 |

Special cases: both periods 0 -> 0; `salesPrev30d = 0` and `sales30d > 0` (new or just starting) -> 60.

## 4. Listing Completeness (10)

```
fullShare = listingsWithFullInfo / listingCount
score = clamp(0.85 * fullShare * 100 + 0.15 * clamp(listingCount / 10 * 100))
```

`listingCount = 0` -> 0. The second term rewards having at least 10 listings.

## 5. Service Quality (20)

`score = 0.5 * responseScore + 0.5 * refundScore`

| responseRate | responseScore | | refundRate | refundScore |
|---|---|---|---|---|
| 0.95+ | 100 | | 0.02 or less | 100 |
| 0.80 | 70 | | 0.05 | 70 |
| 0.50 | 30 | | 0.10 | 30 |
| 0.25 or less | 0 | | 0.15+ | 0 |

## 6. Recent Activity (10)

| daysSinceLastSale | score |
|---|---|
| 2 or less | 100 |
| 7 | 80 |
| 14 | 65 |
| 30 | 40 |
| 60 | 15 |
| 90+ | 0 |

---

## Overall score, caps and verdict

`overallScore = round(sum(weight * score) / 100)`, then apply caps (lowest applies):

- **Dormant cap:** `daysSinceLastSale >= 60` -> overall at most **40**. A shop with no recent sales should not look fine because old reviews are good.
- **No track record cap:** `reviewCount < 10` or `salesPrev30d == 0` -> overall at most **69**. A new shop cannot be "healthy" yet.

| overallScore | verdict |
|---|---|
| 70-100 | `healthy` |
| 50-69 | `watch` |
| 0-49 | `critical` |

## Known limits of the current fields

- No sales history beyond two 30-day windows, so **seasonality** can't be separated from real growth (see Frostline in the test data).
- No shipping/on-time rate or shop age. If you add them later, `service` and a "new shop" flag are the natural places.
- Underpricing is only visible through `priceMin/priceMax` vs market average; true profit margin needs cost data.

## LLM contract

When the vLLM step runs, it should produce only `detail` (per dimension), `summary` and `recommendations`. It must not change `score`, `weight` or `verdict`, so results stay reproducible. `engine` is `"llm"` in that case, `"mock"` for the rule-based scorer.

## Reference results for `/data/test-shops.json`

Computed with this exact rubric. `/data/test-shops.expected.json` holds the same values with a +/-5 tolerance on the overall score.

| Shop | profile | price | reviews | salesTrend | listings | service | activity | overall | verdict |
|---|---|---|---|---|---|---|---|---|---|
| Willow & Oak Home | healthy established | 100 | 100 | 73 | 95 | 100 | 100 | 94 | healthy |
| Sunset Gadgets Hub | dying | 58 | 45 | 14 | 40 | 30 | 100 | 44 | critical |
| Nova Pet Treats | brand new | 100 | 54 | 60 | 76 | 100 | 100 | 69 | watch |
| Heritage Leatherworks | overpriced but loved | 38 | 90 | 54 | 92 | 89 | 100 | 73 | healthy |
| BargainBin Basics | race to the bottom | 53 | 73 | 98 | 51 | 64 | 100 | 73 | healthy |
| Pixel Print Studio | poor service | 100 | 65 | 55 | 92 | 18 | 100 | 67 | watch |
| Old Town Vintage | dormant | 95 | 84 | 0 | 61 | 72 | 0 | 40 | critical |
| Fresh Brew Collective | fast growing, thin listings | 100 | 90 | 100 | 34 | 100 | 100 | 91 | healthy |
| Ghost Listing Co | empty / zero data | 50 | 50 | 0 | 0 | 50 | 0 | 30 | critical |
| Frostline Winter Wear | seasonal peak | 100 | 92 | 100 | 93 | 81 | 100 | 94 | healthy |
