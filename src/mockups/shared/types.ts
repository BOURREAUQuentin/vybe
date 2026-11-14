import type { ComponentType } from 'react';

export type MockupScreenName = 'discover' | 'concert' | 'search';

/** Navigation interne au laboratoire de maquettes (aucune vraie route n'est ouverte). */
export type MockupNav = {
  openConcert: (id: string) => void;
  goBack: () => void;
};

export type MockupScreenProps = { nav: MockupNav };
export type MockupConcertProps = MockupScreenProps & { eventId: string };

/** Une direction d'interface : son nom et ses trois écrans clés. */
export type MockupDirection = {
  key: string;
  name: string;
  intent: string;
  Discover: ComponentType<MockupScreenProps>;
  Concert: ComponentType<MockupConcertProps>;
  Search: ComponentType<MockupScreenProps>;
};
