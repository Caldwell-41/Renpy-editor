const [, , command, ...args] = process.argv;

if (command === "version") {
  process.stdout.write("mock-renpy 0.0\n");
} else if (command === "diagnostics") {
  process.stdout.write(JSON.stringify({ severity: "warning", line: 4, args }) + "\n");
} else if (command === "stderr") {
  process.stderr.write(`mock warning ${args.join(" ")}\n`);
} else if (command === "delay") {
  setTimeout(() => process.stdout.write("delayed\n"), 2_000);
} else if (command === "flood") {
  process.stdout.write("x".repeat(131_072));
} else {
  process.stderr.write("denied mock operation\n");
  process.exitCode = 2;
}
