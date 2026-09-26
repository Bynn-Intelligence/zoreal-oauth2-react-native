/**
 * The provider, the button and the dialog together, rendered with
 * react-test-renderer over the host-component mock: press through each way in
 * on a phone and a tablet, and check what the provider was
 * asked for, what was opened, and what the dialog says.
 */
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Linking, Platform } from 'react-native';

// The mock's Platform carries isPad on every OS; the real type only on iOS.
const platform = Platform as unknown as { isPad?: boolean };
import { ZorealLoginButton, ZorealOAuthProvider, type PairingUI } from '../src/index';
import { nativeStrings, strings } from '../src/i18n';

const en = strings('en');
const n = nativeStrings('en');
const ISSUER = 'https://id.example';

type Call = { url: string; body?: Record<string, unknown> };
let calls: Call[] = [];

function stubProvider() {
  calls = [];
  let seq = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: { body?: string }) => {
      const url = String(input);
      const body = init?.body && init.body.startsWith('{') ? JSON.parse(init.body) : undefined;
      calls.push({ url, body });
      if (url.endsWith('/pair')) {
        seq += 1;
        return new Response(
          JSON.stringify({ request_id: `req${seq}`, pair_url: `https://zoreal.example/login/req${seq}?t=start${seq}`, expires_in: 300, qr_refresh_seconds: 3 }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('/status')) {
        return new Response(JSON.stringify({ status: 'pending', expires_in: 290 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/qr.svg')) {
        return new Response('<svg viewBox="0 0 10 10"></svg>', { status: 200 });
      }
      return new Response('{}', { status: 404 });
    })
  );
}

const pairStarts = () => calls.filter((c) => c.url.endsWith('/pair'));
const tick = (ms = 0) => act(() => new Promise((r) => setTimeout(r, ms)));

function texts(root: ReactTestInstance): string[] {
  return root.findAll((node) => String(node.type) === 'Text').flatMap((node) => {
    const c = node.props.children;
    return (Array.isArray(c) ? c : [c]).filter((x: unknown) => typeof x === 'string');
  });
}

function press(root: ReactTestInstance, label: string) {
  const target = root.findAll((node) => String(node.type) === 'Pressable').find((node) => {
    if (node.props.accessibilityLabel === label) return true;
    return texts(node).includes(label);
  });
  if (!target) throw new Error(`no control labelled "${label}"; on screen: ${texts(root).join(' | ')}`);
  act(() => target.props.onPress());
}

async function mount(pairingUI: PairingUI = 'modal', locale?: string): Promise<ReactTestRenderer> {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(
      <ZorealOAuthProvider clientId="ast_test" issuer={ISSUER} pairingUI={pairingUI} locale={locale}>
        <ZorealLoginButton flow="auth-code" onSuccess={() => {}} />
      </ZorealOAuthProvider>
    );
  });
  return r;
}

beforeEach(() => {
  stubProvider();
  vi.mocked(Linking.openURL).mockClear();
  vi.mocked(Linking.canOpenURL).mockReset();
  platform.isPad = false;
});

afterEach(() => {
  vi.unstubAllGlobals();
  platform.isPad = false;
});

describe('the SDK dialog: check first, open directly, fall back to another device', () => {
  it('a phone without ZOREAL ID is told so, starts nothing, and can use another device', async () => {
    vi.mocked(Linking.canOpenURL).mockResolvedValue(false);
    const r = await mount();
    press(r.root, en.buttonContinue);
    await tick();
    expect(texts(r.root)).toContain(n.missingTitle);
    expect(pairStarts()).toHaveLength(0);
    expect(vi.mocked(Linking.openURL)).not.toHaveBeenCalled();

    press(r.root, n.otherDevice);
    await tick(10);
    expect(pairStarts()).toHaveLength(1);
    expect(pairStarts()[0].body?.display).toBe('qr');
    expect(texts(r.root)).toContain(en.title);
    // No way back to a phone that plainly has no ZOREAL ID.
    expect(texts(r.root)).not.toContain(n.thisDevice);

    press(r.root, en.cancel);
    await tick();
    expect(r.root.findAll((node) => String(node.type) === 'Modal')).toHaveLength(0);
    act(() => r.unmount());
  });

  it('"I already have ZOREAL ID" opens the link anyway', async () => {
    vi.mocked(Linking.canOpenURL).mockResolvedValue(false);
    const r = await mount();
    press(r.root, en.buttonContinue);
    await tick();
    press(r.root, n.haveApp);
    await tick(10);
    expect(pairStarts()[0].body?.display).toBe('link');
    expect(vi.mocked(Linking.openURL)).toHaveBeenCalledWith('https://zoreal.example/login/req1?t=start1');
    act(() => r.unmount());
  });

  it('a phone with ZOREAL ID opens it directly, and can switch to the code and back', async () => {
    vi.mocked(Linking.canOpenURL).mockResolvedValue(true);
    const r = await mount();
    press(r.root, en.buttonContinue);
    await tick(10);
    expect(pairStarts()).toHaveLength(1);
    expect(pairStarts()[0].body?.display).toBe('link');
    expect(vi.mocked(Linking.openURL)).toHaveBeenCalledWith('https://zoreal.example/login/req1?t=start1');
    expect(texts(r.root)).toEqual(expect.arrayContaining([n.titleOpen, n.reopen, n.otherDevice]));

    press(r.root, n.otherDevice);
    await tick(10);
    expect(pairStarts()).toHaveLength(2);
    expect(pairStarts()[1].body?.display).toBe('qr');
    expect(texts(r.root)).toEqual(expect.arrayContaining([en.title, n.thisDevice]));

    press(r.root, n.thisDevice);
    await tick(10);
    expect(pairStarts()).toHaveLength(3);
    expect(pairStarts()[2].body?.display).toBe('link');
    press(r.root, en.cancel);
    await tick();
    act(() => r.unmount());
  });

  it('an iPad starts with the code and never asks about ZOREAL ID', async () => {
    platform.isPad = true;
    const r = await mount();
    press(r.root, en.buttonContinue);
    await tick(10);
    expect(vi.mocked(Linking.canOpenURL)).not.toHaveBeenCalled();
    expect(pairStarts()[0].body?.display).toBe('qr');
    expect(texts(r.root)).toContain(en.title);
    expect(texts(r.root)).not.toContain(n.thisDevice);
    press(r.root, en.cancel);
    await tick();
    act(() => r.unmount());
  });

  it('pairingUI="none" draws nothing and asks nothing: the app owns the UI', async () => {
    const r = await mount('none');
    press(r.root, en.buttonContinue);
    await tick(10);
    expect(vi.mocked(Linking.canOpenURL)).not.toHaveBeenCalled();
    expect(r.root.findAll((node) => String(node.type) === 'Modal')).toHaveLength(0);
    expect(pairStarts()).toHaveLength(1);
    act(() => r.unmount());
  });

  it('the button is labelled in the provider language and holds itself busy', async () => {
    vi.mocked(Linking.canOpenURL).mockResolvedValue(true);
    const r = await mount('modal', 'sv');
    const button = () => r.root.findAll((node) => String(node.type) === 'Pressable' && node.props.accessibilityLabel === 'Fortsätt med ZOREAL')[0];
    expect(button()).toBeDefined();
    expect(button().props.disabled).toBe(false);
    act(() => button().props.onPress());
    await tick(10);
    expect(button().props.disabled).toBe(true);
    expect(texts(r.root)).toContain(nativeStrings('sv').titleOpen);
    press(r.root, strings('sv').cancel);
    await tick();
    expect(button().props.disabled).toBe(false);
    act(() => r.unmount());
  });
});
