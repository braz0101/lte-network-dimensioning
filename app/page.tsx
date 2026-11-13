'use client';

import { useEffect, useState } from 'react';
import { useLTEStore } from '@/lib/lte-store';
import { generatePDFReport } from '@/lib/pdf-generator';
import { ParameterPanel } from '@/components/lte/parameter-panel';
import { LTEMap } from '@/components/lte/lte-map';
import { ResultsDashboard } from '@/components/lte/results-dashboard';
import { ChartsPanel } from '@/components/lte/charts-panel';
import { FormulasPanel } from '@/components/lte/formulas-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Radio, 
  Map, 
  BarChart3, 
  FileText, 
  Settings2, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';

export default function LTEDimensioningTool() {
  const { params, results, calculate } = useLTEStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('map');

  // Calculate on mount and when params change
  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleGeneratePDF = () => {
    if (results) {
      generatePDFReport(params, results);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Radio className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Outil de Dimensionnement LTE</h1>
              <p className="text-xs text-muted-foreground">Master2 SRT / ESP / UCAD - 2025/2026</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Sites:</span>
              <span className="font-semibold text-foreground">{results?.finalSites || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Charge:</span>
              <span className={`font-semibold ${
                (results?.networkLoad || 0) > 85 ? 'text-red-600' : 
                (results?.networkLoad || 0) > 70 ? 'text-amber-500' : 'text-emerald-600'
              }`}>
                {results?.networkLoad.toFixed(0) || 0}%
              </span>
            </div>
          </div>

          {/* Environment Badge */}
          <Badge variant="outline" className="hidden sm:flex">
            {params.zone.environment === 'urban' ? 'Urbain' : 
             params.zone.environment === 'suburban' ? 'Suburbain' : 'Rural'}
          </Badge>

          {/* Frequency Badge */}
          <Badge className="bg-primary text-primary-foreground">
            {params.radio.frequencyBand} MHz
          </Badge>

          {/* PDF Export Button */}
          <Button size="sm" variant="outline" onClick={handleGeneratePDF} disabled={!results}>
            <Download className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Parameters */}
        <aside 
          className={`shrink-0 border-r border-border bg-card transition-all duration-300 flex flex-col ${
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
          }`}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <ParameterPanel />
          </div>
        </aside>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="shrink-0 w-5 flex items-center justify-center bg-muted/30 hover:bg-muted/50 border-r border-border transition-colors"
          title={sidebarCollapsed ? 'Afficher parametres' : 'Masquer parametres'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col min-h-0">
            {/* Tab Navigation */}
            <div className="shrink-0 border-b border-border bg-card px-4">
              <TabsList className="h-12 bg-transparent gap-1 p-0">
                <TabsTrigger 
                  value="map" 
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Carte Interactive
                </TabsTrigger>
                <TabsTrigger 
                  value="analysis" 
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyse Detaillee
                </TabsTrigger>
                <TabsTrigger 
                  value="formulas" 
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Formules
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 flex">
              <TabsContent value="map" className="flex-1 m-0 data-[state=inactive]:hidden">
                <div className="h-full flex">
                  {/* Map */}
                  <div className="flex-1 relative">
                    <LTEMap />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="flex-1 m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="h-full flex">
                  {/* Results Dashboard */}
                  <div className="flex-1 min-w-0 overflow-y-auto border-r border-border">
                    <ResultsDashboard />
                  </div>
                  {/* Charts Panel */}
                  <div className="w-[420px] shrink-0 overflow-y-auto hidden lg:block">
                    <ChartsPanel />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="formulas" className="flex-1 m-0 data-[state=inactive]:hidden overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    <FormulasPanel />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>

      {/* Footer */}
      <footer className="shrink-0 h-8 border-t border-border bg-card flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div>Projet 6 - Ingenierie des Reseaux - Dr FALL</div>
        <div>Ibrahima FALL & Bonco SOW</div>
      </footer>
    </div>
  );
}
