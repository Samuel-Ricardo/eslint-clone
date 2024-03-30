export default class SyntaxTreeProcessor {
  #filePath;
  #errors = new Map();
  #variables = new Map();
  #messages = {
    singleQuote: () => "use single quotes instead of double quotes",
    useConst: (variableKind) => `use "const" instead of "${variableKind}"`,
    useLet: (variableKind) => `use "let" instead of "${variableKind}"`,
  };
  #stages = {
    declaration: "declaration",
    expressionDeclaration: "expressionDeclaration",
  };
  #variableKinds = {
    const: "const",
    let: "let",
    var: "var",
  };

  constructor(filePath) {
    this.#filePath = filePath;
  }

  #storeError(message, { line, column }) {
    let errorLocation = `${this.#filePath}:${line}:${column + 1}`;
    this.#errors.set(errorLocation, { message, errorLocation });
  }

  #handleLiteral(nodeDeclaration) {
    if (!(nodeDeclaration.raw && typeof nodeDeclaration.value === "string"))
      return;

    if (!nodeDeclaration.raw.includes(`"`)) return;

    this.#storeError(this.#messages.singleQuote(), nodeDeclaration.loc.start);
  }

  #handleVariableDeclaration(nodeDeclaration) {
    let originalKind = nodeDeclaration.kind;

    for (let declaration of nodeDeclaration.declarations) {
      this.#variables.set(declaration.id.name, {
        originalKind,
        stage: this.#stages.declaration,
        nodeDeclaration,
      });
    }
  }

  #handleExpressionStatement(node) {
    let { expression } = node;
    if (!expression.left) return;

    let varName = (expression.left.object || expression.left).name;
    if (!this.#variables.has(varName)) return;

    let variable = this.#variables.get(varName);
    let { nodeDeclaration, originalKind, stage } = variable;

    if (
      expression.left.type === "MemberExpression" &&
      stage === this.#stages.declaration
    ) {
      if (originalKind === this.#variableKinds.const) return;

      this.#storeError(
        this.#messages.useConst(originalKind),
        nodeDeclaration.loc.start,
      );

      nodeDeclaration.kind = this.#variableKinds.const;

      this.#variables.set(varName, {
        ...variable,
        stage: this.#stages.expressionDeclaration,
        nodeDeclaration,
      });

      return;
    }

    if (
      [nodeDeclaration.kind, originalKind].includes(this.#variableKinds.let)
    ) {
      this.#variables.set(varName, {
        ...variable,
        stage: this.#stages.expressionDeclaration,
        nodeDeclaration,
      });

      return;
    }

    this.#storeError(
      this.#messages.useLet(originalKind),
      nodeDeclaration.loc.start,
    );

    nodeDeclaration.kind = this.#variableKinds.let;

    this.#variables.set(varName, {
      ...variable,
      stage: this.#stages.expressionDeclaration,
      nodeDeclaration,
    });

    return;
  }

  #traverse(nodeDeclaration) {
    let hooks = {
      Literal: (node) => this.#handleLiteral(node),
      variableDeclaration: (node) => this.#handleVariableDeclaration(node),
      ExpressionStatement: (node) => this.#handleExpressionStatement(node),
    };

    hooks[nodeDeclaration?.type]?.(nodeDeclaration);

    for (let key in nodeDeclaration) {
      if (typeof nodeDeclaration[key] !== "object") continue;
      this.#traverse(nodeDeclaration[key]);
    }
  }

  #checkDeclarationsThatNeverChanged() {
    [...this.#variables.values()]
      .filter(
        ({ stage, nodeDeclaration }) =>
          stage === this.#stages.declaration &&
          nodeDeclaration.kind !== this.#variableKinds.const,
      )
      .forEach(({ nodeDeclaration }) => {
        this.#storeError(
          this.#messages.useConst(nodeDeclaration.kind),
          nodeDeclaration.loc.start,
        );
        nodeDeclaration.kind = this.#variableKinds.const;
      });
  }
}
