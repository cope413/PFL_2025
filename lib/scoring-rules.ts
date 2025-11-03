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
      '<200': number; // Points for allowing less than 200 yards
      '<240': number; // Points for allowing less than 240 yards
      '<280': number; // Points for allowing less than 280 yards
    };
    sackPoints: number; // Points per sack
    turnoverPoints: number; // Points per turnover
    safetyPoints: number; // Points per safety
    twoPointReturnPoints: number; // Points per 2-point return
    defensiveTdPoints: number; // Points per defensive TD
  };
}

export const DEFAULT_SCORING_RULES: ScoringRules = {
  QB: {
    passYardsPerPoint: 25, // 1 point per 25 passing yards
    passTdPoints: 4, // 4 points per passing TD
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 3, // 2 points per 2-point conversion
  },
  RB: {
    receptions: 1, // 1 point per reception (PPR)
    recYardsPerPoint: 10, // 1 point per 10 receiving yards
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    recTdPoints: 6, // 6 points per receiving TD
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 3, // 2 points per 2-point conversion
  },
  WR: {
    receptions: 1, // 1 point per reception (PPR)
    recYardsPerPoint: 10, // 1 point per 10 receiving yards
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    recTdPoints: 6, // 6 points per receiving TD
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 3, // 2 points per 2-point conversion
  },
  TE: {
    receptions: 1, // 1 point per reception (PPR)
    recYardsPerPoint: 10, // 1 point per 10 receiving yards
    rushYardsPerPoint: 10, // 1 point per 10 rushing yards
    recTdPoints: 6, // 6 points per receiving TD
    rushTdPoints: 6, // 6 points per rushing TD
    twoPointConversion: 3, // 2 points per 2-point conversion
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
      '<200': 6, // 6 points for allowing less than 200 yards
      '<240': 4, // 4 points for allowing less than 240 yards
      '<280': 2, // 2 points for allowing less than 280 yards
    },
    sackPoints: 1, // 1 point per sack
    turnoverPoints: 1, // 1 point per turnover
    safetyPoints: 6, // 6 points per safety
    twoPointReturnPoints: 6, // 6 points per 2-point return
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
// Uses distance-based scoring where points increase with field goal distance
export function getFieldGoalPoints(distance: number, rules?: ScoringRules['PK']): number {
  if (distance <= 39) return 3;
  if (distance <= 49) return 6;
  if (distance <= 59) return 9;
  if (distance <= 69) return 12;
  return 15;
}

// Helper function to get yards allowed points for D/ST
export function getYardsAllowedPoints(yardsAllowed: number, rules: ScoringRules['D/ST']): number {
  if (yardsAllowed < 200) return rules.yardsAllowedPoints['<200'];
  if (yardsAllowed < 240) return rules.yardsAllowedPoints['<240'];
  if (yardsAllowed < 280) return rules.yardsAllowedPoints['<280'];
  return 0; // 0 points for 280+ yards allowed
}

// Helper function to get touchdown points based on distance
export function getTouchdownPoints(distance: number): number {
  if (distance < 20) return 6;
  if (distance < 50) return 9;
  if (distance < 80) return 12;
  return 15;
}

// Helper function to get carry/rush points based on tiered scoring
export function getCarryPoints(carries: number): number {
  if (carries < 12) return 0;
  if (carries < 18) return 1;
  if (carries < 24) return 3;
  if (carries < 30) return 6;
  if (carries < 36) return 9;
  if (carries < 42) return 12;
  if (carries < 48) return 15;
  if (carries < 54) return 18;
  return 21;
}

// Helper function to get reception points based on tiered scoring
export function getReceptionPoints(receptions: number): number {
  if (receptions < 3) return 0;
  if (receptions < 6) return 1;
  if (receptions < 9) return 3;
  if (receptions < 12) return 6;
  if (receptions < 15) return 9;
  if (receptions < 18) return 12;
  if (receptions < 21) return 15;
  if (receptions < 24) return 18;
  return 21;
}

// Helper function to calculate bonus points based on combined yardage tiers
export function getBonusPoints(passYards: number, rushYards: number, recYards: number): number {
  let bonusPoints = 0;
  
  // Rushing + Receiving yards bonus
  if (rushYards >= 50 && recYards >= 50) {
    if (rushYards >= 100 && recYards >= 100) {
      bonusPoints += 6;
    } else if (rushYards >= 75 && recYards >= 75) {
      bonusPoints += 4;
    } else {
      bonusPoints += 2;
    }
  }
  
  // Passing + (Rushing OR Receiving) yards bonus
  if ((rushYards >= 50 || recYards >= 50) && passYards >= 200) {
    if ((rushYards >= 100 || recYards >= 100) && passYards >= 300) {
      bonusPoints += 6;
    } else if ((rushYards >= 75 || recYards >= 75) && passYards >= 250) {
      bonusPoints += 4;
    } else {
      bonusPoints += 2;
    }
  }
  
  return bonusPoints;
}

// Helper function to calculate D/ST points
export function calculateDstPoints(
  sacks: number,
  turnovers: number,
  safeties: number,
  twoPointReturns: number,
  yardsAllowed: number,
  defensiveTds: number,
  rules: ScoringRules['D/ST']
): number {
  let totalPoints = 0;
  
  // Sacks
  totalPoints += sacks * rules.sackPoints;
  
  // Turnovers
  totalPoints += turnovers * rules.turnoverPoints;
  
  // Safeties
  totalPoints += safeties * rules.safetyPoints;
  
  // 2-Point Returns
  totalPoints += twoPointReturns * rules.twoPointReturnPoints;
  
  // Yards Allowed (tiered)
  totalPoints += getYardsAllowedPoints(yardsAllowed, rules);
  
  // Defensive TDs
  totalPoints += defensiveTds * rules.defensiveTdPoints;
  
  return totalPoints;
}
