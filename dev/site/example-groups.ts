import { parseAsync, transformFromAstAsync, type NodePath } from '@babel/core';
import * as t from '@babel/types';
import { basename } from 'node:path';
import { showcaseRegion, removeShowcaseMarkers } from './example-showcase';

type ExampleMode = 'showcase' | 'interactive' | 'both';
const exampleMode = (node: t.Node, name: string): ExampleMode => {
  const mode = node.leadingComments
    ?.map(comment => comment.value.match(/@demo\s+(showcase|interactive)\b/)?.[1])
    .find(Boolean);
  if (mode !== 'showcase' && mode !== 'interactive')
    throw new Error(`${name}: add // @demo showcase or // @demo interactive before the export`);
  return mode;
};

/** Vite server/build only: copied API + Native source use the same compiler as the live preview. */
export const compileDemoGroups = async (source: string, filename: string) => {
  const originalAst = (await parseAsync(source, {
    filename,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
  }))!;
  const modes = new Map<string, ExampleMode>();
  const groups = new Map<string, string[]>();
  const showcases = new Map<string, t.File>();
  let sourceId: t.Identifier;
  let optionId: t.Identifier;
  let program: NodePath<t.Program>;
  let changed = false;
  let usesOptions = false;
  const result = await transformFromAstAsync(originalAst, source, {
    filename,
    configFile: false,
    babelrc: false,
    cloneInputAst: true,
    sourceMaps: true,
    plugins: [
      () => ({
        visitor: {
          Program: {
            enter(path: NodePath<t.Program>) {
              program = path;
              sourceId = path.scope.generateUidIdentifier('demoSources');
              optionId = path.scope.generateUidIdentifier('optionCode');
              for (const statement of path.node.body) {
                if (!t.isExportNamedDeclaration(statement) || !t.isVariableDeclaration(statement.declaration)) continue;
                for (const declaration of statement.declaration.declarations) {
                  if (!t.isIdentifier(declaration.id) || !declaration.id.name.endsWith('Example')) continue;
                  const name = declaration.id.name;
                  const mode = exampleMode(statement, name);
                  const fn = declaration.init;
                  const region = t.isArrowFunctionExpression(fn) ? showcaseRegion(fn, name) : undefined;
                  if (region && mode !== 'interactive')
                    throw new Error(name + ': marked regions require @demo interactive');
                  modes.set(name, region ? 'both' : mode);
                  if (region && t.isArrowFunctionExpression(fn) && t.isBlockStatement(fn.body)) {
                    showcases.set(
                      name,
                      t.file(
                        t.program([
                          ...path.node.body
                            .filter(node => t.isImportDeclaration(node))
                            .map(node => t.cloneNode(node, true)),
                          t.exportNamedDeclaration(
                            t.variableDeclaration('const', [
                              t.variableDeclarator(
                                t.identifier(name),
                                t.arrowFunctionExpression([t.identifier('props')], region.tree),
                              ),
                            ]),
                          ),
                        ]),
                      ),
                    );
                    const returned = fn.body.body.filter((node): node is t.ReturnStatement =>
                      t.isReturnStatement(node),
                    );
                    if (returned.length !== 1 || !returned[0]!.argument)
                      throw new Error(name + ': marked usage requires one top-level return');
                    const capture = path.scope.generateUidIdentifier('demo');
                    fn.params = [capture];
                    const metadata = t.memberExpression(sourceId, t.identifier(name));
                    fn.body.body.splice(
                      fn.body.body.indexOf(returned[0]!),
                      0,
                      t.expressionStatement(
                        t.callExpression(t.memberExpression(capture, t.identifier('__capture')), [
                          t.objectExpression(
                            ['api', 'native'].map(field =>
                              t.objectProperty(
                                t.identifier(field),
                                t.arrowFunctionExpression(
                                  [],
                                  t.callExpression(t.memberExpression(metadata, t.identifier(field + 'Template')), [
                                    t.cloneNode(region.values, true),
                                  ]),
                                ),
                              ),
                            ),
                          ),
                        ]),
                      ),
                    );
                    returned[0]!.argument = t.arrowFunctionExpression([], returned[0]!.argument as t.Expression);
                  }
                  groups.set(name, [name]);
                }
              }
              removeShowcaseMarkers(path.parent as t.File);
            },
            exit() {
              if (!changed) return;
              program.unshiftContainer(
                'body',
                t.importDeclaration(
                  [t.importDefaultSpecifier(sourceId)],
                  t.stringLiteral(`./${basename(filename)}?examples`),
                ),
              );
              if (usesOptions)
                program.unshiftContainer(
                  'body',
                  t.importDeclaration(
                    [
                      t.importSpecifier(optionId, t.identifier('optionCode')),
                      t.importSpecifier(t.identifier('joinExampleCode'), t.identifier('joinExampleCode')),
                    ],
                    t.stringLiteral('../site/example'),
                  ),
                );
            },
          },
          JSXElement(path: NodePath<t.JSXElement>) {
            const opening = path.node.openingElement;
            if (!t.isJSXIdentifier(opening.name)) return;
            const binding = path.scope.getBinding(opening.name.name);
            if (
              !binding?.path.isImportSpecifier() ||
              !t.isIdentifier(binding.path.node.imported, { name: 'DemoGroup' })
            )
              return;
            const declaration = binding.path.parentPath;
            if (!declaration?.isImportDeclaration() || !declaration.node.source.value.endsWith('/site/Demo')) return;
            const interactive = opening.attributes.find(
              attr => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'interactive' }),
            );
            if (interactive)
              throw path.buildCodeFrameError('Remove DemoGroup interactive; mark its example showcase region instead');
            const interactiveProperties = (name: string, usage: t.Expression) =>
              ['api', 'native'].map(field => {
                const value = t.memberExpression(t.memberExpression(sourceId, t.identifier(name)), t.identifier(field));
                return t.objectMethod(
                  'get',
                  t.identifier(field === 'api' ? 'interactiveCode' : 'interactiveNativeCode'),
                  [],
                  t.blockStatement([
                    t.returnStatement(
                      t.logicalExpression(
                        '&&',
                        t.cloneNode(value),
                        t.binaryExpression(
                          '+',
                          t.binaryExpression('+', value, t.stringLiteral('\n\n')),
                          t.cloneNode(usage, true),
                        ),
                      ),
                    ),
                  ]),
                );
              });
            const names: string[] = [];
            const groupModes: ExampleMode[] = [];
            const usages: t.Expression[] = [];
            const entriesId = path.scope.generateUidIdentifier('entries');
            const entries = path.node.children
              .filter(
                child =>
                  !(t.isJSXText(child) && !child.value.trim()) &&
                  !(t.isJSXExpressionContainer(child) && t.isJSXEmptyExpression(child.expression)),
              )
              .map(child => {
                if (!t.isJSXElement(child) || !t.isJSXIdentifier(child.openingElement.name))
                  throw path.buildCodeFrameError('DemoGroup requires direct example components');
                const name = child.openingElement.name.name;
                if (!name.endsWith('Example'))
                  throw path.buildCodeFrameError('Example component names must end with Example');
                names.push(name);
                const example = path.scope.getBinding(name);
                if (!example || example.scope !== program.scope || !example.path.isVariableDeclarator())
                  throw path.buildCodeFrameError(`Define ${name} as a module-level example component`);
                if (!example.path.parentPath?.parentPath?.isExportNamedDeclaration())
                  throw path.buildCodeFrameError(`Export ${name} so its source can be extracted`);
                const mode = modes.get(name)!;
                groupModes.push(mode);
                if (child.children.some(node => !t.isJSXText(node) || node.value.trim()))
                  throw path.buildCodeFrameError('Move example children inside the example component');
                let usage: t.Expression = t.stringLiteral(`<${name}`);
                const optionValues: t.ObjectProperty[] = [];
                for (const attribute of child.openingElement.attributes) {
                  if (!t.isJSXAttribute(attribute) || !t.isJSXIdentifier(attribute.name))
                    throw path.buildCodeFrameError('Move spreads and namespaced props inside the example component');
                  // Preview callbacks stay live; showcase copies contain only selected scalar options.
                  if (mode === 'showcase' && attribute.name.name.startsWith('on')) continue;
                  const value = attribute.value;
                  const expression =
                    value === null
                      ? t.booleanLiteral(true)
                      : t.isStringLiteral(value)
                      ? t.stringLiteral(value.value)
                      : t.isJSXExpressionContainer(value) && t.isExpression(value.expression)
                      ? value.expression
                      : null;
                  if (
                    !expression ||
                    t.isFunction(expression) ||
                    t.isObjectExpression(expression) ||
                    t.isArrayExpression(expression)
                  )
                    throw path.buildCodeFrameError('Move complex props inside the example component');
                  usesOptions = true;
                  optionValues.push(
                    t.objectProperty(t.stringLiteral(attribute.name.name), t.cloneNode(expression, true)),
                  );
                  usage = t.binaryExpression(
                    '+',
                    usage,
                    t.callExpression(optionId, [t.stringLiteral(attribute.name.name), t.cloneNode(expression, true)]),
                  );
                }
                usage = t.binaryExpression('+', usage, t.stringLiteral(' />'));
                usages.push(usage);
                const metadata = () => t.memberExpression(sourceId, t.identifier(name));
                const code = (field: string) =>
                  mode !== 'interactive'
                    ? t.callExpression(t.memberExpression(metadata(), t.identifier(field + 'Template')), [
                        t.objectExpression(optionValues.map(value => t.cloneNode(value, true))),
                      ])
                    : t.binaryExpression(
                        '+',
                        t.binaryExpression(
                          '+',
                          t.memberExpression(metadata(), t.identifier(field)),
                          t.stringLiteral('\n\n'),
                        ),
                        t.cloneNode(usage, true),
                      );
                const capture = path.scope.generateUidIdentifier('source');
                const view = path.scope.generateUidIdentifier('view');
                const live = t.cloneNode(child, true);
                if (mode === 'both')
                  live.openingElement.attributes.push(
                    t.jsxAttribute(
                      t.jsxIdentifier('__capture'),
                      t.jsxExpressionContainer(
                        t.arrowFunctionExpression(
                          [t.identifier('value')],
                          t.assignmentExpression('=', capture, t.identifier('value')),
                        ),
                      ),
                    ),
                  );
                const displayed = (field: string) =>
                  mode === 'both'
                    ? t.callExpression(t.memberExpression(capture, t.identifier(field)), [])
                    : code(field);
                const object = t.objectExpression([
                  ...(mode === 'both' ? interactiveProperties(name, usage) : []),
                  t.objectProperty(
                    t.identifier('render'),
                    mode === 'both'
                      ? t.arrowFunctionExpression(
                          [],
                          t.callExpression(
                            t.logicalExpression('??', view, t.assignmentExpression('=', view, live)),
                            [],
                          ),
                        )
                      : t.arrowFunctionExpression([], live),
                  ),
                  t.objectMethod(
                    'get',
                    t.identifier('code'),
                    [],
                    t.blockStatement([t.returnStatement(displayed('api'))]),
                  ),
                  t.objectMethod(
                    'get',
                    t.identifier('nativeCode'),
                    [],
                    t.blockStatement([
                      t.returnStatement(
                        mode !== 'interactive'
                          ? displayed('native')
                          : t.logicalExpression(
                              '&&',
                              t.memberExpression(metadata(), t.identifier('native')),
                              code('native'),
                            ),
                      ),
                    ]),
                  ),
                ]);
                return mode === 'both'
                  ? t.callExpression(
                      t.arrowFunctionExpression(
                        [],
                        t.blockStatement([
                          t.variableDeclaration('let', [t.variableDeclarator(capture), t.variableDeclarator(view)]),
                          t.returnStatement(object),
                        ]),
                      ),
                      [],
                    )
                  : object;
              });
            if (!entries.length) throw path.buildCodeFrameError('DemoGroup requires at least one example');
            if (names.length > 1 && groupModes.some(mode => mode !== 'showcase')) groups.set(names.join('+'), names);
            path.scope.push({ id: entriesId, init: t.arrayExpression(entries), kind: 'const' });
            opening.attributes.push(t.jsxAttribute(t.jsxIdentifier('entries'), t.jsxExpressionContainer(entriesId)));
            const metadata = () => t.memberExpression(sourceId, t.stringLiteral(names.join('+')), true);
            const groupCode = (field: string) => {
              const body = usages.reduce<t.Expression>(
                (code, usage) =>
                  t.binaryExpression(
                    '+',
                    t.binaryExpression('+', code, t.stringLiteral('\n')),
                    t.cloneNode(usage, true),
                  ),
                t.stringLiteral(usages.length > 1 ? '<>' : ''),
              );
              const usage = usages.length > 1 ? t.binaryExpression('+', body, t.stringLiteral('\n</>')) : body;
              const fallback = t.binaryExpression(
                '+',
                t.binaryExpression('+', t.memberExpression(metadata(), t.identifier(field)), t.stringLiteral('\n')),
                usage,
              );
              usesOptions = true;
              return groupModes.every(mode => mode !== 'interactive')
                ? t.callExpression(t.identifier('joinExampleCode'), [
                    t.callExpression(t.memberExpression(entriesId, t.identifier('map')), [
                      t.arrowFunctionExpression(
                        [t.identifier('entry')],
                        t.memberExpression(
                          t.identifier('entry'),
                          t.identifier(field === 'api' ? 'code' : 'nativeCode'),
                        ),
                      ),
                    ]),
                  ])
                : fallback;
            };
            opening.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier('source'),
                t.jsxExpressionContainer(
                  t.objectExpression([
                    ...(groupModes.every(mode => mode === 'both')
                      ? ['api', 'native'].map(field =>
                          t.objectMethod(
                            'get',
                            t.identifier(field === 'api' ? 'interactiveCode' : 'interactiveNativeCode'),
                            [],
                            t.blockStatement([
                              t.returnStatement(
                                t.logicalExpression(
                                  '&&',
                                  t.memberExpression(metadata(), t.identifier(field)),
                                  t.binaryExpression(
                                    '+',
                                    t.memberExpression(metadata(), t.identifier(field)),
                                    t.stringLiteral(
                                      '\n\n' +
                                        (names.length > 1 ? '<>\n' : '') +
                                        names.map(name => '<' + name + ' />').join('\n') +
                                        (names.length > 1 ? '\n</>' : ''),
                                    ),
                                  ),
                                ),
                              ),
                            ]),
                          ),
                        )
                      : []),
                    t.objectMethod(
                      'get',
                      t.identifier('code'),
                      [],
                      t.blockStatement([t.returnStatement(groupCode('api'))]),
                    ),
                    t.objectMethod(
                      'get',
                      t.identifier('nativeCode'),
                      [],
                      t.blockStatement([
                        t.returnStatement(
                          groupModes.every(mode => mode !== 'interactive')
                            ? groupCode('native')
                            : t.logicalExpression(
                                '&&',
                                t.memberExpression(metadata(), t.identifier('native')),
                                groupCode('native'),
                              ),
                        ),
                      ]),
                    ),
                  ]),
                ),
              ),
            );
            path.node.children = [];
            opening.selfClosing = true;
            path.node.closingElement = null;
            changed = true;
            path.skip();
          },
        },
      }),
    ],
  });
  return changed ? { code: result!.code!, map: result!.map, modes, groups, showcases, originalAst } : null;
};
