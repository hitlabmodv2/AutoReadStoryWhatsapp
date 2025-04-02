const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function handleStatusUpdate(sock, msg, {
  autoReadStatus,
  autoLikeStatus,
  downloadMediaStatus,
  sensorNomor,
  loggedInNumber,
  blackList,
  whiteList,
  emojis
}, logCuy) {
  if (msg.key.remoteJid === "status@broadcast" && msg.key.participant) {
    if (msg.key.participant === `${loggedInNumber}@s.whatsapp.net`) {
      logCuy("Status ini adalah status sendiri, diabaikan", "yellow");
      return;
    }

    if (!autoReadStatus) {
      logCuy("AutoReadStatus nonaktif, status diabaikan", "yellow");
      return;
    }
    let senderNumber = msg.key.participant
      ? msg.key.participant.split("@")[0]
      : "Tidak diketahui";
    let displaySendernumber = senderNumber;
    const senderName = msg.pushName || "Tidak diketahui";

    if (sensorNomor && displaySendernumber !== "Tidak diketahui") {
      displaySendernumber =
        displaySendernumber.slice(0, 3) +
        "****" +
        displaySendernumber.slice(-2);
    }

    if (msg.message.protocolMessage) {
      return;
    } 

    if (msg.message.reactionMessage) {
      return;
    }

    if (blackList.includes(senderNumber)) {
      logCuy(
        `${senderName} (${displaySendernumber}) membuat status tapi karena ada di blacklist. Status tidak akan dilihat.`,
        "yellow"
      );
      return;
    }

    if (whiteList.length > 0 && !whiteList.includes(senderNumber)) {
      logCuy(
        `${senderName} (${displaySendernumber}) membuat status tapi karena tidak ada di whitelist. Status tidak akan dilihat.`,
        "yellow"
      );
      return;
    }

    const myself = jidNormalizedUser(sock.user.id);
    const emojiToReact = emojis[Math.floor(Math.random() * emojis.length)];

    if (msg.key.remoteJid && msg.key.participant) {
      await sock.readMessages([msg.key]);

      if (autoLikeStatus) {
        try {
          await sock.sendMessage(
            msg.key.remoteJid,
            { react: { key: msg.key, text: emojiToReact } },
            { statusJidList: [msg.key.participant, myself] }
          );
          logCuy(`Berhasil memberikan reaksi ${emojiToReact} ke status`, "green");
        } catch (error) {
          logCuy(`Gagal memberikan reaksi: ${error.message}`, "red");
        }
      }

      const { loadCounter, saveCounter } = require('./DataManager.js');
      global.totalViewed = (loadCounter() || 0) + 1;
      saveCounter(global.totalViewed, senderNumber);
      const contactViews = loadCounter(senderNumber);

      // Update counter display
      console.log("\n" + "╭─".cyan.bold + "━".repeat(60).cyan + "─╮".cyan.bold);
      console.log("│".cyan.bold + " 🤖 BOT AUTO LIHAT STATUS WHATSAPP".padEnd(60).green.bold + "│".cyan.bold);
      console.log("│".cyan.bold + " ▸ Status Bot: Aktif ✓".padEnd(60).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Total Status Dilihat: ${global.totalViewed}`.padEnd(60).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Status Dilihat dari Kontak: ${contactViews}`.padEnd(60).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Nama Kontak: ${senderName}`.padEnd(60).yellow.bold + "│".cyan.bold);
      console.log("╰─".cyan.bold + "━".repeat(60).cyan + "─╯".cyan.bold);
      logCuy(
        `Berhasil melihat ${
          autoLikeStatus ? "dan menyukai " : ""
        }status dari: ${senderName} (${displaySendernumber}) | Total dilihat: ${global.totalViewed}`,
        "green"
      );

      await handleMediaDownload(sock, msg, {
        downloadMediaStatus,
        senderName,
        displaySendernumber,
        autoLikeStatus,
        loggedInNumber
      }, logCuy);
    }
  }
}

async function handleMediaDownload(sock, msg, config, logCuy) {
  const { downloadMediaStatus, senderName, displaySendernumber, autoLikeStatus, loggedInNumber } = config;
  const targetNumber = loggedInNumber;

  let messageContent = `Status dari *${senderName}* (${displaySendernumber}) telah dilihat ${
    autoLikeStatus ? "dan disukai" : ""
  }`;

  let caption =
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption ||
    msg.message.extendedTextMessage?.text ||
    "Tidak ada caption";

  if (downloadMediaStatus) {
    if (msg.type === "imageMessage" || msg.type === "videoMessage") {
      await handleImageOrVideoDownload(sock, msg, {
        messageContent,
        caption,
        senderName,
        displaySendernumber,
        targetNumber
      }, logCuy);
    } else if (msg.type === "audioMessage") {
      await handleAudioDownload(sock, msg, {
        messageContent,
        senderName,
        displaySendernumber,
        targetNumber
      }, logCuy);
    } else {
      messageContent = `Status teks dari *${senderName}* (${displaySendernumber}) telah dilihat ${
        autoLikeStatus ? "dan disukai" : ""
      } dengan caption: "*${caption}*"`;

      await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
        text: messageContent,
      });
    }
  } else {
    await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
      text: messageContent,
    });
  }
}

async function handleImageOrVideoDownload(sock, msg, config, logCuy) {
  const { messageContent, caption, senderName, displaySendernumber, targetNumber } = config;
  const mediaType = msg.type === "imageMessage" ? "image" : "video";

  try {
    let buffer = await downloadMediaMessage(
      msg,
      "buffer",
      {},
      {
        logger: pino({ level: "fatal" }),
      }
    );

    await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
      [mediaType]: Buffer.from(buffer),
      caption: `${messageContent} dengan caption : "*${caption}*"`,
    });

    buffer = null;
  } catch (error) {
    logCuy(`Error uploading media: ${error}`, "red");
    await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
      text: `${messageContent} namun Gagal mengunggah media dari status ${
        mediaType === "image" ? "gambar" : "video"
      } dari *${senderName}* (${displaySendernumber}).`,
    });
  }
}

async function handleAudioDownload(sock, msg, config, logCuy) {
  const { messageContent, senderName, displaySendernumber, targetNumber } = config;

  await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
    text: messageContent,
  });

  try {
    let buffer = await downloadMediaMessage(
      msg,
      "buffer",
      {},
      {
        logger: pino({ level: "fatal" }),
      }
    );

    await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
      audio: Buffer.from(buffer),
      caption: "",
    });

    buffer = null;
  } catch (error) {
    logCuy(`Error uploading media: ${error}`, "red");
    await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
      text: `Gagal mengunggah audio dari status audio dari *${senderName}* (${displaySendernumber}).`,
    });
  }
}

module.exports = {
  handleStatusUpdate
};