
const fetch = require("node-fetch");
const colors = require("colors");

(async () => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/keamanan.json');
    if (!response.ok) throw new Error('Failed to fetch credentials');
  } catch (error) {
    console.log("\n❌ Gagal mengambil kredensial dari GitHub. Pastikan URL valid.".red.bold);
    process.exit(1);
  }
})();

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

async function verifyCredentials(inputUsername, inputPassword, requireRelogin = false) {
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

    // Start credential check interval after first successful login
    if (!credentialCheckInterval) {
      credentialCheckInterval = setInterval(async () => {
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
      }, 10000); // Check every 10 seconds
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
