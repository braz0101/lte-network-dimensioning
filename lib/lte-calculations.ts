// LTE Dimensioning Calculation Engine
// Based on 3GPP standards and COST-231 Hata propagation model

export type Environment = 'urban' | 'suburban' | 'rural';
export type FrequencyBand = 700 | 800 | 900 | 1800 | 2100 | 2600;
export type MIMOConfig = '2x2' | '4x4' | '8x8';
export type DuplexMode = 'FDD' | 'TDD';

export interface ZoneParameters {
  surface: number; // km²
  population: number;
  penetrationRate: number; // %
  environment: Environment;
}

export interface RadioParameters {
  frequencyBand: FrequencyBand;
  bandwidth: number; // MHz (1.4, 3, 5, 10, 15, 20)
  duplexMode: DuplexMode;
  txPower: number; // dBm
  antennaGainTx: number; // dBi
  antennaGainRx: number; // dBi
  cableLoss: number; // dB
  bodyLoss: number; // dB
  fadingMargin: number; // dB
  interferenceMargin: number; // dB
}

export interface EnodeBParameters {
  antennaHeight: number; // m
  sectors: number; // 1, 3, 6
  mimoConfig: MIMOConfig;
  feederLoss: number; // dB
}

export interface UEParameters {
  sensitivity: number; // dBm
  antennaGain: number; // dBi
  height: number; // m
  trafficPerUser: number; // MB/h during busy hour
  targetThroughput: number; // Mbps per user
}

export interface LTEParameters {
  zone: ZoneParameters;
  radio: RadioParameters;
  enodeb: EnodeBParameters;
  ue: UEParameters;
}

export interface LinkBudgetResult {
  txPower: number;
  txGain: number;
  rxGain: number;
  eirp: number;
  totalLosses: number;
  mapl: number;
  sensitivity: number;
}

export interface PropagationResult {
  pathLoss: number;
  cellRadius: number;
  correctionFactor: number;
}

export interface CoverageResult {
  cellRadius: number;
  cellArea: number;
  sitesRequired: number;
  totalCoverage: number;
  coveragePercentage: number;
}

export interface CapacityResult {
  totalUsers: number;
  prbCount: number;
  spectralEfficiency: number;
  cellThroughput: number;
  siteThroughput: number;
  totalTrafficDemand: number;
  sitesRequired: number;
  loadPerSite: number;
}

export interface CostResult {
  capexPerSite: number;
  opexPerSitePerYear: number;
  totalCapex: number;
  totalOpex5Years: number;
  totalCost5Years: number;
  costPerKm2: number;
  costPerUser: number;
}

export interface KPIResult {
  coverageEfficiency: number;
  capacityEfficiency: number;
  spectralEfficiencyTotal: number;
  costEfficiency: number;
  qosScore: number;
}

export interface DimensioningResult {
  linkBudget: LinkBudgetResult;
  propagation: PropagationResult;
  coverage: CoverageResult;
  capacity: CapacityResult;
  finalSites: number;
  limitingFactor: 'coverage' | 'capacity';
  cost: CostResult;
  kpis: KPIResult;
  networkLoad: number;
}

// Environment correction factors for COST-231 Hata
const ENVIRONMENT_CORRECTION: Record<Environment, number> = {
  urban: 3, // Dense urban (Cm = 3 dB)
  suburban: 0, // Suburban (Cm = 0 dB)
  rural: -5, // Rural/open (Cm negative)
};

// Spectral efficiency based on MIMO config (bits/s/Hz)
const MIMO_EFFICIENCY: Record<MIMOConfig, number> = {
  '2x2': 2.4,
  '4x4': 4.2,
  '8x8': 6.0,
};

// PRB count based on bandwidth
const BANDWIDTH_PRB: Record<number, number> = {
  1.4: 6,
  3: 15,
  5: 25,
  10: 50,
  15: 75,
  20: 100,
};

// Cost estimates (in thousands USD)
const COST_ESTIMATES = {
  capexPerSite: {
    urban: 85,
    suburban: 70,
    rural: 55,
  },
  opexPerSitePerYear: {
    urban: 12,
    suburban: 10,
    rural: 8,
  },
};

/**
 * Calculate Link Budget (Bilan de Liaison)
 * MAPL = P_TX + G_TX + G_RX - L_cable - L_body - M_interference - M_fading - S_RX
 */
