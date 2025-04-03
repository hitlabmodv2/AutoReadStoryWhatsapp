// Using dynamic import for node-fetch
let fetch;
(async () => {
  const { default: _fetch } = await import('node-fetch');
  fetch = _fetch;
})();

const readline = require("readline");

const maskInput = (query) => {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    let password = '';
    process.stdout.write("Password: ".yellow.bold);

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
          process.stdout.write("Password: ".yellow.bold + "*".repeat(password.length));
      }
    });
  });
};

let lastValidCredentials = { username: '', password: '' };

async function verifyCredentials(inputUsername, inputPassword, requireRelogin = false) {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/UsernamePassword.js');
    const data = await response.text();

    const usernameMatch = data.match(/USERNAME=(.*)/);
    const passwordMatch = data.match(/PASSWORD=(.*)/);

    if (!usernameMatch || !passwordMatch) {
      return false;
    }

    const validUsername = usernameMatch[1].trim();
    const validPassword = passwordMatch[1].trim();

    // Check if credentials have changed
    if (lastValidCredentials.username && lastValidCredentials.password) {
      if (lastValidCredentials.username !== validUsername || lastValidCredentials.password !== validPassword) {
        console.log("\n❌ Kredensial telah diubah oleh owner. Mohon login ulang.".red.bold);
        process.exit(1);
      }
    }

    const isValid = inputUsername === validUsername && inputPassword === validPassword;
    if (isValid) {
      lastValidCredentials = { username: validUsername, password: validPassword };
    }
    return isValid;

  } catch (error) {
    console.error('Error fetching credentials:', error);
    return false;
  }
}

// Add periodic credential check
setInterval(async () => {
  if (lastValidCredentials.username && lastValidCredentials.password) {
    await verifyCredentials(lastValidCredentials.username, lastValidCredentials.password, true);
  }
}, 60000); // Check every minute

module.exports = { verifyCredentials, maskInput };