
const handleAutoRecord = async (sock, msg, config) => {
  try {
    if (!config.autoRecord) return;

    if (msg.key && msg.key.remoteJid && msg.key.remoteJid.endsWith('@s.whatsapp.net')) {
      await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
      console.log(`Auto Record aktif untuk chat dengan: ${msg.key.remoteJid.split('@')[0]}`);
    }
  } catch (error) {
    console.error('Error in handleAutoRecord:', error);
  }
};

module.exports = {
  handleAutoRecord
};
