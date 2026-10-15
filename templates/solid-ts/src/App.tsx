import { Button, Collapsible, DialogStack, dialog } from 'solid-beer';

export default function App() {
  return (
    <main class="responsive padding">
      <h1>Solid Beer</h1>
      <p>Your Solid app is ready.</p>
      <Button onClick={() => void dialog.alert('Your app is ready.', 'Welcome')}>Open dialog</Button>
      <Collapsible title="Details">
        <p>Styles, icons and fonts are included. No Tailwind setup required.</p>
      </Collapsible>
      <DialogStack />
    </main>
  );
}
