import { createSignal, For, Show, type Component } from 'solid-js';
import AuthenticatedImage from '../base/AuthenticatedImage';
import { dialog } from '../../dialog';
import type { ImageSource } from '../types';
import './ImageManager.css';

export interface ImageManagerProps {
  ownerId?: string;
  imageUrls: string[];
  onUpload?: (file: File, ownerId?: string) => Promise<void>;
  onDelete?: (imageUrl: string, ownerId?: string) => Promise<void>;
  loadImage?: (source: ImageSource) => Promise<Blob>;
  maxImages?: number;
  label?: string;
  onError?: (message: string) => void;
}

const ImageManager: Component<ImageManagerProps> = props => {
  const [isUploading, setIsUploading] = createSignal(false);
  let fileInput: HTMLInputElement | undefined;

  const reportError = (message: string) => {
    if (props.onError) props.onError(message);
    else void dialog.error(message);
  };
  const selectFiles = async (event: Event, upload: NonNullable<ImageManagerProps['onUpload']>) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    if (props.maxImages && props.imageUrls.length + files.length > props.maxImages) {
      reportError(`Maximum ${props.maxImages} images allowed`);
      input.value = '';
      return;
    }
    setIsUploading(true);
    try {
      for (const file of files) {
        await upload(file, props.ownerId);
      }
    } catch {
      reportError('Failed to upload the image.');
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  };
  const removeImage = async (url: string, remove: NonNullable<ImageManagerProps['onDelete']>) => {
    try {
      await remove(url, props.ownerId);
    } catch {
      reportError('Failed to delete the image.');
    }
  };

  return (
    <div class="tw:space-y-2">
      <Show when={props.label}>
        <h6 class="top-margin">{props.label}</h6>
      </Show>
      <div class="row tw:overflow-x-auto">
        <For each={props.imageUrls}>
          {(url, index) => (
            <div class="relative small-round">
              <AuthenticatedImage
                src={url}
                loadImage={props.loadImage}
                alt={`Image ${index() + 1}`}
                class="small-height"
              />
              <Show when={props.onDelete}>
                {remove => (
                  <div class="absolute top right margin row">
                    <button type="button" class="circle red" onClick={() => void removeImage(url, remove())}>
                      <i>delete</i>
                    </button>
                  </div>
                )}
              </Show>
            </div>
          )}
        </For>
        <Show when={!props.maxImages || props.imageUrls.length < props.maxImages ? props.onUpload : undefined}>
          {upload => (
            <div class="image-manager-upload small-round border small-width small-height">
              <Show
                when={!isUploading()}
                fallback={
                  <div class="image-manager-loading">
                    <progress class="circle" />
                  </div>
                }
              >
                <button
                  type="button"
                  aria-label="Upload images"
                  class="no-round no-padding transparent"
                  onClick={() => fileInput?.click()}
                  disabled={isUploading()}
                >
                  <i>upload</i>
                </button>
              </Show>
              <input
                ref={fileInput}
                type="file"
                class="tw:cursor-pointer"
                onChange={event => void selectFiles(event, upload())}
                multiple={!props.maxImages || props.maxImages > 1}
                accept="image/*"
                disabled={isUploading()}
                hidden
              />
            </div>
          )}
        </Show>
      </div>
    </div>
  );
};

export default ImageManager;
