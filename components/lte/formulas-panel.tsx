'use client';

import { useLTEStore } from '@/lib/lte-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calculator, Radio, Signal, MapPin, Users, DollarSign } from 'lucide-react';

interface FormulaCardProps {
  number: number;
  title: string;
  formula: string;
  description: string;
  variables: { symbol: string; description: string }[];
  currentValues?: { symbol: string; value: string }[];
}

function FormulaCard({ number, title, formula, description, variables, currentValues }: FormulaCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
            {number}
          </Badge>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Formula Display */}
        <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm text-primary font-mono whitespace-nowrap">
            {formula}
          </code>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground">{description}</p>

        {/* Variables */}
        <div className="grid grid-cols-2 gap-2">
          {variables.map((v) => (
            <div key={v.symbol} className="flex items-start gap-2 text-xs">
              <code className="text-primary font-mono shrink-0">{v.symbol}</code>
              <span className="text-muted-foreground">{v.description}</span>
            </div>
          ))}
        </div>

        {/* Current Values */}
        {currentValues && currentValues.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Valeurs actuelles:</div>
            <div className="flex flex-wrap gap-2">
              {currentValues.map((cv) => (
                <Badge key={cv.symbol} variant="outline" className="text-xs font-mono">
                  {cv.symbol} = {cv.value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FormulasPanel() {
  const { params, results } = useLTEStore();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-foreground">Formules de Dimensionnement LTE</h1>
        <p className="text-sm text-muted-foreground">
          Reference complete des equations utilisees dans le calcul du dimensionnement reseau
        </p>
      </div>

      {/* Link Budget */}
      <FormulaCard
        number={1}
        title="Bilan de Liaison (Link Budget)"
        formula="MAPL = P_TX + G_TX + G_RX - L_cable - L_body - M_fading - M_interference - S_RX"
        description="Le MAPL (Maximum Allowable Path Loss) represente la perte de propagation maximale admissible pour maintenir la liaison radio."
        variables={[
          { symbol: 'P_TX', description: 'Puissance d\'emission (dBm)' },
          { symbol: 'G_TX', description: 'Gain d\'antenne emission (dBi)' },
          { symbol: 'G_RX', description: 'Gain d\'antenne reception (dBi)' },
          { symbol: 'L_cable', description: 'Pertes cables et connecteurs (dB)' },
          { symbol: 'L_body', description: 'Pertes dues au corps humain (dB)' },
          { symbol: 'M_fading', description: 'Marge de fading (dB)' },
          { symbol: 'M_interference', description: 'Marge d\'interference (dB)' },
          { symbol: 'S_RX', description: 'Sensibilite du recepteur (dBm)' },
        ]}
        currentValues={results ? [
          { symbol: 'P_TX', value: `${params.radio.txPower} dBm` },
          { symbol: 'G_TX', value: `${params.radio.antennaGainTx} dBi` },
          { symbol: 'G_RX', value: `${params.ue.antennaGain} dBi` },
          { symbol: 'L_cable', value: `${params.radio.cableLoss} dB` },
          { symbol: 'MAPL', value: `${results.linkBudget.mapl.toFixed(1)} dB` },
        ] : undefined}
      />

      {/* COST-231 Hata */}
      <FormulaCard
        number={2}
        title="Modele COST-231 Hata"
        formula="L = 46.3 + 33.9×log(f) - 13.82×log(h_b) - a(h_m) + (44.9 - 6.55×log(h_b))×log(d) + C_m"
        description="Modele de propagation empirique pour estimer les pertes de trajet en environnement urbain et suburbain pour les frequences de 1500 à 2000 MHz."
        variables={[
          { symbol: 'f', description: 'Frequence (MHz)' },
          { symbol: 'h_b', description: 'Hauteur antenne station de base (m)' },
          { symbol: 'h_m', description: 'Hauteur antenne mobile (m)' },
          { symbol: 'd', description: 'Distance (km)' },
          { symbol: 'C_m', description: 'Facteur de correction environnement' },
          { symbol: 'a(h_m)', description: 'Facteur correction hauteur mobile' },
        ]}
        currentValues={results ? [
          { symbol: 'f', value: `${params.radio.frequencyBand} MHz` },
          { symbol: 'h_b', value: `${params.enodeb.antennaHeight} m` },
          { symbol: 'h_m', value: `${params.ue.height} m` },
          { symbol: 'L', value: `${results.propagation.pathLoss.toFixed(1)} dB` },
        ] : undefined}
      />

      {/* Correction Factor */}
      <FormulaCard
        number={3}
        title="Facteur de Correction Mobile"
        formula="a(h_m) = (1.1×log(f) - 0.7)×h_m - (1.56×log(f) - 0.8)"
        description="Facteur de correction pour la hauteur de l'antenne mobile dans les environnements urbains de taille moyenne."
        variables={[
          { symbol: 'f', description: 'Frequence (MHz)' },
          { symbol: 'h_m', description: 'Hauteur antenne mobile (m)' },
        ]}
      />

      {/* Cell Radius */}
      <FormulaCard
        number={4}
        title="Rayon de Cellule"
        formula="R_cell = 10^((MAPL - A) / B)"
        description="Calcul du rayon de couverture d'une cellule en inversant le modele de propagation. A et B sont des constantes derivees du modele COST-231."
        variables={[
          { symbol: 'MAPL', description: 'Perte de propagation max. (dB)' },
          { symbol: 'A', description: 'Constante du modele' },
          { symbol: 'B', description: 'Exposant de propagation' },
          { symbol: 'R_cell', description: 'Rayon de cellule (km)' },
        ]}
        currentValues={results ? [
          { symbol: 'MAPL', value: `${results.linkBudget.mapl.toFixed(1)} dB` },
          { symbol: 'R_cell', value: `${results.propagation.cellRadius.toFixed(2)} km` },
        ] : undefined}
      />

      {/* Number of Sites Coverage */}
      <FormulaCard
        number={5}
        title="Nombre de Sites (Couverture)"
        formula="N_sites_coverage = S_zone / (k × R_cell²)"
        description="Nombre de sites necessaires pour couvrir la zone cible. k depend de la geometrie des cellules (k = π pour circulaire, k = 2.6 pour hexagonal tri-sectoriel)."
        variables={[
          { symbol: 'S_zone', description: 'Surface de la zone (km²)' },
          { symbol: 'R_cell', description: 'Rayon de cellule (km)' },
          { symbol: 'k', description: 'Facteur geometrique' },
        ]}
        currentValues={results ? [
          { symbol: 'S_zone', value: `${params.zone.surface} km²` },
          { symbol: 'R_cell', value: `${results.propagation.cellRadius.toFixed(2)} km` },
          { symbol: 'N_sites', value: `${results.coverage.sitesRequired}` },
        ] : undefined}
      />

      {/* Cell Throughput */}
      <FormulaCard
        number={6}
        title="Debit par Cellule"
        formula="C_cell = N_PRB × η_spectrale × BW_PRB × (1 - Overhead)"
        description="Capacite theorique d'une cellule LTE basee sur les Physical Resource Blocks (PRB) et l'efficacite spectrale."
        variables={[
          { symbol: 'N_PRB', description: 'Nombre de PRB disponibles' },
          { symbol: 'η_spectrale', description: 'Efficacite spectrale (bits/s/Hz)' },
          { symbol: 'BW_PRB', description: 'Bande passante par PRB (180 kHz)' },
          { symbol: 'Overhead', description: 'Overhead canaux de controle (~25%)' },
        ]}
        currentValues={results ? [
          { symbol: 'N_PRB', value: `${results.capacity.prbCount}` },
          { symbol: 'η', value: `${results.capacity.spectralEfficiency.toFixed(1)} bits/s/Hz` },
          { symbol: 'C_cell', value: `${results.capacity.cellThroughput.toFixed(1)} Mbps` },
        ] : undefined}
      />

      {/* Traffic Demand */}
      <FormulaCard
        number={7}
        title="Trafic Total Requis"
        formula="T_total = N_users × T_per_user × 8 / 3600"
        description="Conversion du trafic par utilisateur (MB/h) en debit total (Mbps) pour l'heure chargee."
        variables={[
          { symbol: 'N_users', description: 'Nombre d\'utilisateurs actifs' },
          { symbol: 'T_per_user', description: 'Trafic par utilisateur (MB/h)' },
          { symbol: 'T_total', description: 'Trafic total (Mbps)' },
        ]}
        currentValues={results ? [
          { symbol: 'N_users', value: `${(results.capacity.totalUsers / 1000).toFixed(0)}K` },
          { symbol: 'T_per_user', value: `${params.ue.trafficPerUser} MB/h` },
          { symbol: 'T_total', value: `${results.capacity.totalTrafficDemand.toFixed(1)} Mbps` },
        ] : undefined}
      />

      {/* Number of Sites Capacity */}
      <FormulaCard
        number={8}
        title="Nombre de Sites (Capacite)"
        formula="N_sites_capacity = T_total / (C_cell × N_sectors × Utilization)"
        description="Nombre de sites necessaires pour absorber le trafic total avec un facteur d'utilisation cible."
        variables={[
          { symbol: 'T_total', description: 'Trafic total requis (Mbps)' },
          { symbol: 'C_cell', description: 'Debit par cellule (Mbps)' },
          { symbol: 'N_sectors', description: 'Nombre de secteurs par site' },
          { symbol: 'Utilization', description: 'Taux d\'utilisation cible (~70%)' },
        ]}
        currentValues={results ? [
          { symbol: 'T_total', value: `${results.capacity.totalTrafficDemand.toFixed(1)} Mbps` },
          { symbol: 'C_site', value: `${results.capacity.siteThroughput.toFixed(1)} Mbps` },
          { symbol: 'N_sites', value: `${results.capacity.sitesRequired}` },
        ] : undefined}
      />

      {/* Final Sites */}
      <FormulaCard
        number={9}
        title="Dimensionnement Final"
        formula="N_sites_final = max(N_sites_coverage, N_sites_capacity)"
        description="Le nombre final de sites est le maximum entre le dimensionnement par couverture et par capacite, assurant que les deux contraintes sont satisfaites."
        variables={[
          { symbol: 'N_sites_coverage', description: 'Sites pour couverture' },
          { symbol: 'N_sites_capacity', description: 'Sites pour capacite' },
          { symbol: 'N_sites_final', description: 'Sites finaux requis' },
        ]}
        currentValues={results ? [
          { symbol: 'N_couv', value: `${results.coverage.sitesRequired}` },
          { symbol: 'N_cap', value: `${results.capacity.sitesRequired}` },
          { symbol: 'N_final', value: `${results.finalSites}` },
          { symbol: 'Limite', value: results.limitingFactor === 'coverage' ? 'Couverture' : 'Capacite' },
        ] : undefined}
      />

      {/* PRB Calculation */}
      <FormulaCard
        number={10}
        title="Calcul des PRB"
        formula="N_PRB = BW_total / 180 kHz"
        description="Nombre de Physical Resource Blocks disponibles selon la largeur de bande du canal LTE."
        variables={[
          { symbol: 'BW_total', description: 'Largeur de bande totale (MHz)' },
          { symbol: '180 kHz', description: 'Largeur d\'un PRB' },
          { symbol: 'N_PRB', description: 'Nombre de PRB' },
        ]}
        currentValues={[
          { symbol: '1.4 MHz', value: '6 PRB' },
          { symbol: '3 MHz', value: '15 PRB' },
          { symbol: '5 MHz', value: '25 PRB' },
          { symbol: '10 MHz', value: '50 PRB' },
          { symbol: '15 MHz', value: '75 PRB' },
          { symbol: '20 MHz', value: '100 PRB' },
        ]}
      />

      {/* Environment Correction */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
              11
            </Badge>
            Facteurs de Correction Environnement (C_m)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Environnement</th>
                  <th className="text-center py-2 text-xs font-medium text-muted-foreground">C_m (dB)</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Caracteristiques</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-foreground">Urbain dense</td>
                  <td className="py-2 text-center text-primary font-mono">+3</td>
                  <td className="py-2 text-muted-foreground">Batiments eleves, forte densite</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-foreground">Suburbain</td>
                  <td className="py-2 text-center text-primary font-mono">0</td>
                  <td className="py-2 text-muted-foreground">Zones residentielles, densite moyenne</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-foreground">Rural</td>
                  <td className="py-2 text-center text-primary font-mono">-5</td>
                  <td className="py-2 text-muted-foreground">Zones ouvertes, faible densite</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MIMO Efficiency */}
      <Card className="bg-card border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
              12
            </Badge>
            Efficacite Spectrale MIMO
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Configuration</th>
                  <th className="text-center py-2 text-xs font-medium text-muted-foreground">Efficacite (bits/s/Hz)</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Utilisation typique</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-foreground">MIMO 2x2</td>
                  <td className="py-2 text-center text-primary font-mono">2.4</td>
                  <td className="py-2 text-muted-foreground">Standard, bonne couverture</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium text-foreground">MIMO 4x4</td>
                  <td className="py-2 text-center text-primary font-mono">4.2</td>
                  <td className="py-2 text-muted-foreground">Haute capacite, urbain dense</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-foreground">MIMO 8x8</td>
                  <td className="py-2 text-center text-primary font-mono">6.0</td>
                  <td className="py-2 text-muted-foreground">LTE-Advanced, tres haute capacite</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* References */}
      <Card className="bg-muted/30 border-border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            References
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• 3GPP TS 36.104 - LTE Base Station Radio Transmission and Reception</li>
            <li>• 3GPP TS 36.211 - LTE Physical Channels and Modulation</li>
            <li>• COST 231 - Urban Transmission Loss Models</li>
            <li>• Saunders & Zavala - Antennas and Propagation for Wireless Communication Systems</li>
            <li>• Holma & Toskala - LTE for UMTS: Evolution to LTE-Advanced</li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Projet 6 - Ingenierie des Reseaux - Dr FALL
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Ibrahima FALL & Bonco SOW - Master2 SRT / ESP / UCAD - 2025/2026
        </p>
      </div>
    </div>
  );
}
