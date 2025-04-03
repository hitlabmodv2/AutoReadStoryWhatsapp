
const handleAutoRecord = async (sock, msg, config) => {
  try {
    if (!config.autoRecord) return;
    
    if (msg.key && msg.key.remoteJid) {
      await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
    }
  } catch (error) {
    console.error('Error in handleAutoRecord:', error);
  }
};

export {
  handleAutoRecord
};
