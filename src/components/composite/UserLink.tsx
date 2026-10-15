import { createResource, Show, Suspense, type Component } from 'solid-js';
import { dialog } from '../../dialog';
import UserDetailDialog from './UserDetailDialog';
import type { UserDetail } from '../types';
import './UserLink.css';

export interface UserLinkProps {
  userId: string | null;
  loadUser: (userId: string) => Promise<UserDetail | null>;
  getAvatarUrl?: (user: UserDetail) => string;
  class?: string;
}

const UserLink: Component<UserLinkProps> = props => {
  const [user] = createResource(
    () => props.userId,
    id => (id ? props.loadUser(id) : Promise.resolve(null)),
  );
  const avatarUrl = () => {
    const detail = user();
    return detail ? props.getAvatarUrl?.(detail) ?? detail.avatarUrl : undefined;
  };
  const openDetails = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (props.userId)
      dialog.show(
        UserDetailDialog,
        { userId: props.userId, loadUser: props.loadUser, getAvatarUrl: props.getAvatarUrl },
        { closeOnClickOutside: true },
      );
  };

  return (
    <button
      type="button"
      class={`user-link chip fill round medium ${props.class ?? ''}`}
      onClick={openDetails}
      disabled={!props.userId}
    >
      <Suspense fallback={<progress class="circle small" aria-label="Loading user" />}>
        <Show when={avatarUrl()} fallback={<i>account_circle</i>}>
          {url => <img class="responsive" src={url()} alt="Avatar" />}
        </Show>
        <span>{user()?.nickname || user()?.username || props.userId}</span>
      </Suspense>
    </button>
  );
};

export default UserLink;