export function calculateLinkBudget(
  radio: RadioParameters,
  enodeb: EnodeBParameters,
  ue: UEParameters
): LinkBudgetResult {
  const txPower = radio.txPower;
  const txGain = radio.antennaGainTx;
  const rxGain = ue.antennaGain;
  
  // EIRP (Effective Isotropic Radiated Power)
  const eirp = txPower + txGain - radio.cableLoss - enodeb.feederLoss;
  
  // Total losses
  const totalLosses = radio.cableLoss + radio.bodyLoss + enodeb.feederLoss;
  
  // MAPL calculation
  const mapl = txPower + txGain + rxGain - totalLosses - 
               radio.fadingMargin - radio.interferenceMargin - ue.sensitivity;
  
  return {
    txPower,
    txGain,
    rxGain,
    eirp,
    totalLosses,
    mapl,
    sensitivity: ue.sensitivity,
  };
}

/**
 * Calculate Path Loss using COST-231 Hata Model
 * L = 46.3 + 33.9×log(f) - 13.82×log(h_b) - a(h_m) + (44.9 - 6.55×log(h_b))×log(d) + C_m
 * 
 * Where:
 * - f: frequency in MHz
 * - h_b: base station antenna height in m
 * - h_m: mobile antenna height in m
 * - d: distance in km
 * - C_m: environment correction factor
 * - a(h_m): mobile antenna height correction factor
 */
export function calculatePathLoss(
  frequency: number,
  distance: number,
  bsHeight: number,
  mobileHeight: number,
  environment: Environment
): number {
  const f = frequency;
  const hb = bsHeight;
  const hm = mobileHeight;
  const d = Math.max(distance, 0.1); // Minimum 100m
  const Cm = ENVIRONMENT_CORRECTION[environment];
  
  // Mobile antenna height correction for urban areas
  // a(h_m) = (1.1×log(f) - 0.7)×h_m - (1.56×log(f) - 0.8)
  const ahm = (1.1 * Math.log10(f) - 0.7) * hm - (1.56 * Math.log10(f) - 0.8);
  
  // COST-231 Hata formula
  const pathLoss = 46.3 + 33.9 * Math.log10(f) - 13.82 * Math.log10(hb) - ahm +
                   (44.9 - 6.55 * Math.log10(hb)) * Math.log10(d) + Cm;
  
  return pathLoss;
}

/**
 * Calculate cell radius from MAPL and path loss model
 * Inverse of COST-231 Hata to find distance
 */
export function calculateCellRadius(
  mapl: number,
  frequency: number,
  bsHeight: number,
  mobileHeight: number,
  environment: Environment
): PropagationResult {
  const f = frequency;
  const hb = bsHeight;
  const hm = mobileHeight;
  const Cm = ENVIRONMENT_CORRECTION[environment];
  
  // Mobile antenna height correction
  const ahm = (1.1 * Math.log10(f) - 0.7) * hm - (1.56 * Math.log10(f) - 0.8);
  
  // Rearranging COST-231 to solve for d:
  // MAPL = 46.3 + 33.9×log(f) - 13.82×log(h_b) - a(h_m) + (44.9 - 6.55×log(h_b))×log(d) + C_m
  // log(d) = (MAPL - 46.3 - 33.9×log(f) + 13.82×log(h_b) + a(h_m) - C_m) / (44.9 - 6.55×log(h_b))
  
  const A = 46.3 + 33.9 * Math.log10(f) - 13.82 * Math.log10(hb) - ahm + Cm;
  const B = 44.9 - 6.55 * Math.log10(hb);
  
  const logD = (mapl - A) / B;
  const cellRadius = Math.pow(10, logD);
  
  // Clamp to reasonable values
  const clampedRadius = Math.max(0.1, Math.min(cellRadius, 50));
  
  // Recalculate path loss at this radius for verification
  const pathLoss = calculatePathLoss(frequency, clampedRadius, bsHeight, mobileHeight, environment);
  
  return {
    pathLoss,
    cellRadius: clampedRadius,
    correctionFactor: Cm,
  };
}

/**
 * Calculate coverage dimensioning
 * N_sites = Surface / (π × R_cell²)
 */
