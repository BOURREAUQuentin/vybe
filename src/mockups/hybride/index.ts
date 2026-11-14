import type { MockupDirection } from '@/mockups/shared/types';

import { HybrideConcert } from './ConcertScreen';
import { HybrideDiscover } from './DiscoverScreen';
import { HybrideSearch } from './SearchScreen';

// Direction 4 — HYBRIDE (Pass + Flow) : la base proposée pour l'étape 3.
export const hybrideDirection: MockupDirection = {
  key: 'hybride',
  name: 'Hybride',
  intent: 'Pass + Flow : l’identité du billet sur une structure claire et ergonomique.',
  Discover: HybrideDiscover,
  Concert: HybrideConcert,
  Search: HybrideSearch,
};
