import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Svg, { Path, Rect, SvgXml } from 'react-native-svg';
import type { ActivePairing } from './flow';
import { interpolate, isRtl, nativeStrings, strings } from './i18n';
import { zorealIdStoreUrl } from './installed';
import { titleFor } from './intent';
import { ZorealLockup } from './mark';
import type { LoginIntent, ZorealTheme } from './types';

/**
 * The SDK's own pairing dialog, the native counterpart of the React SDK's
 * PairingModal, rendered by the provider for every login unless
 * `pairingUI="none"`. It has three faces, because a native app on a phone is
 * the same-device case the web handles with a navigation
 * (check for ZOREAL ID first, open it directly, fall back to another device):
 *
 * - ZOREAL ID is not on this phone: say so, offer the store, offer another
 *   device, and let someone whose ZOREAL ID the check could not see open the
 *   link anyway. No pairing exists yet.
 * - ZOREAL ID on this phone has the request: wait for it, with a way to open
 *   it again and a way to another device.
 * - The code, for another device (a tablet always, a phone by choice): the
 *   provider's animated QR, the same title, body, status, countdown and help
 *   the React dialog shows, and on a phone a way back to this one.
 */

export type HostedPairing =
  | {
      kind: 'missing';
      intent: LoginIntent;
      otherDevice: () => void;
      haveApp: () => void;
      cancel: () => void;
    }
  | {
      kind: 'pairing';
      intent: LoginIntent;
      pairing: ActivePairing;
      /** Link only: open ZOREAL ID again. */
      reopen?: () => void;
      /** Link only, while pending: start again as a QR. */
      otherDevice?: () => void;
      /** QR on a phone that may have ZOREAL ID: start again as a link. */
      thisDevice?: () => void;
    };

/**
 * How long a pairing stays on screen when the provider states no expiry of
 * its own. It does state one (`expires_in`, five minutes today), and that is
 * the deadline unless the app sets a shorter `pairingTimeoutMs`.
 */
export const DEFAULT_PAIRING_TIMEOUT_MS = 300_000;

/** Below this the countdown changes colour: a prompt to hurry, not background. */
const URGENT_SECONDS = 20;

const QR_SIZE = 180;

// The React SDK's dialog tokens, so a web and a native sign-in from the same
// relying party look like one product.
const PALETTES = {
  light: {
    scrim: 'rgba(16, 18, 27, 0.45)',
    surface: '#ffffff',
    sunken: '#f6f7f9',
    ink: '#16181c',
    inkSoft: '#4a4f57',
    inkMute: '#6b7078',
    line: '#e4e6ea',
    lineSoft: '#eef0f3',
    accent: '#00b4d9',
    accentSoft: '#dcf3fa',
    accentInk: '#04698a',
    urgent: '#b4761a',
  },
  dark: {
    scrim: 'rgba(0, 0, 0, 0.62)',
    surface: '#17191d',
    sunken: '#1f2226',
    ink: '#f4f5f7',
    inkSoft: '#b3b8c0',
    inkMute: '#8b9199',
    line: '#2c3036',
    lineSoft: '#24272c',
    accent: '#34c9e8',
    accentSoft: '#0d3b47',
    accentInk: '#7fdcf0',
    urgent: '#e0a952',
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Seconds left, from a deadline rather than a decremented counter: a timer
 * suspended in the background would otherwise come back lying about the time.
 * Restarted for each pairing and again when it is claimed, since claiming
 * opens the provider's second window; a shorter `timeoutMs` of the app's caps
 * both, never extends them.
 */
function useCountdown(key: string | null, expiresIn: number | undefined, timeoutMs: number | undefined, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiresRef = useRef(expiresIn);
  expiresRef.current = expiresIn;

  useEffect(() => {
    if (!key) return;
    const serverMs = typeof expiresRef.current === 'number' ? expiresRef.current * 1000 : Infinity;
    const capMs = timeoutMs ?? (Number.isFinite(serverMs) ? serverMs : DEFAULT_PAIRING_TIMEOUT_MS);
    const ms = Math.min(capMs, serverMs);
    const deadline = Date.now() + ms;
    setRemaining(Math.round(ms / 1000));
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [key, timeoutMs]);

  return remaining;
}

/**
 * The code on screen is one frame of a rotating sequence, so a new URL
 * arrives every few seconds. The next frame is fetched first and only
 * replaces the one showing once it has arrived; a frame that fails leaves
 * the old one up, which stays valid for a few more seconds. Always on a
 * white field: a camera reads dark modules on a light ground in either theme.
 */
function QrWell({ url, spent, c }: { url: string; spent: boolean; c: Palette }) {
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    if (spent) return;
    let alive = true;
    fetch(url, { headers: { Accept: 'image/svg+xml' } })
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (alive && text && text.trim().startsWith('<svg')) setXml(text);
      })
      .catch(() => {
        /* keep the frame that is showing; the next refresh retries */
      });
    return () => {
      alive = false;
    };
  }, [url, spent]);

  return (
    <View style={[styles.well, { borderColor: c.line }]}>
      <View style={{ opacity: spent ? 0.12 : 1 }}>
        {xml ? <SvgXml xml={xml} width={QR_SIZE} height={QR_SIZE} /> : <View style={{ width: QR_SIZE, height: QR_SIZE }} />}
      </View>
      {spent && (
        <View style={styles.wellOverlay}>
          <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
            <IconPhone color={c.accentInk} />
          </View>
        </View>
      )}
    </View>
  );
}

