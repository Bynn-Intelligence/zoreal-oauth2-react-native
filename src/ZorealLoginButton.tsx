import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useZorealFlow } from './useZorealLogin';
import type { NonOAuthError, ZorealButtonConfiguration, ZorealCredentialResponse, ZorealLoginRequestOptions } from './types';

/**
 * The drop-in button: a plain Pressable, no external UI dependency, no image
 * asset, no font. It runs the browser-direct flow, so it returns the
 * pseudonymous identity only; personal data needs the auth-code flow and your
 * backend.
 *
 * On a phone, pressing it opens the pairing link in the ZOREAL ID app (or the
 * pairing page, when the app is not installed) and the press resolves through
 * onSuccess when the user returns. Where a QR belongs (display: 'qr', or a
 * tablet), the button does not draw one: render pairUrl from
 * onPairingStateChange with the QR renderer of your choice.
 *
 * The copy is neutral: the button asserts nothing about a person who has not
 * yet authenticated.
 */

const TEXTS: Record<NonNullable<ZorealButtonConfiguration['text']>, string> = {
  continue_with: 'Continue with ZOREAL',
  signin_with: 'Sign in with ZOREAL',
  signup_with: 'Sign up with ZOREAL',
  signin: 'Sign in',
};

const SIZES = {
  large: { height: 44, font: 15, pad: 20 },
  medium: { height: 38, font: 14, pad: 16 },
  small: { height: 32, font: 12, pad: 12 },
} as const;

/** The mark: a filled ring, drawn with two Views so no SVG library is needed. */
const Mark = ({ size, color }: { size: number; color: string }) => (
  <View
    accessible={false}
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: Math.max(1.5, size * 0.11),
      borderColor: color,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.28,
        height: size * 0.28,
        borderRadius: (size * 0.28) / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

export type ZorealLoginButtonProps = {
  onSuccess: (response: ZorealCredentialResponse) => void;
  onError?: (error: NonOAuthError) => void;
  /** Merged onto the Pressable, after the button's own style. */
  style?: StyleProp<ViewStyle>;
} & ZorealLoginRequestOptions &
  ZorealButtonConfiguration;

export function ZorealLoginButton(props: ZorealLoginButtonProps) {
  const {
    onSuccess,
    onError,
    style,
    type = 'standard',
    theme = 'filled',
    size = 'large',
    text = 'continue_with',
    shape = 'rectangular',
    logo_alignment = 'left',
    width,
    click_listener,
    ...request
  } = props;

  const { login } = useZorealFlow({
    ...request,
    flow: 'browser-direct',
    onCredential: onSuccess,
    onError: (e) => onError?.({ type: 'unknown', description: e.description ?? e.error }),
    onNonOAuthError: (e: NonOAuthError) => onError?.(e),
  });

  const s = SIZES[size];
  const palette =
    theme === 'outline'
      ? { background: 'transparent', color: '#1a1a1a', border: 'rgba(128,128,128,0.5)' }
      : theme === 'filled_black'
        ? { background: '#111111', color: '#ffffff', border: '#111111' }
        : { background: '#00b4d9', color: '#ffffff', border: '#00b4d9' };

  const base: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: logo_alignment === 'center' ? 'center' : 'flex-start',
    gap: 10,
    height: s.height,
    paddingHorizontal: s.pad,
    width,
    borderRadius: shape === 'pill' ? s.height / 2 : shape === 'square' ? 4 : 8,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    alignSelf: 'flex-start',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={TEXTS[text]}
      onPress={() => {
        click_listener?.();
        login();
      }}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}
    >
      <Mark size={Math.round(s.font * 1.25)} color={palette.color} />
      {type === 'standard' && (
        <Text style={{ color: palette.color, fontSize: s.font, fontWeight: '500' }}>
          {TEXTS[text]}
        </Text>
      )}
    </Pressable>
  );
}
