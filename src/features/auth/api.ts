// Connexion sans mot de passe (V1.3) : e-mail → code à 6 chiffres → session.
// La première connexion crée le compte.

import { isAuthApiError, isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const CODE_LENGTH = 6;
/** Délai avant de pouvoir redemander un code (limite d'envoi des e-mails). */
export const RESEND_DELAY_SECONDS = 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

/** Message en français pour une erreur de connexion. */
export function authErrorMessage(error: unknown): string {
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'otp_expired':
        return 'Code incorrect ou expiré. Vérifie-le ou demande un nouveau code.';
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'Trop de demandes en peu de temps. Patiente quelques minutes avant de réessayer.';
      case 'email_address_invalid':
      case 'validation_failed':
        return 'Cette adresse e-mail n’est pas valide.';
      case 'email_address_not_authorized':
        return 'Les e-mails ne peuvent pas encore être envoyés à cette adresse (service d’envoi en mode test).';
      default:
        // Ex. échec d'envoi de l'e-mail côté serveur (erreur 500, « unexpected_failure »).
        return 'L’envoi a échoué côté serveur. Réessaie dans un instant.';
    }
  }
  // supabase-js range aussi les erreurs 5xx du serveur dans AuthRetryableFetchError :
  // seul le statut 0 (requête jamais arrivée) correspond à une vraie coupure réseau.
  if ((isAuthRetryableFetchError(error) && error.status === 0) || error instanceof TypeError) {
    return 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
  }
  if (isAuthError(error)) {
    return 'L’envoi a échoué côté serveur. Réessaie dans un instant.';
  }
  return 'Une erreur inattendue est survenue. Réessaie dans un instant.';
}

/** Envoie un code à 6 chiffres par e-mail (crée le compte s'il n'existe pas). */
export async function sendSignInCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Vérifie le code ; en cas de succès, la session est enregistrée automatiquement. */
export async function verifySignInCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code.trim(),
    type: 'email',
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
