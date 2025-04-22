
const handleAutoTyping = async (sock, msg, config) => {
  if (!config.autoTyping) return;
  
  if (msg.key.remoteJid) {
    try {
      await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
      
      // Stop typing after 3 seconds
      setTimeout(async () => {
        try {
          await sock.sendPresenceUpdate('paused', msg.key.remoteJid);
        } catch (error) {
          // Abaikan error saat mencoba menghentikan status mengetik
          console.log("[Auto-Typing] Error saat menghentikan status mengetik:", error.message);
        }
      }, 3000);
    } catch (error) {
      // Tangani error dengan lebih baik
      console.log("[Auto-Typing] Error saat mengirim status mengetik:", error.message);
      
      // Jika koneksi terputus, tunggu sebentar lalu coba kirim ulang
      if (error.message.includes('Connection Closed')) {
        setTimeout(async () => {
          try {
            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
          } catch (retryError) {
            console.log("[Auto-Typing] Gagal mengirim ulang status mengetik:", retryError.message);
          }
        }, 5000); // Tunggu 5 detik sebelum mencoba lagi
      }
    }
  }
};

export {
  handleAutoTyping
};
