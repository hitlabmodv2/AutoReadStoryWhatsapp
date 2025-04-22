
const handleAutoOnline = async (sock, msg, config) => {
  try {
    if (msg.key && msg.key.remoteJid) {
      // If autoOnline is false, set presence to unavailable
      await sock.sendPresenceUpdate(config.autoOnline ? 'available' : 'unavailable', msg.key.remoteJid);
    }
  } catch (error) {
    console.error('Error in handleAutoOnline:', error);
  }
};

export {
  handleAutoOnline
};
