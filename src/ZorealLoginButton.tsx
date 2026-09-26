import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useZorealOAuth } from './context';
import { strings } from './i18n';
import { ZOREAL_BLUE, ZorealMark } from './mark';
import { useZorealFlow } from './useZorealLogin';
import type {
  NonOAuthError,
  ZorealButtonConfiguration,
  ZorealCodeResponse,
  ZorealCredentialResponse,
  ZorealLoginRequestOptions,
} from './types';

/**
 * The drop-in button, the native twin of `@zoreal/oauth2-react`'s ZorealLogin:
 * the same sizes, themes, shapes, copy and mark, drawn with react-native-svg.
 * Pressed, it runs the whole sign-in: with the provider's dialog (the
 * default) that includes the check for ZOREAL ID on a phone, the store prompt,
 * "Use another device" and the QR on a tablet. It holds itself busy until the
 * login settles.
 *
 * It runs either flow, discriminated on `flow` exactly as useZorealLogin is:
 * browser-direct (the default) hands onSuccess an ID token; auth-code hands it
 * the code, PKCE verifier and nonce for YOUR backend to redeem.
 *
 * The copy is neutral: the button asserts nothing about a person who has not
 * yet authenticated.
 */

// The default label is translated with the dialog's own copy; the four
// alternatives are English, as they are in the React SDK.
const TEXTS: Record<NonNullable<ZorealButtonConfiguration['text']>, string | null> = {
  continue_with: null,
  signin_with: 'Sign in with ZOREAL',
  signup_with: 'Sign up with ZOREAL',
  signin: 'Sign in',
  verify_with: 'Verify with ZOREAL ID',
};

/* The house button: 14 point medium text, a 22 point mark, 12 between them,
   20 at the sides, 12 point corners. The smaller sizes scale that down; they
   do not change its proportions. */
const SIZES = {
  large: { height: 50, font: 14, pad: 20, mark: 22, gap: 12, radius: 12 },
  medium: { height: 42, font: 14, pad: 16, mark: 20, gap: 10, radius: 10 },
  small: { height: 34, font: 12, pad: 12, mark: 16, gap: 8, radius: 8 },
} as const;

const THEMES = {
  outline: { background: '#ffffff', color: '#16181c', border: '#e2e4de' },
  filled_black: { background: '#111111', color: '#ffffff', border: '#111111' },
  filled: { background: ZOREAL_BLUE, color: '#ffffff', border: ZOREAL_BLUE },
} as const;

export type ZorealLoginButtonProps = (
  | { flow?: 'browser-direct'; onSuccess: (response: ZorealCredentialResponse) => void }
  | { flow: 'auth-code'; onSuccess: (response: ZorealCodeResponse) => void }
) & {
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
    theme = 'outline',
    size = 'large',
    text = 'continue_with',
    shape = 'rectangular',
    logo_alignment = 'center',
    width,
    click_listener,
    flow = 'browser-direct',
    ...request
  } = props;

  const { locale } = useZorealOAuth();
  const label = TEXTS[text] ?? strings(locale).buttonContinue;

  const { login, internals } = useZorealFlow({
    ...request,
    flow,
    onCredential: flow === 'browser-direct' ? (onSuccess as (r: ZorealCredentialResponse) => void) : undefined,
    onCode: flow === 'auth-code' ? (onSuccess as (r: ZorealCodeResponse) => void) : undefined,
    onError: (e) => onError?.({ type: 'unknown', description: e.description ?? e.error }),
    onNonOAuthError: (e: NonOAuthError) => onError?.(e),
  });

  const s = SIZES[size];
  const palette = THEMES[theme];
  const radius = shape === 'pill' ? s.height / 2 : shape === 'square' ? 4 : s.radius;
  // The mark keeps the brand blue wherever it can be seen. On the brand-blue
  // filled button it cannot, so there it takes the label's white.
  const markColor = theme === 'filled' ? palette.color : ZOREAL_BLUE;
  const busy = internals.busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={() => {
        click_listener?.();
        login();
      }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: logo_alignment === 'center' ? 'center' : 'flex-start',
          gap: s.gap,
          height: s.height,
          paddingHorizontal: s.pad,
          width,
          borderRadius: radius,
          backgroundColor: palette.background,
          borderWidth: 1,
          borderColor: palette.border,
          alignSelf: width === undefined ? 'flex-start' : undefined,
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        busy && { opacity: 0.7 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={markColor} style={{ width: s.mark, height: s.mark }} />
      ) : (
        <ZorealMark size={s.mark} color={markColor} />
      )}
      {type === 'standard' && (
        <Text style={{ color: palette.color, fontSize: s.font, fontWeight: '500' }} maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
