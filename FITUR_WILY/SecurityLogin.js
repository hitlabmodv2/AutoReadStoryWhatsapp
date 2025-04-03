// Using dynamic import for node-fetch
let fetch;
(async () => {
  const { default: _fetch } = await import('node-fetch');
  fetch = _fetch;
})();

const readline = require("readline");

const maskInput = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (stringToWrite === query) {
        rl.output.write(stringToWrite);
      } else {
        rl.output.write('*');
      }
    };
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