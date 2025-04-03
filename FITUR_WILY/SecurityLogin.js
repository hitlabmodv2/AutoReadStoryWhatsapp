// Using dynamic import for node-fetch
let fetch;
(async () => {
  const { default: _fetch } = await import('node-fetch');
  fetch = _fetch;
})();

const readline = require("readline");
let currentCredentials = { username: '', password: '' };

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

async function checkCredentials() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/UsernamePassword.js');
    const data = await response.text();

    const usernameMatch = data.match(/USERNAME=(.*)/);
    const passwordMatch = data.match(/PASSWORD=(.*)/);

    if (!usernameMatch || !passwordMatch) return null;

    const newUsername = usernameMatch[1].trim();
    const newPassword = passwordMatch[1].trim();

    if (currentCredentials.username && 
        (currentCredentials.username !== newUsername || 
         currentCredentials.password !== newPassword)) {
      console.log("\n❌ Kredensial telah diubah! Menggunakan kredensial baru...".red.bold);
      currentCredentials = { username: newUsername, password: newPassword };
      process.exit(1);
    }

    return { username: newUsername, password: newPassword };
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return null;
  }
}

async function verifyCredentials(inputUsername, inputPassword) {
  const credentials = await checkCredentials();
  if (!credentials) return false;

  const isValid = inputUsername === credentials.username && 
                  inputPassword === credentials.password;

  if (isValid) {
    currentCredentials = credentials;
    // Start credential check interval
    setInterval(checkCredentials, 5000); // Check every 5 seconds
  }

  return isValid;
}

module.exports = { verifyCredentials, maskInput };