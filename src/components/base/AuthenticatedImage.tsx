import { createMemo, createResource, onCleanup, Show, type Component, type JSX } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { ImageSource } from '../types';

export interface AuthenticatedImageProps extends Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: ImageSource;
  loadImage?: (source: ImageSource) => Promise<Blob>;
  fallbackIcon?: string;
}

const defaultLoadImage = async (source: ImageSource) => {
  if (source instanceof Blob) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);
  return response.blob();
};

const AuthenticatedImage: Component<AuthenticatedImageProps> = props => {
  const [image] = createResource(
    // Authenticated loads + object URLs belong to the client, including async SSR.
    () => (!isServer && props.src ? { source: props.src, load: props.loadImage ?? defaultLoadImage } : false),
    ({ source, load }): ImageSource | Promise<ImageSource> =>
      typeof source === 'string' && source.startsWith('data:') ? source : load(source),
  );
  const imageUrl = createMemo(() => {
    if (!props.src || image.loading || image.error) return;
    const value = image();
    if (!value || typeof value === 'string') return value;
    const url = URL.createObjectURL(value);
    onCleanup(() => URL.revokeObjectURL(url));
    return url;
  });

  const placeholder = () => (
    <div class={`surface-variant center-align middle-align ${props.class ?? ''}`}>
      <i class="extra large-opacity">{props.fallbackIcon ?? 'broken_image'}</i>
    </div>
  );

  return (
    <Show when={props.src && !image.error} fallback={placeholder()}>
      <Show
        when={imageUrl()}
        fallback={
          <div class={`surface-variant center-align middle-align ${props.class ?? ''}`}>
            <progress class="circle small" />
          </div>
        }
      >
        <img {...props} src={imageUrl()} loading={props.loading ?? 'lazy'} />
      </Show>
    </Show>
  );
};

export default AuthenticatedImage;
