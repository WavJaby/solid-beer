import { describe, expect, it, vi } from 'vitest';
import { isServer, renderToString, renderToStringAsync } from 'solid-js/web';
import { AccountMenu, AuthenticatedImage, beerCssComponents, CopyButton, dialog, Progress } from '../src';
import { compiledProgress } from './fixtures/compiled-progress';
import { compiledBadge, compiledButton } from './fixtures/compiled-badge';
import { compiledPrimitives } from './fixtures/compiled-primitives';
import { DynamicAppearance } from './fixtures/compiled-dynamic';

describe('Dynamic compiler SSR', () => {
  it('resolves typed appearance and preserves absent native attributes', () => {
    const markup = renderToString(() => (
      <DynamicAppearance
        border={false}
        elevation="large"
        active
        shape="linear"
        size="medium"
        wavy={false}
        value={undefined}
      />
    ));
    expect(markup).toContain('class="margin large-elevate"');
    expect(markup).toContain('class="overlay active"');
    expect(markup).toContain('class="margin medium"');
    expect(markup).not.toMatch(/\b(?:padding|shape|size|wavy|value)=/);
    const completed = renderToString(() => compiledProgress({ value: 1, max: 1 })); // Completed range: value equals max.
    expect(completed).toContain('value="1"');
    expect(completed).toContain('max="1"');
    expect(completed).not.toContain('attr:');
  });
});

describe('environment', () => {
  it('runs on server', () => {
    expect(typeof window).toBe('undefined');
    expect(isServer).toBe(true);
  });
  it('ignores toast calls without loading the browser runtime', () => {
    expect(typeof globalThis.ui).toBe('undefined');
    expect(() => dialog.toast('Server notification')).not.toThrow();
  });
  it('renders copy controls without accessing clipboard or loading the runtime', () => {
    const markup = renderToString(() => <CopyButton text="Copy on the client" />);
    expect(markup).toContain('aria-label="Copy text"');
    expect(markup).toContain('type="button"');
    expect(markup).toContain('Copy on the client');
    expect(typeof globalThis.ui).toBe('undefined');
  });
});

describe('AuthenticatedImage SSR', () => {
  it('keeps authenticated requests on the client during synchronous and asynchronous rendering', async () => {
    const load = vi.fn(async () => new Blob(['private']));
    const view = () => <AuthenticatedImage src="/private" loadImage={load} />;
    expect(renderToString(view)).toContain('<progress');
    expect(await renderToStringAsync(view)).toContain('<progress');
    expect(load).not.toHaveBeenCalled();
    expect(renderToString(() => <AuthenticatedImage src="" />)).toContain('broken_image');
  });
});

describe('BeerCSS component inventory', () => {
  it('can be consumed during SSR without loading the browser runtime', () => {
    const string = renderToString(() => <span>{beerCssComponents.length}</span>);
    expect(string).toBe('<span>32</span>');
  });
});

describe('AccountMenu SSR', () => {
  it('renders compiled primitive hosts and control structure without browser APIs', () => {
    const markup = renderToString(() =>
      compiledPrimitives({ checked: true, value: 0, label: 'SSR content', changed: () => undefined }),
    );
    expect(markup).toContain('SSR content');
    expect(markup).toContain('checkbox small');
    expect(markup).toContain('type="range"');
    expect(markup).not.toContain('elevation=');
  });

  it('renders a closed account trigger without accessing document', () => {
    const markup = renderToString(() => <AccountMenu user={{ username: 'Alex' }} />);
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('type="button"');
    expect(markup).not.toContain('<article');
  });
});

describe('Progress SSR', () => {
  it('renders the compiler fixture with native classes and absent value/max', () => {
    const markup = renderToString(() => compiledProgress({}));
    expect(markup).toContain('class="circle wavy small"');
    expect(markup).toContain('aria-label="Compiled progress"');
    expect(markup).not.toMatch(/\b(?:shape|size|wavy|value|max)=/);
  });
  it('renders native markup without browser runtime or synthetic option attributes', () => {
    const markup = renderToString(() => <Progress shape="circle" wavy size="small" aria-label="Loading" />);
    expect(markup).toContain('<progress');
    expect(markup).toMatch(/class="circle wavy small\s*"/);
    expect(markup).toContain('aria-label="Loading"');
    expect(markup).not.toMatch(/\b(?:shape|size|wavy|value)=/);
  });
});

describe('Compiled composed components SSR', () => {
  it('renders zero and empty badges with the expected label structure', () => {
    const button = renderToString(() => compiledButton({}));
    expect(button).toContain('<button');
    expect(button).toContain('<i>home</i>');
    expect(button).toContain('<span>Save</span>');
    expect(button).toContain('<span class="badge none">0</span>');
    const anchor = renderToString(compiledBadge);
    expect(anchor).toContain('<span class="badge min"></span>');
    expect(anchor).not.toMatch(/\bicon=/);
  });
});