const IconPhone = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={6} y={2} width={12} height={20} rx={2.5} />
    <Path d="M11 18.5h2" />
  </Svg>
);

const IconClose = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const IconShield = ({ color }: { color: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

function Action({
  label,
  onPress,
  kind,
  c,
}: {
  label: string;
  onPress: () => void;
  kind: 'primary' | 'secondary' | 'quiet';
  c: Palette;
}) {
  const box =
    kind === 'primary'
      ? { backgroundColor: c.accent, borderColor: c.accent }
      : kind === 'secondary'
        ? { backgroundColor: 'transparent', borderColor: c.line }
        : { backgroundColor: 'transparent', borderColor: 'transparent' };
  const ink = kind === 'primary' ? '#ffffff' : kind === 'secondary' ? c.ink : c.accentInk;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, box, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
    >
      <Text style={[styles.actionText, { color: ink }]} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PairingSheet({
  hosted,
  locale,
  theme = 'auto',
  timeoutMs,
}: {
  hosted: HostedPairing;
  locale?: string;
  theme?: ZorealTheme;
  timeoutMs?: number;
}) {
  const scheme = useColorScheme();
  const c = theme === 'dark' || (theme === 'auto' && scheme === 'dark') ? PALETTES.dark : PALETTES.light;
  const t = strings(locale);
  const n = nativeStrings(locale);
  const direction = isRtl(locale) ? 'rtl' : 'ltr';

  const pairing = hosted.kind === 'pairing' ? hosted.pairing : null;
  const status = pairing?.state.status;
  // `claimed`: the request is waiting in ZOREAL ID; `enrolling`: a first-time
  // holder is finishing setup. Either way the action has moved to the phone.
  const settled = status === 'claimed' || status === 'enrolling';
  const cancel = hosted.kind === 'missing' ? hosted.cancel : () => pairing?.cancel();

  const remaining = useCountdown(
    pairing ? `${pairing.requestId}:${settled ? 'claimed' : 'pending'}` : null,
    pairing?.state.expiresIn,
    timeoutMs,
    cancel
  );

  let title: string;
  let body: string;
  let content: ReactNode = null;
  let actions: ReactNode = null;

  if (hosted.kind === 'missing') {
    title = n.missingTitle;
    body = n.missingBody;
    actions = (
      <>
        <Action kind="primary" label={n.getApp} onPress={() => void Linking.openURL(zorealIdStoreUrl()).catch(() => undefined)} c={c} />
        <Action kind="secondary" label={n.otherDevice} onPress={hosted.otherDevice} c={c} />
        <Action kind="quiet" label={n.haveApp} onPress={hosted.haveApp} c={c} />
      </>
    );
  } else if (pairing?.appLink) {
    title = status === 'enrolling' ? t.titleApprove : n.titleOpen;
    body = status === 'enrolling' ? t.bodyEnrolling : n.bodyOpen;
    content = <Status settled={settled} remaining={remaining} t={t} c={c} />;
    actions = (
      <>
        {hosted.reopen && <Action kind="primary" label={n.reopen} onPress={hosted.reopen} c={c} />}
        {hosted.otherDevice && !settled && <Action kind="secondary" label={n.otherDevice} onPress={hosted.otherDevice} c={c} />}
      </>
    );
  } else {
    title = settled ? t.titleApprove : titleFor(t, hosted.intent);
    body = status === 'enrolling' ? t.bodyEnrolling : settled ? t.bodyApprove : t.bodyScan;
    content = (
      <>
        {pairing?.qrUrl ? (
          <View accessible accessibilityRole="image" accessibilityLabel={t.qrAlt}>
            <QrWell url={pairing.qrUrl} spent={settled} c={c} />
          </View>
        ) : null}
        <Status settled={settled} remaining={remaining} t={t} c={c} />
        {!settled && (
          <View style={[styles.help, { backgroundColor: c.sunken }]}>
            <Text style={[styles.helpTitle, { color: c.ink, writingDirection: direction }]}>{t.noIdTitle}</Text>
            <Text style={[styles.helpBody, { color: c.inkSoft, writingDirection: direction }]}>{t.noIdBody}</Text>
          </View>
        )}
      </>
    );
    actions = hosted.thisDevice && !settled ? <Action kind="secondary" label={n.thisDevice} onPress={hosted.thisDevice} c={c} /> : null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={cancel} statusBarTranslucent>
      <View style={[styles.scrim, { backgroundColor: c.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityElementsHidden importantForAccessibility="no" />
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.body} bounces={false}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.close}
              onPress={cancel}
              hitSlop={12}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
            >
              <IconClose color={c.inkMute} />
            </Pressable>
            <ZorealLockup height={32} ink={c.ink} />
            <Text accessibilityRole="header" style={[styles.title, { color: c.ink, writingDirection: direction }]}>
              {title}
            </Text>
            <Text style={[styles.bodyText, { color: c.inkSoft, writingDirection: direction }]}>{body}</Text>
            {content}
            {actions ? <View style={styles.actions}>{actions}</View> : null}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: c.lineSoft }]}>
            <Action kind="secondary" label={t.cancel} onPress={cancel} c={c} />
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL('https://zoreal.com').catch(() => undefined)}
              style={styles.secured}
            >
              <IconShield color={c.inkMute} />
              <Text style={[styles.securedText, { color: c.inkMute }]}>{t.secured}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Status({
  settled,
  remaining,
  t,
  c,
}: {
  settled: boolean;
  remaining: number;
  t: ReturnType<typeof strings>;
  c: Palette;
}) {
  return (
    <View style={styles.statusBlock}>
      <View style={[styles.status, { backgroundColor: c.accentSoft }]} accessibilityLiveRegion="polite">
        <View style={[styles.dot, { backgroundColor: c.accent }]} />
        <Text style={[styles.statusText, { color: c.accentInk }]}>{settled ? t.waitingApproval : t.waiting}</Text>
      </View>
      <Text style={[styles.timer, { color: remaining <= URGENT_SECONDS ? c.urgent : c.inkMute }]}>
        {interpolate(t.expiresIn, mmss(remaining))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  body: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, paddingBottom: 20, gap: 12 },
  close: { position: 'absolute', top: 12, end: 12, padding: 8, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  bodyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  well: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginTop: 4,
  },
  wellOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statusBlock: { alignItems: 'center', gap: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '500' },
  timer: { fontSize: 12, fontVariant: ['tabular-nums'] },
  help: { alignSelf: 'stretch', padding: 14, borderRadius: 12, gap: 4 },
  helpTitle: { fontSize: 12, fontWeight: '600' },
  helpBody: { fontSize: 12, lineHeight: 17 },
  actions: { alignSelf: 'stretch', gap: 8, marginTop: 4 },
  action: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  footer: { padding: 12, gap: 10, borderTopWidth: 1, alignItems: 'stretch' },
  secured: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  securedText: { fontSize: 12 },
});
