# API reference

[Usage examples](README.md) / [Installation](INSTALL.md) / [Live demo](https://git.wavjaby.com/solid-beer/)

## Styles and lazy components

The shared stylesheet contains complete BeerCSS styles, theme variables and local font/image assets. Component CSS follows imports and supports tree shaking/lazy loading. Declared CSS layer order is independent of import order.

Put a lazy component in a separate application module, for example `lazy(() => import('./ImagePanel'))`. Statically importing `Button` and dynamically importing the same library barrel does not guarantee a separate chunk; Vite 8 may coalesce it. A separate lazy module kept component CSS out of the initial stylesheet in the tested Vite versions.

## Components

Application callbacks own API requests, authentication, uploads and navigation; the library has no application service or router dependency.

| Need | Exports |
| --- | --- |
| Typed BeerCSS primitives | Button, Badge, Card, Field, Icon, Checkbox, Radio, ToggleSwitch, Slider, Progress, AppBar, BottomAppBar, Chip, Divider, List, Navigation, Overlay, Page, Snackbar, Tabs, Tab, Tooltip |
| UI building blocks | AuthenticatedImage, Collapsible, CopyButton, Dialog, MenuSelect, Nav, Table |
| Application workflows | AccountMenu, ConfirmDialog, DialogStack, ImageManager, SearchSelect, UserDetailDialog, UserLink |

`MenuSelect` accepts options + `onSelect`; `label` names its trigger. `name` includes the value in native form submission; disabled values are omitted. `required` enables native validation when `value === undefined`, including feedback below the trigger. Use normal submission or `requestSubmit()`; `submit()` and `noValidate` bypass validation.

## Async search and selection

`SearchSelect<T>` accepts `SearchSelectOption<T>` results (`{ label: string, value: T }`) and a `Setter<T | undefined>` from the caller's signal. Selection writes `value`; clearing writes `undefined`. `initialQuery` sets the input at mount; external selection changes do not update the input because the component receives no getter. Pending responses from older searches or dismissed menus are ignored; `onError` receives search failures and `errorText` controls the message.

```tsx
import { SearchSelect } from 'solid-beer'
import { createSignal, Show } from 'solid-js'

const products = [{ sku: 'keyboard', title: 'Keyboard' }]

export default function ProductSearch() {
  const [selected, setSelected] = createSignal<(typeof products)[number]>()
  return (
    <>
      <SearchSelect
        search={async query => products.filter(item => item.title.toLowerCase().includes(query.toLowerCase())).map(item => ({ label: item.title, value: item }))}
        setSelected={setSelected}
      />
      <Show when={selected()}>{item => <p>Selected SKU: {item().sku}</p>}</Show>
    </>
  )
}
```

`label` supplies menu and input text; `value` can be an ID, object, or another payload. `renderOption` receives the whole option and customizes results. The clear icon resets the query and external selection; the component owns no selected state or preview layout. User search is an application example: render `UserLink` beside the search component using the caller's signal.

## Account menu

`AccountMenu` reads its name, email and avatar from `user`; it keeps no uploaded-avatar copy. `onAvatarUpload(file): Promise<void>` handles the upload and updates the caller's user signal. Reject to show the upload error; the file input resets on success or failure so the same file can be selected again. Update `user.avatarUrl` in the caller after upload.

Set `profileHref` to show the account-management link; omitted URLs hide it. `onLogout` owns authentication and navigation. `token` or `onTokenCopy` supplies clipboard content; copy failures show an error. Document click/Escape handlers exist only while the menu is visible and are removed on close or disposal. All buttons use `type="button"` for embedding in forms.

## Image manager

`ImageManager` reads `imageUrls` directly from the caller; it keeps no list copy. `onUpload(file, ownerId): Promise<void>` and `onDelete(url, ownerId): Promise<void>` own persistence and update the caller's signal. Uploads run sequentially; `maxImages` checks the selected batch against the current list. Omitted handlers hide the corresponding actions. Rejections use `onError(message)` or the default error dialog; upload inputs reset after completion or failure so the same file can be selected again.

Update the caller's image list after each upload/delete, including local-only lists.

## Authenticated images

`AuthenticatedImage` uses `src` + optional `loadImage(source): Promise<Blob>` as its resource source. Changing either reloads the image and displays progress; stale responses cannot replace the current image. Failed or empty sources show `fallbackIcon` (`broken_image` by default). Data URLs bypass loading; other sources use `fetch` unless a loader is supplied. Object URLs are revoked on replacement or disposal. Requests run only on the client, including when the parent uses async SSR.

## Data tables

`Table` renders plain data rows without selection props. Supply both `selectedIndices: Accessor<Set<number>>` and `onSelectionChange` to enable row/header checkboxes and selection counts; supplying only one leaves selection disabled. `actions` and `selectionFallback` can show a toolbar independently. Loading and empty states span the visible columns, including the selection column only when enabled.

## Programmatic dialogs

After [app setup](INSTALL.md#app-setup), call the dialog API from event handlers:

`Dialog` uses native `showModal()` for modal focus and background inertness. Its component CSS locks page scrolling while any library dialog is open, including nested dialogs; hiding or disposing the last dialog releases the lock. `show` remains caller-owned: update it in `onClose` to accept Escape, close-button and optional backdrop dismissal. Backdrop dismissal requires a press and release outside the dialog. `aria-label`, `aria-labelledby` and `aria-describedby` name/describe the dialog; `closeLabel` names its close button. Programmatic dialogs use string titles as their accessible name. `dialog.confirm()` resolves `true` only on confirmation and `false` on other dismissals; `dialog.alert()` resolves on every dismissal.

```tsx
import { ConfirmDialog, DialogStack, dialog } from 'solid-beer'

const App = () => (
  <>
    <button onClick={() => dialog.show(ConfirmDialog, { message: 'Continue?' })}>Open</button>
    <DialogStack />
  </>
)
```

Keep controlled dialogs mounted until `onAfterClose` so exit animations can finish. `DialogStack` handles removal automatically. Reduced-motion preferences disable transitions; browsers without discrete top-layer transitions may close immediately.

`dialog.toast(message)` reuses one snackbar and delegates activation, click dismissal and its 3-second timer to BeerCSS `ui`. Complete [runtime setup](INSTALL.md#app-setup); missing runtime throws a setup error, while SSR calls do nothing. Repeated calls replace the message and restart the timer. Official behavior blurs the focused element and closes every other active snackbar; using it alongside a signal-controlled `Snackbar` requires the caller to keep that state consistent.

`CopyButton` uses the same toast after clipboard success or failure. Its optional `onClick` reports the click immediately, independently of clipboard completion. The button stops click propagation and uses `type="button"` so it does not submit a surrounding form.

## Progress

```tsx
<Progress shape="circle" wavy size="small" value={completed()} max={total()} />
<Progress shape="circle" aria-label="Loading" />
```

`shape` accepts `linear` / `circle`; `size` accepts `small` / `medium` / `large` / `max`. Explicit options override conflicting BeerCSS helpers in `class` / `classList`; omitted options preserve class-only usage. Native attributes, events and refs pass through; progress indicators have no children. Value and max use attribute bindings so setting either to `undefined` removes it.

## BeerCSS primitives

`Button`, `Badge`, `AppBar`, `BottomAppBar`, `Card`, `Chip`, `Checkbox`, `Radio`, `ToggleSwitch`, `Divider`, `Field`, `Icon`, `List`, `Navigation`, `Overlay`, `Page`, `Slider`, `Snackbar`, `Tabs`, `Tab`, and `Tooltip` expose typed appearance options. Grid, container, positioning, typography, media, and wave helpers stay native JSX. Native dialogs, details, and tables remain flexible; the library's separate Dialog/Collapsible/Table APIs add application workflows.

`Field` wraps appearance around native input/select/textarea children; labels, IDs, events, and input attributes remain explicit. Checkbox/Radio/ToggleSwitch and Slider forward native attributes, events, and refs to their input; `class`, `classList`, and appearance props style the wrapper. Choice children render inside the label's span; Slider children follow its track, for example a value tooltip. Overlay, Page, Tab and Snackbar use an `active` prop; callers own state and timing. Omitted appearance props preserve raw helper classes; explicit props override the corresponding helper group. `ToggleSwitch` avoids a name collision with Solid's `Switch` control flow.

```tsx
<Card border round class="large-padding" elevation="none"><h6>Title</h6></Card>
<Checkbox checked={enabled()} onChange={event => setEnabled(event.currentTarget.checked)}>Enabled</Checkbox>
<Field border floating><input id="name" placeholder=" " /><label for="name">Name</label></Field>
<Slider size="medium" value={value()} onInput={event => setValue(event.currentTarget.valueAsNumber)} />
```

Appearance props describe component shape, state, finite visual variants, internal structure, or component-specific position/direction. Padding, margin, spacing, alignment, wrapping, colors and custom styles stay in `class` / `classList`; they have no prop recommendation and are not overridden by appearance props. Directional/custom classes such as `vertical-padding`, `top-padding` and `custom-card` remain caller-owned.

### Button and Badge composition

```tsx
<Button size="large" border class="primary" onClick={save}>
  <Icon>{icon()}</Icon>
  <span>{label()}</span>
  <Badge inline>{count()}</Badge>
</Button>
<a href="#notifications"><Icon>notifications</Icon><Badge dot /></a>
```

Button supports `shape` (`circle`, `square`), `round`, `smallRound`, `size` (`small`, `medium`, `large`, `extra`), `border`, `fill`, `elevation` (`none`, `small`, `medium`, `large`), `vertical`, `responsive` and `extended`. Badge supports `dot`, `inline`, `square`, `size` and `position` (`top`, `bottom`, `left`, `right`); combined positions remain class/classList. Colors and spacing stay caller-owned. Button renders its children directly, with no label wrapper. Badge renders `<span class="badge ...">`; omit children and add `min` for a dot, or supply text/numbers including zero. Icon, label and badge content can update independently.

## Compiler behavior

Use named imports, including aliases. Static classes, fixed-key `classList`, typed appearance props, native attributes/events/refs and permitted children stay reactive after lowering. `classes?: readonly string[]` supports dynamic class fragments; use empty strings to omit fragments. Class precedence is `class -> classes -> classList -> explicit appearance props`; required base tokens remain protected.

Arbitrary dynamic `class`, nonliteral/computed/spread `classList`, prop spreads, duplicate props, `children={...}`, `className`, namespaced attributes and unsupported children retain the component. Namespace/default imports, variable aliases and re-exports are not lowered. Invalid literal options fail eligible builds. Fallback preserves normal component behavior.

Static BeerCSS helpers with typed equivalents produce warnings; custom classes do not. Set `warnClassHelpers: false` to disable warnings. `importSources` opts exact aliases into compilation; `include` / `exclude` select files. `onReport` receives transform/fallback counts, warnings, retained components and `nativeAvailable`. `compileSolidBeer(code, filename, options)` exposes the same transform for build tools.
