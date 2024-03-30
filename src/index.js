import { parseArgs } from "node:util";
import path from "node:path";
import fs from "node:fs";
import * as espree from "espree";
import SyntaxTreeProcessor from "./syntaxTreeProcessor.js";
import Reporter from "./reporter.js";

function getFilePathFromCLI() {
  try {
    const {
      values: { file },
    } = parseArgs({
      options: {
        file: {
          type: "string",
          alias: "f",
        },
      },
    });
    if (!file) throw new Error("No file provided");
    return file;
  } catch (error) {
    console.error(
      chalk.red(
        "Error: Please provide a valid file path as an argument using -f or --file",
      ),
    );
    process.exit(1);
  }
}

const filePath = getFilePathFromCLI();
const outputFilePath = path.join(
  process.cwd(),
  `${path.basename(filePath, ".js")}.linted.js`,
);

const code = fs.readFileSync(filePath, "utf8");
const ast = espree.parse(code, {
  ecmaVersion: 2024,
  loc: true,
  sourceType: "module",
});

const processor = new SyntaxTreeProcessor(filePath);
const errors = processor.process(ast);

Reporter.report({
  errors,
  ast,
  outputFilePath,
});
