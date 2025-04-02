
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'DATA');
const COUNTER_FILE = path.join(DATA_DIR, 'viewed_counter.json');

function initDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadCounter() {
  initDataDirectory();
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = fs.readFileSync(COUNTER_FILE, 'utf8');
      return JSON.parse(data).counter || 0;
    }
  } catch (error) {
    console.error('Error loading counter:', error);
  }
  return 0;
}

function saveCounter(count) {
  initDataDirectory();
  try {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ counter: count }), 'utf8');
  } catch (error) {
    console.error('Error saving counter:', error);
  }
}

module.exports = {
  loadCounter,
  saveCounter
};
