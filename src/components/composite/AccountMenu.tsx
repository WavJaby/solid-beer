import { createEffect, createMemo, createSignal, onCleanup, Show, type Component } from 'solid-js';
import { dialog } from '../../dialog';
import './AccountMenu.css';

export interface AccountUser {
  email?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  avatarUrl?: string;
}

export interface AccountMenuProps {
  user: AccountUser | null | undefined;
  token?: string;
  onLogout?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
  onTokenCopy?: () => string | Promise<string | undefined> | undefined;
  profileHref?: string;
  class?: string;
}

const AccountMenu: Component<AccountMenuProps> = props => {
  const [open, setOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;

  const displayName = createMemo(() => {
    const user = props.user;
    if (!user) return '';
    return user.firstname || user.lastname
      ? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim()
      : user.username ?? '';
  });
  const avatarUrl = () => props.user?.avatarUrl;
  const visible = () => open() && !!props.user;
  const close = () => setOpen(false);
  const handleOutsideClick = (event: MouseEvent) => {
    if (menuRef && !event.composedPath().includes(menuRef)) close();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  const toggle = () => setOpen(value => !value);
  const upload = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !props.onAvatarUpload) return;
    try {
      await props.onAvatarUpload(file);
    } catch {
      void dialog.error('Failed to upload the avatar.');
    } finally {
      input.value = '';
    }
  };
  const copyToken = async () => {
    try {
      const token = (await props.onTokenCopy?.()) ?? props.token;
      if (token) {
        await navigator.clipboard.writeText(token);
        dialog.toast('Token copied');
      }
    } catch {
      void dialog.error('Failed to copy the token.');
    }
  };

  createEffect(() => {
    if (!props.user) close();
  });
  createEffect(() => {
    if (!visible()) return;
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <div class={`account-switcher ${props.class ?? ''}`} ref={menuRef}>
      <button
        type="button"
        class="circle transparent"
        onClick={toggle}
        aria-label="Account menu"
        aria-expanded={visible()}
        disabled={!props.user}
      >
        <Show when={avatarUrl()} fallback={<i>account_circle</i>}>
          <img class="circle responsive" src={avatarUrl()} alt="Profile" />
        </Show>
      </button>
      <Show when={visible()}>
        <article class="account-menu round small-padding">
          <div class="header-bar">
            <div class="center-align small-text">{props.user?.email}</div>
            <button type="button" class="circle transparent" onClick={close} aria-label="Close">
              <i>close</i>
            </button>
          </div>
          <div class="vertical middle-align small-padding">
            <div class="account-menu-avatar relative">
              <Show when={avatarUrl()} fallback={<i class="extra">account_circle</i>}>
                <img class="circle" src={avatarUrl()} alt="Profile" />
              </Show>
              <Show when={props.onAvatarUpload}>
                <button
                  type="button"
                  class="circle absolute account-menu-camera"
                  onClick={() => fileInputRef?.click()}
                  aria-label="Change photo"
                >
                  <i class="tiny">photo_camera</i>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={upload} hidden />
              </Show>
            </div>
            <h6 class="small-margin">Hello, {displayName()}</h6>
            <Show when={props.profileHref}>
              <a href={props.profileHref} class="button border round small" onClick={close}>
                Manage your account
              </a>
            </Show>
          </div>
          <nav class="group connected small-margin">
            <Show when={props.token || props.onTokenCopy}>
              <button type="button" class="border left-round max fill" onClick={copyToken}>
                <i>link</i>
                <span>Copy token</span>
              </button>
            </Show>
            <button
              type="button"
              class="border right-round max fill"
              onClick={() => {
                close();
                props.onLogout?.();
              }}
            >
              <i>logout</i>
              <span>Log out</span>
            </button>
          </nav>
        </article>
      </Show>
    </div>
  );
};

export default AccountMenu;
