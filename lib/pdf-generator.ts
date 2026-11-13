import type { LTEParameters, DimensioningResult } from './lte-calculations';
import jsPDF from 'jspdf';

export function generatePDFReport(params: LTEParameters, results: DimensioningResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const addTitle = (text: string, size = 16) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 128);
    doc.text(text, margin, y);
    y += size * 0.5 + 4;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(text, margin, y);
    y += 8;
  };

  const addText = (label: string, value: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin + indent, y);
    doc.setTextColor(40, 40, 40);
    doc.text(value, margin + 80 + indent, y);
    y += 6;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const checkNewPage = (needed = 40) => {
    if (y > doc.internal.pageSize.getHeight() - needed) {
      doc.addPage();
      y = 20;
    }
  };

  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number): string => {
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
    return '$' + num.toFixed(0);
  };

  // Header
  addTitle('RAPPORT DE DIMENSIONNEMENT LTE', 18);
  y += 2;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, margin, y);
  y += 4;
  doc.text('Master2 SRT / ESP / UCAD - 2025/2026', margin, y);
  y += 10;
  addLine();

  // Summary
  addTitle('1. Resume Executif', 14);
  y += 2;
  
  doc.setFillColor(240, 248, 255);
  doc.rect(margin, y, pageWidth - 2 * margin, 35, 'F');
  y += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 128, 128);
  doc.text(`${results.finalSites} sites eNodeB requis`, margin + 5, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Facteur limitant: ${results.limitingFactor === 'coverage' ? 'Couverture' : 'Capacite'}`, margin + 5, y);
  y += 6;
  doc.text(`Charge reseau: ${results.networkLoad.toFixed(1)}%`, margin + 5, y);
  y += 6;
  doc.text(`Cout total (5 ans): ${formatCurrency(results.cost.totalCost5Years)}`, margin + 5, y);
  y += 15;

  // Parameters
  checkNewPage();
  addTitle('2. Parametres d\'Entree', 14);
  y += 4;

  addSubtitle('2.1 Zone');
  addText('Environnement:', params.zone.environment.charAt(0).toUpperCase() + params.zone.environment.slice(1));
  addText('Surface:', `${params.zone.surface} km²`);
  addText('Population:', formatNumber(params.zone.population, 0));
  addText('Taux de penetration:', `${params.zone.penetrationRate}%`);
  y += 4;

  addSubtitle('2.2 Radio');
  addText('Bande de frequence:', `${params.radio.frequencyBand} MHz`);
  addText('Largeur de bande:', `${params.radio.bandwidth} MHz`);
  addText('Mode duplex:', params.radio.duplexMode);
  addText('Puissance Tx:', `${params.radio.txPower} dBm`);
  addText('Gain antenne Tx:', `${params.radio.antennaGainTx} dBi`);
  addText('Pertes cables:', `${params.radio.cableLoss} dB`);
  addText('Marge fading:', `${params.radio.fadingMargin} dB`);
  addText('Marge interference:', `${params.radio.interferenceMargin} dB`);
  y += 4;

  checkNewPage();
  addSubtitle('2.3 eNodeB');
  addText('Hauteur antenne:', `${params.enodeb.antennaHeight} m`);
  addText('Nombre de secteurs:', `${params.enodeb.sectors}`);
  addText('Configuration MIMO:', params.enodeb.mimoConfig);
  addText('Pertes feeder:', `${params.enodeb.feederLoss} dB`);
  y += 4;

  addSubtitle('2.4 Terminal (UE)');
  addText('Sensibilite:', `${params.ue.sensitivity} dBm`);
  addText('Gain antenne:', `${params.ue.antennaGain} dBi`);
  addText('Hauteur:', `${params.ue.height} m`);
  addText('Trafic/utilisateur:', `${params.ue.trafficPerUser} MB/h`);
  y += 8;

  // Link Budget
  checkNewPage();
  addLine();
  addTitle('3. Bilan de Liaison (Link Budget)', 14);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
  y += 6;
  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  doc.setTextColor(0, 128, 128);
  doc.text('MAPL = P_TX + G_TX + G_RX - L_cable - L_body - M_fading - M_interf - S_RX', margin + 5, y);
  y += 18;

  addText('Puissance Tx (P_TX):', `${results.linkBudget.txPower} dBm`);
  addText('Gain Tx (G_TX):', `${results.linkBudget.txGain} dBi`);
  addText('Gain Rx (G_RX):', `${results.linkBudget.rxGain} dBi`);
  addText('EIRP:', `${results.linkBudget.eirp.toFixed(1)} dBm`);
  addText('Pertes totales:', `${results.linkBudget.totalLosses.toFixed(1)} dB`);
  
  doc.setFont('helvetica', 'bold');
  addText('MAPL:', `${results.linkBudget.mapl.toFixed(1)} dB`);
  doc.setFont('helvetica', 'normal');
  y += 8;

  // Propagation
  checkNewPage();
  addLine();
  addTitle('4. Modele de Propagation', 14);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
  y += 6;
  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  doc.setTextColor(0, 128, 128);
  doc.text('L = 46.3 + 33.9*log(f) - 13.82*log(h_b) - a(h_m) + (44.9 - 6.55*log(h_b))*log(d) + C_m', margin + 5, y);
  y += 18;

  addText('Perte de propagation:', `${results.propagation.pathLoss.toFixed(1)} dB`);
  addText('Facteur correction (C_m):', `${results.propagation.correctionFactor} dB`);
  
  doc.setFont('helvetica', 'bold');
  addText('Rayon de cellule:', `${results.propagation.cellRadius.toFixed(2)} km`);
  doc.setFont('helvetica', 'normal');
  y += 8;

  // Coverage Dimensioning
  checkNewPage();
  addLine();
  addTitle('5. Dimensionnement par Couverture', 14);
  y += 4;

  addText('Rayon de cellule:', `${results.coverage.cellRadius.toFixed(2)} km`);
  addText('Surface par cellule:', `${results.coverage.cellArea.toFixed(2)} km²`);
  addText('Couverture totale:', `${results.coverage.totalCoverage.toFixed(1)} km²`);
  addText('Taux de couverture:', `${results.coverage.coveragePercentage.toFixed(1)}%`);
  
  doc.setFont('helvetica', 'bold');
  addText('Sites requis:', `${results.coverage.sitesRequired}`);
  doc.setFont('helvetica', 'normal');
  y += 8;

  // Capacity Dimensioning
  checkNewPage();
  addLine();
  addTitle('6. Dimensionnement par Capacite', 14);
  y += 4;

  addText('Utilisateurs totaux:', formatNumber(results.capacity.totalUsers, 0));
  addText('PRBs disponibles:', `${results.capacity.prbCount}`);
  addText('Efficacite spectrale:', `${results.capacity.spectralEfficiency.toFixed(1)} bits/s/Hz`);
  addText('Debit par cellule:', `${results.capacity.cellThroughput.toFixed(1)} Mbps`);
  addText('Debit par site:', `${results.capacity.siteThroughput.toFixed(1)} Mbps`);
  addText('Trafic total requis:', `${results.capacity.totalTrafficDemand.toFixed(1)} Mbps`);
  addText('Charge par site:', `${results.capacity.loadPerSite.toFixed(1)}%`);
  
  doc.setFont('helvetica', 'bold');
  addText('Sites requis:', `${results.capacity.sitesRequired}`);
  doc.setFont('helvetica', 'normal');
  y += 8;

  // Final Result
  checkNewPage();
  addLine();
  addTitle('7. Resultat Final', 14);
  y += 4;

  doc.setFillColor(240, 255, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text(`Nombre de sites requis: ${results.finalSites}`, margin + 5, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Facteur limitant: ${results.limitingFactor === 'coverage' ? 'COUVERTURE' : 'CAPACITE'}`, margin + 5, y);
  y += 15;

  // Costs
  checkNewPage();
  addLine();
  addTitle('8. Analyse des Couts', 14);
  y += 4;

  addText('CAPEX par site:', formatCurrency(results.cost.capexPerSite));
  addText('OPEX par site/an:', formatCurrency(results.cost.opexPerSitePerYear));
  addText('CAPEX total:', formatCurrency(results.cost.totalCapex));
  addText('OPEX (5 ans):', formatCurrency(results.cost.totalOpex5Years));
  
  doc.setFont('helvetica', 'bold');
  addText('Cout total (5 ans):', formatCurrency(results.cost.totalCost5Years));
  doc.setFont('helvetica', 'normal');
  
  addText('Cout par km²:', formatCurrency(results.cost.costPerKm2));
  addText('Cout par utilisateur:', formatCurrency(results.cost.costPerUser));
  y += 8;

  // KPIs
  checkNewPage();
  addLine();
  addTitle('9. Indicateurs de Performance (KPIs)', 14);
  y += 4;

  addText('Efficacite couverture:', `${results.kpis.coverageEfficiency.toFixed(1)}%`);
  addText('Efficacite capacite:', `${results.kpis.capacityEfficiency.toFixed(1)}%`);
  addText('Efficacite spectrale:', `${results.kpis.spectralEfficiencyTotal.toFixed(2)} bits/s/Hz`);
  addText('Score QoS:', `${results.kpis.qosScore.toFixed(1)}/100`);
  addText('Charge reseau:', `${results.networkLoad.toFixed(1)}%`);
  y += 8;

  // Footer
  checkNewPage(30);
  addLine();
  y += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Outil de Dimensionnement LTE - Projet 6 - Ingenierie des Reseaux', margin, y);
  y += 5;
  doc.text('Ibrahima FALL & Bonco SOW - Master2 SRT / ESP / UCAD - 2025/2026', margin, y);

  // Save
  doc.save(`rapport-dimensionnement-lte-${Date.now()}.pdf`);
}
