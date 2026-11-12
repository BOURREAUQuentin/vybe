import { Linking, Platform } from 'react-native';

type Place = {
  name: string;
  latitude: number;
  longitude: number;
};

/**
 * Lien qui ouvre l'app de cartes du téléphone sur un lieu (itinéraire) :
 * Plans sur iPhone, l'app de cartes par défaut sur Android (lien « geo: »).
 * Ce n'est pas un appel d'API : on ouvre simplement une autre application.
 */
export function getDirectionsUrl({ name, latitude, longitude }: Place): string {
  const coordinates = `${latitude},${longitude}`;
  const label = encodeURIComponent(name);

  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?daddr=${coordinates}&q=${label}`;
  }
  return `geo:${coordinates}?q=${coordinates}(${label})`;
}

/** Ouvre l'itinéraire ; ne fait rien si aucune app de cartes n'est disponible. */
export function openDirections(place: Place): void {
  Linking.openURL(getDirectionsUrl(place)).catch(() => undefined);
}
