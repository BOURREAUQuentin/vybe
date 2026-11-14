import type { MockupDirection } from '@/mockups/shared/types';

import { FlowConcert } from './ConcertScreen';
import { FlowDiscover } from './DiscoverScreen';
import { FlowSearch } from './SearchScreen';

// Direction 3 — FLOW : supprimer ce dossier (et sa ligne dans mockups/directions.ts) si non retenue.
export const flowDirection: MockupDirection = {
  key: 'flow',
  name: 'Flow',
  intent: 'Une expérience immersive où la photo et le mouvement portent l’émotion.',
  Discover: FlowDiscover,
  Concert: FlowConcert,
  Search: FlowSearch,
};
