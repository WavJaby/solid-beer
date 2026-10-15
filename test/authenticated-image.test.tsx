import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticatedImage } from '../src';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};
const deferred = () => {
  let resolve!: (blob: Blob) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Blob>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const createUrl = vi.fn<[Blob | MediaSource], string>();
const revokeUrl = vi.fn<[string], void>();

beforeEach(() => {
  createUrl.mockReset().mockImplementation(() => `blob:image-${createUrl.mock.calls.length}`);
  revokeUrl.mockReset();
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createUrl;
    static revokeObjectURL = revokeUrl;
  });
});
afterEach(() => {
  disposers.splice(0).forEach(dispose => dispose());
  vi.unstubAllGlobals();
});

describe('AuthenticatedImage', () => {
  it('shows loading on replacement, ignores stale responses and revokes owned URLs', async () => {
    const [src, setSrc] = createSignal('first');
    const requests = [deferred(), deferred(), deferred()];
    const load = vi.fn()
      .mockImplementationOnce(() => requests[0]!.promise)
      .mockImplementationOnce(() => requests[1]!.promise)
      .mockImplementationOnce(() => requests[2]!.promise);
    const container = mount(() => <AuthenticatedImage src={src()} loadImage={load} alt="Preview" />);
    expect(container.querySelector('progress')).not.toBeNull();
    requests[0]!.resolve(new Blob(['first']));
    await settle();
    const firstUrl = container.querySelector('img')!.getAttribute('src')!;
    expect(container.querySelector('img')!.alt).toBe('Preview');
    expect(container.querySelector('img')!.getAttribute('loading')).toBe('lazy');
    setSrc('stale');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('progress')).not.toBeNull();
    expect(revokeUrl).toHaveBeenCalledWith(firstUrl);
    setSrc('latest');
    requests[1]!.resolve(new Blob(['stale']));
    await settle();
    expect(createUrl).toHaveBeenCalledOnce();
    expect(container.querySelector('progress')).not.toBeNull();
    requests[2]!.resolve(new Blob(['latest']));
    await settle();
    const latestUrl = container.querySelector('img')!.getAttribute('src')!;
    expect(latestUrl).not.toBe(firstUrl);
    disposers.splice(0).forEach(dispose => dispose());
    expect(revokeUrl.mock.calls.map(([url]) => url)).toEqual([firstUrl, latestUrl]);
  });
  it('renders failures and missing sources, then recovers without throwing resource errors', async () => {
    const [src, setSrc] = createSignal('failed');
    const request = deferred();
    const load = vi.fn(() => request.promise);
    const container = mount(() => <AuthenticatedImage src={src()} loadImage={load} fallbackIcon="image" />);
    request.reject(new Error('Unauthorized'));
    await settle();
    expect(container.querySelector('i')?.textContent).toBe('image');
    expect(container.querySelector('progress')).toBeNull();
    setSrc('');
    expect(container.querySelector('i')?.textContent).toBe('image');
    expect(load).toHaveBeenCalledOnce();
    const data = 'data:image/png;base64,AA==';
    setSrc(data);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(data);
    expect(load).toHaveBeenCalledOnce();
    expect(createUrl).not.toHaveBeenCalled();
  });
  it('ignores fulfillment after disposal and reacts to loader changes', async () => {
    const pending = deferred();
    const firstLoad = vi.fn(() => pending.promise);
    const nextLoad = vi.fn(async () => new Blob(['next']));
    const [load, setLoad] = createSignal(firstLoad);
    const container = mount(() => <AuthenticatedImage src="avatar" loadImage={load()} />);
    setLoad(() => nextLoad);
    await settle();
    expect(nextLoad).toHaveBeenCalledWith('avatar');
    expect(container.querySelector('img')).not.toBeNull();
    disposers.splice(0).forEach(dispose => dispose());
    pending.resolve(new Blob(['late']));
    await settle();
    expect(createUrl).toHaveBeenCalledOnce();
    expect(revokeUrl).toHaveBeenCalledOnce();
  });
  it('loads Blob sources without fetch and reports failed default fetches', async () => {
    const blob = new Blob(['local']);
    const fetch = vi.fn(async () => ({ ok: false, status: 403 }));
    vi.stubGlobal('fetch', fetch);
    const [src, setSrc] = createSignal<string | Blob>(blob);
    const container = mount(() => <AuthenticatedImage src={src()} />);
    await settle();
    expect(createUrl).toHaveBeenCalledWith(blob);
    expect(fetch).not.toHaveBeenCalled();
    setSrc('/private');
    await settle();
    expect(fetch).toHaveBeenCalledWith('/private');
    await vi.waitFor(() => expect(container.querySelector('i')?.textContent).toBe('broken_image'));
    expect(revokeUrl).toHaveBeenCalledOnce();
  });
  it('fetches remote blobs and discards a pending request after unmount', async () => {
    const blob = new Blob(['remote']);
    const request = deferred();
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, blob: async () => blob })
      .mockResolvedValueOnce({ ok: true, blob: () => request.promise });
    vi.stubGlobal('fetch', fetch);
    const [src, setSrc] = createSignal('/first');
    const container = mount(() => <AuthenticatedImage src={src()} />);
    await vi.waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(createUrl).toHaveBeenCalledWith(blob);
    setSrc('/pending');
    await settle();
    disposers.splice(0).forEach(dispose => dispose());
    request.resolve(new Blob(['unmounted']));
    await settle();
    expect(createUrl).toHaveBeenCalledOnce();
    expect(revokeUrl).toHaveBeenCalledOnce();
  });
});
