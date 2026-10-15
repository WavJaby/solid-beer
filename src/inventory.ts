export type ComponentStatus = 'implemented' | 'planned';

export interface BeerCssComponent {
  name: string;
  status: ComponentStatus;
  presentation: 'api' | 'native';
}

export const beerCssCategories = [
  { id: 'app-bars', name: 'App bars', presentation: 'api' },
  { id: 'badges', name: 'Badges', presentation: 'api' },
  { id: 'buttons', name: 'Buttons', presentation: 'api' },
  { id: 'cards', name: 'Cards', presentation: 'api' },
  { id: 'checkboxes', name: 'Checkboxes', presentation: 'api' },
  { id: 'chips', name: 'Chips', presentation: 'api' },
  { id: 'containers', name: 'Containers', presentation: 'native' },
  { id: 'dialogs', name: 'Dialogs', presentation: 'native' },
  { id: 'dividers', name: 'Dividers', presentation: 'api' },
  { id: 'expansions', name: 'Expansion panels', presentation: 'native' },
  { id: 'fields', name: 'Fields', presentation: 'api' },
  { id: 'grids', name: 'Grids', presentation: 'native' },
  { id: 'icons', name: 'Icons', presentation: 'api' },
  { id: 'layouts', name: 'Layouts', presentation: 'native' },
  { id: 'lists', name: 'Lists', presentation: 'api' },
  { id: 'media', name: 'Media', presentation: 'native' },
  { id: 'menus', name: 'Menus', presentation: 'api' },
  { id: 'navigations', name: 'Navigations', presentation: 'api' },
  { id: 'overlays', name: 'Overlays', presentation: 'api' },
  { id: 'pages', name: 'Pages', presentation: 'api' },
  { id: 'progress', name: 'Progress', presentation: 'api' },
  { id: 'radios', name: 'Radios', presentation: 'api' },
  { id: 'selects', name: 'Selects', presentation: 'api' },
  { id: 'sliders', name: 'Sliders', presentation: 'api' },
  { id: 'snackbars', name: 'Snackbars', presentation: 'api' },
  { id: 'switches', name: 'Switches', presentation: 'api' },
  { id: 'tables', name: 'Tables', presentation: 'native' },
  { id: 'tabs', name: 'Tabs', presentation: 'api' },
  { id: 'textareas', name: 'Textareas', presentation: 'api' },
  { id: 'tooltips', name: 'Tooltips', presentation: 'api' },
  { id: 'typography', name: 'Typography', presentation: 'native' },
  { id: 'waves', name: 'Waves', presentation: 'native' },
] as const satisfies readonly (Pick<BeerCssComponent, 'name' | 'presentation'> & { id: string })[];

export const beerCssComponents: readonly BeerCssComponent[] = beerCssCategories.map(({ name, presentation }) => ({
  name,
  status: 'implemented',
  presentation,
}));
