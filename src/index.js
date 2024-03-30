import { parseArgs } from "node:util";

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
