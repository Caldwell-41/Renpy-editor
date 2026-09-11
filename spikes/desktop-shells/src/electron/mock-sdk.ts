const [, , command, ...args] = process.argv;

if (command === "version") {
  process.stdout.write("mock-renpy 0.0\n");
} else if (command === "diagnostics") {
  process.stdout.write(JSON.stringify({ severity: "warning", line: 4, args }) + "\n");
} else {
  process.stderr.write("denied mock operation\n");
  process.exitCode = 2;
}
