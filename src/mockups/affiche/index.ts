import type { MockupDirection } from '@/mockups/shared/types';

import { AfficheConcert } from './ConcertScreen';
import { AfficheDiscover } from './DiscoverScreen';
import { AfficheSearch } from './SearchScreen';

// Direction 1 — AFFICHE : supprimer ce dossier (et sa ligne dans mockups/directions.ts) si non retenue.
export const afficheDirection: MockupDirection = {
  key: 'affiche',
  name: 'Affiche',
  intent: 'Chaque écran ressemble à une affiche de concert collée dans la rue.',
  Discover: AfficheDiscover,
  Concert: AfficheConcert,
  Search: AfficheSearch,
};
