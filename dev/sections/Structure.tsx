import { DemoGroup, DemoSection } from '../site/Demo';
const image = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#6750a4"/><text x="120" y="95" text-anchor="middle" font-size="42" fill="white">Beer</text></svg>',
)}`;
export const Containers = () => (
  <DemoSection id="containers" title="Containers">
    <DemoGroup title="Rows and alignment" doc="NAVIGATION">
      <ContainerRowExample />
      <CenteredContainerExample />
    </DemoGroup>
  </DemoSection>
);
export const Grids = () => (
  <DemoSection id="grids" title="Grids">
    <DemoGroup title="Responsive columns" doc="GRID">
      <ResponsiveGridExample />
    </DemoGroup>
  </DemoSection>
);
export const Layouts = () => (
  <DemoSection id="layouts" title="Layouts">
    <DemoGroup title="Position within a surface" doc="LAYOUT">
      <PositionedLayoutExample />
      <ScrollableLayoutExample />
    </DemoGroup>
  </DemoSection>
);
export const Media = () => (
  <DemoSection id="media" title="Media">
    <DemoGroup title="Images and native video" doc="MEDIA">
      <ResponsiveImageExample src={image} />
      <AvatarImageExample src={image} />
      <NativeVideoExample poster={image} />
    </DemoGroup>
    <p>
      Use native img/video/svg for media. AuthenticatedImage adds loading and fallback behavior in the library examples
      above.
    </p>
  </DemoSection>
);
export const Typography = () => (
  <DemoSection id="typography" title="Typography">
    <DemoGroup title="Headings and text helpers" doc="TYPOGRAPHY">
      <TypographyExample />
    </DemoGroup>
  </DemoSection>
);
export const Waves = () => (
  <DemoSection id="waves" title="Waves">
    <DemoGroup title="Ripple interaction" doc="JAVASCRIPT">
      <WaveButtonExample />
      <WaveSurfaceExample />
    </DemoGroup>
  </DemoSection>
);
// @demo showcase
export const ContainerRowExample = () => (
  <div class="row wrap max border padding">
    <span class="chip">Minimum</span>
    <div class="max">Flexible content</div>
    <span>Trailing</span>
  </div>
);
// @demo showcase
export const CenteredContainerExample = () => (
  <div class="fill padding center-align middle-align max">Centered container</div>
);
// @demo showcase
export const ResponsiveGridExample = () => (
  <div class="grid max">
    <article class="s12 m6 l4 border">s12 m6 l4</article>
    <article class="s12 m6 l4 border">s12 m6 l4</article>
    <article class="s12 m12 l4 border">s12 m12 l4</article>
  </div>
);
// @demo showcase
export const PositionedLayoutExample = () => (
  <article class="relative medium-height max border">
    <span class="absolute left top padding">Top left</span>
    <span class="absolute right bottom padding">Bottom right</span>
  </article>
);
// @demo showcase
export const ScrollableLayoutExample = () => (
  <article class="scroll small-height max border">
    <header class="fixed fill">Sticky header</header>
    <p>Scroll this surface. Native positioning keeps layout flexible.</p>
    <div class="large-height">Content</div>
    <footer class="fixed fill">Sticky footer</footer>
  </article>
);
// @demo showcase
export const ResponsiveImageExample = (props: { src?: string }) => (
  <img src={props.src} alt="Beer illustration" class="round responsive small small-width" />
);
// @demo showcase
export const AvatarImageExample = (props: { src?: string }) => (
  <img src={props.src} alt="Circular Beer illustration" class="circle large" />
);
// @demo showcase
export const NativeVideoExample = (props: { poster?: string }) => (
  <video
    controls
    preload="none"
    poster={props.poster}
    class="round responsive small small-width"
    aria-label="Native video player"
  >
    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
  </video>
);
// @demo showcase
export const TypographyExample = () => (
  <div class="max">
    <h3>Headline</h3>
    <h6>Supporting heading</h6>
    <p class="large-text">Large body text</p>
    <p class="small-text">Small supporting text</p>
    <p class="bold">Bold emphasis</p>
    <a href="#typography" class="link underline">
      Linked text
    </a>
  </div>
);
// @demo showcase
export const WaveButtonExample = () => (
  <button type="button" class="wave primary">
    Click for a ripple
  </button>
);
// @demo showcase
export const WaveSurfaceExample = () => (
  <article class="wave border small-width" tabindex="0">
    <h6>Interactive surface</h6>
    <p>Wave is an interaction helper, so keep it in class.</p>
  </article>
);
