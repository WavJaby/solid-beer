import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';
import { beerClass, beerHelperProp, beerOptionEntries, beerRecipes, type BeerRecipe } from '../appearance';
import { classListBaseline, dynamicClass, type ClassListEntry, type DynamicOption } from './appearance';

type Literal = string | number | boolean | null;
export type ComponentFallback =
  | 'spread'
  | 'duplicate-prop'
  | 'dynamic-appearance'
  | 'class-list'
  | 'unsupported-prop'
  | 'children';
type RecipeInput = {
  path: NodePath<t.JSXElement>;
  types: typeof t;
  literals: Map<string, Literal>;
  native: t.JSXAttribute[];
  expressions: Map<string, t.Expression>;
  classList: ClassListEntry[];
};
type RecipeOutput = { attributes: t.JSXAttribute[]; children: t.JSXElement['children'] };
interface Recipe {
  tag: string;
  props: readonly string[];
  allowChildren: boolean;
  dynamicProps?: readonly string[];
  resolve: (input: RecipeInput) => RecipeOutput;
  classHelper?: (helper: string) => string | undefined;
}

export const literalAttribute = (attribute: t.JSXAttribute): { value: Literal } | undefined => {
  const node = attribute.value?.type === 'JSXExpressionContainer' ? attribute.value.expression : attribute.value;
  if (node == null) return { value: true };
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral')
    return { value: node.value };
  if (node.type === 'NullLiteral') return { value: null };
};

const fragmentClass = (types: typeof t, base: string, fragments: t.Expression): t.Expression => {
  const joined = types.callExpression(
    types.memberExpression(
      types.arrayExpression([
        types.stringLiteral(base),
        types.spreadElement(
          types.isArrayExpression(fragments)
            ? fragments
            : types.logicalExpression('??', fragments, types.arrayExpression([])),
        ),
      ]),
      types.identifier('join'),
    ),
    [types.stringLiteral(' ')],
  );
  return types.callExpression(
    types.memberExpression(
      types.callExpression(types.memberExpression(joined, types.identifier('replace')), [
        types.regExpLiteral('\\s+', 'g'),
        types.stringLiteral(' '),
      ]),
      types.identifier('trim'),
    ),
    [],
  );
};

const beerHost = (recipe: BeerRecipe): Recipe => ({
  tag: recipe.tag,
  props: ['class', 'classes', ...Object.keys(recipe.options)],
  allowChildren: recipe.allowChildren ?? !recipe.void,
  dynamicProps: ['classes', ...Object.keys(recipe.options)],
  classHelper: token => beerHelperProp(recipe, token),
  resolve({ path, types, literals, native, expressions, classList }) {
    let classes: string | t.Expression;
    try {
      const fragments = expressions.get('classes');
      expressions.delete('classes');
      const baseline = beerClass(recipe, Object.fromEntries(literals));
      classes =
        classList.length || fragments
          ? classListBaseline(
              path,
              types,
              fragments
                ? fragmentClass(types, beerClass(recipe, { class: literals.get('class') }), fragments)
                : beerClass(recipe, { class: literals.get('class') }),
              classList,
              recipe.base,
            )
          : baseline;
      if (classList.length && typeof classes === 'string')
        classes = beerClass(recipe, { ...Object.fromEntries(literals), class: classes });
    } catch (error) {
      throw path.buildCodeFrameError((error as Error).message);
    }
    if (typeof classes !== 'string')
      for (const [prop, value] of literals) if (prop !== 'class') expressions.set(prop, types.valueToNode(value));
    for (const attribute of native) {
      if (attribute.name.type === 'JSXIdentifier' && recipe.attributeBindings?.includes(attribute.name.name))
        attribute.name = types.jsxNamespacedName(types.jsxIdentifier('attr'), attribute.name);
    }
    const children = path.node.children;
    const options: Record<string, DynamicOption> = Object.fromEntries(
      Object.entries(recipe.options).map(([prop, choices]) => {
        const entries = beerOptionEntries(choices);
        return [prop, { tokens: entries.map(entry => entry.token).filter(Boolean), choices: entries }];
      }),
    );
    const classAttribute = types.jsxAttribute(
      types.jsxIdentifier('class'),
      expressions.size
        ? types.jsxExpressionContainer(dynamicClass(path, types, classes, expressions, options))
        : typeof classes === 'string'
        ? types.stringLiteral(classes)
        : types.jsxExpressionContainer(classes),
    );
    if (!recipe.kind) return { attributes: [...native, classAttribute], children };
    const element = (tag: string, attributes: t.JSXAttribute[], body: t.JSXElement['children'] = []) =>
      types.jsxElement(
        types.jsxOpeningElement(types.jsxIdentifier(tag), attributes, body.length === 0),
        body.length ? types.jsxClosingElement(types.jsxIdentifier(tag)) : null,
        body,
      );
    const input = element('input', [
      ...native,
      types.jsxAttribute(types.jsxIdentifier('type'), types.stringLiteral(recipe.inputType!)),
    ]);
    return {
      attributes: [classAttribute],
      children:
        recipe.kind === 'choice' ? [input, element('span', [], children)] : [input, element('span', []), ...children],
    };
  },
});

export const componentRecipes: Record<string, Recipe> = {
  ...Object.fromEntries(Object.entries(beerRecipes).map(([name, recipe]) => [name, beerHost(recipe)])),
};
