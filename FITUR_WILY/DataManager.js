
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'DATA');
const COUNTER_FILE = path.join(DATA_DIR, 'viewed_counter.json');

function initDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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

module.exports = {
  loadCounter,
  saveCounter
};
