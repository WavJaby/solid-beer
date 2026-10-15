import type { NodePath } from '@babel/core';
import type * as t from '@babel/types';

export interface DynamicOption {
  tokens: readonly string[];
  choices: ReadonlyArray<{ value: string | boolean; token: string }>;
}

export type ClassListEntry = { key: string; value: t.Expression };

/** Known keys only; values run once. Hosts add/delete tokens and protect their base class. */
export const classListBaseline = (
  path: NodePath<t.JSXElement>,
  types: typeof t,
  baseline: string | t.Expression,
  entries: readonly ClassListEntry[],
  base?: string,
): string | t.Expression => {
  // Object.entries sorts integer keys; preserve that order without reordering value evaluation.
  const ordered = Object.values(Object.fromEntries(entries.map((entry, index) => [entry.key, { entry, index }])));
  if (typeof baseline === 'string' && entries.every(entry => types.isBooleanLiteral(entry.value))) {
    const tokens = new Set(baseline.split(/\s+/).filter(Boolean));
    for (const { entry } of ordered)
      for (const token of entry.key.split(/\s+/).filter(Boolean))
        (entry.value as t.BooleanLiteral).value ? tokens.add(token) : tokens.delete(token);
    if (base) tokens.add(base);
    return [...tokens].join(' ');
  }
  const parameters = entries.map(() => path.scope.generateUidIdentifier('enabled'));
  const baselineParameter = path.scope.generateUidIdentifier('baseline');
  const dynamicBaseline = typeof baseline !== 'string';
  const args = entries.map(entry => entry.value);
  if (dynamicBaseline) {
    parameters.unshift(baselineParameter);
    args.unshift(baseline);
  }
  const call = (target: t.Expression, method: string, args: t.Expression[]) =>
    types.callExpression(types.memberExpression(target, types.identifier(method)), args);
  const tokens = path.scope.generateUidIdentifier('tokens');
  const statements: t.Statement[] = [
    types.variableDeclaration('const', [
      types.variableDeclarator(
        tokens,
        types.newExpression(types.identifier('Set'), [
          types.tsAsExpression(
            dynamicBaseline
              ? call(call(baselineParameter, 'split', [types.regExpLiteral('\\s+')]), 'filter', [
                  types.identifier('Boolean'),
                ])
              : types.arrayExpression(
                  baseline
                    .split(/\s+/)
                    .filter(Boolean)
                    .map(token => types.stringLiteral(token)),
                ),
            types.tsArrayType(types.tsStringKeyword()),
          ),
        ]),
      ),
    ]),
  ];
  ordered.forEach(({ entry, index }) => {
    for (const token of entry.key.split(/\s+/).filter(Boolean))
      statements.push(
        types.expressionStatement(
          types.conditionalExpression(
            parameters[index + (dynamicBaseline ? 1 : 0)]!,
            call(tokens, 'add', [types.stringLiteral(token)]),
            call(tokens, 'delete', [types.stringLiteral(token)]),
          ),
        ),
      );
  });
  if (base) statements.push(types.expressionStatement(call(tokens, 'add', [types.stringLiteral(base)])));
  statements.push(
    types.returnStatement(
      call(types.arrayExpression([types.spreadElement(tokens)]), 'join', [types.stringLiteral(' ')]),
    ),
  );
  return types.callExpression(types.arrowFunctionExpression(parameters, types.blockStatement(statements)), args);
};

/** Finite typed options -> reactive class expression; expressions run once per class update, never at build time. */
export const dynamicClass = (
  path: NodePath<t.JSXElement>,
  types: typeof t,
  baseline: string | t.Expression,
  expressions: Map<string, t.Expression>,
  options: Record<string, DynamicOption>,
): t.Expression => {
  const parameters: t.Identifier[] = [];
  const arguments_: t.Expression[] = [];
  const fragments: t.Expression[] = [];
  const owned = new Set([...expressions.keys()].flatMap(prop => options[prop]!.tokens));
  const original = typeof baseline === 'string' ? baseline.split(/\s+/).filter(Boolean) : undefined;
  const source = path.scope.generateUidIdentifier('baseline');
  if (!original) {
    parameters.push(source);
    arguments_.push(baseline as t.Expression);
  }
  const select = (tokens: readonly string[], include: boolean): t.Expression => {
    if (original) return types.stringLiteral(original.filter(token => tokens.includes(token) === include).join(' '));
    const token = path.scope.generateUidIdentifier('token');
    const includes = types.callExpression(
      types.memberExpression(
        types.arrayExpression(tokens.map(value => types.stringLiteral(value))),
        types.identifier('includes'),
      ),
      [token],
    );
    return types.callExpression(
      types.memberExpression(
        types.callExpression(
          types.memberExpression(
            types.callExpression(types.memberExpression(source, types.identifier('split')), [
              types.regExpLiteral('\\s+'),
            ]),
            types.identifier('filter'),
          ),
          [types.arrowFunctionExpression([token], include ? includes : types.unaryExpression('!', includes))],
        ),
        types.identifier('join'),
      ),
      [types.stringLiteral(' ')],
    );
  };
  fragments.push(select([...owned], false));
  for (const [prop, expression] of expressions) {
    const option = options[prop]!;
    const parameter = path.scope.generateUidIdentifier(prop);
    parameters.push(parameter);
    arguments_.push(expression);
    const equal = (value: t.Expression) => types.binaryExpression('===', parameter, value);
    const fallback = select(option.tokens, true);
    let selected: t.Expression;
    {
      const message = types.binaryExpression(
        '+',
        types.stringLiteral(`Invalid ${prop}: `),
        types.callExpression(types.memberExpression(types.identifier('JSON'), types.identifier('stringify')), [
          parameter,
        ]),
      );
      selected = types.callExpression(
        types.arrowFunctionExpression(
          [],
          types.blockStatement([types.throwStatement(types.newExpression(types.identifier('Error'), [message]))]),
        ),
        [],
      );
      for (const choice of [...option.choices].reverse())
        selected = types.conditionalExpression(
          equal(
            typeof choice.value === 'boolean' ? types.booleanLiteral(choice.value) : types.stringLiteral(choice.value),
          ),
          types.stringLiteral(choice.token),
          selected,
        );
    }
    fragments.push(
      types.conditionalExpression(equal(types.unaryExpression('void', types.numericLiteral(0))), fallback, selected),
    );
  }
  const call = (target: t.Expression, method: string, args: t.Expression[]) =>
    types.callExpression(types.memberExpression(target, types.identifier(method)), args);
  const fragment = path.scope.generateUidIdentifier('class');
  let body = call(types.arrayExpression(fragments), 'filter', [types.arrowFunctionExpression([fragment], fragment)]);
  body = call(body, 'join', [types.stringLiteral(' ')]);
  return types.callExpression(types.arrowFunctionExpression(parameters, body), arguments_);
};
