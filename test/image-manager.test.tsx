import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialog, ImageManager } from '../src';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};
const image = (label: string) =>
  'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg"><title>${label}</title></svg>`);
const sources = (container: HTMLElement) => [...container.querySelectorAll('img')].map(img => img.getAttribute('src'));
const input = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type="file"]')!;
const choose = (field: HTMLInputElement, files: File[]) => {
  Object.defineProperty(field, 'files', { configurable: true, value: files });
  field.dispatchEvent(new Event('change', { bubbles: true }));
};
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
};
const deleteButton = (container: HTMLElement) =>
  [...container.querySelectorAll('button')].find(button => button.textContent?.trim() === 'delete')!;

afterEach(() => {
  disposers.splice(0).forEach(dispose => dispose());
  vi.restoreAllMocks();
});

describe('ImageManager', () => {
  it('reads the external list and exposes actions only while their handlers exist', () => {
    const first = image('first');
    const second = image('second');
    const [images, setImages] = createSignal([first]);
    const [editable, setEditable] = createSignal(false);
    const upload = vi.fn(async () => {});
    const remove = vi.fn(async () => {});
    const container = mount(() => (
      <ImageManager
        imageUrls={images()}
        onUpload={editable() ? upload : undefined}
        onDelete={editable() ? remove : undefined}
      />
    ));
    expect(sources(container)).toEqual([first]);
    expect(container.querySelector('button')).toBeNull();
    expect(input(container)).toBeNull();
    setImages([second]);
    expect(sources(container)).toEqual([second]);
    setEditable(true);
    expect(deleteButton(container)).toBeDefined();
    const field = input(container);
    const picker = vi.spyOn(field, 'click').mockImplementation(() => {});
    container.querySelector<HTMLButtonElement>('[aria-label="Upload images"]')!.click();
    expect(picker).toHaveBeenCalledOnce();
    expect([...container.querySelectorAll('button')].every(button => button.type === 'button')).toBe(true);
    setEditable(false);
    expect(container.querySelector('button')).toBeNull();
    expect(input(container)).toBeNull();
  });

  it('awaits batch uploads sequentially, resets the input and leaves list changes to the caller', async () => {
    const initial = image('initial');
    const uploaded = [image('first upload'), image('second upload')];
    const files = uploaded.map((_, index) => new File(['image'], `upload-${index}.svg`, { type: 'image/svg+xml' }));
    const [images, setImages] = createSignal([initial]);
    const first = deferred();
    const second = deferred();
    const upload = vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const owner = 'record';
    const container = mount(() => <ImageManager imageUrls={images()} ownerId={owner} onUpload={upload} />);
    const field = input(container);
    const reset = vi.spyOn(field, 'value', 'set');
    choose(field, files);
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenNthCalledWith(1, files[0], owner); // First selected file starts before the next one.
    expect(field.disabled).toBe(true);
    expect(container.querySelector('.image-manager-loading progress')).not.toBeNull();
    first.resolve();
    await vi.waitFor(() => expect(upload).toHaveBeenCalledTimes(files.length));
    expect(upload).toHaveBeenLastCalledWith(files.at(-1), owner);
    expect(field.disabled).toBe(true);
    second.resolve();
    await vi.waitFor(() => expect(field.disabled).toBe(false));
    expect(reset).toHaveBeenLastCalledWith('');
    expect(sources(container)).toEqual([initial]);
    setImages(current => [...current, ...uploaded]);
    expect(sources(container)).toEqual([initial, ...uploaded]);
  });

  it('ignores empty selections and rejects a batch exceeding the current capacity', () => {
    const capacity = 1; // Single-image mode allows one image and disables multiple selection.
    const [images, setImages] = createSignal<string[]>([]);
    const upload = vi.fn(async () => {});
    const error = vi.fn();
    const container = mount(() => (
      <ImageManager imageUrls={images()} maxImages={capacity} onUpload={upload} onError={error} />
    ));
    const field = input(container);
    const reset = vi.spyOn(field, 'value', 'set');
    expect(field.multiple).toBe(false);
    choose(field, []);
    expect(upload).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    const overCapacity = Array.from({ length: capacity + 1 }, (_, index) => new File(['image'], `${index}.svg`));
    choose(field, overCapacity);
    expect(upload).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(`Maximum ${capacity} images allowed`);
    expect(reset).toHaveBeenLastCalledWith('');
    expect(field.disabled).toBe(false);
    setImages([image('full')]);
    expect(input(container)).toBeNull();
    setImages([]);
    expect(input(container)).not.toBeNull();
  });

  it('reports failed uploads, stops the batch and allows the same file to be selected again', async () => {
    const initial = image('initial');
    const upload = vi.fn().mockRejectedValue(new Error('Upload failed'));
    const error = vi.fn();
    const container = mount(() => <ImageManager imageUrls={[initial]} onUpload={upload} onError={error} />);
    const field = input(container);
    const reset = vi.spyOn(field, 'value', 'set');
    const files = ['first.svg', 'second.svg'].map(name => new File(['image'], name));
    choose(field, files);
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Failed to upload the image.'));
    expect(upload).toHaveBeenCalledOnce(); // Failure aborts the remaining selected files.
    expect(field.disabled).toBe(false);
    expect(reset).toHaveBeenLastCalledWith('');
    expect(sources(container)).toEqual([initial]);
    const attempts = upload.mock.calls.length;
    choose(field, [files[0]!]);
    await vi.waitFor(() => expect(error.mock.calls).toHaveLength(attempts + 1));
    expect(upload).toHaveBeenLastCalledWith(files[0], undefined);
  });

  it('uses the default delete error dialog and reflects only caller-owned list changes', async () => {
    const url = image('existing');
    const [images, setImages] = createSignal([url]);
    const error = vi.spyOn(dialog, 'error').mockResolvedValue(undefined);
    const pending = deferred();
    const remove = vi.fn().mockRejectedValueOnce(new Error('Delete failed')).mockReturnValueOnce(pending.promise);
    const owner = 'record';
    const capacity = 1; // The initial image fills the single-image slot.
    const container = mount(() => (
      <ImageManager
        imageUrls={images()}
        ownerId={owner}
        onUpload={async () => {}}
        onDelete={remove}
        maxImages={capacity}
      />
    ));
    expect(input(container)).toBeNull();
    deleteButton(container).click();
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Failed to delete the image.'));
    expect(remove).toHaveBeenCalledWith(url, owner);
    expect(sources(container)).toEqual([url]);
    deleteButton(container).click();
    pending.resolve();
    await pending.promise;
    expect(sources(container)).toEqual([url]);
    setImages([]);
    expect(sources(container)).toEqual([]);
    expect(deleteButton(container)).toBeUndefined();
    expect(input(container)).not.toBeNull();
  });
});
