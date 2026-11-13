'use client';

import React from "react"

import { useLTEStore } from '@/lib/lte-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Radio, 
  MapPin, 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp,
  Zap,
  Signal,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
  return num.toFixed(decimals);
}

function formatCurrency(num: number): string {
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
  return '$' + num.toFixed(0);
}

function getStatusColor(value: number, thresholds: { warning: number; danger: number }): string {
  if (value >= thresholds.danger) return 'text-red-600';
  if (value >= thresholds.warning) return 'text-amber-500';
  return 'text-emerald-600';
}

function getStatusBadge(value: number, thresholds: { warning: number; danger: number }): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (value >= thresholds.danger) return { label: 'Critique', variant: 'destructive' };
  if (value >= thresholds.warning) return { label: 'Attention', variant: 'secondary' };
  return { label: 'OK', variant: 'default' };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  description?: string;
  trend?: { value: number; label: string };
  status?: { value: number; thresholds: { warning: number; danger: number } };
}

function MetricCard({ title, value, unit, icon, description, trend, status }: MetricCardProps) {
  const statusColor = status ? getStatusColor(status.value, status.thresholds) : '';
  
  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-xs font-medium">{title}</span>
          </div>
          {status && (
            <Badge variant={getStatusBadge(status.value, status.thresholds).variant} className="text-xs">
              {getStatusBadge(status.value, status.thresholds).label}
            </Badge>
          )}
        </div>
        <div className={`mt-2 text-2xl font-bold ${statusColor || 'text-foreground'}`}>
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className={`h-3 w-3 ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            <span className={trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsDashboard() {
  const { results, params } = useLTEStore();

  if (!results) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">Aucun resultat</h3>
          <p className="text-sm text-muted-foreground">
            Modifiez les parametres pour lancer le calcul de dimensionnement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Summary Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Resume du Dimensionnement</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Le dimensionnement final est limite par la{' '}
                <span className="font-medium text-primary">
                  {results.limitingFactor === 'coverage' ? 'couverture' : 'capacite'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{results.finalSites}</div>
              <div className="text-xs text-muted-foreground">sites eNodeB requis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Sites Couverture"
          value={results.coverage.sitesRequired}
          icon={<MapPin className="h-4 w-4" />}
          description={`Rayon: ${results.propagation.cellRadius.toFixed(2)} km`}
        />
        <MetricCard
          title="Sites Capacite"
          value={results.capacity.sitesRequired}
          icon={<Users className="h-4 w-4" />}
          description={`${formatNumber(results.capacity.totalUsers, 0)} utilisateurs`}
        />
        <MetricCard
          title="Charge Reseau"
          value={results.networkLoad.toFixed(1)}
          unit="%"
          icon={<Gauge className="h-4 w-4" />}
          status={{ value: results.networkLoad, thresholds: { warning: 70, danger: 85 } }}
        />
        <MetricCard
          title="Score QoS"
          value={results.kpis.qosScore.toFixed(1)}
          unit="/100"
          icon={<Zap className="h-4 w-4" />}
          status={{ value: 100 - results.kpis.qosScore, thresholds: { warning: 30, danger: 50 } }}
        />
      </div>

      {/* Link Budget Section */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Signal className="h-4 w-4 text-primary" />
            Bilan de Liaison (Link Budget)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Puissance Tx</div>
              <div className="text-lg font-semibold text-foreground">{results.linkBudget.txPower} dBm</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">EIRP</div>
              <div className="text-lg font-semibold text-foreground">{results.linkBudget.eirp.toFixed(1)} dBm</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Pertes Totales</div>
              <div className="text-lg font-semibold text-foreground">{results.linkBudget.totalLosses.toFixed(1)} dB</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">MAPL</div>
              <div className="text-lg font-semibold text-primary">{results.linkBudget.mapl.toFixed(1)} dB</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Perte de propagation maximale admissible</span>
              <span className="font-medium text-foreground">MAPL = {results.linkBudget.mapl.toFixed(1)} dB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage & Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coverage */}
        <Card className="bg-card border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Dimensionnement Couverture
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Rayon de cellule</span>
              <span className="font-medium text-foreground">{results.propagation.cellRadius.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Surface par cellule</span>
              <span className="font-medium text-foreground">{results.coverage.cellArea.toFixed(2)} km²</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Sites requis</span>
              <span className="font-medium text-foreground">{results.coverage.sitesRequired}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Couverture totale</span>
              <span className="font-medium text-foreground">{results.coverage.totalCoverage.toFixed(1)} km²</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Taux de couverture</span>
                <span className="text-xs font-medium text-foreground">{results.coverage.coveragePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={results.coverage.coveragePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card className="bg-card border-border">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Dimensionnement Capacite
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Utilisateurs totaux</span>
              <span className="font-medium text-foreground">{formatNumber(results.capacity.totalUsers, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">PRBs disponibles</span>
              <span className="font-medium text-foreground">{results.capacity.prbCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Debit par cellule</span>
              <span className="font-medium text-foreground">{results.capacity.cellThroughput.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Debit par site</span>
              <span className="font-medium text-foreground">{results.capacity.siteThroughput.toFixed(1)} Mbps</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Charge par site</span>
                <span className={`text-xs font-medium ${getStatusColor(results.capacity.loadPerSite, { warning: 70, danger: 85 })}`}>
                  {results.capacity.loadPerSite.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(results.capacity.loadPerSite, 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Costs */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Analyse des Couts
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">CAPEX Total</div>
              <div className="text-lg font-semibold text-foreground">{formatCurrency(results.cost.totalCapex)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">OPEX (5 ans)</div>
              <div className="text-lg font-semibold text-foreground">{formatCurrency(results.cost.totalOpex5Years)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Cout Total (5 ans)</div>
              <div className="text-lg font-semibold text-primary">{formatCurrency(results.cost.totalCost5Years)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Cout/Utilisateur</div>
              <div className="text-lg font-semibold text-foreground">{formatCurrency(results.cost.costPerUser)}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">CAPEX par site:</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(results.cost.capexPerSite)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-xs text-muted-foreground">OPEX/site/an:</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(results.cost.opexPerSitePerYear)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Indicateurs Cles de Performance (KPIs)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Efficacite de couverture</span>
                <span className="text-xs font-medium text-foreground">{results.kpis.coverageEfficiency.toFixed(1)}%</span>
              </div>
              <Progress value={results.kpis.coverageEfficiency} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Efficacite de capacite</span>
                <span className="text-xs font-medium text-foreground">{results.kpis.capacityEfficiency.toFixed(1)}%</span>
              </div>
              <Progress value={results.kpis.capacityEfficiency} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Efficacite spectrale</span>
                <span className="text-xs font-medium text-foreground">{results.kpis.spectralEfficiencyTotal.toFixed(2)} bits/s/Hz</span>
              </div>
              <Progress value={(results.kpis.spectralEfficiencyTotal / 6) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Score QoS global</span>
                <span className={`text-xs font-medium ${getStatusColor(100 - results.kpis.qosScore, { warning: 30, danger: 50 })}`}>
                  {results.kpis.qosScore.toFixed(1)}/100
                </span>
              </div>
              <Progress value={results.kpis.qosScore} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {results.networkLoad > 85 && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs text-red-800">
                <span className="font-medium">Charge elevee:</span> La charge reseau depasse 85%. Considerez l'ajout de sites supplementaires ou l'augmentation de la bande passante.
              </div>
            </div>
          )}
          {results.networkLoad <= 85 && results.networkLoad > 70 && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800">
                <span className="font-medium">Charge moderee:</span> La charge approche le seuil critique. Surveillez l'evolution du trafic.
              </div>
            </div>
          )}
          {results.networkLoad <= 70 && (
            <div className="flex items-start gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs text-emerald-800">
                <span className="font-medium">Configuration optimale:</span> Le dimensionnement est equilibre avec une marge de capacite suffisante.
              </div>
            </div>
          )}
          {results.limitingFactor === 'coverage' && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-800">
                <span className="font-medium">Limite par couverture:</span> Pour reduire le nombre de sites, envisagez une bande de frequence plus basse ou des antennes plus hautes.
              </div>
            </div>
          )}
          {results.limitingFactor === 'capacity' && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-800">
                <span className="font-medium">Limite par capacite:</span> Pour reduire le nombre de sites, considerez une configuration MIMO superieure ou une bande passante plus large.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
