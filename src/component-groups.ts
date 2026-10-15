import { beerRecipes } from './appearance';

export type ComponentCategory = 'base' | 'composite';

export interface SolidBeerComponent {
  name: string;
  category: ComponentCategory;
  description: string;
}

export const baseComponents: readonly SolidBeerComponent[] = [
  { name: 'AuthenticatedImage', category: 'base', description: 'Image rendering with loading and fallback states.' },
  { name: 'Collapsible', category: 'base', description: 'A BeerCSS expansion panel wrapper.' },
  { name: 'CopyButton', category: 'base', description: 'A small action for copying text to the clipboard.' },
  { name: 'Dialog', category: 'base', description: 'A controlled overlay and dialog shell.' },
  { name: 'MenuSelect', category: 'base', description: 'A button connected to a selectable BeerCSS menu.' },
  { name: 'Nav', category: 'base', description: 'Responsive navigation layout primitives.' },
  { name: 'Table', category: 'base', description: 'A selectable table with loading and empty states.' },
  ...Object.keys(beerRecipes).map(name => ({
    name,
    category: 'base' as const,
    description: `Typed BeerCSS ${name} appearance with native attributes and optional compilation.`,
  })),
];

export const compositeComponents: readonly SolidBeerComponent[] = [
  {
    name: 'AccountMenu',
    category: 'composite',
    description: 'Account actions, avatar upload, token copy, and logout.',
  },
  { name: 'ConfirmDialog', category: 'composite', description: 'A ready-to-use confirmation or alert dialog body.' },
  { name: 'DialogStack', category: 'composite', description: 'A host for dialogs opened through the dialog API.' },
  { name: 'ImageManager', category: 'composite', description: 'Image upload, preview, and deletion workflow.' },
  { name: 'UserDetailDialog', category: 'composite', description: 'A user detail view loaded through a callback.' },
  { name: 'UserLink', category: 'composite', description: 'A user link that opens user details.' },
  {
    name: 'SearchSelect',
    category: 'composite',
    description: 'Async search and selection for any item type, with custom renderers.',
  },
];

export const solidBeerComponents: readonly SolidBeerComponent[] = [...baseComponents, ...compositeComponents];
