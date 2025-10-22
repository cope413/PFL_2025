# Fantasy Football Scoring Rules

This document explains how to customize the scoring rules for the PFL fantasy football league.

## Location

The scoring rules are defined in `lib/scoring-rules.ts`. This file contains all the configuration for how points are calculated for different player positions.

## Default Scoring Rules

### Quarterback (QB)
- **Passing Yards**: Tiered system (0-24 points based on yard ranges)
  - < 200 yards: 0 points
  - 200-249 yards: 2 points
  - 250-299 yards: 4 points
  - 300-334 yards: 6 points
  - 335-364 yards: 8 points
  - 365-399 yards: 10 points
  - 400-434 yards: 12 points
  - 435-464 yards: 14 points
  - 465-499 yards: 16 points
  - 500-534 yards: 18 points
  - 535-564 yards: 20 points
  - 565-599 yards: 22 points
  - 600+ yards: 24 points
- **Passing TDs**: 4 points per touchdown
- **Rushing Yards**: 1 point per 10 yards
- **Rushing TDs**: 6 points per touchdown
- **2-Point Conversions**: 2 points

### Running Back (RB)
- **Receptions**: 1 point per reception (PPR)
- **Receiving Yards**: Tiered system (0-24 points based on yard ranges)
  - < 50 yards: 0 points
  - 50-74 yards: 2 points
  - 75-99 yards: 4 points
  - 100-134 yards: 6 points
  - 135-164 yards: 8 points
  - 165-199 yards: 10 points
  - 200-234 yards: 12 points
  - 235-264 yards: 14 points
  - 265-299 yards: 16 points
  - 300-334 yards: 18 points
  - 335-364 yards: 20 points
  - 365-399 yards: 22 points
  - 400+ yards: 24 points
- **Rushing Yards**: Tiered system (0-24 points based on yard ranges)
  - < 50 yards: 0 points
  - 50-74 yards: 2 points
  - 75-99 yards: 4 points
  - 100-134 yards: 6 points
  - 135-164 yards: 8 points
  - 165-199 yards: 10 points
  - 200-234 yards: 12 points
  - 235-264 yards: 14 points
  - 265-299 yards: 16 points
  - 300-334 yards: 18 points
  - 335-364 yards: 20 points
  - 365-399 yards: 22 points
  - 400+ yards: 24 points
- **Receiving TDs**: 6 points per touchdown
- **Rushing TDs**: 6 points per touchdown
- **2-Point Conversions**: 2 points

### Wide Receiver (WR)
- **Receptions**: 1 point per reception (PPR)
- **Receiving Yards**: Tiered system (0-24 points based on yard ranges)
  - < 50 yards: 0 points
  - 50-74 yards: 2 points
  - 75-99 yards: 4 points
  - 100-134 yards: 6 points
  - 135-164 yards: 8 points
  - 165-199 yards: 10 points
  - 200-234 yards: 12 points
  - 235-264 yards: 14 points
  - 265-299 yards: 16 points
  - 300-334 yards: 18 points
  - 335-364 yards: 20 points
  - 365-399 yards: 22 points
  - 400+ yards: 24 points
- **Rushing Yards**: Tiered system (0-24 points based on yard ranges)
  - < 50 yards: 0 points
  - 50-74 yards: 2 points
  - 75-99 yards: 4 points
  - 100-134 yards: 6 points
  - 135-164 yards: 8 points
  - 165-199 yards: 10 points
  - 200-234 yards: 12 points
  - 235-264 yards: 14 points
  - 265-299 yards: 16 points
  - 300-334 yards: 18 points
  - 335-364 yards: 20 points
  - 365-399 yards: 22 points
  - 400+ yards: 24 points
- **Receiving TDs**: 6 points per touchdown
- **Rushing TDs**: 6 points per touchdown
- **2-Point Conversions**: 2 points

