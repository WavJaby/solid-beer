import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountMenu, type AccountUser, dialog } from '../src';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  const dispose = render(view, container);
  disposers.push(dispose, () => container.remove());
  return { container, dispose };
};
const button = (container: HTMLElement, label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
afterEach(() => {
  disposers.splice(0).forEach(dispose => dispose());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AccountMenu', () => {
  it('subscribes only while open and cleans up on close and disposal', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { container, dispose } = mount(() => <AccountMenu user={{ username: 'Alex' }} />);
    const subscriptions = () => add.mock.calls.filter(([type]) => type === 'click' || type === 'keydown');
    expect(subscriptions()).toEqual([]);
    button(container, 'Account menu').click();
    expect(subscriptions().map(([type]) => type)).toEqual(['click', 'keydown']);
    expect(container.querySelector('article')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(container.querySelector('article')).toBeNull();
    for (const [type, handler] of subscriptions()) expect(remove).toHaveBeenCalledWith(type, handler);
    button(container, 'Account menu').click();
    document.body.click();
    expect(container.querySelector('article')).toBeNull();
    button(container, 'Account menu').click();
    dispose();
    for (const [type, handler] of subscriptions()) expect(remove).toHaveBeenCalledWith(type, handler);
  });

  it('does not submit its surrounding form', () => {
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const { container } = mount(() => (
      <form onSubmit={submit}>
        <AccountMenu user={{ username: 'Alex' }} />
      </form>
    ));
    button(container, 'Account menu').click();
    button(container, 'Close').click();
    expect(submit).not.toHaveBeenCalled();
    expect([...container.querySelectorAll('button')].every(element => element.type === 'button')).toBe(true);
  });

  it('reflects external user changes and closes when the user is removed', () => {
    const [user, setUser] = createSignal<AccountUser | null>({ username: 'Alex' });
    const { container } = mount(() => <AccountMenu user={user()} />);
    button(container, 'Account menu').click();
    setUser({ firstname: 'Sam', lastname: 'Lee', email: 'sam@example.test', avatarUrl: 'sam.png' });
    expect(container.querySelector('h6')?.textContent).toBe('Hello, Sam Lee');
    expect(container.querySelector('.account-menu-avatar img')?.getAttribute('src')).toBe('sam.png');
    setUser(null);
    expect(container.querySelector('article')).toBeNull();
    expect(button(container, 'Account menu').getAttribute('aria-expanded')).toBe('false');
    expect(button(container, 'Account menu').disabled).toBe(true);
  });

  it('uses the supplied profile URL and closes before logout invokes app behavior', () => {
    let container: HTMLElement;
    const logout = vi.fn(() => expect(container.querySelector('article')).toBeNull());
    ({ container } = mount(() => <AccountMenu user={{ username: 'Alex' }} profileHref="#account" onLogout={logout} />));
    button(container, 'Account menu').click();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('#account');
    container.querySelector<HTMLButtonElement>('nav button')!.click();
    expect(logout).toHaveBeenCalledOnce();
    button(container, 'Account menu').click();
    container.querySelector('a')!.click();
    expect(container.querySelector('article')).toBeNull();
    const absent = mount(() => <AccountMenu user={{ username: 'Alex' }} />).container;
    button(absent, 'Account menu').click();
    expect(absent.querySelector('a')).toBeNull();
    expect(absent.querySelector('input[type="file"]')).toBeNull();
    expect(absent.textContent).not.toContain('Copy token');
  });

  it('updates avatars through the caller and resets the file input after success and failure', async () => {
    const [user, setUser] = createSignal<AccountUser>({ username: 'Alex' });
    const report = vi.spyOn(dialog, 'error').mockResolvedValue();
    const upload = vi
      .fn()
      .mockImplementationOnce(async () => setUser({ username: 'Alex', avatarUrl: 'uploaded.png' }))
      .mockRejectedValueOnce(new Error('Upload failed'));
    const { container } = mount(() => <AccountMenu user={user()} onAvatarUpload={upload} />);
    button(container, 'Account menu').click();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    Object.defineProperty(input, 'value', { value: file.name, writable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(input.value).toBe(''));
    expect(upload).toHaveBeenCalledWith(file);
    expect([...container.querySelectorAll('img')].every(image => image.getAttribute('src') === 'uploaded.png')).toBe(
      true,
    );
    setUser({ username: 'Sam', avatarUrl: 'sam.png' });
    expect(container.querySelector('.account-menu-avatar img')?.getAttribute('src')).toBe('sam.png');
    input.value = file.name;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(report).toHaveBeenCalledWith('Failed to upload the avatar.'));
    expect(input.value).toBe('');
    expect(container.querySelector('.account-menu-avatar img')?.getAttribute('src')).toBe('sam.png');
    Object.defineProperty(input, 'files', { value: [] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(upload.mock.calls).toEqual([[file], [file]]);
  });

  it('copies only resolved tokens and reports supplier or clipboard failures', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: write } });
    const toast = vi.spyOn(dialog, 'toast').mockImplementation(() => undefined);
    const report = vi.spyOn(dialog, 'error').mockResolvedValue();
    const supplier = vi
      .fn()
      .mockResolvedValueOnce('supplied')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Token failed'))
      .mockResolvedValueOnce('rejected');
    const { container } = mount(() => (
      <AccountMenu user={{ username: 'Alex' }} token="fallback" onTokenCopy={supplier} />
    ));
    button(container, 'Account menu').click();
    const copy = container.querySelector<HTMLButtonElement>('nav button')!;
    copy.click();
    await vi.waitFor(() => expect(write).toHaveBeenCalledWith('supplied'));
    expect(toast).toHaveBeenCalledWith('Token copied');
    copy.click();
    await vi.waitFor(() => expect(write).toHaveBeenCalledWith('fallback'));
    copy.click();
    await vi.waitFor(() => expect(report).toHaveBeenCalledWith('Failed to copy the token.'));
    write.mockRejectedValueOnce(new Error('Clipboard denied'));
    copy.click();
    await vi.waitFor(() =>
      expect(report.mock.calls).toEqual([['Failed to copy the token.'], ['Failed to copy the token.']]),
    );
  });
});
