import { Node, SyntaxKind, Type } from 'ts-morph'

const { ExportAssignment, Identifier, FunctionDeclaration, ArrowFunction } =
  SyntaxKind

/**
 * Exteracts the return type of a function, if any.
 * Supports:
 * - function declaration `function foo() {}`
 * - function expression `const foo = function() {}`
 * - arrow functions `const foo = () => {}`
 * - module exports
 */
export function getReturnType(node?: Node): Type | undefined {
  switch (node?.getKind()) {
    case ExportAssignment:
      return getReturnType(node.asKind(ExportAssignment)?.getExpression())
    case Identifier:
      return getReturnType(node.getSymbol()?.getValueDeclaration())
    case FunctionDeclaration:
      return node.asKind(FunctionDeclaration)?.getReturnType()
    case ArrowFunction:
      return node.asKind(ArrowFunction)?.getReturnType()
  }
}