export function calculateCoverage(
  zone: ZoneParameters,
  propagation: PropagationResult,
  sectors: number
): CoverageResult {
  const cellRadius = propagation.cellRadius;
  
  // Cell area (hexagonal approximation for tri-sector)
  // For tri-sector: Area = 2.6 × R² (hexagonal packing)
  // For single sector: Area = π × R²
  const cellArea = sectors >= 3 
    ? 2.6 * cellRadius * cellRadius 
    : Math.PI * cellRadius * cellRadius;
  
  const siteArea = cellArea * (sectors / 3); // Normalize to site
  const sitesRequired = Math.ceil(zone.surface / siteArea);
  
  const totalCoverage = sitesRequired * siteArea;
  const coveragePercentage = Math.min((totalCoverage / zone.surface) * 100, 100);
  
  return {
    cellRadius,
    cellArea,
    sitesRequired,
    totalCoverage,
    coveragePercentage,
  };
}

/**
 * Calculate capacity dimensioning
 * Based on PRB allocation and throughput requirements
 */
export function calculateCapacity(
  zone: ZoneParameters,
  radio: RadioParameters,
  enodeb: EnodeBParameters,
  ue: UEParameters
): CapacityResult {
  // Total subscribers
  const totalUsers = Math.ceil(zone.population * (zone.penetrationRate / 100));
  
  // PRB count based on bandwidth
  const prbCount = BANDWIDTH_PRB[radio.bandwidth] || 50;
  
  // Spectral efficiency based on MIMO
  const spectralEfficiency = MIMO_EFFICIENCY[enodeb.mimoConfig];
  
  // PRB bandwidth = 180 kHz
  const prbBandwidth = 0.18; // MHz
  
  // Cell throughput = PRB × efficiency × bandwidth per PRB × (1 - overhead)
  // Overhead typically 25% for control channels
  const overhead = 0.25;
  const cellThroughput = prbCount * spectralEfficiency * prbBandwidth * (1 - overhead);
  
  // Site throughput (all sectors)
  const siteThroughput = cellThroughput * enodeb.sectors;
  
  // Traffic demand during busy hour
  // Convert MB/h to Mbps: (MB/h × 8) / 3600
  const trafficPerUserMbps = (ue.trafficPerUser * 8) / 3600;
  const totalTrafficDemand = totalUsers * trafficPerUserMbps;
  
  // Sites required for capacity
  // Consider utilization factor (typically 70%)
  const utilizationFactor = 0.7;
  const effectiveSiteThroughput = siteThroughput * utilizationFactor;
  const sitesRequired = Math.ceil(totalTrafficDemand / effectiveSiteThroughput);
  
  // Load per site
  const loadPerSite = sitesRequired > 0 
    ? (totalTrafficDemand / sitesRequired) / siteThroughput * 100 
    : 0;
  
  return {
    totalUsers,
    prbCount,
    spectralEfficiency,
    cellThroughput,
    siteThroughput,
    totalTrafficDemand,
    sitesRequired,
    loadPerSite,
  };
}

/**
 * Calculate deployment costs
 */
export function calculateCosts(
  sitesRequired: number,
  environment: Environment
): CostResult {
  const capexPerSite = COST_ESTIMATES.capexPerSite[environment] * 1000;
  const opexPerSitePerYear = COST_ESTIMATES.opexPerSitePerYear[environment] * 1000;
  
  const totalCapex = sitesRequired * capexPerSite;
  const totalOpex5Years = sitesRequired * opexPerSitePerYear * 5;
  const totalCost5Years = totalCapex + totalOpex5Years;
  
  return {
    capexPerSite,
    opexPerSitePerYear,
    totalCapex,
    totalOpex5Years,
    totalCost5Years,
    costPerKm2: 0, // Will be calculated with zone info
    costPerUser: 0, // Will be calculated with user info
  };
}

/**
 * Calculate KPIs
 */
export function calculateKPIs(
  coverage: CoverageResult,
  capacity: CapacityResult,
  cost: CostResult,
  zone: ZoneParameters
): KPIResult {
  // Coverage efficiency: % of target coverage achieved
  const coverageEfficiency = coverage.coveragePercentage;
  
  // Capacity efficiency: inverse of load (lower load = higher efficiency)
  const capacityEfficiency = Math.max(0, 100 - capacity.loadPerSite);
  
  // Spectral efficiency: bits/s/Hz achieved
  const spectralEfficiencyTotal = capacity.spectralEfficiency;
  
  // Cost efficiency: users per $1000 invested
  const costEfficiency = cost.totalCost5Years > 0 
    ? (capacity.totalUsers / cost.totalCost5Years) * 1000 
    : 0;
  
  // QoS score: weighted average
  const qosScore = (coverageEfficiency * 0.4 + capacityEfficiency * 0.4 + 
                   Math.min(spectralEfficiencyTotal / 6 * 100, 100) * 0.2);
  
  return {
    coverageEfficiency,
    capacityEfficiency,
    spectralEfficiencyTotal,
    costEfficiency,
    qosScore,
  };
}

