
import fetch from 'node-fetch';
import colors from 'colors';
import readline from 'readline';

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
                console.log("\n" + "╭─".red.bold + "━".repeat(60).red + "─╮".red.bold);
                console.log("│".red.bold + " ❌ PERINGATAN KEAMANAN".padEnd(60).red.bold + "│".red.bold);
                console.log("│".red.bold + "─".repeat(60).red + "│".red.bold);
                console.log("│".red.bold + " Username dan Password telah diubah! Bot akan berhenti.".padEnd(60).red.bold + "│".red.bold);
                console.log("│".red.bold + " Silakan login ulang dengan Username/Password baru.".padEnd(60).yellow.bold + "│".red.bold);
                console.log("╰─".red.bold + "━".repeat(60).red + "─╯".red.bold);
                process.exit(1);
              }
            }
          } catch (error) {
            console.error("Error checking credentials:", error);
          }
        }, 60000); // Check every 1 minute
      }
    }

    return isValid;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return false;
  }
}

export { verifyCredentials, maskInput };
