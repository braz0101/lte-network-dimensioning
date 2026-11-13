'use client';

import { create } from 'zustand';
import {
  type LTEParameters,
  type DimensioningResult,
  type Environment,
  DEFAULT_PARAMS,
  calculateDimensioning,
} from './lte-calculations';

export interface PlacedSite {
  id: string;
  lat: number;
  lng: number;
  name: string;
  enabled: boolean;
  config: {
    frequency: number;
    power: number;
    height: number;
    sectors: number;
    azimuth: number;
  };
}

interface LTEStore {
  // Parameters
  params: LTEParameters;
  setParams: (params: Partial<LTEParameters>) => void;
  setZoneParams: (zone: Partial<LTEParameters['zone']>) => void;
  setRadioParams: (radio: Partial<LTEParameters['radio']>) => void;
  setEnodebParams: (enodeb: Partial<LTEParameters['enodeb']>) => void;
  setUEParams: (ue: Partial<LTEParameters['ue']>) => void;
  setEnvironment: (env: Environment) => void;
  
  // Results
  results: DimensioningResult | null;
  calculate: () => void;
  
  // Map state
  placedSites: PlacedSite[];
  addSite: (site: Omit<PlacedSite, 'id'>) => void;
  removeSite: (id: string) => void;
  updateSite: (id: string, updates: Partial<PlacedSite>) => void;
  clearSites: () => void;
  
  // UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showCoverage: boolean;
  setShowCoverage: (show: boolean) => void;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
}

export const useLTEStore = create<LTEStore>((set, get) => ({
  // Initial parameters (Urban by default)
  params: DEFAULT_PARAMS.urban,
  
  setParams: (newParams) => {
    set((state) => ({
      params: { ...state.params, ...newParams },
    }));
    get().calculate();
  },
  
  setZoneParams: (zone) => {
    set((state) => ({
      params: {
        ...state.params,
        zone: { ...state.params.zone, ...zone },
      },
    }));
    get().calculate();
  },
  
  setRadioParams: (radio) => {
    set((state) => ({
      params: {
        ...state.params,
        radio: { ...state.params.radio, ...radio },
      },
    }));
    get().calculate();
  },
  
  setEnodebParams: (enodeb) => {
    set((state) => ({
      params: {
        ...state.params,
        enodeb: { ...state.params.enodeb, ...enodeb },
      },
    }));
    get().calculate();
  },
  
  setUEParams: (ue) => {
    set((state) => ({
      params: {
        ...state.params,
        ue: { ...state.params.ue, ...ue },
      },
    }));
    get().calculate();
  },
  
  setEnvironment: (env) => {
    set(() => ({
      params: DEFAULT_PARAMS[env],
    }));
    get().calculate();
  },
  
  // Results
  results: null,
  
  calculate: () => {
    const { params } = get();
    const results = calculateDimensioning(params);
    set({ results });
  },
  
  // Map state
  placedSites: [],
  
  addSite: (site) => {
    const id = `site-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((state) => ({
      placedSites: [...state.placedSites, { ...site, id }],
    }));
  },
  
  removeSite: (id) => {
    set((state) => ({
      placedSites: state.placedSites.filter((s) => s.id !== id),
    }));
  },
  
  updateSite: (id, updates) => {
    set((state) => ({
      placedSites: state.placedSites.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },
  
  clearSites: () => {
    set({ placedSites: [] });
  },
  
  // UI state
  activeTab: 'zone',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  showCoverage: true,
  setShowCoverage: (show) => set({ showCoverage: show }),
  
  // Dakar, Senegal coordinates
  mapCenter: [14.6937, -17.4441],
  setMapCenter: (center) => set({ mapCenter: center }),
}));