### Tight End (TE)
- **Receptions**: 1 point per reception (PPR)
- **Receiving Yards**: Tiered system (0-24 points based on yard ranges)
  - < 50 yards: 0 points
  - 50-74 yards: 2 points
  - 75-99 yards: 4 points
  - 100-134 yards: 6 points
  - 135-164 yards: 8 points
  - 165-199 yards: 10 points
  - 200-234 yards: 12 points
  - 235-264 yards: 14 points
  - 265-299 yards: 16 points
  - 300-334 yards: 18 points
  - 335-364 yards: 20 points
  - 365-399 yards: 22 points
  - 400+ yards: 24 points
- **Rushing Yards**: Tiered system (0-24 points based on yard ranges)
  - < 50 yards: 0 points
  - 50-74 yards: 2 points
  - 75-99 yards: 4 points
  - 100-134 yards: 6 points
  - 135-164 yards: 8 points
  - 165-199 yards: 10 points
  - 200-234 yards: 12 points
  - 235-264 yards: 14 points
  - 265-299 yards: 16 points
  - 300-334 yards: 18 points
  - 335-364 yards: 20 points
  - 365-399 yards: 22 points
  - 400+ yards: 24 points
- **Receiving TDs**: 6 points per touchdown
- **Rushing TDs**: 6 points per touchdown
- **2-Point Conversions**: 2 points

### Kicker (PK)
- **Extra Points**: 1 point per extra point
- **Field Goals**:
  - 0-19 yards: 3 points
  - 20-29 yards: 3 points
  - 30-39 yards: 3 points
  - 40-49 yards: 4 points
  - 50+ yards: 5 points

### Defense/Special Teams (D/ST)
- **Yards Allowed**:
  - 0-99 yards: 10 points
  - 100-199 yards: 7 points
  - 200-299 yards: 4 points
  - 300-399 yards: 1 point
  - 400-499 yards: 0 points
  - 500+ yards: -3 points
- **Sacks**: 1 point per sack
- **Takeaways**: 2 points per takeaway (interception or fumble recovery)
- **Safeties**: 2 points per safety
- **Defensive TDs**: 6 points per defensive touchdown

## How to Customize

1. Open `lib/scoring-rules.ts`
2. Modify the values in the `DEFAULT_SCORING_RULES` object
3. Save the file
4. The changes will be reflected immediately in the player breakdown modals

## Example Customizations

### Change to Half-PPR (0.5 points per reception)
```typescript
RB: {
  receptions: 0.5, // Change from 1 to 0.5
  // ... rest of the rules
}
```

### Change passing TD points to 6
```typescript
QB: {
  passTdPoints: 6, // Change from 4 to 6
  // ... rest of the rules
}
```

### Customize passing yard tiers
To modify the passing yard tiers, edit the `getPassYardPoints()` function in `lib/scoring-rules.ts`:

```typescript
export function getPassYardPoints(yards: number): number {
  if (yards < 200) return 0;
  if (yards < 250) return 2;
  // ... modify the tiers as needed
  return 24;
}
```

### Customize rushing/receiving yard tiers
To modify the rushing and receiving yard tiers, edit the `getRushingYardPoints()` and `getReceivingYardPoints()` functions in `lib/scoring-rules.ts`:

```typescript
export function getRushingYardPoints(yards: number): number {
  if (yards < 50) return 0;
  if (yards < 75) return 2;
  // ... modify the tiers as needed
  return 24;
}

export function getReceivingYardPoints(yards: number): number {
  if (yards < 50) return 0;
  if (yards < 75) return 2;
  // ... modify the tiers as needed
  return 24;
}
```

### Add bonus points for long TDs
You would need to modify the `calculatePoints` function in `PlayerBreakdownModal.tsx` to add custom logic for TD distance bonuses.

## Notes

- The scoring rules are applied in real-time when viewing player breakdowns
- Changes to scoring rules do not affect historical data - they only affect how points are displayed
- The player breakdown modal shows the calculation as "X = Y" where X is the stat value and Y is the points earned
- All scoring rules are centralized in one file for easy maintenance
