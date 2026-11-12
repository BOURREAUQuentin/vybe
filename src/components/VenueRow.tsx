import { LinkRow } from '@/components/LinkRow';

type VenueRowProps = {
  name: string;
  /** Ligne secondaire : adresse, ou ville. */
  subtitle?: string | null;
  onPress: () => void;
};

// Ligne de salle cliquable : icône de lieu, nom, adresse. Ouvre la fiche salle.
export function VenueRow({ name, subtitle, onPress }: VenueRowProps) {
  return (
    <LinkRow
      icon={{ ios: 'mappin.and.ellipse', android: 'location_on' }}
      title={name}
      subtitle={subtitle}
      onPress={onPress}
      accessibilityHint="Ouvre la fiche de la salle"
    />
  );
}
