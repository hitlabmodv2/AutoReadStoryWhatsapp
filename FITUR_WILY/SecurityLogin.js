// Using dynamic import for node-fetch
let fetch;
(async () => {
  const { default: _fetch } = await import('node-fetch');
  fetch = _fetch;
})();

const readline = require("readline");

const maskInput = (query) => {
  return new Promise((resolve) => {
    console.log("\n" + "╭─".cyan.bold + "━".repeat(60).cyan + "─╮".cyan.bold);
    console.log("│".cyan.bold + " LOGIN SECURITY".padEnd(60).yellow.bold + "│".cyan.bold);
    console.log("│".cyan.bold + "─".repeat(60).cyan + "│".cyan.bold);
    console.log("│".cyan.bold + ` ${query}`.padEnd(60).white + "│".cyan.bold);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    let password = '';
    process.stdout.write("│".cyan.bold + " Password: ".padEnd(60).white + "│".cyan.bold + "\r");
    process.stdout.write("│".cyan.bold + " Password: ".white);

    stdin.on('data', (char) => {
      const charStr = char.toString();
      switch (charStr) {
        case '\r':
        case '\n':
          process.stdout.write('\n');
          stdin.setRawMode(false);
          stdin.pause();
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u0008': // Backspace
        case '\u007F': // Delete
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += charStr;
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write("│".cyan.bold + " Password: ".white + password + " ".repeat(49 - password.length) + "│".cyan.bold);
      }
    });

    console.log("\n" + "╰─".cyan.bold + "━".repeat(60).cyan + "─╯".cyan.bold);
  });
};

async function verifyCredentials(inputUsername, inputPassword) {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/UsernamePassword.js');
    const data = await response.text();

    // Extract credentials from response
    const usernameMatch = data.match(/USERNAME=(.*)/);
    const passwordMatch = data.match(/PASSWORD=(.*)/);

    if (!usernameMatch || !passwordMatch) {
      return false;
    }

    const validUsername = usernameMatch[1].trim();
    const validPassword = passwordMatch[1].trim();

    return inputUsername === validUsername && inputPassword === validPassword;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return false;
  }
}

module.exports = { verifyCredentials, maskInput };