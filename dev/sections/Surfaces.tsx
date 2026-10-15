import { createSignal } from 'solid-js';
import {
  AppBar,
  BottomAppBar,
  Card,
  Chip,
  Divider,
  Icon,
  List,
  Navigation,
  Overlay,
  Page,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  type ChipProps,
} from 'src';
import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';
// @demo showcase
export const CardExample = () => (
  <Card border round class="large-padding" elevation="none">
    <h6>A reusable surface</h6>
    <p>Native children stay flexible.</p>
  </Card>
);
// @demo showcase
export const ColoredCardExample = (props: { paddingClass?: 'small-padding' | 'medium-padding' | 'large-padding' }) => (
  <Card class="primary-container" classes={[props.paddingClass ?? 'medium-padding']} elevation="small">
    <h6>Color and spacing</h6>
    <p>Change the padding above.</p>
    <button type="button">Action</button>
  </Card>
);
// @demo showcase
export const TopAppBarExample = () => (
  <AppBar class="max primary-container">
    <nav>
      <Icon>menu</Icon>
      <h6 class="max">Top app bar</h6>
      <Icon>search</Icon>
    </nav>
  </AppBar>
);
// @demo showcase
export const BottomAppBarExample = () => (
  <BottomAppBar class="max secondary-container">
    <nav>
      <Icon>check_box</Icon>
      <Icon>brush</Icon>
      <div class="max" />
      <button type="button" class="circle">
        +
      </button>
    </nav>
  </BottomAppBar>
);
// @demo showcase
export const SuggestionChipExample = (props: { size?: ChipProps['size'] }) => (
  <Chip type="button" size={props.size ?? 'medium'}>
    Suggestion
  </Chip>
);
// @demo showcase
export const IconChipExample = (props: { size?: ChipProps['size'] }) => (
  <Chip type="button" border size={props.size ?? 'medium'}>
    <Icon>favorite</Icon>
    <span>With icon</span>
  </Chip>
);
// @demo showcase
export const DisabledChipExample = (props: { size?: ChipProps['size'] }) => (
  <Chip type="button" fill disabled>
    Disabled
  </Chip>
);
// @demo showcase
export const HorizontalDividerExample = () => (
  <div class="max">
    <p>Before</p>
    <Divider size="small" />
    <p>After</p>
  </div>
);
// @demo showcase
export const VerticalDividerExample = () => (
  <nav>
    <span>Left</span>
    <Divider vertical />
    <span>Right</span>
  </nav>
);
// @demo showcase
export const SmallIconExample = () => <Icon size="small">home</Icon>;
// @demo showcase
export const FilledIconExample = () => (
  <Icon size="large" filled>
    favorite
  </Icon>
);
// @demo showcase
export const ExtraIconExample = () => <Icon size="extra">sports_bar</Icon>;
// @demo showcase
export const IconListExample = () => (
  <List border class="max medium-space">
    <li>
      <Icon>inbox</Icon>
      <div class="max">
        <h6 class="small">Inbox</h6>
        <div>Supporting text</div>
      </div>
    </li>
    <li>
      <Icon>archive</Icon>
      <div class="max">
        <h6 class="small">Archive</h6>
        <div>Supporting text</div>
      </div>
    </li>
    <li>
      <Icon>delete</Icon>
      <div class="max">
        <h6 class="small">Trash</h6>
        <div>Supporting text</div>
      </div>
    </li>
  </List>
);
// @demo showcase
export const OrderedListExample = () => (
  <ol class="list border max">
    <li>First</li>
    <li>Second</li>
  </ol>
);
// @demo showcase
export const ConnectedNavigationExample = () => (
  <Navigation group connected class="max">
    <button type="button" class="left-round">
      Home
    </button>
    <button type="button" class="right-round">
      Search
    </button>
  </Navigation>
);
// @demo showcase
export const ToolbarNavigationExample = () => (
  <Navigation class="wrap" toolbar>
    <Icon>format_bold</Icon>
    <Icon>format_italic</Icon>
    <Icon>format_underlined</Icon>
  </Navigation>
);
// @demo interactive
export const OverlayExample = () => {
  const [open, setOpen] = createSignal(false);
  return (
    <div class="relative max medium-height border round" data-demo-showcase>
      <button type="button" onClick={() => setOpen(true)}>
        Show overlay
      </button>
      <Overlay
        active={open()}
        class="center-align middle-align"
        style="position: absolute"
        onClick={() => setOpen(false)}
      >
        <button type="button">Dismiss overlay</button>
      </Overlay>
    </div>
  );
};
// @demo interactive
export const PagesExample = () => {
  const [active, setActive] = createSignal('Overview');
  return (
    <div class="max" data-demo-showcase>
      <Tabs>
        <Tab
          href="#tabs"
          active={active() === 'Overview'}
          onClick={event => {
            event.preventDefault();
            setActive('Overview');
          }}
        >
          Overview
        </Tab>
        <Tab
          href="#tabs"
          active={active() === 'Details'}
          onClick={event => {
            event.preventDefault();
            setActive('Details');
          }}
        >
          Details
        </Tab>
      </Tabs>
      <Page active={active() === 'Overview'} class="padding">
        <h6>Overview</h6>
        <p>Overview content</p>
      </Page>
      <Page active={active() === 'Details'} class="padding">
        <h6>Details</h6>
        <p>Details content</p>
      </Page>
    </div>
  );
};
// @demo interactive
export const SnackbarExample = () => {
  const [open, setOpen] = createSignal(false);
  return (
    <div data-demo-showcase>
      <button type="button" onClick={() => setOpen(true)}>
        Show snackbar
      </button>
      <Snackbar active={open()} role="status">
        <span class="max">Changes saved</span>
        <button type="button" class="transparent" onClick={() => setOpen(false)}>
          Dismiss
        </button>
      </Snackbar>
    </div>
  );
};
// @demo showcase
export const PlainTooltipExample = () => (
  <button type="button">
    <span>Hover for context</span>
    <Tooltip position="bottom" role="tooltip">
      Helpful context
    </Tooltip>
  </button>
);
// @demo showcase
export const RichTooltipExample = () => (
  <button type="button" class="border">
    <span>Rich tooltip</span>
    <Tooltip rich role="tooltip">
      <strong>More information</strong>
      <span class="block">Keep explanations short and useful.</span>
    </Tooltip>
  </button>
);
export const Cards = () => {
  const padding = createOption(['small-padding', 'medium-padding', 'large-padding'], 'medium-padding');
  return (
    <DemoSection id="cards" title="Cards">
      <DemoGroup
        title="Surfaces"
        doc="CARD"
        options={
          <Options>
            <OptionGroup name="card-padding" option={padding} />
          </Options>
        }
      >
        <CardExample />
        <ColoredCardExample paddingClass={padding.value()} />
      </DemoGroup>
    </DemoSection>
  );
};
export const AppBars = () => (
  <DemoSection id="app-bars" title="App bars">
    <DemoGroup title="Top and bottom bars" doc="LAYOUT">
      <TopAppBarExample />
      <BottomAppBarExample />
    </DemoGroup>
  </DemoSection>
);
export const Chips = () => {
  const size = createOption(['small', 'medium', 'large'], 'medium');
  return (
    <DemoSection id="chips" title="Chips">
      <DemoGroup
        title="Compact actions"
        doc="CHIP"
        options={
          <Options>
            <OptionGroup name="chip-size" option={size} />
          </Options>
        }
      >
        <SuggestionChipExample size={size.value()} />
        <IconChipExample size={size.value()} />
        <DisabledChipExample size={size.value()} />
      </DemoGroup>
    </DemoSection>
  );
};
export const Dividers = () => (
  <DemoSection id="dividers" title="Dividers">
    <DemoGroup title="Horizontal and vertical" doc="DIVIDER">
      <HorizontalDividerExample />
      <VerticalDividerExample />
    </DemoGroup>
  </DemoSection>
);
export const Icons = () => (
  <DemoSection id="icons" title="Icons">
    <DemoGroup title="Material symbols" doc="ICON">
      <SmallIconExample />
      <FilledIconExample />
      <ExtraIconExample />
    </DemoGroup>
  </DemoSection>
);
export const Lists = () => (
  <DemoSection id="lists" title="Lists">
    <DemoGroup title="Icons, text and ordered lists" doc="LIST">
      <IconListExample />
      <OrderedListExample />
    </DemoGroup>
  </DemoSection>
);
export const Navigations = () => (
  <DemoSection id="navigations" title="Navigations">
    <DemoGroup title="Groups and toolbars" doc="NAVIGATION">
      <ConnectedNavigationExample />
      <ToolbarNavigationExample />
    </DemoGroup>
    <p>Rail and bottom-bar navigation are shown by this site's responsive navigation.</p>
  </DemoSection>
);
export const Overlays = () => (
  <DemoSection id="overlays" title="Overlays">
    <DemoGroup title="Controlled visibility" doc="OVERLAY">
      <OverlayExample />
    </DemoGroup>
  </DemoSection>
);
export const Pages = () => (
  <DemoSection id="pages" title="Pages">
    <DemoGroup title="Switching content" doc="PAGE">
      <PagesExample />
    </DemoGroup>
  </DemoSection>
);
export const TabExamples = () => (
  <DemoSection id="tabs" title="Tabs">
    <DemoGroup title="Tabs with pages" doc="TABS">
      <PagesExample />
    </DemoGroup>
  </DemoSection>
);
export const Snackbars = () => (
  <DemoSection id="snackbars" title="Snackbars">
    <DemoGroup title="Controlled message" doc="SNACKBAR">
      <SnackbarExample />
    </DemoGroup>
  </DemoSection>
);
export const Tooltips = () => (
  <DemoSection id="tooltips" title="Tooltips">
    <DemoGroup title="Context on hover" doc="TOOLTIP">
      <PlainTooltipExample />
      <RichTooltipExample />
    </DemoGroup>
  </DemoSection>
);
