import {
  AppBar,
  Button,
  Badge,
  BottomAppBar,
  Card,
  Chip,
  Checkbox,
  Radio,
  ToggleSwitch,
  Divider,
  Field,
  Icon,
  List,
  Navigation,
  Overlay,
  Page,
  Slider,
  Snackbar,
  Tabs,
  Tab,
  Tooltip,
} from 'solid-beer';

export const compiledPrimitives = (props: {
  checked: boolean;
  value: number;
  changed: (event: Event) => void;
  inputRef?: (element: HTMLInputElement) => void;
  label: string;
}) => (
  <>
    <Button shape="circle" size="small" border elevation="large" type="button">
      <Badge inline square>
        0
      </Badge>
    </Button>
    <AppBar responsive>
      <nav>Top</nav>
    </AppBar>
    <BottomAppBar responsive>
      <nav>Bottom</nav>
    </BottomAppBar>
    <Card border round class="large-padding" elevation="none">
      {props.label}
    </Card>
    <Chip type="button" border size="small">
      Chip
    </Chip>
    <Checkbox size="small" checked={props.checked} onChange={props.changed} ref={props.inputRef}>
      Checkbox
    </Checkbox>
    <Radio name="choice" checked={props.checked}>
      Radio
    </Radio>
    <ToggleSwitch checked={props.checked}>Switch</ToggleSwitch>
    <Divider vertical size="small" />
    <Field border floating>
      <input aria-label="Name" />
      <label>Name</label>
    </Field>
    <Icon size="large" filled>
      home
    </Icon>
    <List border class="medium-space">
      <li>Item</li>
    </List>
    <Navigation class="wrap" group>
      <a href="#home">Home</a>
    </Navigation>
    <Overlay active={false} blur="small" />
    <Page active direction="left">
      Page
    </Page>
    <Slider size="medium" value={props.value} onInput={props.changed}>
      <div class="tooltip" />
    </Slider>
    <Snackbar active={false} position="top">
      Saved
    </Snackbar>
    <Tabs class="center-align" min>
      <Tab active href="#tab">
        Tab
      </Tab>
    </Tabs>
    <Tooltip position="bottom" rich>
      Help
    </Tooltip>
  </>
);
