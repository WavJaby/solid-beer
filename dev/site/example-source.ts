import { transformAsync, transformFromAstAsync, type NodePath, type PluginObj } from '@babel/core';
import * as t from '@babel/types';
import { beerRecipes, type BeerRecipe } from '../../src/appearance';
import { removeShowcaseMarkers } from './example-showcase';

/** Extract the selected export + transitive module bindings; local closures stay intact. */
export const extractExample = async (
  ast: t.File,
  source: string,
  filename: string,
  names: string | readonly string[],
) => {
  const plugin: PluginObj = {
    visitor: {
      Program(path) {
        const statements = new Set<t.Statement>();
        const visited = new Set<NodePath>();
        const importedReferences = new Set<string>();
        const typeDeclarations = new Map(
          path.get('body').flatMap(statement => {
            const declaration = statement.isExportNamedDeclaration() ? statement.get('declaration') : statement;
            return declaration &&
              !Array.isArray(declaration) &&
              (declaration.isTSTypeAliasDeclaration() || declaration.isTSInterfaceDeclaration())
              ? [[declaration.node.id.name, declaration] as const]
              : [];
          }),
        );
        const include = (bindingPath: NodePath) => {
          if (visited.has(bindingPath)) return;
          visited.add(bindingPath);
          const statement = bindingPath.findParent(parent => parent.parentPath === path) ?? bindingPath;
          if (!statement.isStatement() && !statement.isImportDeclaration()) return;
          statements.add(statement.node);
          const reference = (name: string, scope: NodePath['scope']) => {
            const binding = scope.getBinding(name);
            if (binding?.scope === path.scope) {
              if (binding.path.parentPath?.isImportDeclaration()) importedReferences.add(name);
              else include(binding.path);
            } else if (!binding && typeDeclarations.has(name)) include(typeDeclarations.get(name)!);
          };
          statement.traverse({
            ReferencedIdentifier: referencePath => reference(referencePath.node.name, referencePath.scope),
            JSXOpeningElement(element) {
              let node = element.node.name;
              while (node.type === 'JSXMemberExpression') node = node.object;
              if (node.type === 'JSXIdentifier') reference(node.name, element.scope);
            },
            TSTypeReference(type) {
              let node = type.node.typeName;
              while (node.type === 'TSQualifiedName') node = node.left;
              reference(node.name, type.scope);
            },
            TSTypeQuery(type) {
              let node = type.node.exprName;
              if (node.type === 'TSImportType') return;
              while (node.type === 'TSQualifiedName') node = node.left;
              reference(node.name, type.scope);
            },
          });
        };
        for (const name of typeof names === 'string' ? [names] : names) {
          const selected = path.scope.getBinding(name);
          if (!selected) throw path.buildCodeFrameError(`Unknown example export: ${name}`);
          include(selected.path);
        }
        path.node.body = path.node.body.filter(
          statement => statements.has(statement) || statement.type === 'ImportDeclaration',
        );
        path.scope.crawl();
        // Demo metadata belongs to the build, not copied application source.
        removeShowcaseMarkers(path.parent as t.File);
        t.traverseFast(path.node, node => {
          for (const key of ['leadingComments', 'innerComments', 'trailingComments'] as const)
            node[key] = node[key]?.filter(comment => !/@demo\b/.test(comment.value));
        });
        for (const statement of path.get('body')) {
          if (!statement.isImportDeclaration()) continue;
          statement.node.trailingComments = statement.node.trailingComments?.filter(
            comment => comment.loc?.start.line === statement.node.loc?.end.line,
          );
          if (!statement.node.specifiers.length) continue;
          for (const specifier of statement.get('specifiers')) {
            if (
              !path.scope.getBinding(specifier.node.local.name)?.referenced &&
              !importedReferences.has(specifier.node.local.name)
            )
              specifier.remove();
          }
          if (!statement.node.specifiers.length) statement.remove();
          else if (['src', '../../src'].includes(statement.node.source.value))
            statement.node.source.value = 'solid-beer';
        }
      },
    },
  };
  const result = await transformFromAstAsync(ast, source, {
    filename,
    configFile: false,
    babelrc: false,
    cloneInputAst: true,
    plugins: [plugin],
  });
  return result!.code!;
};

/** Explicit attributes need Solid's supported type augmentation when copied as standalone TSX. */
export const nativeExampleSource = async (code: string, filename: string) => {
  const attributes = new Map<string, Set<string>>();
  await transformAsync(code, {
    filename,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
    plugins: [
      () => ({
        visitor: {
          JSXElement(path: NodePath<t.JSXElement>) {
            const opening = path.node.openingElement;
            if (opening.name.type !== 'JSXIdentifier') return;
            const tag = opening.name.name;
            const recipe = (Object.values(beerRecipes) as BeerRecipe[]).find(
              recipe => recipe.tag === tag && recipe.attributeBindings,
            );
            if (!recipe) return;
            for (const attribute of opening.attributes)
              if (
                attribute.type === 'JSXAttribute' &&
                attribute.name.type === 'JSXNamespacedName' &&
                attribute.name.namespace.name === 'attr' &&
                recipe.attributeBindings!.includes(attribute.name.name.name)
              ) {
                const name = attribute.name.name.name;
                const types = attributes.get(name) ?? new Set<string>();
                types.add(`IntrinsicElements['${recipe.tag}']['${name}']`);
                attributes.set(name, types);
              }
          },
        },
      }),
    ],
  });
  if (!attributes.size) return code;
  return (
    code +
    `\n\ndeclare module 'solid-js' {\n  namespace JSX {\n    interface ExplicitAttributes {\n${[...attributes]
      .map(([name, types]) => `      ${name}: ${[...types].join(' | ')};`)
      .join('\n')}\n    }\n  }\n}`
  );
};
