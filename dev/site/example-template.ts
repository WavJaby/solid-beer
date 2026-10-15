import { transformAsync, transformFromAstAsync } from '@babel/core';
import * as t from '@babel/types';
import { beerRecipes, type BeerComponentName, type BeerRecipe } from '../../src/appearance';
import { compileSolidBeer } from '../../src/vite';

/** Only closed, stateless JSX trees specialize; unknown calls/bindings retain executable source. */
export const exampleTemplate = async (ast: t.File, filename: string, name: string) => {
  const program = ast.program;
  const imports = new Map<string, string>();
  for (const node of program.body)
    if (t.isImportDeclaration(node) && ['solid-beer', 'src', '../../src'].includes(node.source.value))
      for (const specifier of node.specifiers)
        if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported))
          imports.set(specifier.local.name, specifier.imported.name);
  const declaration = program.body
    .flatMap(node =>
      t.isExportNamedDeclaration(node) && t.isVariableDeclaration(node.declaration)
        ? node.declaration.declarations
        : [],
    )
    .find(node => t.isIdentifier(node.id, { name }));
  if (!declaration || !t.isArrowFunctionExpression(declaration.init)) return;
  const fn = declaration.init;
  const parameter = fn.params[0];
  const id = t.isIdentifier(parameter)
    ? parameter
    : t.isAssignmentPattern(parameter) && t.isIdentifier(parameter.left)
    ? parameter.left
    : undefined;
  const safe = (node: t.Node): boolean => {
    if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node) || t.isNullLiteral(node))
      return true;
    if (t.isIdentifier(node, { name: 'undefined' })) return true;
    if (t.isMemberExpression(node))
      return !node.computed && !!id && t.isIdentifier(node.object, { name: id.name }) && t.isIdentifier(node.property);
    if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) return safe(node.left) && safe(node.right);
    if (t.isUnaryExpression(node)) return ['!', '+', '-'].includes(node.operator) && safe(node.argument);
    if (t.isConditionalExpression(node)) return safe(node.test) && safe(node.consequent) && safe(node.alternate);
    if (t.isTemplateLiteral(node)) return node.expressions.every(safe);
    if (t.isArrayExpression(node))
      return node.elements.every(item => item !== null && !t.isSpreadElement(item) && safe(item));
    if (t.isObjectExpression(node))
      return node.properties.every(
        item => t.isObjectProperty(item) && !item.computed && !item.shorthand && safe(item.value),
      );
    return false;
  };
  const body =
    t.isBlockStatement(fn.body) && fn.body.body.length === 1 && t.isReturnStatement(fn.body.body[0])
      ? fn.body.body[0].argument
      : fn.body;
  if (!t.isJSXElement(body) && !t.isJSXFragment(body)) return;
  const used = new Map<string, string>();
  const concat = (parts: t.Expression[]) => parts.reduce((a, b) => t.binaryExpression('+', a, b), t.stringLiteral(''));
  const render = (node: t.JSXElement | t.JSXFragment, native: boolean, depth = 0): t.Expression | undefined => {
    const children: t.Expression[] = [];
    for (const child of node.children) {
      if (t.isJSXText(child)) {
        const text = child.value.includes('\n')
          ? child.value
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(Boolean)
              .join(' ')
          : child.value;
        if (text) children.push(t.stringLiteral(text));
      } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
        const result = render(child, native, depth + 1);
        if (!result) return;
        children.push(result);
      } else if (t.isJSXExpressionContainer(child) && t.isJSXEmptyExpression(child.expression)) continue;
      else if (t.isJSXExpressionContainer(child) && safe(child.expression))
        children.push(
          t.callExpression(t.identifier('exampleText'), [t.cloneNode(child.expression as t.Expression, true)]),
        );
      else return;
    }
    const multiline =
      t.isJSXFragment(node) || node.children.some(child => t.isJSXElement(child) || t.isJSXFragment(child));
    const content =
      multiline && children.length
        ? children
            .flatMap(child => [t.stringLiteral('\n' + '  '.repeat(depth + 1)), child])
            .concat(t.stringLiteral('\n' + '  '.repeat(depth)))
        : children;
    if (t.isJSXFragment(node)) return concat([t.stringLiteral('<>'), ...content, t.stringLiteral('</>')]);
    if (!t.isJSXIdentifier(node.openingElement.name)) return;
    const local = node.openingElement.name.name;
    const imported = imports.get(local);
    const recipe: BeerRecipe | undefined = imported ? beerRecipes[imported as BeerComponentName] : undefined;
    if ((imported && !recipe) || (!imported && !/^[a-z]/.test(local))) return;
    if (imported && !native) used.set(local, imported);
    const attributes: t.ObjectProperty[] = [];
    for (const attr of node.openingElement.attributes) {
      if (!t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name) || ['ref', 'children'].includes(attr.name.name))
        return;
      const value =
        attr.value === null
          ? t.booleanLiteral(true)
          : t.isStringLiteral(attr.value)
          ? attr.value
          : t.isJSXExpressionContainer(attr.value)
          ? attr.value.expression
          : undefined;
      if (!value || (!native && !safe(value))) return;
      // Showcase copies omit forwarded callbacks; inline handlers require interactive source.
      if (attr.name.name.startsWith('on')) {
        if (!safe(value) || !t.isMemberExpression(value)) return;
        continue;
      }
      attributes.push(t.objectProperty(t.stringLiteral(attr.name.name), t.cloneNode(value as t.Expression, true)));
    }
    const tag = local;
    const props = t.callExpression(t.identifier('exampleAttributes'), [
      t.objectExpression(attributes),
      !native && recipe ? t.valueToNode(recipe) : t.identifier('undefined'),
    ]);
    return concat([
      t.stringLiteral(`<${tag}`),
      props,
      t.stringLiteral(node.openingElement.selfClosing ? ' />' : '>'),
      ...content,
      ...(node.openingElement.selfClosing ? [] : [t.stringLiteral(`</${tag}>`)]),
    ]);
  };
  const api = render(body, false);
  if (!api) return;
  // Native templates render compiler output; no second recipe-to-DOM implementation.
  const selected = t.file(
    t.program([
      ...(used.size
        ? [
            t.importDeclaration(
              [...used].map(([local, imported]) => t.importSpecifier(t.identifier(local), t.identifier(imported))),
              t.stringLiteral('solid-beer'),
            ),
          ]
        : []),
      t.exportNamedDeclaration(
        t.variableDeclaration('const', [t.variableDeclarator(t.identifier(name), t.cloneNode(fn, true))]),
      ),
    ]),
  );
  t.traverseFast(selected, node => {
    if (t.isJSXOpeningElement(node))
      node.attributes = node.attributes.filter(
        attr => !t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name) || !attr.name.name.startsWith('on'),
      );
  });
  const selectedCode = await transformFromAstAsync(selected, undefined, { configFile: false, babelrc: false });
  const compiled = await compileSolidBeer(selectedCode!.code!, filename, { warnClassHelpers: false });
  if (!compiled.report.nativeAvailable) return;
  const nativeAst = await transformAsync(compiled.code, {
    filename,
    configFile: false,
    babelrc: false,
    ast: true,
    code: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
  });
  const nativeFn = nativeAst!
    .ast!.program.body.flatMap(node =>
      t.isExportNamedDeclaration(node) && t.isVariableDeclaration(node.declaration)
        ? node.declaration.declarations
        : [],
    )
    .find(node => t.isIdentifier(node.id, { name }))?.init;
  if (!t.isArrowFunctionExpression(nativeFn) || (!t.isJSXElement(nativeFn.body) && !t.isJSXFragment(nativeFn.body)))
    return;
  // Fully specialized snippets use ordinary attributes; live JSX keeps attr:value/max.
  t.traverseFast(nativeFn.body, node => {
    if (t.isJSXAttribute(node) && t.isJSXNamespacedName(node.name) && node.name.namespace.name === 'attr')
      node.name = t.jsxIdentifier(node.name.name.name);
  });
  const native = render(nativeFn.body, true);
  if (!native) return;
  const prefix = used.size
    ? `import { ${[...used]
        .map(([local, imported]) => (local === imported ? local : `${imported} as ${local}`))
        .join(', ')} } from 'solid-beer';\n\n`
    : '';
  const templates = t.objectExpression([
    t.objectProperty(
      t.identifier('apiTemplate'),
      t.arrowFunctionExpression(
        [id ? t.identifier(id.name) : t.identifier('props')],
        concat([t.stringLiteral(prefix), api]),
      ),
    ),
    t.objectProperty(
      t.identifier('nativeTemplate'),
      t.arrowFunctionExpression([id ? t.identifier(id.name) : t.identifier('props')], native),
    ),
  ]);
  const result = await transformFromAstAsync(t.file(t.program([t.expressionStatement(templates)])), undefined, {
    configFile: false,
    babelrc: false,
  });
  return result!.code!.replace(/^\(/, '').replace(/\);?$/, '');
};
