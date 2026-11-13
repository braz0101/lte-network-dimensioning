# LTE Network Dimensioning

Outil web de dimensionnement d'un réseau LTE : couverture (bilan de liaison)
et capacité (nombre d'eNodeB) à partir des paramètres radio d'une zone.

## Objectif
Estimer le nombre de sites LTE nécessaires selon la surface, la densité
d'abonnés et le bilan de liaison.

## Contexte
Projet 6 — Ingénierie des Réseaux, Master 2 SRT (ESP/UCAD), 2025-2026.
Encadrant : Dr Mangoné Fall.

## Architecture
- Frontend / logique : Next.js (React, TypeScript)
- Calculs : bilan de liaison + modèle de propagation

## Technologies
Next.js, React, TypeScript, Tailwind CSS.

## Installation
```bash
pnpm install
pnpm dev
```
(ou `npm install && npm run dev`)

## Démo en ligne
https://my-lte-network-dimensioning.vercel.app/

## Résultats
Voir le rapport détaillé dans `docs/`.

## Limites
Modèle de propagation simplifié ; à affiner selon l'environnement réel.

## Co-auteurs
Ibrahima Fall, Bonco Sow.

## Licence
MIT — voir `LICENSE`.
