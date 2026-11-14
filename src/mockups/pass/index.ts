import type { MockupDirection } from '@/mockups/shared/types';

import { PassConcert } from './ConcertScreen';
import { PassDiscover } from './DiscoverScreen';
import { PassSearch } from './SearchScreen';

// Direction 2 — PASS : supprimer ce dossier (et sa ligne dans mockups/directions.ts) si non retenue.
export const passDirection: MockupDirection = {
  key: 'pass',
  name: 'Pass',
  intent: 'Chaque concert est un billet qu’on a envie de collectionner.',
  Discover: PassDiscover,
  Concert: PassConcert,
  Search: PassSearch,
};
