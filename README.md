# solid-beer

BeerCSS for SolidJS: native classes, typed components and ready-made dialogs, search, menus, images and tables. Includes styles, icons and fonts; no Tailwind build required.

[Installation](INSTALL.md) / [Live examples](https://git.wavjaby.com/solid-beer/) / [API reference](API.md)

## Native JSX or components

Both use the same BeerCSS styles. Native JSX gives direct control; components add typed appearance props and forward native events, attributes and refs.

```tsx
import { Button } from 'solid-beer'

<button type="button" class="border primary">Save</button>
<Button border class="primary">Save</Button>
```

Use props for variants such as `border` or `shape="circle"`; use classes for color, layout and spacing. The compiler turns supported primitives into native JSX and keeps other patterns as components.

## Reactive classes

Use `class` for fixed classes, `classes` for computed fragments and `classList` for boolean toggles. Empty strings omit fragments; Solid signals keep them reactive.

Keep fixed classes in `class` and pass dynamic strings as `classes={[color(), size()]}` instead of assembling a template string. Conditional fragments still use expressions such as `active() ? 'primary' : 'secondary'`.

Solid already compiles reactive `class` and `classList`. `classes` is this library's array API: it simplifies composition and lets our compiler lower supported primitives with dynamic fragments; arbitrary dynamic `class` retains the component.

```tsx
import { createSignal } from 'solid-js'
import { Button } from 'solid-beer'

export default function Favorite() {
  const [active, setActive] = createSignal(false)
  return (
    <Button
      border
      class="margin"
      classes={[active() ? 'primary' : 'secondary']}
      classList={{ 'large-margin': active() }}
      aria-pressed={active()}
      onClick={() => setActive(value => !value)}
    >
      {active() ? 'Saved' : 'Save'}
    </Button>
  )
}
```

Explicit appearance props override conflicting classes. BeerCSS helpers such as `responsive`, `row`, `padding` and `max` also work on native elements; see the [BeerCSS reference](https://www.beercss.com/).

## Dialogs

Mount one `DialogStack` near the app root, then call dialogs from event handlers. The library handles modal focus, scroll locking and close animations.

```tsx
import { Button, DialogStack, dialog } from 'solid-beer'

export default function App() {
  return (
    <main class="responsive padding">
      <Button onClick={() => void dialog.alert('Your app is ready.', 'Welcome')}>
        Open dialog
      </Button>
      <DialogStack />
    </main>
  )
}
```

Explore [components](https://git.wavjaby.com/solid-beer/#custom-components), [dialogs](https://git.wavjaby.com/solid-beer/#custom-dialogs) and [native BeerCSS patterns](https://git.wavjaby.com/solid-beer/#beercss) in the live demo.
