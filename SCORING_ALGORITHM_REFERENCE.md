# Quick Reference: Scoring Algorithm v2.0

## Normalization: Raw Score → 0-10 Scale

### Per-Game Formula

| Game | Input | Normalization | Example |
|------|-------|----------------|---------|
| **OSPAN (1)** | 0-15 letters | `(score/15)*10 - errors*0.5` | 12 letters, 1 error = 7.5 |
| **Stop-Signal (2)** | 0-200+ SSRTs | `(score/100)*10 - errors*0.4` | 180, 1 error = 7.6 |
| **Task Switch (3)** | 0-5 shifts | `(score/5)*10 - errors*0.8` | 4 shifts, 1 error = 7.2 |
| **CPT (4)** | 0-100% accuracy | `(accuracy/100)*10 - errors*0.15` | 95%, 2 errors = 8.7 |
| **Decision (5)** | 0-3000 + RT | `0.6*(score/2500)*10 + 0.4*rt_score - errors*0.3` | 2800, 350ms, 0 err = 9.3 |
| **Rule Shift (6)** | 0-500 grid + 0-3 quiz | `((grid/500)*10 + (quiz/3)*10)/2 - errors*0.5` | 450 grid, 3 quiz, 1 err = 9.5 |
| **SJT (7)** | 0-100% accuracy | `(accuracy/100)*10 - errors*0.3` | 88%, 1 error = 8.7 |

**Reaction Time (Game 5) Special Case**:
- `200-500ms` = No penalty (expert zone)
- `100-200ms` or `500-1000ms` = Minor penalty
- `<100ms` = Guessing penalty
- `>1000ms` = Sluggishness penalty

---

## Weighted Composite Score

```
Composite = Σ(normalized_i × weight_i) / Σ(weight_i)
```

### Weights (Predictive Importance)
```javascript
game1: 1.0  // Working memory (execution floor)
game2: 0.8  // Impulse control (risk mitigation)
game3: 1.2  // Learning agility ← HIGHEST
game4: 0.9  // Attention stability
game5: 1.1  // Decision quality + speed
game6: 1.3  // Adaptability + exception ← HIGHEST
game7: 1.0  // Workplace judgment
```

**Why these weights?**
- Learning agility (game 3) + Adaptation (game 6) = strongest predictors of long-term success
- Decision-making (game 5) = critical for leadership
- Impulse control (game 2) = lower weight (risk mitigation, not opportunity)

---

## Recommendation Thresholds

```
8.0 ≤ score      → STRONG ALIGNMENT
6.5 ≤ score < 8.0   → SOLID ALIGNMENT WITH COACHING  
4.5 ≤ score < 6.5   → CONDITIONAL ALIGNMENT
score < 4.5      → EXPLORATORY FIT - NEEDS MORE DATA
```

**Confidence Score**:
- Heuristic baseline: 55%
- +5% per point of composite score
- Max cap: 80% (acknowledges limits of behavioral assessment)

---

## Example Calculation

**Candidate Data**:
```
game1: score=12, errors=1
game2: score=180, errors=0  
game3: score=4, errors=1
game4: accuracy=92%, errors=1
game5: score=2600, avgReactionTime=380ms, errors=0
game6: gridScore=420, quizScore=2, errors=1
game7: accuracy=85%, errors=2
```

**Step 1: Normalize Each Game** (0-10 scale)
```
game1 = (12/15)*10 - 1*0.5 = 8.0 - 0.5 = 7.5
game2 = (180/100)*10 - 0*0.4 = 18.0 (capped 10) = 10.0
game3 = (4/5)*10 - 1*0.8 = 8.0 - 0.8 = 7.2
game4 = (92/100)*10 - 1*0.15 = 9.2 - 0.15 = 9.05
game5 = 0.6*(2600/2500)*10 + 0.4*(10 no penalty) - 0*0.3 = 6.24 + 4.0 = 10.24 (capped 10)
game6 = ((420/500)*10 + (2/3)*10)/2 - 1*0.5 = (8.4 + 6.67)/2 - 0.5 = 7.53 - 0.5 = 7.03
game7 = (85/100)*10 - 2*0.3 = 8.5 - 0.6 = 7.9
```

**Step 2: Apply Weights**
```
weighted = (7.5*1.0 + 10.0*0.8 + 7.2*1.2 + 9.05*0.9 + 10.0*1.1 + 7.03*1.3 + 7.9*1.0) / (1.0+0.8+1.2+0.9+1.1+1.3+1.0)
        = (7.5 + 8.0 + 8.64 + 8.145 + 11.0 + 9.139 + 7.9) / 8.2
        = 60.324 / 8.2
        = 7.36
```

**Step 3: Determine Recommendation**
```
7.36 ∈ [6.5, 8.0) → SOLID ALIGNMENT WITH COACHING
Confidence: 55 + (7.36 * 5) = 81.8% → capped at 80%
```

---

## Career Profile Matching

The heuristic checks these patterns:

1. **Learning Agility + Exception Handling Experts**
   - `game3 ≥ 7 AND game6 ≥ 7`
   - → Strategic Analyst / Change Manager
   - Rationale: Strong adaptability for innovation roles

2. **Operations & Execution Specialists**
   - `game4 ≥ 7 AND game5 ≥ 6.5`
   - → Operations / Process Coordinator
   - Rationale: Reliable attention + sound judgment under pressure

3. **Leadership Potential**
   - `game7 ≥ 7 AND game1 ≥ 6 AND game2 ≥ 6`
   - → Team Lead / Middle Management
   - Rationale: SJT + executive function + impulse control = collaborative leadership

---

## Testing Guidance

### Creating Test Data
- **Weak profile**: normalized scores mostly <5.0 → composite <4.5
- **Developing profile**: normalized scores 5-7 → composite 5-7
- **Strong profile**: normalized scores mostly >7.5 → composite >8.0

### Example Test Assertions
```javascript
// Before: "does it recommend?"
expect(result.recommendation).toBe('STRONG ALIGNMENT');

// Now: "is recommendation proportional to performance?"
const composite = calculateCompositeScore(data);
expect(result.recommendation).toMatch(
  composite >= 8 ? /STRONG/ : composite >= 6.5 ? /COACHING/ : /CONDITIONAL/
);
```

---

## Common Pitfalls

❌ **Don't**: Compare raw scores across games (0-15 vs 0-3000)  
✅ **Do**: Use normalized scores (all 0-10 now)

❌ **Don't**: Adjust thresholds (8.0, 6.5, 4.5) without data  
✅ **Do**: Adjust weights first; only retune thresholds with HR outcome data

❌ **Don't**: Assume equal importance of all games  
✅ **Do**: Remember game3 (1.2×) and game6 (1.3×) are weighted highest

❌ **Don't**: Penalize fast reactions (<300ms)  
✅ **Do**: Recognize them as expert-level performance

---

## Calibration Roadmap

After 6+ months of HR outcome data:

1. **Validate weights**: Correlation between each game and job success metrics
2. **Recalibrate normalization**: Are the expected ranges accurate for your population?
3. **Role-specific thresholds**: Adjust 8.0/6.5/4.5 per job family (sales vs engineering vs leadership)
4. **Combine with other signals**: Track how well this predicts when combined with interviews, experience, references

---

## Contact & Questions

For questions on scoring logic, weights, or thresholds:
- **Algorithm owner**: Cognitive assessment team
- **Last updated**: March 26, 2026
- **Version**: 2.0 (normalized, weighted composite)
