'use client';

import { useLTEStore } from '@/lib/lte-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart, Activity } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

const COLORS = {
  primary: 'hsl(174, 60%, 41%)',
  secondary: 'hsl(152, 52%, 48%)',
  tertiary: 'hsl(271, 43%, 56%)',
  quaternary: 'hsl(35, 92%, 64%)',
  muted: 'hsl(210, 16%, 82%)',
};

export function ChartsPanel() {
  const { results, params } = useLTEStore();

  if (!results) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">Aucune donnee</h3>
          <p className="text-sm text-muted-foreground">
            Les graphiques apparaitront apres le calcul du dimensionnement.
          </p>
        </div>
      </div>
    );
  }

  // Data for comparison chart
  const comparisonData = [
    {
      name: 'Couverture',
      sites: results.coverage.sitesRequired,
      fill: COLORS.primary,
    },
    {
      name: 'Capacite',
      sites: results.capacity.sitesRequired,
      fill: COLORS.secondary,
    },
    {
      name: 'Final',
      sites: results.finalSites,
      fill: COLORS.tertiary,
    },
  ];

  // Data for cost breakdown
  const costData = [
    { name: 'CAPEX', value: results.cost.totalCapex, fill: COLORS.primary },
    { name: 'OPEX (5 ans)', value: results.cost.totalOpex5Years, fill: COLORS.secondary },
  ];

  // Data for KPI radar
  const kpiData = [
    {
      subject: 'Couverture',
      value: results.kpis.coverageEfficiency,
      fullMark: 100,
    },
    {
      subject: 'Capacite',
      value: results.kpis.capacityEfficiency,
      fullMark: 100,
    },
    {
      subject: 'QoS',
      value: results.kpis.qosScore,
      fullMark: 100,
    },
    {
      subject: 'Efficacite Spectrale',
      value: (results.kpis.spectralEfficiencyTotal / 6) * 100,
      fullMark: 100,
    },
    {
      subject: 'Marge Capacite',
      value: Math.max(0, 100 - results.networkLoad),
      fullMark: 100,
    },
  ];

  // Data for link budget waterfall
  const linkBudgetData = [
    { name: 'P_TX', value: results.linkBudget.txPower, fill: COLORS.primary },
    { name: 'G_TX', value: results.linkBudget.txGain, fill: COLORS.secondary },
    { name: 'G_RX', value: results.linkBudget.rxGain, fill: COLORS.secondary },
    { name: 'Pertes', value: -results.linkBudget.totalLosses, fill: COLORS.tertiary },
    { name: 'M_fading', value: -params.radio.fadingMargin, fill: COLORS.tertiary },
    { name: 'M_interf', value: -params.radio.interferenceMargin, fill: COLORS.tertiary },
    { name: 'S_RX', value: -Math.abs(params.ue.sensitivity), fill: COLORS.quaternary },
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value}`;
  };

  const capexPercentage = (results.cost.totalCapex / results.cost.totalCost5Years) * 100;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
        <BarChart className="h-5 w-5 text-primary" />
        Visualisations & Analyses
      </h2>

      {/* Comparison Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            Comparaison Dimensionnement
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={comparisonData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} sites`, 'Nombre de sites']}
                />
                <Bar dataKey="sites" radius={[0, 4, 4, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Le dimensionnement final est limite par la{' '}
            <span className="font-medium text-primary">
              {results.limitingFactor === 'coverage' ? 'couverture' : 'capacite'}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Cost Distribution */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Repartition des Couts (5 ans)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={costData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.primary }} />
                  <span className="text-xs text-muted-foreground">CAPEX</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{formatCurrency(results.cost.totalCapex)}</div>
                  <div className="text-xs text-muted-foreground">{capexPercentage.toFixed(0)}%</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.secondary }} />
                  <span className="text-xs text-muted-foreground">OPEX (5 ans)</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{formatCurrency(results.cost.totalOpex5Years)}</div>
                  <div className="text-xs text-muted-foreground">{(100 - capexPercentage).toFixed(0)}%</div>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Total</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(results.cost.totalCost5Years)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Radar */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Radar KPIs
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={kpiData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Link Budget Waterfall */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            Bilan de Liaison (Contributions)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={linkBudgetData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ 
                    value: 'dB', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} dB`, '']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {linkBudgetData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 0 ? COLORS.secondary : COLORS.tertiary} 
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.secondary }} />
              <span className="text-muted-foreground">Gains (+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.tertiary }} />
              <span className="text-muted-foreground">Pertes (-)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters Summary */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">Parametres Utilises</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">Environnement</div>
              <div className="font-medium text-foreground capitalize">{params.zone.environment}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Surface</div>
              <div className="font-medium text-foreground">{params.zone.surface} km²</div>
            </div>
            <div>
              <div className="text-muted-foreground">Population</div>
              <div className="font-medium text-foreground">{(params.zone.population / 1000000).toFixed(1)}M</div>
            </div>
            <div>
              <div className="text-muted-foreground">Frequence</div>
              <div className="font-medium text-foreground">{params.radio.frequencyBand} MHz</div>
            </div>
            <div>
              <div className="text-muted-foreground">Bande passante</div>
              <div className="font-medium text-foreground">{params.radio.bandwidth} MHz</div>
            </div>
            <div>
              <div className="text-muted-foreground">MIMO</div>
              <div className="font-medium text-foreground">{params.enodeb.mimoConfig}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Secteurs</div>
              <div className="font-medium text-foreground">{params.enodeb.sectors}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Penetration</div>
              <div className="font-medium text-foreground">{params.zone.penetrationRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
