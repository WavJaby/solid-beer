import type { Component } from 'solid-js';
import { beerCssCategories } from '../../src/inventory';
import {
  AppBars,
  Cards,
  Chips,
  Dividers,
  Icons,
  Lists,
  Navigations,
  Overlays,
  Pages,
  Snackbars,
  TabExamples,
  Tooltips,
} from './Surfaces';
import { Checkboxes, Fields, Radios, Selects, Sliders, Switches, Textareas } from './Controls';
import { Containers, Grids, Layouts, Media, Typography, Waves } from './Structure';
import Badges from './Badges';
import Buttons from './Buttons';
import Dialogs from './Dialogs';
import Expansions from './Expansions';
import Menus from './Menus';
import Progress from './Progress';
import Tables from './Tables';

const sectionComponents = {
  'app-bars': AppBars,
  badges: Badges,
  buttons: Buttons,
  cards: Cards,
  checkboxes: Checkboxes,
  chips: Chips,
  containers: Containers,
  dialogs: Dialogs,
  dividers: Dividers,
  expansions: Expansions,
  fields: Fields,
  grids: Grids,
  icons: Icons,
  layouts: Layouts,
  lists: Lists,
  media: Media,
  menus: Menus,
  navigations: Navigations,
  overlays: Overlays,
  pages: Pages,
  progress: Progress,
  radios: Radios,
  selects: Selects,
  sliders: Sliders,
  snackbars: Snackbars,
  switches: Switches,
  tables: Tables,
  tabs: TabExamples,
  textareas: Textareas,
  tooltips: Tooltips,
  typography: Typography,
  waves: Waves,
} satisfies Record<(typeof beerCssCategories)[number]['id'], Component>;

export const beerSections = beerCssCategories.map(({ id, name }) => ({
  id,
  title: name,
  component: sectionComponents[id],
}));
