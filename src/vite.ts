import { transformAsync, type PluginObj } from '@babel/core';
import type * as t from '@babel/types';
import { createFilter, type Plugin } from 'vite';
import { componentRecipes, literalAttribute, type ComponentFallback } from './compiler/recipes';
import type { ClassListEntry } from './compiler/appearance';

export type { ComponentFallback } from './compiler/recipes';
export interface SolidBeerTransformReport {
  id: string;
  transformed: number;
  fallbacks: Partial<Record<ComponentFallback, number>>;
  warnings: string[];
  retained: string[];
  /** No retained library component/fallback; lowered modules may keep helpers, untouched modules must have no library value imports. */
  nativeAvailable: boolean;
}
export interface SolidBeerOptions {
  /** Exact import sources exposing library components; aliases must be opted in. */
  importSources?: string[];
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  /** Warn on literal class tokens and fixed classList keys with typed equivalents; default true. */
  warnClassHelpers?: boolean;
  /** Per-file counts; fallbacks retain the original component. */
  onReport?: (report: SolidBeerTransformReport) => void;
}
const PLUGIN_NAME = 'solid-beer:compile';

/** Binding resolution + conservative preflight are shared; recipes own DOM shape and class policy. */
const componentLowering = (
  types: typeof t,
  sources: readonly string[],
  report: SolidBeerTransformReport,
  warnClassHelpers: boolean,
): PluginObj => ({
  name: PLUGIN_NAME,
  visitor: {
    Program: {
      exit(path) {
        path.scope.crawl();
        const retained = new Set<string>();
        path.traverse({
          JSXElement(element) {
            const name = element.node.openingElement.name;
            const root = types.isJSXIdentifier(name)
              ? name
              : types.isJSXMemberExpression(name) && types.isJSXIdentifier(name.object)
              ? name.object
              : undefined;
            const binding = root && element.scope.getBinding(root.name);
            const declaration = binding?.path.parentPath;
            if (declaration?.isImportDeclaration() && sources.includes(declaration.node.source.value))
              retained.add(types.isJSXIdentifier(name) ? name.name : root!.name);
          },
        });
        for (const statement of path.get('body')) {
          if (
            !statement.isImportDeclaration() ||
            statement.node.importKind === 'type' ||
            !sources.includes(statement.node.source.value)
          )
            continue;
          for (const specifier of statement.get('specifiers')) {
            if (specifier.isImportSpecifier() && specifier.node.importKind === 'type') continue;
            const imported = specifier.isImportSpecifier() ? specifier.node.imported : undefined;
            const name =
              imported?.type === 'Identifier'
                ? imported.name
                : imported?.type === 'StringLiteral'
                ? imported.value
                : specifier.node.local.name;
            if (/^[A-Z]/.test(name) && path.scope.getBinding(specifier.node.local.name)?.referenced)
              retained.add(specifier.node.local.name);
          }
        }
        report.retained = [...retained];
        for (const statement of path.get('body')) {
          if (!report.transformed) break;
          if (!statement.isImportDeclaration() || !sources.includes(statement.node.source.value)) continue;
          let removed = false;
          for (const specifier of statement.get('specifiers')) {
            if (!specifier.isImportSpecifier()) continue;
            const imported = specifier.node.imported;
            const name = imported.type === 'Identifier' ? imported.name : imported.value;
            if (!Object.hasOwn(componentRecipes, name)) continue;
            if (!path.scope.getBinding(specifier.node.local.name)?.referenced) {
              specifier.remove();
              removed = true;
            }
          }
          // Only BeerCSS primitives are lowered; their CSS lives in the shared stylesheet.
          if (removed && !statement.node.specifiers.length) statement.remove();
        }
        report.nativeAvailable =
          !report.retained.length &&
          !Object.keys(report.fallbacks).length &&
          (report.transformed > 0 ||
            !path.node.body.some(
              statement =>
                types.isImportDeclaration(statement) &&
                sources.includes(statement.source.value) &&
                statement.importKind !== 'type' &&
                (statement.specifiers.length === 0 ||
                  statement.specifiers.some(
                    specifier => !types.isImportSpecifier(specifier) || specifier.importKind !== 'type',
                  )),
            ));
      },
    },
    JSXElement(path) {
      const opening = path.node.openingElement;
      if (!types.isJSXIdentifier(opening.name)) return;
      const binding = path.scope.getBinding(opening.name.name);
      if (!binding || !binding.path.isImportSpecifier()) return;
      const imported = binding.path.node.imported;
      const name = imported.type === 'Identifier' ? imported.name : imported.value;
      if (!Object.hasOwn(componentRecipes, name)) return;
      const recipe = componentRecipes[name]!;
      const declaration = binding.path.parentPath;
      if (
        !declaration.isImportDeclaration() ||
        declaration.node.importKind === 'type' ||
        binding.path.node.importKind === 'type' ||
        !sources.includes(declaration.node.source.value)
      )
        return;
      const fallback = (reason: ComponentFallback) => {
        report.fallbacks[reason] = (report.fallbacks[reason] ?? 0) + 1;
      };
      if (warnClassHelpers && recipe.classHelper) {
        for (const attribute of opening.attributes) {
          if (!types.isJSXAttribute(attribute) || !types.isJSXIdentifier(attribute.name)) continue;
          const literal = literalAttribute(attribute);
          const tokens: string[] = [];
          if (attribute.name.name === 'class' && typeof literal?.value === 'string') tokens.push(literal.value);
          if (
            attribute.name.name === 'classList' &&
            types.isJSXExpressionContainer(attribute.value) &&
            types.isObjectExpression(attribute.value.expression)
          )
            for (const property of attribute.value.expression.properties)
              if (types.isObjectProperty(property) && !property.computed)
                if (types.isIdentifier(property.key)) tokens.push(property.key.name);
                else if (types.isStringLiteral(property.key)) tokens.push(property.key.value);
          for (const helper of new Set(tokens.flatMap(token => token.split(/\s+/)))) {
            const prop = recipe.classHelper(helper);
            if (prop)
              report.warnings.push(
                report.id +
                  ':' +
                  (attribute.loc?.start.line ?? '?') +
                  ': ' +
                  name +
                  ' ' +
                  attribute.name.name +
                  ' helper "' +
                  helper +
                  '": prefer the "' +
                  prop +
                  '" prop; explicit props override this helper.',
              );
          }
        }
      }
      const meaningfulChildren = path.node.children.filter(
        child => !types.isJSXText(child) || child.value.trim() !== '',
      );
      if (!recipe.allowChildren && meaningfulChildren.length) {
        fallback('children');
        return;
      }
      const names = new Set<string>();
      const native: t.JSXAttribute[] = [];
      const literals = new Map<string, string | number | boolean | null>();
      const expressions = new Map<string, t.Expression>();
      const classList: ClassListEntry[] = [];
      for (const attribute of opening.attributes) {
        if (!types.isJSXAttribute(attribute)) {
          fallback('spread');
          return;
        }
        if (!types.isJSXIdentifier(attribute.name)) {
          fallback('unsupported-prop');
          return;
        }
        const prop = attribute.name.name;
        if (names.has(prop)) {
          fallback('duplicate-prop');
          return;
        }
        names.add(prop);
        if (prop === 'classList') {
          if (
            !types.isJSXExpressionContainer(attribute.value) ||
            !types.isObjectExpression(attribute.value.expression)
          ) {
            fallback('class-list');
            return;
          }
          const keys = new Set<string>();
          for (const property of attribute.value.expression.properties) {
            const key =
              types.isObjectProperty(property) && !property.computed
                ? types.isIdentifier(property.key)
                  ? property.key.name
                  : types.isStringLiteral(property.key)
                  ? property.key.value
                  : undefined
                : undefined;
            if (
              key === undefined ||
              key === '__proto__' ||
              keys.has(key) ||
              !types.isObjectProperty(property) ||
              !types.isExpression(property.value)
            ) {
              fallback('class-list');
              return;
            }
            keys.add(key);
            classList.push({ key, value: property.value });
          }
          continue;
        }
        if (prop === 'children' || prop === 'className') {
          fallback('unsupported-prop');
          return;
        }
        if (!recipe.props.includes(prop)) {
          native.push(attribute);
          continue;
        }
        const literal = literalAttribute(attribute);
        if (!literal) {
          if (
            recipe.dynamicProps?.includes(prop) &&
            types.isJSXExpressionContainer(attribute.value) &&
            types.isExpression(attribute.value.expression)
          ) {
            expressions.set(prop, attribute.value.expression);
            continue;
          }
          fallback('dynamic-appearance');
          return;
        }
        literals.set(prop, literal.value);
      }
      // Resolve only fully analyzable calls; later spreads/dynamic props may override earlier literals.
      const result = recipe.resolve({ path, types, literals, native, expressions, classList });
      opening.name = types.jsxIdentifier(recipe.tag);
      opening.attributes = result.attributes;
      path.node.children = result.children;
      opening.selfClosing = result.children.length === 0;
      path.node.closingElement = opening.selfClosing ? null : types.jsxClosingElement(types.jsxIdentifier(recipe.tag));
      report.transformed++;
    },
  },
});

