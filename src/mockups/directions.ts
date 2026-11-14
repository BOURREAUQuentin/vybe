import { afficheDirection } from './affiche';
import { flowDirection } from './flow';
import { hybrideDirection } from './hybride';
import { passDirection } from './pass';
import type { MockupDirection } from './shared/types';

// Directions présentées dans le laboratoire de maquettes (étape 2 de la refonte).
// L'hybride est en premier : c'est elle qui s'ouvre au démarrage.
export const directions: MockupDirection[] = [hybrideDirection, afficheDirection, passDirection, flowDirection];
