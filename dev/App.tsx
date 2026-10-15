import { type Component, For } from 'solid-js';
import { DialogStack } from 'src';
import { beerSections } from './sections';
import CustomComponents from './sections/CustomComponents';
import CustomDialogs from './sections/CustomDialogs';
import CustomExpansions from './sections/CustomExpansions';
import CustomTables from './sections/CustomTables';

// Library workflows first, then BeerCSS patterns; ids are navigation anchors.
const sectionGroups: Array<{
  id: string;
  title: string;
  description: string;
  sections: Array<{ id: string; title: string; component: Component }>;
}> = [
  {
    id: 'library',
    title: 'Solid Beer components',
    description: 'Ready-to-use components for everyday app workflows.',
    sections: [
      { id: 'custom-components', title: 'Everyday components', component: CustomComponents },
      { id: 'custom-dialogs', title: 'Dialog workflows', component: CustomDialogs },
      { id: 'custom-expansions', title: 'Collapsible panels', component: CustomExpansions },
      { id: 'custom-tables', title: 'Data tables', component: CustomTables },
    ],
  },
  {
    id: 'beercss',
    title: 'BeerCSS examples',
    description: 'Native JSX patterns and their Solid component APIs.',
    sections: beerSections,
  },
];
const sections = sectionGroups.flatMap(group => group.sections);

const App: Component = () => {
  return (
    <>
      <nav class="left m l scroll max">
        <header>
          <a class="button extend square round" href="#begin">
            <i>sports_bar</i>
            <span>Solid Beer</span>
          </a>
        </header>
        <For each={sectionGroups}>
          {group => (
            <>
              <header>
                <a href={`#${group.id}`} class="small-text bold">
                  {group.title}
                </a>
              </header>
              <For each={group.sections}>
                {section => (
                  <a href={`#${section.id}`}>
                    <i>widgets</i>
                    <span>{section.title}</span>
                  </a>
                )}
              </For>
            </>
          )}
        </For>
      </nav>
      <nav class="bottom s">
        <For each={sections.slice(0, 5)}>
          {section => (
            <a href={`#${section.id}`}>
              <i>widgets</i>
              <span>{section.title}</span>
            </a>
          )}
        </For>
      </nav>

      <main class="responsive">
        <article class="hero large-padding no-elevate round" id="begin">
          <div class="grid middle-align">
            <div class="s12 m8">
              <span class="chip small secondary">Bun + SolidJS</span>
              <h1>BeerCSS-first Solid components</h1>
              <p class="large-text">
                Start with ready-to-use Solid Beer components, then explore BeerCSS patterns. Open code to see how each
                example works.
              </p>
              <nav class="wrap">
                <a class="button primary" href="#custom-components">
                  <i>rocket_launch</i>
                  <span>Explore components</span>
                </a>
                <a class="button border" href="https://www.beercss.com/" target="_blank" rel="noreferrer">
                  <i>open_in_new</i>
                  <span>BeerCSS</span>
                </a>
              </nav>
            </div>
            <div class="s12 m4 center-align">
              <span class="chip border">
                <i>widgets</i>
                <span>{sections.length} demo sections</span>
              </span>
            </div>
          </div>
        </article>

        <div class="field label border s">
          <select
            aria-label="Jump to example"
            onChange={event => {
              location.hash = event.currentTarget.value;
            }}
          >
            <option value="begin">Choose an example</option>
            <For each={sectionGroups}>
              {group => (
                <optgroup label={group.title}>
                  <For each={group.sections}>{section => <option value={section.id}>{section.title}</option>}</For>
                </optgroup>
              )}
            </For>
          </select>
          <label>Jump to example</label>
        </div>

        <For each={sectionGroups}>
          {group => (
            <section id={group.id}>
              <div class="large-space" />
              <h2 class="h4">{group.title}</h2>
              <p>{group.description}</p>
              <For each={group.sections}>{section => <section.component />}</For>
            </section>
          )}
        </For>
        <div class="large-space" />
      </main>

      <DialogStack />
    </>
  );
};

export default App;
