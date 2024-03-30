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
}
