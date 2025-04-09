import { jidNormalizedUser } from "@whiskeysockets/baileys";
import pino from "pino";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { loadCounter, saveCounter } from './DataManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(fs.readFileSync(path.join(dirname(__dirname), 'config.json'), 'utf-8'));

async function handleStatusUpdate(sock, msg, {
  autoReadStatus,
  autoLikeStatus,
  downloadMediaStatus,
  sensorNomor,
  loggedInNumber,
  blackList,
  whiteList,
  emojis,
  statusDelay
}, logCuy) {
  const handleError = (error) => {
    console.error('\n[ERROR]'.red.bold + ' An error occurred:'.yellow, error);
    if (config.lewatierror) {
      console.log('[INFO]'.cyan.bold + ' Continuing execution due to lewatierror enabled...'.yellow);
      return true; // Continue execution
    }
    return false; // Stop execution
  };

  try {
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
        await new Promise(resolve => setTimeout(resolve, config.SpeedReadStory || 2000));
        await sock.readMessages([msg.key]);

        try {
          if (autoLikeStatus) {
            await sock.sendMessage(
              msg.key.remoteJid,
              { react: { key: msg.key, text: emojiToReact } },
              { statusJidList: [msg.key.participant, myself] }
            );
          }
        } catch (error) {
          logCuy(`Gagal memberikan reaksi: ${error.message}`, "red");
        }

        global.totalViewed = (loadCounter() || 0) + 1;
        saveCounter(global.totalViewed, senderNumber);
        const contactViews = loadCounter(senderNumber);

        const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];
        const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
        const bgColor = randomColor();
        const textColor = randomColor();

        const statusType = msg.message.imageMessage ? "Gambar" : 
                          msg.message.videoMessage ? "Video" : 
                          msg.message.audioMessage ? "Audio" :
                          msg.message.extendedTextMessage ? "Teks" : "Tidak diketahui";

        console.log("\n" + "╭─"[bgColor].bold + "━".repeat(45)[bgColor] + "─╮"[bgColor].bold);
        console.log("│"[bgColor].bold + " 🤖 BOT AUTO LIHAT STATUS WHATSAPP".padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + "─".repeat(45)[bgColor] + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + " Status Bot        : Aktif ✓".padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Kecepatan Lihat   : ${(config.SpeedReadStory/1000)} Detik`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Total Dilihat     : ${global.totalViewed}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Dilihat Kontak    : ${contactViews}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Nama Kontak       : ${senderName.split("🇮🇩")[0].trim()}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Nomor Kontak      : ${displaySendernumber}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Tipe Status       : ${statusType}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Reaksi Diberikan  : ${emojiToReact}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("│"[bgColor].bold + ` Status            : ${autoLikeStatus ? "Dilihat & Disukai" : "Dilihat"}`.padEnd(45)[textColor].bold + "│"[bgColor].bold);
        console.log("╰─"[bgColor].bold + "━".repeat(45)[bgColor] + "─╯"[bgColor].bold);

        if (downloadMediaStatus) {
          if (msg.message.imageMessage || msg.message.videoMessage || msg.message.audioMessage) {
            try {
              let buffer = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                }
              );

              const mediaType = msg.message.imageMessage ? "image" : 
                                msg.message.videoMessage ? "video" : 
                                "audio";

              const caption = msg.message[`${mediaType}Message`]?.caption || "";

              const createSeparator = (text) => {
                const length = text.length;
                return '━'.repeat(length);
              };

              const formatLine = (label, value) => {
                const line = `│ ${label}${value}`;
                return `${line}\n${createSeparator(line)}`;
              };

              const createLine = (text) => {
                const line = `│ ${text}`;
                return `${line}\n━\n`;
              };

              const now = new Date();
              const startTime = global.botStartTime || (global.botStartTime = new Date());
              const runtime = new Date(now - startTime);
              const days = Math.floor(runtime / (1000 * 60 * 60 * 24));
              const hours = runtime.getUTCHours();
              const minutes = runtime.getUTCMinutes();
              const seconds = runtime.getUTCSeconds();

              const formatDate = (date) => {
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
              };

              const formatMediaType = (msg) => {
                if (msg.message.imageMessage) return "Gambar";
                if (msg.message.videoMessage) return "Video";
                if (msg.message.audioMessage) {
                  return msg.message.audioMessage.ptt ? "Voice Note" : "Audio";
                }
                if (msg.message.extendedTextMessage) return "Teks";
                return "Tidak diketahui";
              };

              const formatRuntime = (days, hours, minutes, seconds) => {
                const parts = [];
                if (days > 0) parts.push(`${days} hari`);
                if (hours > 0) parts.push(`${hours} jam`);
                if (minutes > 0) parts.push(`${minutes} menit`);
                if (seconds > 0) parts.push(`${seconds} detik`);
                return parts.join(', ');
              };

              const formatCurrentDate = () => {
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const now = new Date();
                return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
              };

              let mediaTypeDisplay = "";
              if (msg.message.imageMessage) mediaTypeDisplay = "Gambar";
              else if (msg.message.videoMessage) mediaTypeDisplay = "Video";
              else if (msg.message.audioMessage) {
                  mediaTypeDisplay = msg.message.audioMessage.ptt ? "Voice Note" : "Audio";
              }

              const statusMessage = 
                `╭─━━━━━━━━━━━━━│\n` +
                `│ Status Bot : *Aktif ✓*\n` +
                `│ Auto Download Berhasil : *${formatMediaType(msg)}*\n` +
                `│ Nama Kontak : *${senderName}*\n` +
                `│ Nomor Kontak : *${displaySendernumber}*\n` +
                `│ Tipe Status : *${formatMediaType(msg)}*\n` +
                `│ Caption : *${caption || "Tidak ada"}*\n` +
                `│ Status : *Dilihat & ${autoLikeStatus ? 'Disukai' : 'Tidak Disukai'}*\n` +
                `│━━━━━━━━━━━━━━│\n` +
                `│ Total Melihat Status Orang : *${global.totalViewed}*\n` +
                `│ Total Melihat Status Dia : *${loadCounter(senderNumber)}*\n` +
                `│ Kecepatan Lihat : *${config.SpeedReadStory/1000} Detik*\n` +
                `│━━━━━━━━━━━━━━│\n` +
                `│ Hari Ini : *${formatCurrentDate()}*\n` +
                `│ Waktu Bot Berjalan : *${formatRuntime(days, hours, minutes, seconds)}*\n` +
                `╰─━━━━━━━━━━━━━│`;

              await sock.sendMessage(`${loggedInNumber}@s.whatsapp.net`, {
                [mediaType]: buffer,
                caption: statusMessage
              });

              buffer = null;
            } catch (error) {
              logCuy(`Error downloading media: ${error}`, "red");
            }

          }
        }
      }
    }
  } catch (error) {
    logCuy(`Error in handleStatusUpdate: ${error}`, "red");
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

export {
  handleStatusUpdate
};