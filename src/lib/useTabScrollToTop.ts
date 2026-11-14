import { useScrollToTop } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Re-toucher l'onglet de l'écran quand on est déjà dessus fait remonter la page en haut.
 *
 * La remontée native des onglets ne trouve pas nos listes (elle ne descend que par le premier
 * élément de chaque niveau) : on écoute donc l'événement `tabPress` avec `useScrollToTop`
 * d'Expo Router, qui n'agit que si l'écran est affiché et à la racine de son onglet (depuis
 * une fiche, le premier toucher revient d'abord à l'écran d'accueil de l'onglet).
 *
 * @param scrollToTop remonte la liste ou la page de l'écran (ex. `ref.current?.scrollTo({ y: 0 })`).
 */
export function useTabScrollToTop(scrollToTop: () => void): void {
  // Toujours la dernière version de la fonction, sans réabonner l'écouteur à chaque rendu.
  const latest = useRef(scrollToTop);
  useEffect(() => {
    latest.current = scrollToTop;
  });

  const target = useRef({
    scrollToOffset: () => latest.current(),
  });
  useScrollToTop(target);
}