/** Shared by the Vite hook and build-time example source generation; Babel never ships to the browser. */
export async function compileSolidBeer(code: string, id: string, options: SolidBeerOptions = {}) {
  const report: SolidBeerTransformReport = {
    id,
    transformed: 0,
    fallbacks: {},
    warnings: [],
    retained: [],
    nativeAvailable: false,
  };
  const result = await transformAsync(code, {
    filename: id,
    configFile: false,
    babelrc: false,
    sourceMaps: true,
    parserOpts: { plugins: ['jsx', ...(id.endsWith('.tsx') ? ['typescript' as const] : [])] },
    plugins: [
      api =>
        componentLowering(api.types, options.importSources ?? ['solid-beer'], report, options.warnClassHelpers ?? true),
    ],
  });
  return { code: result!.code!, map: result!.map, report };
}

/** Place before vite-plugin-solid; both plugins run in Vite's pre phase. Browser runtime stays independent. */
export default function solidBeer(options: SolidBeerOptions = {}): Plugin {
  const sources = options.importSources ?? ['solid-beer'];
  const filter = createFilter(options.include ?? /\.[jt]sx$/, options.exclude ?? /node_modules/);
  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    configResolved(config) {
      const beer = config.plugins.findIndex(plugin => plugin.name === PLUGIN_NAME);
      const solid = config.plugins.findIndex(plugin => plugin.name === 'solid');
      if (solid !== -1 && beer > solid) throw new Error('Place solidBeer() before solidPlugin() in plugins.');
    },
    async transform(code, id) {
      const filename = id.split('?')[0]!;
      if (!filter(filename) || !sources.some(source => code.includes(source))) return null;
      const result = await compileSolidBeer(code, filename, options);
      const report = result.report;
      options.onReport?.(report);
      report.warnings.forEach(message => this.warn(message));
      if (!report.transformed) return null;
      return { code: result.code, map: result.map };
    },
  };
}
