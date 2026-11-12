import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField, type TextFieldRef } from '@/components/TextField';
import {
  authErrorMessage,
  CODE_LENGTH,
  isValidEmail,
  normalizeEmail,
  RESEND_DELAY_SECONDS,
  sendSignInCode,
  verifySignInCode,
} from '@/features/auth/api';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  opacity,
  spacing,
  touch,
} from '@/theme/tokens';

type Step = 'email' | 'code';

// Connexion sans mot de passe (V1.3), présentée en fenêtre modale :
// 1. e-mail → envoi d'un code à 6 chiffres ; 2. saisie du code → connecté (le compte est créé si besoin).
export default function SignInScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeInput = useRef<TextFieldRef>(null);

  // Compte à rebours avant de pouvoir redemander un code.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const sendCode = async () => {
    if (!isValidEmail(email)) {
      setError('Saisis une adresse e-mail valide.');
      return;
    }
    setError(null);
    setIsSending(true);
    try {
      await sendSignInCode(email);
      setStep('code');
      setCode('');
      setResendIn(RESEND_DELAY_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 300);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setIsSending(false);
    }
  };

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || isVerifying) return;
    setError(null);
    setIsVerifying(true);
    try {
      await verifySignInCode(email, value);
      close(); // connecté : la session est enregistrée, l'app se met à jour toute seule
    } catch (caught) {
      setError(authErrorMessage(caught));
      setIsVerifying(false);
    }
  };

  const onCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) void verify(digits);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon={{ ios: 'xmark', android: 'close' }}
              accessibilityLabel="Fermer"
              onPress={close}
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text
          style={styles.title}
          accessibilityRole="header"
          maxFontSizeMultiplier={maxFontScale.display}>
          {step === 'email' ? 'Connexion' : 'Code reçu'}
        </Text>

        {step === 'email' ? (
          <>
            <Text style={styles.intro}>
              Un compte te permet de suivre des artistes et d’enregistrer tes envies. Pas de mot
              de passe : on t’envoie un code par e-mail.
            </Text>
            <TextField
              label="Ton e-mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              placeholder="prenom@exemple.fr"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void sendCode()}
              error={error}
              autoFocus
            />
            <PrimaryButton
              label="Recevoir un code"
              loading={isSending}
              onPress={() => void sendCode()}
            />
            {/* Information RGPD au bon moment (cahier des charges 10.8). */}
            <Text style={styles.notice}>
              Ton e-mail sert uniquement à ton compte Vybe : jamais revendu, ni utilisé pour de la
              publicité. Tu peux supprimer ton compte et tes données à tout moment.
            </Text>
            <Pressable
              onPress={() => router.push('/infos')}
              accessibilityRole="link"
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
              <Text style={styles.linkLabel}>Politique de confidentialité ›</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.intro}>
              Entre le code à {CODE_LENGTH} chiffres envoyé à{' '}
              <Text style={styles.strong}>{normalizeEmail(email)}</Text>. Pense à regarder dans
              les indésirables.
            </Text>
            <TextField
              ref={codeInput}
              label="Code"
              variant="code"
              value={code}
              onChangeText={onCodeChange}
              placeholder="••••••"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={CODE_LENGTH}
              error={error}
            />
            <PrimaryButton
              label="Se connecter"
              loading={isVerifying}
              disabled={code.length !== CODE_LENGTH}
              onPress={() => void verify(code)}
            />
            <View style={styles.row}>
              <Pressable
                onPress={() => void sendCode()}
                disabled={resendIn > 0 || isSending}
                accessibilityRole="button"
                accessibilityState={{ disabled: resendIn > 0 || isSending }}
                style={({ pressed }) => [
                  styles.link,
                  (pressed || resendIn > 0) && styles.pressed,
                ]}>
                <Text style={styles.linkLabel}>
                  {resendIn > 0 ? `Renvoyer le code (dans ${resendIn} s)` : 'Renvoyer le code'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkLabel}>Changer d’e-mail</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text,
  },
  strong: {
    fontFamily: fonts.semibold,
  },
  notice: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  link: {
    minHeight: touch.minSize,
    justifyContent: 'center',
  },
  pressed: {
    opacity: opacity.pressed,
  },
  linkLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
