import { createSignal, Show } from 'solid-js';
import {
  AccountMenu,
  type AccountUser,
  AuthenticatedImage,
  CopyButton,
  ImageManager,
  SearchSelect,
  UserLink,
} from 'src';
import { DemoGroup, DemoSection } from '../site/Demo';
const demoImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="#6750a4"/><text x="80" y="72" text-anchor="middle" font-size="40" fill="white">Beer</text></svg>',
)}`;
const users = [
  {
    id: 'alex',
    username: 'alex',
    nickname: 'Alex',
    email: 'alex@example.test',
    role: 'Member',
  },
  {
    id: 'sam',
    username: 'sam',
    nickname: 'Sam',
    email: 'sam@example.test',
    role: 'Editor',
  },
];
const loadUser = async (id: string) => users.find(user => user.id === id) ?? null;
const searchUsers = async (query: string) =>
  users
    .filter(user => `${user.nickname} ${user.username}`.toLowerCase().includes(query.toLowerCase()))
    .map(user => ({
      label: user.nickname,
      value: user,
    }));
const fileDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
// @demo interactive
export const SearchExample = () => {
  const [selected, setSelected] = createSignal<(typeof users)[number]>();
  return (
    <>
      <SearchSelect
        search={searchUsers}
        renderOption={option => (
          <div>
            <strong>{option.label}</strong>
            <div class="small-text">{option.value.username}</div>
          </div>
        )}
        setSelected={setSelected}
        placeholder="Search Alex or Sam"
      />
      <Show when={selected()}>{user => <UserLink userId={user().id} loadUser={loadUser} />}</Show>
      <p>Selected: {selected()?.nickname ?? 'None'}</p>
    </>
  );
};
const products = [
  {
    sku: 'keyboard',
    title: 'Keyboard',
  },
  {
    sku: 'mouse',
    title: 'Mouse',
  },
];
const searchProducts = async (query: string) =>
  products
    .filter(product => product.title.toLowerCase().includes(query.toLowerCase()))
    .map(product => ({
      label: product.title,
      value: product,
    }));
// @demo interactive
export const ProductSearchExample = () => {
  const [selected, setSelected] = createSignal<(typeof products)[number]>();
  return (
    <>
      <SearchSelect search={searchProducts} placeholder="Search products" setSelected={setSelected} />
      <Show when={selected()}>{product => <p>Selected SKU: {product().sku}</p>}</Show>
    </>
  );
};
// @demo interactive
export const AccountExample = () => {
  const [user, setUser] = createSignal<AccountUser>({
    username: 'alex',
    email: 'alex@example.test',
  });
  const [status, setStatus] = createSignal('Open the account menu to try its actions.');
  return (
    <div class="row max">
      <span class="max">{status()}</span>
      <AccountMenu
        user={user()}
        profileHref="#custom-components"
        onAvatarUpload={async file => {
          const avatarUrl = await fileDataUrl(file);
          setUser(current => ({
            ...current,
            avatarUrl,
          }));
          setStatus('Avatar updated in page memory.');
        }}
        token="demo-token"
        onLogout={() => setStatus('Logout callback received.')}
      />
    </div>
  );
};
// @demo interactive
export const ImagesExample = () => {
  const [images, setImages] = createSignal([demoImage]);
  return (
    <div>
      <p>Choose images from your device. Changes stay in this page.</p>
      <ImageManager
        imageUrls={images()}
        onUpload={async file => {
          const url = await fileDataUrl(file);
          setImages(current => [...current, url]);
        }}
        onDelete={async url => {
          setImages(current => current.filter(image => image !== url));
        }}
        label="Image manager"
      />
    </div>
  );
};
// @demo interactive
export const CopyTextExample = () => <CopyButton text="bun add solid-beer" />;
// @demo interactive
export const UserLinkExample = () => <UserLink userId="alex" loadUser={loadUser} />;
// @demo interactive
export const AuthenticatedImageExample = () => (
  <AuthenticatedImage src={demoImage} alt="Demo image" class="small-height" />
);
// @demo interactive
export const MissingImageExample = () => (
  <AuthenticatedImage src="" alt="Missing image" fallbackIcon="broken_image" class="small-height small-width" />
);
const CustomComponents = () => {
  return (
    <DemoSection id="custom-components" title="Everyday components">
      <DemoGroup title="Copy text">
        <CopyTextExample />
      </DemoGroup>
      <DemoGroup title="Search and selection" class="row wrap large-space vertical">
        <SearchExample />
        <ProductSearchExample />
      </DemoGroup>
      <DemoGroup title="Account actions" class="row wrap large-space vertical">
        <AccountExample />
        <UserLinkExample />
      </DemoGroup>
      <DemoGroup title="Images" class="row wrap large-space vertical">
        <AuthenticatedImageExample />
        <MissingImageExample />
        <ImagesExample />
      </DemoGroup>
    </DemoSection>
  );
};
export default CustomComponents;
