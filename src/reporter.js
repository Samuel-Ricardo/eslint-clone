import chalk from "chalk";
import * as astring from "astring";
import fs from "node:fs";
import path from "node:path";

export default class Reporter {
  static report({ errors, ast, outputFilePath }) {
    errors
      .sort((error1, error2) => {
        const [aLine, aColumn] = error1.errorLocation.split(":").slice(1);
        const [bLine, bColumn] = error2.errorLocation.split(":").slice(1);

        if (aLine !== bLine) return aLine - bLine;
        return aColumn - bColumn;
      })
      .forEach(({ message, errorLocation }) => {
        const errorMessage = `${chalk.red("Error: ")} ${message}`;
        const finalMessage = `${errorMessage}\n${chalk.gray(errorLocation)}`;

        console.error(finalMessage);
      });

    const updateCode = astring.generate(ast);
    fs.writeFileSync(outputFilePath, updateCode, "utf-8");

    if (!errors.length) {
      console.log(chalk.green("\nLinting completed without errors."));
    } else {
      console.log(
        chalk.red(`\nLinting completed with ${errors.length} errors.`),
      );
    }
    console.log(
      chalk.green("\nCode fixed and saved at"),
      chalk.yellow("./" + path.basename(outputFilePath)),
      chalk.green("successfully!"),
    );
  }
}