/**
 * Main dimensioning function
 */
export function calculateDimensioning(params: LTEParameters): DimensioningResult {
  // Step 1: Link Budget
  const linkBudget = calculateLinkBudget(params.radio, params.enodeb, params.ue);
  
  // Step 2: Propagation and Cell Radius
  const propagation = calculateCellRadius(
    linkBudget.mapl,
    params.radio.frequencyBand,
    params.enodeb.antennaHeight,
    params.ue.height,
    params.zone.environment
  );
  
  // Step 3: Coverage Dimensioning
  const coverage = calculateCoverage(params.zone, propagation, params.enodeb.sectors);
  
  // Step 4: Capacity Dimensioning
  const capacity = calculateCapacity(params.zone, params.radio, params.enodeb, params.ue);
  
  // Step 5: Final site count (max of coverage and capacity)
  const finalSites = Math.max(coverage.sitesRequired, capacity.sitesRequired);
  const limitingFactor = coverage.sitesRequired >= capacity.sitesRequired ? 'coverage' : 'capacity';
  
  // Step 6: Costs
  const cost = calculateCosts(finalSites, params.zone.environment);
  cost.costPerKm2 = params.zone.surface > 0 ? cost.totalCost5Years / params.zone.surface : 0;
  cost.costPerUser = capacity.totalUsers > 0 ? cost.totalCost5Years / capacity.totalUsers : 0;
  
  // Step 7: KPIs
  const kpis = calculateKPIs(coverage, capacity, cost, params.zone);
  
  // Network load based on final sites
  const networkLoad = finalSites > 0 
    ? (capacity.totalTrafficDemand / (finalSites * capacity.siteThroughput)) * 100 
    : 0;
  
  return {
    linkBudget,
    propagation,
    coverage,
    capacity,
    finalSites,
    limitingFactor,
    cost,
    kpis,
    networkLoad: Math.min(networkLoad, 100),
  };
}

// Default parameters for different environments
export const DEFAULT_PARAMS: Record<Environment, LTEParameters> = {
  urban: {
    zone: {
      surface: 150,
      population: 2500000,
      penetrationRate: 75,
      environment: 'urban',
    },
    radio: {
      frequencyBand: 1800,
      bandwidth: 20,
      duplexMode: 'FDD',
      txPower: 46,
      antennaGainTx: 18,
      antennaGainRx: 0,
      cableLoss: 2,
      bodyLoss: 3,
      fadingMargin: 8,
      interferenceMargin: 3,
    },
    enodeb: {
      antennaHeight: 30,
      sectors: 3,
      mimoConfig: '4x4',
      feederLoss: 0.5,
    },
    ue: {
      sensitivity: -95,
      antennaGain: 0,
      height: 1.5,
      trafficPerUser: 500,
      targetThroughput: 10,
    },
  },
  suburban: {
    zone: {
      surface: 400,
      population: 800000,
      penetrationRate: 65,
      environment: 'suburban',
    },
    radio: {
      frequencyBand: 1800,
      bandwidth: 15,
      duplexMode: 'FDD',
      txPower: 46,
      antennaGainTx: 18,
      antennaGainRx: 0,
      cableLoss: 2,
      bodyLoss: 3,
      fadingMargin: 7,
      interferenceMargin: 2,
    },
    enodeb: {
      antennaHeight: 35,
      sectors: 3,
      mimoConfig: '2x2',
      feederLoss: 0.5,
    },
    ue: {
      sensitivity: -95,
      antennaGain: 0,
      height: 1.5,
      trafficPerUser: 400,
      targetThroughput: 8,
    },
  },
  rural: {
    zone: {
      surface: 1000,
      population: 200000,
      penetrationRate: 50,
      environment: 'rural',
    },
    radio: {
      frequencyBand: 800,
      bandwidth: 10,
      duplexMode: 'FDD',
      txPower: 46,
      antennaGainTx: 18,
      antennaGainRx: 0,
      cableLoss: 2,
      bodyLoss: 3,
      fadingMargin: 6,
      interferenceMargin: 1,
    },
    enodeb: {
      antennaHeight: 40,
      sectors: 3,
      mimoConfig: '2x2',
      feederLoss: 0.5,
    },
    ue: {
      sensitivity: -95,
      antennaGain: 0,
      height: 1.5,
      trafficPerUser: 300,
      targetThroughput: 5,
    },
  },
};
