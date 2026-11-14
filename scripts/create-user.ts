// Create a real user account in the database (DATABASE_URL must be set, see .env.example).
//
//   npm run user:create -- --email coach@school.edu --username coach --name "Coach Kim" --role admin
//
// The password is typed at a hidden prompt (or read from the SPORTAL_NEW_PASSWORD environment
// variable for automation). It is hashed before it is stored and is never printed or logged.
// Roles: student_athlete (default; "athlete" still works), coach, university_representative. Pass --role more than once to give several roles.
// The administrator cannot be created here: set ADMIN_EMAIL and ADMIN_PASSWORD (see .env.example) and start the API.

import { createUser, UserInputError } from "../server/auth.server.ts";
import { closeDb } from "../server/db.server.ts";

function parseArgs(argv: string[]) {
  const out: { email?: string; username?: string; name?: string; roles: string[] } = { roles: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--email" && value) (out.email = value), i++;
    else if (flag === "--username" && value) (out.username = value), i++;
    else if (flag === "--name" && value) (out.name = value), i++;
    else if (flag === "--role" && value) out.roles.push(value), i++;
    else {
      console.error(`Unknown or incomplete option: ${flag}`);
      process.exit(2);
    }
  }
  return out;
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      // Piped input: read one line.
      let buf = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => {
        buf += chunk;
        const nl = buf.indexOf("\n");
        if (nl !== -1) {
          stdin.pause();
          resolve(buf.slice(0, nl).replace(/\r$/, ""));
        }
      });
      stdin.on("end", () => resolve(buf.trim()));
      return;
    }
    let pw = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n" || c === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(pw);
          return;
        }
        if (c === "\u0003") process.exit(130); // Ctrl+C
        if (c === "\u007f" || c === "\b") pw = pw.slice(0, -1);
        else pw += c;
      }
    };
    stdin.on("data", onData);
  });
}

const args = parseArgs(process.argv.slice(2));
if (!args.email || !args.username) {
  console.error('Usage: npm run user:create -- --email <email> --username <name> [--name "Display Name"] [--role student_athlete|coach|university_representative]...');
  process.exit(2);
}

const password = process.env["SPORTAL_NEW_PASSWORD"] ?? (await promptHidden("Password (hidden): "));
if (!process.env["SPORTAL_NEW_PASSWORD"]) {
  const again = await promptHidden("Repeat password:   ");
  if (again !== password) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
}

try {
  const user = await createUser({
    email: args.email,
    username: args.username,
    password,
    ...(args.name ? { displayName: args.name } : {}),
    ...(args.roles.length ? { roles: args.roles } : {}),
  });
  console.log(`Created ${user.username} <${user.email}> with role(s): ${user.roles.join(", ")}`);
} catch (err) {
  if (err instanceof UserInputError) {
    console.error(err.message);
    await closeDb();
    process.exit(1);
  }
  await closeDb();
  throw err;
}
await closeDb();
