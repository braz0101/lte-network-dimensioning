'use client';

import { useLTEStore } from '@/lib/lte-store';
import type { Environment, FrequencyBand, MIMOConfig, DuplexMode } from '@/lib/lte-calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, TreePine, Mountain, MapPin, Radio, Server, Smartphone, FileText, Download, Printer, Share2, HelpCircle } from 'lucide-react';

const FREQUENCY_BANDS: FrequencyBand[] = [700, 800, 900, 1800, 2100, 2600];
const BANDWIDTHS = [1.4, 3, 5, 10, 15, 20];
const MIMO_CONFIGS: MIMOConfig[] = ['2x2', '4x4', '8x8'];

interface ParamInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
}

function ParamInput({ label, value, onChange, unit, min = 0, max = 100, step = 1, tooltip }: ParamInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-xs font-medium">{value} {unit}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

interface ReportSectionProps {
  onGeneratePDF: () => void;
  onExportJSON: () => void;
}

function ReportSection({ onGeneratePDF, onExportJSON }: ReportSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Generation de Rapports
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Exportez les resultats du dimensionnement dans differents formats pour documentation ou partage.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={onGeneratePDF} className="bg-primary hover:bg-primary/90">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Rapport PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onExportJSON}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Imprimer
          </Button>
          <Button size="sm" variant="outline">
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Partager
          </Button>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Contenu du rapport:</p>
          <div className="flex flex-wrap gap-1">
            {['Resume', 'Parametres', 'Link Budget', 'Couverture', 'Capacite', 'Couts', 'KPIs', 'Formules'].map((item) => (
              <span key={item} className="px-2 py-0.5 text-xs bg-muted rounded-md text-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ParameterPanel() {
  const {
    params,
    setZoneParams,
    setRadioParams,
    setEnodebParams,
    setUEParams,
    setEnvironment,
    results,
  } = useLTEStore();

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
  };

  const handleGeneratePDF = () => {
    // Will be implemented with PDF generator
    console.log('Generating PDF report...');
  };

  const handleExportJSON = () => {
    if (!results) return;
    const data = {
      parameters: params,
      results: results,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lte-dimensionnement-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Radio className="h-4 w-4 text-primary" />
          Parametres de Dimensionnement
        </h2>
      </div>

      {/* Environment Selection */}
      <div className="shrink-0 p-4 border-b border-border">
        <Label className="text-xs text-muted-foreground mb-2 block">Environnement</Label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={params.zone.environment === 'urban' ? 'default' : 'outline'}
            onClick={() => handleEnvironmentChange('urban')}
            className="flex-1"
          >
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Urbain
          </Button>
          <Button
            size="sm"
            variant={params.zone.environment === 'suburban' ? 'default' : 'outline'}
            onClick={() => handleEnvironmentChange('suburban')}
            className="flex-1"
          >
            <TreePine className="h-3.5 w-3.5 mr-1.5" />
            Suburbain
          </Button>
          <Button
            size="sm"
            variant={params.zone.environment === 'rural' ? 'default' : 'outline'}
            onClick={() => handleEnvironmentChange('rural')}
            className="flex-1"
          >
            <Mountain className="h-3.5 w-3.5 mr-1.5" />
            Rural
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="zone" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 grid grid-cols-4 mx-4 mt-3 bg-muted/50">
          <TabsTrigger value="zone" className="text-xs data-[state=active]:bg-background">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            Zone
          </TabsTrigger>
          <TabsTrigger value="radio" className="text-xs data-[state=active]:bg-background">
            <Radio className="h-3.5 w-3.5 mr-1" />
            Radio
          </TabsTrigger>
          <TabsTrigger value="enodeb" className="text-xs data-[state=active]:bg-background">
            <Server className="h-3.5 w-3.5 mr-1" />
            eNodeB
          </TabsTrigger>
          <TabsTrigger value="ue" className="text-xs data-[state=active]:bg-background">
            <Smartphone className="h-3.5 w-3.5 mr-1" />
            UE
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {/* Zone Tab */}
            <TabsContent value="zone" className="mt-0 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Parametres de Zone</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <ParamInput
                    label="Surface"
                    value={params.zone.surface}
                    onChange={(v) => setZoneParams({ surface: v })}
                    unit="km²"
                    min={1}
                    max={2000}
                    step={10}
                    tooltip="Surface totale de la zone a couvrir"
                  />
                  <ParamInput
                    label="Population"
                    value={params.zone.population}
                    onChange={(v) => setZoneParams({ population: v })}
                    min={10000}
                    max={10000000}
                    step={10000}
                    tooltip="Nombre total d'habitants dans la zone"
                  />
                  <ParamInput
                    label="Taux de penetration"
                    value={params.zone.penetrationRate}
                    onChange={(v) => setZoneParams({ penetrationRate: v })}
                    unit="%"
                    min={10}
                    max={100}
                    step={5}
                    tooltip="Pourcentage de la population utilisant le reseau mobile"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Radio Tab */}
            <TabsContent value="radio" className="mt-0 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Parametres Radio</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Bande de frequence</Label>
                    <Select
                      value={params.radio.frequencyBand.toString()}
                      onValueChange={(v) => setRadioParams({ frequencyBand: Number(v) as FrequencyBand })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_BANDS.map((band) => (
                          <SelectItem key={band} value={band.toString()}>
                            {band} MHz
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Largeur de bande</Label>
                    <Select
                      value={params.radio.bandwidth.toString()}
                      onValueChange={(v) => setRadioParams({ bandwidth: Number(v) })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BANDWIDTHS.map((bw) => (
                          <SelectItem key={bw} value={bw.toString()}>
                            {bw} MHz
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Mode Duplex</Label>
                    <Select
                      value={params.radio.duplexMode}
                      onValueChange={(v) => setRadioParams({ duplexMode: v as DuplexMode })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FDD">FDD</SelectItem>
                        <SelectItem value="TDD">TDD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <ParamInput
                    label="Puissance Tx"
                    value={params.radio.txPower}
                    onChange={(v) => setRadioParams({ txPower: v })}
                    unit="dBm"
                    min={20}
                    max={60}
                    step={1}
                    tooltip="Puissance d'emission de la station de base"
                  />
                  <ParamInput
                    label="Gain Antenne Tx"
                    value={params.radio.antennaGainTx}
                    onChange={(v) => setRadioParams({ antennaGainTx: v })}
                    unit="dBi"
                    min={0}
                    max={25}
                    step={0.5}
                    tooltip="Gain de l'antenne d'emission"
                  />
                  <ParamInput
                    label="Pertes cables"
                    value={params.radio.cableLoss}
                    onChange={(v) => setRadioParams({ cableLoss: v })}
                    unit="dB"
                    min={0}
                    max={10}
                    step={0.5}
                    tooltip="Pertes dans les cables et connecteurs"
                  />
                  <ParamInput
                    label="Pertes corps"
                    value={params.radio.bodyLoss}
                    onChange={(v) => setRadioParams({ bodyLoss: v })}
                    unit="dB"
                    min={0}
                    max={10}
                    step={0.5}
                    tooltip="Pertes dues au corps humain"
                  />
                  <ParamInput
                    label="Marge Fading"
                    value={params.radio.fadingMargin}
                    onChange={(v) => setRadioParams({ fadingMargin: v })}
                    unit="dB"
                    min={0}
                    max={15}
                    step={0.5}
                    tooltip="Marge pour le fading lent (shadowing)"
                  />
                  <ParamInput
                    label="Marge Interference"
                    value={params.radio.interferenceMargin}
                    onChange={(v) => setRadioParams({ interferenceMargin: v })}
                    unit="dB"
                    min={0}
                    max={10}
                    step={0.5}
                    tooltip="Marge pour l'interference inter-cellules"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* eNodeB Tab */}
            <TabsContent value="enodeb" className="mt-0 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Parametres eNodeB</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <ParamInput
                    label="Hauteur Antenne"
                    value={params.enodeb.antennaHeight}
                    onChange={(v) => setEnodebParams({ antennaHeight: v })}
                    unit="m"
                    min={10}
                    max={80}
                    step={1}
                    tooltip="Hauteur de l'antenne au-dessus du sol"
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nombre de secteurs</Label>
                    <Select
                      value={params.enodeb.sectors.toString()}
                      onValueChange={(v) => setEnodebParams({ sectors: Number(v) })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 secteur (Omni)</SelectItem>
                        <SelectItem value="3">3 secteurs</SelectItem>
                        <SelectItem value="6">6 secteurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Configuration MIMO</Label>
                    <Select
                      value={params.enodeb.mimoConfig}
                      onValueChange={(v) => setEnodebParams({ mimoConfig: v as MIMOConfig })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MIMO_CONFIGS.map((mimo) => (
                          <SelectItem key={mimo} value={mimo}>
                            MIMO {mimo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ParamInput
                    label="Pertes Feeder"
                    value={params.enodeb.feederLoss}
                    onChange={(v) => setEnodebParams({ feederLoss: v })}
                    unit="dB"
                    min={0}
                    max={5}
                    step={0.1}
                    tooltip="Pertes dans le feeder (cable coaxial)"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* UE Tab */}
            <TabsContent value="ue" className="mt-0 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Parametres UE (Terminal)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <ParamInput
                    label="Sensibilite"
                    value={params.ue.sensitivity}
                    onChange={(v) => setUEParams({ sensitivity: v })}
                    unit="dBm"
                    min={-120}
                    max={-70}
                    step={1}
                    tooltip="Sensibilite minimale du recepteur"
                  />
                  <ParamInput
                    label="Gain Antenne"
                    value={params.ue.antennaGain}
                    onChange={(v) => setUEParams({ antennaGain: v })}
                    unit="dBi"
                    min={-5}
                    max={5}
                    step={0.5}
                    tooltip="Gain de l'antenne du terminal"
                  />
                  <ParamInput
                    label="Hauteur UE"
                    value={params.ue.height}
                    onChange={(v) => setUEParams({ height: v })}
                    unit="m"
                    min={1}
                    max={3}
                    step={0.1}
                    tooltip="Hauteur du terminal mobile"
                  />
                  <ParamInput
                    label="Trafic/Utilisateur"
                    value={params.ue.trafficPerUser}
                    onChange={(v) => setUEParams({ trafficPerUser: v })}
                    unit="MB/h"
                    min={50}
                    max={2000}
                    step={50}
                    tooltip="Trafic moyen par utilisateur en heure chargee"
                  />
                  <ParamInput
                    label="Debit cible"
                    value={params.ue.targetThroughput}
                    onChange={(v) => setUEParams({ targetThroughput: v })}
                    unit="Mbps"
                    min={1}
                    max={100}
                    step={1}
                    tooltip="Debit minimum cible par utilisateur"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Report Section - Always visible */}
            <ReportSection onGeneratePDF={handleGeneratePDF} onExportJSON={handleExportJSON} />
          </div>
        </div>
      </Tabs>
    </div>
  );
}
