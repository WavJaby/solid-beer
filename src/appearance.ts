export interface BeerRecipe {
  tag: string;
  base?: string;
  options: Record<string, readonly string[] | string | Readonly<Record<string, string>>>;
  attributeBindings?: readonly string[];
  allowChildren?: boolean;
  kind?: 'choice' | 'slider';
  inputType?: string;
  void?: boolean;
}

const sizes = ['small', 'medium', 'large', 'extra'] as const;
const positions = ['top', 'bottom', 'left', 'right'] as const;
const surfaces = { border: 'border', round: 'round', fill: 'fill' };
const elevations = { none: 'no-elevate', small: 'small-elevate', medium: 'medium-elevate', large: 'large-elevate' };

/** Shared class policy; runtime, compiler and demo consume the same finite options. */
export const beerRecipes = {
  Progress: {
    tag: 'progress',
    options: {
      shape: { linear: '', circle: 'circle' },
      wavy: 'wavy',
      size: ['small', 'medium', 'large', 'max'] as const,
    },
    attributeBindings: ['value', 'max'],
    allowChildren: false,
  },
  Button: {
    tag: 'button',
    options: {
      shape: ['circle', 'square'],
      round: 'round',
      smallRound: 'small-round',
      size: sizes,
      border: 'border',
      fill: 'fill',
      elevation: elevations,
      vertical: 'vertical',
      responsive: 'responsive',
      extended: 'extend',
    },
  },
  Badge: {
    tag: 'span',
    base: 'badge',
    options: { dot: 'min', inline: 'none', square: 'no-round', size: sizes, position: positions },
  },
  AppBar: { tag: 'header', options: { fixed: 'fixed', responsive: 'responsive' } },
  BottomAppBar: { tag: 'footer', options: { fixed: 'fixed', responsive: 'responsive' } },
  Card: {
    tag: 'article',
    options: {
      ...surfaces,
      elevation: elevations,
    },
  },
  Chip: { tag: 'button', base: 'chip', options: { ...surfaces, size: sizes, circle: 'circle' } },
  Checkbox: {
    tag: 'label',
    base: 'checkbox',
    kind: 'choice',
    inputType: 'checkbox',
    options: { size: sizes, icon: 'icon' },
  },
  Radio: { tag: 'label', base: 'radio', kind: 'choice', inputType: 'radio', options: { size: sizes, icon: 'icon' } },
  ToggleSwitch: {
    tag: 'label',
    base: 'switch',
    kind: 'choice',
    inputType: 'checkbox',
    options: { size: sizes, icon: 'icon' },
  },
  Divider: { tag: 'hr', void: true, options: { vertical: 'vertical', size: ['small', 'medium', 'large'] } },
  Field: {
    tag: 'div',
    base: 'field',
    options: { ...surfaces, size: sizes, floating: 'label', prefix: 'prefix', suffix: 'suffix', invalid: 'invalid' },
  },
  Icon: { tag: 'i', options: { size: ['tiny', ...sizes], filled: 'fill' } },
  List: { tag: 'ul', base: 'list', options: { border: 'border' } },
  Navigation: {
    tag: 'nav',
    options: {
      position: positions,
      vertical: 'vertical',
      group: 'group',
      connected: 'connected',
      toolbar: 'toolbar',
    },
  },
  Overlay: {
    tag: 'div',
    base: 'overlay',
    options: { active: 'active', blur: { small: 'small-blur', medium: 'medium-blur', large: 'large-blur' } },
  },
  Page: { tag: 'div', base: 'page', options: { active: 'active', direction: positions } },
  Slider: {
    tag: 'div',
    base: 'slider',
    kind: 'slider',
    inputType: 'range',
    options: { size: sizes, vertical: 'vertical' },
  },
  Snackbar: { tag: 'div', base: 'snackbar', options: { active: 'active', position: ['top', 'bottom'] } },
  Tabs: { tag: 'div', base: 'tabs', options: { min: 'min' } },
  Tab: { tag: 'a', options: { active: 'active' } },
  Tooltip: { tag: 'span', base: 'tooltip', options: { position: positions, rich: 'max' } },
} satisfies Record<string, BeerRecipe>;

export type BeerComponentName = keyof typeof beerRecipes;

export const beerOptionEntries = (choices: BeerRecipe['options'][string]) =>
  typeof choices === 'string'
    ? [
        { value: true, token: choices },
        { value: false, token: '' },
      ]
    : Array.isArray(choices)
    ? choices.map(value => ({ value, token: value }))
    : Object.entries(choices).map(([value, token]) => ({ value, token }));

export const beerPropKeys = (recipe: BeerRecipe) => [
  'class',
  'classes',
  'classList',
  'children',
  ...Object.keys(recipe.options),
  ...(recipe.attributeBindings ?? []),
];

export const beerHelperProp = (recipe: BeerRecipe, token: string) =>
  Object.entries(recipe.options).find(([, choices]) =>
    beerOptionEntries(choices).some(entry => entry.token !== '' && entry.token === token),
  )?.[0];

export const beerClass = (recipe: BeerRecipe, props: Record<string, unknown>) => {
  const fixedClass = props.class;
  if (fixedClass != null && typeof fixedClass !== 'string')
    throw new Error(`Invalid class: ${JSON.stringify(fixedClass)}`);
  const className = [fixedClass ?? '', ...((props.classes ?? []) as readonly string[])].join(' ');
  const classes = new Set<string>([recipe.base ?? '', ...className.split(/\s+/)].filter(Boolean));
  const classList = props.classList as Record<string, boolean | undefined> | undefined;
  for (const [tokens, enabled] of Object.entries(classList ?? {})) {
    for (const token of tokens.split(/\s+/).filter(Boolean)) enabled ? classes.add(token) : classes.delete(token);
  }
  for (const [prop, choices] of Object.entries(recipe.options)) {
    const value = props[prop];
    if (value === undefined) continue;
    if (typeof choices === 'string') {
      if (typeof value !== 'boolean') throw new Error(`Invalid ${prop}: ${JSON.stringify(value)}`);
      value ? classes.add(choices) : classes.delete(choices);
    } else {
      const entries = beerOptionEntries(choices);
      const selected = entries.find(entry => entry.value === value);
      if (!selected) throw new Error(`Invalid ${prop}: ${JSON.stringify(value)}`);
      for (const entry of entries) classes.delete(entry.token);
      if (selected.token) classes.add(selected.token);
    }
  }
  if (recipe.base) classes.add(recipe.base);
  return [...classes].join(' ');
};
