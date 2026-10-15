import * as t from '@babel/types';

/** One marked JSX subtree; capture scalar attributes in its existing state scope. */
export const showcaseRegion = (fn: t.ArrowFunctionExpression, name: string) => {
  const regions: t.JSXElement[] = [];
  t.traverseFast(fn.body, node => {
    if (
      t.isJSXElement(node) &&
      node.openingElement.attributes.some(
        attr => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'data-demo-showcase' }),
      )
    )
      regions.push(node);
  });
  if (!regions.length) return;
  if (regions.length !== 1 || fn.params.length || !t.isBlockStatement(fn.body))
    throw new Error(`${name}: showcase usage requires one marked JSX region in a zero-argument block function`);
  const tree = t.cloneNode(regions[0]!, true);
  const values: t.ObjectProperty[] = [];
  t.traverseFast(tree, node => {
    if (t.isJSXSpreadAttribute(node) || t.isJSXSpreadChild(node))
      throw new Error(`${name}: showcase regions cannot contain spreads`);
    if (t.isJSXOpeningElement(node)) {
      node.attributes = node.attributes.filter(attr => {
        if (!t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name))
          throw new Error(`${name}: showcase regions require ordinary named attributes`);
        if (attr.name.name === 'ref') throw new Error(`${name}: showcase regions cannot contain refs`);
        return attr.name.name !== 'data-demo-showcase' && !attr.name.name.startsWith('on');
      });
    }
    if (
      t.isJSXExpressionContainer(node) &&
      t.isExpression(node.expression) &&
      !t.isStringLiteral(node.expression) &&
      !t.isNumericLiteral(node.expression) &&
      !t.isBooleanLiteral(node.expression) &&
      !t.isNullLiteral(node.expression)
    ) {
      const key = `value${values.length}`;
      values.push(t.objectProperty(t.identifier(key), t.cloneNode(node.expression, true)));
      node.expression = t.memberExpression(t.identifier('props'), t.identifier(key));
    }
  });
  return { tree, values: t.objectExpression(values) };
};

export const removeShowcaseMarkers = (ast: t.File) => {
  t.traverseFast(ast, node => {
    if (t.isJSXOpeningElement(node))
      node.attributes = node.attributes.filter(
        attr => !t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name, { name: 'data-demo-showcase' }),
      );
  });
};
