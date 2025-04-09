
const handleAutoTyping = async (sock, msg, config) => {
  if (!config.autoTyping) return;
  
  if (msg.key.remoteJid) {
    await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
    
    // Stop typing after 3 seconds
    setTimeout(async () => {
      await sock.sendPresenceUpdate('paused', msg.key.remoteJid);
    }, 3000);
  }
};

export {
  handleAutoTyping
};
