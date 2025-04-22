
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'DATA');
const COUNTER_FILE = path.join(DATA_DIR, 'viewed_counter.json');
const RESTART_FILE = path.join(DATA_DIR, 'restart_counter.json');

function initDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESTART_FILE)) {
    fs.writeFileSync(RESTART_FILE, JSON.stringify({ restarts: 0 }), 'utf8');
  }
}

function loadCounter(contact = null) {
  initDataDirectory();
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
      if (contact) {
        data.perContact[contact] = data.perContact[contact] || 0;
        return data.perContact[contact];
      }
      return data.counter || 0;
    }
  } catch (error) {
    console.error('Error loading counter:', error);
  }
  return 0;
}

function saveCounter(count, contact = null) {
  initDataDirectory();
  try {
    const data = fs.existsSync(COUNTER_FILE) ? 
      JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) : 
      { counter: 0, perContact: {} };

    data.counter = count;
    if (contact) {
      data.perContact[contact] = (data.perContact[contact] || 0) + 1;
    }
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving counter:', error);
  }
}

function incrementRestartCounter() {
  try {
    const data = JSON.parse(fs.readFileSync(RESTART_FILE, 'utf8'));
    data.restarts += 1;
    fs.writeFileSync(RESTART_FILE, JSON.stringify(data, null, 2), 'utf8');
    return data.restarts;
  } catch (error) {
    console.error('Error updating restart counter:', error);
    return 0;
  }
}

function saveCredentials(username, password) {
  initDataDirectory();
  const credentialsFile = path.join(DATA_DIR, 'credentials.json');
  try {
    fs.writeFileSync(credentialsFile, JSON.stringify({ username, password }), 'utf8');
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
}

async function checkGithubCredentials() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/keamanan.json');
    const data = await response.text();
    
    const usernameMatch = data.match(/USERNAME=([^\s\n]+)/);
    const passwordMatch = data.match(/PASSWORD=([^\s\n]+)/);
    
    if (!usernameMatch || !passwordMatch) return null;
    
    return {
      username: usernameMatch[1].trim(),
      password: passwordMatch[1].trim()
    };
  } catch (error) {
    console.error('Error fetching GitHub credentials:', error);
    return null;
  }
}

function loadCredentials() {
  const credentialsFile = path.join(DATA_DIR, 'credentials.json');
  try {
    if (fs.existsSync(credentialsFile)) {
      const savedCreds = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
      
      // Check if credentials match with GitHub
      checkGithubCredentials().then(githubCreds => {
        if (githubCreds && 
            (savedCreds.username !== githubCreds.username || 
             savedCreds.password !== githubCreds.password)) {
          // Delete credentials if they don't match
          fs.unlinkSync(credentialsFile);
          console.log("\n" + "╭─".red.bold + "━".repeat(60).red + "─╮".red.bold);
          console.log("│".red.bold + " ❌ PERINGATAN KEAMANAN".padEnd(60).red.bold + "│".red.bold);
          console.log("│".red.bold + "─".repeat(60).red + "│".red.bold);
          console.log("│".red.bold + " Username dan Password telah diubah! Bot akan berhenti.".padEnd(60).red.bold + "│".red.bold);
          console.log("│".red.bold + " Silakan login ulang dengan Username/Password baru.".padEnd(60).yellow.bold + "│".red.bold);
          console.log("╰─".red.bold + "━".repeat(60).red + "─╯".red.bold);
          process.exit(1);
        }
      });
      
      return savedCreds;
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
  return null;
}

function getRestartCount() {
  try {
    const data = JSON.parse(fs.readFileSync(RESTART_FILE, 'utf8'));
    return data.restarts;
  } catch (error) {
    console.error('Error reading restart counter:', error);
    return 0;
  }
}

export {
  loadCounter,
  saveCounter,
  incrementRestartCounter,
  getRestartCount,
  loadCredentials,
  saveCredentials,
  checkGithubCredentials
};
