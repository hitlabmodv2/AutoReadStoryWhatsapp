const fetch = require("node-fetch");
const colors = require("colors");
const readline = require("readline");

const maskInput = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const stdin = process.openStdin();
    process.stdin.on("data", char => {
      char = char + "";
      switch (char) {
        case "\n": case "\r": case "\u0004":
          stdin.pause();
          break;
        default:
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(query + Array(rl.line.length + 1).join("*"));
          break;
      }
    });
    rl.question(query, value => {
      rl.history = rl.history.slice(1);
      resolve(value);
    });
  });
};

let lastValidCredentials = { username: '', password: '' };
let credentialCheckInterval;

async function verifyCredentials(inputUsername, inputPassword) {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/keamanan.json');
    const data = await response.text();

    const usernameMatch = data.match(/USERNAME=(.*)/);
    const passwordMatch = data.match(/PASSWORD=(.*)/);

    if (!usernameMatch || !passwordMatch) {
      console.log("\n❌ Format kredensial tidak valid di GitHub.".red.bold);
      return false;
    }

    const validUsername = usernameMatch[1].trim();
    const validPassword = passwordMatch[1].trim();

    const isValid = inputUsername === validUsername && inputPassword === validPassword;

    if (isValid) {
      lastValidCredentials = { username: validUsername, password: validPassword };

      // Start credential check interval
      if (!credentialCheckInterval) {
        credentialCheckInterval = setInterval(async () => {
          try {
            const checkResponse = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/keamanan.json');
            const checkData = await checkResponse.text();
            const newUsernameMatch = checkData.match(/USERNAME=(.*)/);
            const newPasswordMatch = checkData.match(/PASSWORD=(.*)/);

            if (newUsernameMatch && newPasswordMatch) {
              const newUsername = newUsernameMatch[1].trim();
              const newPassword = newPasswordMatch[1].trim();

              if (newUsername !== lastValidCredentials.username || newPassword !== lastValidCredentials.password) {
                console.log("\n❌ Kredensial telah diubah di GitHub! Bot akan berhenti.".red.bold);
                console.log("Silakan login ulang dengan kredensial baru.".yellow.bold);
                process.exit(1);
              }
            }
          } catch (error) {
            console.error("Error checking credentials:", error);
          }
        }, 10000); // Check every 10 seconds
      }
    }

    return isValid;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return false;
  }
}

module.exports = { verifyCredentials, maskInput };