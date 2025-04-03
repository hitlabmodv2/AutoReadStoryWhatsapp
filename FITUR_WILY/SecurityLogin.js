// Using dynamic import for node-fetch
let fetch;
(async () => {
  const { default: _fetch } = await import('node-fetch');
  fetch = _fetch;
})();

const readline = require("readline");

const maskInput = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    let password = '';
    process.stdout.write(query);

    process.stdin.on('data', (char) => {
      char = char.toString('utf8');
      switch (char) {
        case '\n': case '\r': case '\u0004':
          process.stdin.pause();
          process.stdout.write('\n');
          rl.close();
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        default:
          password += char;
          process.stdout.write('*');
      }
    });
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