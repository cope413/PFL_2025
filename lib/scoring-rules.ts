// Fantasy Football Scoring Rules Configuration
// This file contains all the scoring rules for different player positions
// Modify these values to adjust how points are calculated

export interface ScoringRules {
  QB: {
    passYardsPerPoint: number; // 1 point per X passing yards
    passTdPoints: number; // Points per passing TD
    rushYardsPerPoint: number; // 1 point per X rushing yards
    rushTdPoints: number; // Points per rushing TD
    twoPointConversion: number; // Points per 2-point conversion
  };
  RB: {
    receptions: number; // Points per reception
    recYardsPerPoint: number; // 1 point per X receiving yards
    rushYardsPerPoint: number; // 1 point per X rushing yards
    recTdPoints: number; // Points per receiving TD
    rushTdPoints: number; // Points per rushing TD
    twoPointConversion: number; // Points per 2-point conversion
  };
  WR: {
    receptions: number; // Points per reception
    recYardsPerPoint: number; // 1 point per X receiving yards
    rushYardsPerPoint: number; // 1 point per X rushing yards
    recTdPoints: number; // Points per receiving TD
    rushTdPoints: number; // Points per rushing TD
    twoPointConversion: number; // Points per 2-point conversion
  };
  TE: {
    receptions: number; // Points per reception
    recYardsPerPoint: number; // 1 point per X receiving yards
    rushYardsPerPoint: number; // 1 point per X rushing yards
    recTdPoints: number; // Points per receiving TD
    rushTdPoints: number; // Points per rushing TD
    twoPointConversion: number; // Points per 2-point conversion
  };
  PK: {
    extraPoint: number; // Points per extra point
    fieldGoalRanges: {
      '0-19': number;
      '20-29': number;
      '30-39': number;
      '40-49': number;
      '50+': number;
    };
  };
  'D/ST': {
    yardsAllowedPoints: {
      '0-99': number;
      '100-199': number;
      '200-299': number;
      '300-399': number;
      '400-499': number;
      '500+': number;
    };
    sackPoints: number; // Points per sack
    takeawayPoints: number; // Points per takeaway (interception or fumble recovery)
    safetyPoints: number; // Points per safety
    defensiveTdPoints: number; // Points per defensive TD
  };
}

export const DEFAULT_SCORING_RULES: ScoringRules = {
  QB: {
    passYardsPerPoint: 25, // 1 point per 25 passing yards
    passTdPoints: 4, // 4 points per passing TD
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 2, // 2 points per 2-point conversion
  },
  RB: {
    receptions: 1, // 1 point per reception (PPR)
    recYardsPerPoint: 10, // 1 point per 10 receiving yards
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    recTdPoints: 6, // 6 points per receiving TD
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 2, // 2 points per 2-point conversion
  },
  WR: {
    receptions: 1, // 1 point per reception (PPR)
    recYardsPerPoint: 10, // 1 point per 10 receiving yards
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    recTdPoints: 6, // 6 points per receiving TD
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 2, // 2 points per 2-point conversion
  },
  TE: {
    receptions: 1, // 1 point per reception (PPR)
    recYardsPerPoint: 10, // 1 point per 10 receiving yards
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    recTdPoints: 6, // 6 points per receiving TD
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 2, // 2 points per 2-point conversion
  },
  PK: {
    extraPoint: 1, // 1 point per extra point
    fieldGoalRanges: {
      '0-19': 3, // 3 points for 0-19 yard field goals
      '20-29': 3, // 3 points for 20-29 yard field goals
      '30-39': 3, // 3 points for 30-39 yard field goals
      '40-49': 4, // 4 points for 40-49 yard field goals
      '50+': 5, // 5 points for 50+ yard field goals
    },
  },
  'D/ST': {
    yardsAllowedPoints: {
      '0-99': 10, // 10 points for allowing 0-99 yards
      '100-199': 7, // 7 points for allowing 100-199 yards
      '200-299': 4, // 4 points for allowing 200-299 yards
      '300-399': 1, // 1 point for allowing 300-399 yards
      '400-499': 0, // 0 points for allowing 400-499 yards
      '500+': -3, // -3 points for allowing 500+ yards
    },
    sackPoints: 1, // 1 point per sack
    takeawayPoints: 2, // 2 points per takeaway
    safetyPoints: 2, // 2 points per safety
    defensiveTdPoints: 6, // 6 points per defensive TD
  },
};

// Helper function to get passing yard points based on tiered system
export function getPassYardPoints(yards: number): number {
  if (yards < 200) return 0;
  if (yards < 250) return 2;
  if (yards < 300) return 4;
  if (yards < 335) return 6;
  if (yards < 365) return 8;
  if (yards < 400) return 10;
  if (yards < 435) return 12;
  if (yards < 465) return 14;
  if (yards < 500) return 16;
  if (yards < 535) return 18;
  if (yards < 565) return 20;
  if (yards < 600) return 22;
  return 24;
}

// Helper function to get rushing/receiving yard points based on tiered system
export function getRushingYardPoints(yards: number): number {
  if (yards < 50) return 0;
  if (yards < 75) return 2;
  if (yards < 100) return 4;
  if (yards < 135) return 6;
  if (yards < 165) return 8;
  if (yards < 200) return 10;
  if (yards < 235) return 12;
  if (yards < 265) return 14;
  if (yards < 300) return 16;
  if (yards < 335) return 18;
  if (yards < 365) return 20;
  if (yards < 400) return 22;
  return 24;
}

// Helper function to get receiving yard points based on tiered system
export function getReceivingYardPoints(yards: number): number {
  if (yards < 50) return 0;
  if (yards < 75) return 2;
  if (yards < 100) return 4;
  if (yards < 135) return 6;
  if (yards < 165) return 8;
  if (yards < 200) return 10;
  if (yards < 235) return 12;
  if (yards < 265) return 14;
  if (yards < 300) return 16;
  if (yards < 335) return 18;
  if (yards < 365) return 20;
  if (yards < 400) return 22;
  return 24;
}

// Helper function to get field goal points based on distance
export function getFieldGoalPoints(distance: number, rules: ScoringRules['PK']): number {
  if (distance <= 19) return rules.fieldGoalRanges['0-19'];
  if (distance <= 29) return rules.fieldGoalRanges['20-29'];
  if (distance <= 39) return rules.fieldGoalRanges['30-39'];
  if (distance <= 49) return rules.fieldGoalRanges['40-49'];
  return rules.fieldGoalRanges['50+'];
}

// Helper function to get yards allowed points for D/ST
export function getYardsAllowedPoints(yardsAllowed: number, rules: ScoringRules['D/ST']): number {
  if (yardsAllowed <= 99) return rules.yardsAllowedPoints['0-99'];
  if (yardsAllowed <= 199) return rules.yardsAllowedPoints['100-199'];
  if (yardsAllowed <= 299) return rules.yardsAllowedPoints['200-299'];
  if (yardsAllowed <= 399) return rules.yardsAllowedPoints['300-399'];
  if (yardsAllowed <= 499) return rules.yardsAllowedPoints['400-499'];
  return rules.yardsAllowedPoints['500+'];
}
