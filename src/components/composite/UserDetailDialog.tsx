import { createResource, Show, type Component } from 'solid-js';
import type { UserDetail } from '../types';

export interface UserDetailDialogProps {
  userId: string | null;
  loadUser: (userId: string) => Promise<UserDetail | null>;
  getAvatarUrl?: (user: UserDetail) => string;
  onClose: () => void;
}

const formatDateTime = (timestamp?: number) => (timestamp ? new Date(timestamp).toLocaleString('en-US') : 'N/A');

const UserDetailDialog: Component<UserDetailDialogProps> = props => {
  const [user] = createResource(
    () => props.userId,
    id => (id ? props.loadUser(id) : Promise.resolve(null)),
  );
  const avatarUrl = (value: UserDetail) => props.getAvatarUrl?.(value) ?? value.avatarUrl;

  return (
    <>
      <Show when={user.loading}>
        <div class="center-align padding">
          <progress class="circle" />
        </div>
      </Show>
      <Show when={user.error}>
        <article class="border center-align padding">
          <i class="extra error-text">error</i>
          <p>Failed to load user details.</p>
        </article>
      </Show>
      <Show when={!user.loading && user()}>
        {value => (
          <>
            <header class="vertical middle-align">
              <Show when={avatarUrl(value())}>
                <img class="circle extra" src={avatarUrl(value())} alt={`${value().username ?? value().id}'s avatar`} />
              </Show>
              <h5 class="small-margin">{value().nickname ?? value().username ?? value().id}</h5>
              <Show when={value().nickname && value().nickname !== value().username}>
                <p class="large-opacity no-margin">@{value().username}</p>
              </Show>
            </header>
            <div class="grid">
              <div class="s12 m6">
                <p class="bold large-opacity no-margin">User ID</p>
                <p class="small-text no-margin">{value().id}</p>
              </div>
              <div class="s12 m6">
                <p class="bold large-opacity no-margin">Role</p>
                <p class="no-margin">
                  <span class="chip small">{value().role ?? 'N/A'}</span>
                </p>
              </div>
              <div class="s12 m6">
                <p class="bold large-opacity no-margin">Email</p>
                <p class="no-margin">{value().email ?? 'N/A'}</p>
              </div>
              <div class="s12 m6">
                <p class="bold large-opacity no-margin">Registered</p>
                <p class="no-margin">{formatDateTime(value().registerTime)}</p>
              </div>
              <div class="s12 m6">
                <p class="bold large-opacity no-margin">Last login</p>
                <p class="no-margin">{formatDateTime(value().lastLoginTime)}</p>
              </div>
            </div>
            <nav class="right-align">
              <button class="border" onClick={props.onClose}>
                Close
              </button>
            </nav>
          </>
        )}
      </Show>
    </>
  );
};

export default UserDetailDialog;
