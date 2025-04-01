
const { jidNormalizedUser } = require("@whiskeysockets/baileys");

async function handleAutoLikeStatus(sock, msg, autoLikeStatus, emojis) {
  if (!autoLikeStatus) return;

  const myself = jidNormalizedUser(sock.user.id);
  const emojiToReact = emojis[Math.floor(Math.random() * emojis.length)];

  if (msg.key.remoteJid && msg.key.participant) {
    await sock.sendMessage(
      msg.key.remoteJid,
      { react: { key: msg.key, text: emojiToReact } },
      { statusJidList: [msg.key.participant, myself] }
    );
  }
}

module.exports = {
  handleAutoLikeStatus
};
