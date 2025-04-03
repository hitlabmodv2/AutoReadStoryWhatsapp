const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  jidNormalizedUser,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

let connectionAttempts = 0;

const colors = require("colors");
const moment = require("moment-timezone");
let useCode = true;
let loggedInNumber;

function logCuy(message, type = "green") {
  moment.locale("id");
  const now = moment().tz("Asia/Jakarta");
  const colors = ["red", "green", "yellow", "blue", "magenta", "cyan"];
  const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
  const randomColor2 = colors[Math.floor(Math.random() * colors.length)];
  const randomColor3 = colors[Math.floor(Math.random() * colors.length)];
  console.log(
    `\n${now.format(" dddd ")[`bg${randomColor1.charAt(0).toUpperCase() + randomColor1.slice(1)}`]}${
      now.format(" D MMMM YYYY ")[
        `bg${randomColor2.charAt(0).toUpperCase() + randomColor2.slice(1)}`
      ].black
    }${now.format(" HH:mm:ss ")[`bg${randomColor3.charAt(0).toUpperCase() + randomColor3.slice(1)}`].black}\n`,
  );
  console.log(`${message.bold[type]}`);
}

const configPath = path.join(__dirname, "config.json");
let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const emojiList = require("./EMOJI/emoji.js");
let {
  autoReadStatus,
  autoLikeStatus,
  downloadMediaStatus,
  sensorNomor,
  antiTelpon,
  autoKickStory,
  blackList,
  whiteList,
  autoTypingStatus = false, // Added autoTypingStatus to config
} = config;

const emojis = emojiList;

const updateConfig = (key, value) => {
  config[key] = value;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
};

let welcomeMessage = false;

async function connectToWhatsApp() {
  const sessionPath = path.join(__dirname, "sessions");
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const sessionExists = fs.existsSync(path.join(sessionPath, "creds.json"));

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: !useCode,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 30000,
    browser: Browsers.macOS("Chrome"),
    shouldSyncHistoryMessage: () => true,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
  });

  if (useCode && !sessionExists) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(
      "\n==================== PENGATURAN PEMASANGAN ====================".cyan
        .bold,
    );
    console.log("📱 Selamat datang di Pengaturan Bot WhatsApp".yellow);
    console.log(
      "=========================================================\n".cyan.bold,
    );

    const askPairingCode = () => {
      rl.question(
        "Apakah Anda ingin menggunakan kode pemasangan untuk masuk? (Y/n): "
          .yellow.bold,
        async (answer) => {
          if (answer.toLowerCase() === "y" || answer.trim() === "") {
            console.log("\n📱 Silakan masukkan nomor WhatsApp Anda:".cyan);
            console.log("📝 Format: 62xxx (misalnya, 628123456789)".yellow);
            console.log(
              "=========================================================\n".cyan
                .bold,
            );

            const askWaNumber = () => {
              rl.question(
                "Masukkan nomor WhatsApp Anda: ".yellow.bold,
                async (waNumber) => {
                  if (!/^\d+$/.test(waNumber)) {
                    logCuy(
                      "Nomor harus berupa angka!\nSilakan masukkan nomor WhatsApp kembali!.",
                      "red",
                    );
                    askWaNumber();
                  } else if (!waNumber.startsWith("62")) {
                    logCuy(
                      "Nomor harus diawali dengan 62!\nContoh : 628123456789\nSilakan masukkan nomor WhatsApp kembali!.",
                      "red",
                    );
                    askWaNumber();
                  } else {
                    // Delete existing sessions folder if it exists
                    if (fs.existsSync("sessions")) {
                      fs.rmSync("sessions", { recursive: true, force: true });
                      console.log(
                        "\n📁 Folder sesi dihapus di:".cyan,
                        process.cwd() + "/sessions",
                      );
                    }

                    // Create new sessions folder
                    fs.mkdirSync("sessions", { recursive: true });
                    console.log(
                      "📁 Folder sesi dibuat di:".cyan,
                      process.cwd() + "/sessions\n",
                    );

                    const code = await sock.requestPairingCode(waNumber);
                    console.log(
                      "\n==================== KODE PEMASANGAN ===================="
                        .cyan.bold,
                    );
                    console.log(
                      `Kode Pemasangan WhatsApp: ${code.slice(0, 4)}-${code.slice(4)}`
                        .green.bold,
                    );
                    console.log(
                      "=========================================================\n"
                        .cyan.bold,
                    );
                    console.log(
                      "🔗 Gunakan kode di atas untuk menghubungkan bot dengan WhatsApp Anda."
                        .yellow,
                    );
                    console.log(
                      "📋 Cara memasukkan pairing code di WhatsApp terbaru:"
                        .yellow,
                    );
                    console.log("1️⃣  Buka aplikasi WhatsApp di ponsel Anda.");
                    console.log(
                      "2️⃣  Ketuk ikon tiga titik di pojok kanan atas untuk membuka menu.",
                    );
                    console.log('3️⃣  Pilih "Perangkat Tertaut" dari menu.');
                    console.log(
                      '4️⃣  Ketuk "Tautkan Perangkat" dan masukkan pairing code yang ditampilkan di atas.',
                    );
                    console.log(
                      "5️⃣  Ikuti instruksi di layar untuk menyelesaikan proses pairing.",
                    );
                    console.log("\n✨ Menunggu koneksi...".cyan);
                    rl.close();
                  }
                },
              );
            };
            askWaNumber();
          } else if (answer.toLowerCase() === "n") {
            useCode = false;
            logCuy(
              "Buka WhatsApp Anda lalu klik tiga titik di kanan atas kemudian klik perangkat tertaut setelah itu Silahkan scan QR code dibawah untuk login ke WhatsApp",
              "cyan",
            );
            connectToWhatsApp();
            rl.close();
          } else {
            logCuy('Input tidak valid. Silakan masukkan "y" atau "n".', "red");
            askPairingCode();
          }
        },
      );
    };

    askPairingCode();
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      connectionAttempts++;
      const shouldReconnect =
        lastDisconnect.error?.output.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect && connectionAttempts < config.autodeletesessions) {
        logCuy(
          `Mencoba menghubungkan ke WhatsApp... (Percobaan ${connectionAttempts}/${config.autodeletesessions})\n`,
          "cyan",
        );
        connectToWhatsApp();
      } else {
        if (connectionAttempts >= config.autodeletesessions) {
          logCuy(
            `Gagal terhubung setelah ${config.autodeletesessions} percobaan. Menghapus sesi dan memulai ulang...`,
            "red",
          );
        } else {
          logCuy(
            "Nampaknya kamu telah logout dari WhatsApp, silahkan login ke WhatsApp kembali!",
            "red",
          );
        }
        fs.rmSync(sessionPath, { recursive: true, force: true });
        connectionAttempts = 0;
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      loggedInNumber = sock.user.id.split("@")[0].split(":")[0];
      let displayedLoggedInNumber = loggedInNumber;
      if (sensorNomor) {
        displayedLoggedInNumber =
          displayedLoggedInNumber.slice(0, 3) +
          "****" +
          displayedLoggedInNumber.slice(-2);
      }
      let messageInfo = `Bot *AutoReadStoryWhatsApp* Aktif!
Kamu berhasil login dengan nomor: ${displayedLoggedInNumber}

info status fitur:
- Auto Read Status: ${autoReadStatus ? "*Aktif*" : "*Nonaktif*"}
- Auto Like Status: ${autoLikeStatus ? "*Aktif*" : "*Nonaktif*"}
- Download Media Status: ${downloadMediaStatus ? "*Aktif*" : "*Nonaktif*"}
- Sensor Nomor: ${sensorNomor ? "*Aktif*" : "*Nonaktif*"}
- Anti Telpon: ${antiTelpon ? "*Aktif*" : "*Nonaktif*"}
- Auto Kick tag Story: ${autoKickStory ? "*Aktif*" : "*Nonaktif*"}
- Auto Typing: ${autoTypingStatus ? "*Aktif*" : "*Nonaktif*"}
- Auto Record: ${config.autoRecord ? "*Aktif*" : "*Nonaktif*"}

Ketik *#menu* untuk melihat menu perintah yang tersedia.

SC : https://github.com/jauhariel/AutoReadStoryWhatsapp`;
      const { loadCounter } = require("./FITUR_WILY/DataManager.js");
      global.totalViewed = loadCounter();

      console.log("\n" + "╭─".cyan.bold + "━".repeat(60).cyan + "─╮".cyan.bold);
      console.log(
        "│".cyan.bold +
          " 🤖 BOT AUTO LIHAT STATUS WHATSAPP".padEnd(60).green.bold +
          "│".cyan.bold,
      );
      console.log(
        "│".cyan.bold +
          " ▸ Status Bot: Aktif ✓".padEnd(60).yellow.bold +
          "│".cyan.bold,
      );
      console.log(
        "│".cyan.bold +
          ` ▸ Nomor Login: ${displayedLoggedInNumber}`.padEnd(60).yellow.bold +
          "│".cyan.bold,
      );
      console.log(
        "│".cyan.bold +
          ` ▸ Total Status Dilihat: ${global.totalViewed}`.padEnd(60).yellow
            .bold +
          "│".cyan.bold,
      );
      console.log("│".cyan.bold + " ".repeat(60) + "│".cyan.bold);
      console.log(
        "│".cyan.bold +
          " Bot siap memproses status!".padEnd(60).green.bold +
          "│".cyan.bold,
      );
      console.log(
        "│".cyan.bold +
          " Dibuat oleh github.com/Jauhariel".padEnd(60).red.bold +
          "│".cyan.bold,
      );
      console.log("╰─".cyan.bold + "━".repeat(60).cyan + "─╯".cyan.bold + "\n");

      if (!welcomeMessage) {
        setTimeout(async () => {
          await sock.sendMessage(`${loggedInNumber}@s.whatsapp.net`, {
            text: messageInfo,
          });
          welcomeMessage = true;
        }, 5000);
      }
    }
  });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("call", (call) => {
    const { id, status, from } = call[0];
    if (status === "offer" && antiTelpon) return sock.rejectCall(id, from);
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const { handleAutoTyping } = require("./FITUR_WILY/AutoTyping.js");
    await handleAutoTyping(sock, msg, config);

    const { handleStatusUpdate } = require("./FITUR_WILY/CodeAutoReadStory.js");
    await handleStatusUpdate(
      sock,
      msg,
      {
        autoReadStatus,
        autoLikeStatus,
        downloadMediaStatus,
        sensorNomor,
        loggedInNumber,
        blackList,
        whiteList,
        emojis,
      },
      logCuy,
    );

    msg.type = msg.message.imageMessage
      ? "imageMessage"
      : msg.message.videoMessage
        ? "videoMessage"
        : msg.message.audioMessage
          ? "audioMessage"
          : msg.message.extendedTextMessage
            ? "extendedTextMessage"
            : Object.keys(msg.message)[0];

    msg.text =
      msg.type === "conversation"
        ? msg.message.conversation
        : msg.type === "extendedTextMessage"
          ? msg.message.extendedTextMessage.text
          : msg.message[msg.type]?.caption || "";

    msg.isQuoted =
      msg.type === "extendedTextMessage"
        ? msg.message.extendedTextMessage.contextInfo?.quotedMessage
        : msg.type === "imageMessage"
          ? msg.message.imageMessage.contextInfo?.quotedMessage
          : msg.type === "videoMessage"
            ? msg.message.videoMessage.contextInfo?.quotedMessage
            : msg.type === "audioMessage"
              ? msg.message.audioMessage.contextInfo?.quotedMessage
              : null;

    msg.quoted = msg.isQuoted
      ? msg.message.extendedTextMessage?.contextInfo ||
        msg.message.imageMessage?.contextInfo ||
        msg.message.videoMessage?.contextInfo ||
        msg.message.audioMessage?.contextInfo
      : null;

    const prefixes = [".", "#", "!", "/"];
    let prefix = prefixes.find((p) => msg.text.startsWith(p));

    if (prefix && msg.key.fromMe) {
      msg.cmd = msg.text.trim().split(" ")[0].replace(prefix, "").toLowerCase();

      // args
      msg.args = msg.text
        .replace(/^\S*\b/g, "")
        .trim()
        .split("|");

      async function validateNumber(commandname, type, sc, data) {
        if (!data) {
          await sock.sendMessage(
            `${loggedInNumber}@s.whatsapp.net`,
            {
              text: `Nomor harus diisi.\ncontoh ketik :\n\`${commandname} blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`${commandname} blacklist nomornya\`\nuntuk ${type} nomor ${sc} blacklist\n\n\`${commandname} whitelist nomornya\`\nuntuk ${type} nomor ${sc} whitelist`,
            },
            { quoted: msg },
          );
          return false;
        }
        if (!/^\d+$/.test(data)) {
          await sock.sendMessage(
            `${loggedInNumber}@s.whatsapp.net`,
            {
              text: `Nomor harus berupa angka.\ncontoh ketik :\n\`${commandname} blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`${commandname} blacklist nomornya\`\nuntuk ${type} nomor ${sc} blacklist\n\n\`${commandname} whitelist nomornya\`\nuntuk ${type} nomor ${sc} whitelist`,
            },
            { quoted: msg },
          );
          return false;
        }
        if (!data.startsWith("62")) {
          await sock.sendMessage(
            `${loggedInNumber}@s.whatsapp.net`,
            {
              text: `Nomor harus diawali dengan 62.\ncontoh ketik :\n\`${commandname} blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`${commandname} blacklist nomornya\`\nuntuk ${type} nomor ${sc} blacklist\n\n\`${commandname} whitelist nomornya\`\nuntuk ${type} nomor ${sc} whitelist`,
            },
            { quoted: msg },
          );
          return false;
        }
        return true;
      }

      // command
      switch (msg.cmd) {
        case "on":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  text: `mana argumennya ?\ncontoh ketik : \`#on autolike\`\n\nArgumen yang tersedia:\n\n\`#on autoread\`\nuntuk mengaktifkan fitur autoread story\n\n\`#on autolike\`\nuntuk mengaktifkan fitur autolike story\n\n\`#on dlmedia\`\nuntuk mengaktifkan fitur download media(foto,video, dan audio) dari story\n\n\`#on sensornomor\`\nuntuk mengaktifkan sensor nomor\n\n\`#on antitelpon\`\nuntuk mengaktifkan anti-telpon\n\n\`#on kickstory\`\nuntuk mengaktifkan auto kick story grup\n\n\`#on autotyping\`\nuntuk mengaktifkan fitur auto typing`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                switch (arg.trim().toLowerCase()) {
                  case "autoread":
                    autoReadStatus = true;
                    updateConfig("autoReadStatus", true);
                    logCuy("Kamu mengaktifkan fitur Auto Read Status", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Read Status aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autolike":
                    autoLikeStatus = true;
                    updateConfig("autoLikeStatus", true);
                    logCuy("Kamu mengaktifkan fitur Auto Like Status", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Like Status aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "dlmedia":
                    downloadMediaStatus = true;
                    updateConfig("downloadMediaStatus", true);
                    logCuy(
                      "Kamu mengaktifkan fitur Download Media Status",
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Download Media Status aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "sensornomor":
                    sensorNomor = true;
                    updateConfig("sensorNomor", true);
                    logCuy("Kamu mengaktifkan fitur sensorNomor", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Sensor Nomor aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "antitelpon":
                    antiTelpon = true;
                    updateConfig("antiTelpon", true);
                    logCuy("Kamu mengaktifkan fitur Anti-telpon", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Anti-telpon aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "kickstory":
                    autoKickStory = true;
                    updateConfig("autoKickStory", true);
                    logCuy(
                      "Kamu mengaktifkan fitur auto kick tag grup di story",
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Kick Tag Grup di Story aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autotyping":
                    autoTypingStatus = true;
                    updateConfig("autoTypingStatus", true);
                    logCuy("Kamu mengaktifkan fitur Auto Typing", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Typing aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autorecord":
                    config.autoRecord = true;
                    updateConfig("autoRecord", true);
                    logCuy("Kamu mengaktifkan fitur Auto Record", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Record aktif" },
                      { quoted: msg },
                    );
                    break;
                  default:
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: autoread, autolike, dlmedia, sensornomor, kickstory, antitelpon dan autotyping`,
                      },
                      { quoted: msg },
                    );
                    break;
                }
              });
          break;
        case "off":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  text: `mana argumennya ?\ncontoh ketik : \`#off autolike\`\n\nArgumen yang tersedia:\n\n\`#off autoread\`\nuntuk menonaktifkan fitur autoread story\n\n\`#off autolike\`\nuntuk menonaktifkan fitur autolike story\n\n\`#off dlmedia\`\nuntuk menonaktifkan fitur download media(foto,video, dan audio) dari story\n\n\`#off sensornomor\`\nuntuk menonaktifkan sensor nomor\n\n\`#off antitelpon\`\nuntuk menonaktifkan anti-telpon\n\n\`#off kickstory\`\nuntuk menonaktifkan auto kick story grup\n\n\`#off autotyping\`\nuntuk menonaktifkan fitur auto typing`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                switch (arg.trim().toLowerCase()) {
                  case "autoread":
                    autoReadStatus = false;
                    updateConfig("autoReadStatus", false);
                    logCuy("Kamu mematikan fitur Auto Read Status", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Read Status nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autolike":
                    autoLikeStatus = false;
                    updateConfig("autoLikeStatus", false);
                    logCuy("Kamu mematikan fitur Auto Like Status", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Like Status nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "dlmedia":
                    downloadMediaStatus = false;
                    updateConfig("downloadMediaStatus", false);
                    logCuy(
                      "Kamu mematikan fitur Download Media Status",
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Download Media Status nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "sensornomor":
                    sensorNomor = false;
                    updateConfig("sensorNomor", false);
                    logCuy("Kamu mematikan fitur Sensor Nomor", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Sensor Nomor nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "antitelpon":
                    antiTelpon = false;
                    updateConfig("antiTelpon", false);
                    logCuy("Kamu mematikan fitur Anti-telpon", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Anti-telpon nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "kickstory":
                    autoKickStory = false;
                    updateConfig("autoKickStory", false);
                    logCuy(
                      "Kamu mematikan fitur auto kick tag grup di story",
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Kick Tag Grup di Story nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autotyping":
                    autoTypingStatus = false;
                    updateConfig("autoTypingStatus", false);
                    logCuy("Kamu mematikan fitur Auto Typing", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Typing nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autorecord":
                    config.autoRecord = false;
                    updateConfig("autoRecord", false);
                    logCuy("Kamu mematikan fitur Auto Record", "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: "Auto Record nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  default:
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: autoread, autolike, dlmedia, sensornomor, kickstory, antitelpon dan autotyping`,
                      },
                      { quoted: msg },
                    );
                    break;
                }
              });
          break;
        case "add":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  text: `mana argumennya ?\ncontoh ketik :\n\`#add blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`#add blacklist nomornya\`\nuntuk menambahkan nomor ke blacklist\n\n\`#add whitelist nomornya\`\nuntuk menambahkan nomor ke whitelist\n\n\`#add emojis emojinya\`\nuntuk menambahkan emoji ke emojis`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                const [list, data] = arg.trim().split(" ");
                if (list === "emojis") {
                  let emojiRegex = /^[\p{Emoji}\u200D\uFE0F]$/gu;
                  if (!data) {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `emoji harus diisi.\ncontoh ketik :\n\`#add emojis 👍\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (!emojiRegex.test(data)) {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `hanya boleh mengisi 1 emoji.\ncontoh ketik :\n\`#add emojis 👍\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (!emojis.includes(data)) {
                    emojis.push(data);
                    updateConfig("emojis", emojis);
                    logCuy(
                      `Kamu menambahkan emoji ${data} ke daftar emojis`,
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `emoji ${data} berhasil ditambahkan ke daftar emojis`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: `emoji ${data} sudah ada di daftar emojis` },
                      { quoted: msg },
                    );
                  }
                } else if (list === "blacklist") {
                  const isValid = await validateNumber(
                    "#add",
                    "menambahkan",
                    "ke",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (!blackList.includes(data)) {
                    blackList.push(data);
                    updateConfig("blackList", blackList);
                    logCuy(
                      `Kamu menambahkan nomor ${displayNumber} ke blacklist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Nomor ${displayNumber} berhasil ditambahkan ke blacklist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: `Nomor ${displayNumber} sudah ada di blacklist` },
                      { quoted: msg },
                    );
                  }
                } else if (list === "whitelist") {
                  const isValid = await validateNumber(
                    "#add",
                    "menambahkan",
                    "ke",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (!whiteList.includes(data)) {
                    whiteList.push(data);
                    updateConfig("whiteList", whiteList);
                    logCuy(
                      `Kamu menambahkan nomor ${displayNumber} ke whitelist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Nomor ${displayNumber} berhasil ditambahkan ke whitelist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      { text: `Nomor ${displayNumber} sudah ada di whitelist` },
                      { quoted: msg },
                    );
                  }
                } else {
                  await sock.sendMessage(
                    `${loggedInNumber}@s.whatsapp.net`,
                    {
                      text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: blacklist, whitelist, emojis`,
                    },
                    { quoted: msg },
                  );
                }
              });
          break;
        case "remove":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  text: `mana argumennya ?\ncontoh ketik :\n\`#remove blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`#remove blacklist nomornya\`\nuntuk menghapus nomor dari blacklist\n\n\`#remove whitelist nomornya\`\nuntuk menghapus nomor dari whitelist\n\n\`#remove emojis emojinya\`\nuntuk menghapus emoji dari daftar emojis`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                const [list, data] = arg.trim().split(" ");
                if (list === "emojis") {
                  let emojiRegex = /^[\p{Emoji}\u200D\uFE0F]$/gu;
                  if (!data) {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `emoji harus diisi.\ncontoh ketik :\n\`#remove emojis 👍\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (!emojiRegex.test(data)) {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `hanya boleh mengisi 1 emoji.\ncontoh ketik :\n\`#remove emojis f���\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (emojis.length === 1) {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Tidak bisa menghapus emoji terakhir. Harus ada minimal satu emoji.\n\nKetik \`#info\` untuk mengecek daftar emoji yang tersedia`,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (emojis.includes(data)) {
                    emojis = emojis.filter((n) => n !== data);
                    updateConfig("emojis", emojis);
                    logCuy(`Kamu menghapus emoji ${data} dari emojis`, "blue");
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `emoji ${data} berhasil dihapus dari daftar emojis`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `emoji ${data} tidak ada di daftar emojis\n\nKetik \`#info\` untuk mengecek daftar emoji yang tersedia`,
                      },
                      { quoted: msg },
                    );
                  }
                } else if (list === "blacklist") {
                  const isValid = await validateNumber(
                    "#remove",
                    "menghapus",
                    "dari",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (blackList.includes(data)) {
                    blackList = blackList.filter((n) => n !== data);
                    updateConfig("blackList", blackList);
                    logCuy(
                      `Kamu menghapus nomor ${displayNumber} dari blacklist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Nomor ${displayNumber} berhasil dihapus dari blacklist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Nomor ${displayNumber} tidak ada di blacklist\n\nKetik \`#info\` untuk mengecek daftar nomor yang tersedia`,
                      },
                      { quoted: msg },
                    );
                  }
                } else if (list === "whitelist") {
                  const isValid = await validateNumber(
                    "#remove",
                    "menghapus",
                    "dari",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (whiteList.includes(data)) {
                    whiteList = whiteList.filter((n) => n !== data);
                    updateConfig("whiteList", whiteList);
                    logCuy(
                      `Kamu menghapus nomor ${displayNumber} dari whitelist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Nomor ${displayNumber} berhasil dihapus dari whitelist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      `${loggedInNumber}@s.whatsapp.net`,
                      {
                        text: `Nomor ${displayNumber} tidak ada di whitelist\n\nKetik \`#info\` untuk mengecek daftar nomor yang tersedia`,
                      },
                      { quoted: msg },
                    );
                  }
                } else {
                  await sock.sendMessage(
                    `${loggedInNumber}@s.whatsapp.net`,
                    {
                      text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: blacklist, whitelist, emojis`,
                    },
                    { quoted: msg },
                  );
                }
              });
          break;
        case "menu":
          const menuMessage = `╔══════『 STATUS FITUR 』══════⊱
┃
┣━⊱ Auto Read Status: ${autoReadStatus ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Auto Like Status: ${autoLikeStatus ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Download Media: ${downloadMediaStatus ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Sensor Nomor: ${sensorNomor ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Anti Telpon: ${antiTelpon ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Auto Kick Story: ${autoKickStory ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Auto Typing: ${autoTypingStatus ? "✅ AKTIF" : "❌ NONAKTIF"}
┣━⊱ Auto Record: ${config.autoRecord ? "✅ AKTIF" : "❌ NONAKTIF"}
┃
╚═════════════════════⊱

╔═══════『 DAFTAR MENU 』═════⊱
┃
┣━━⊱ Contoh: #on autolike
┃

Perintah On:
\`#on autoread\`
Mengaktifkan fitur autoread story

\`#on autolike\`
Mengaktifkan fitur autolike story

\`#on dlmedia\`
Mengaktifkan fitur download media (foto, video, dan audio) dari story

\`#on sensornomor\`
Mengaktifkan sensor nomor

\`#on antitelpon\`
Mengaktifkan anti telpon

\`#on kickstory\`
Mengaktifkan auto kick story tag grup

\`#on autotyping\`
Mengaktifkan fitur auto typing

\`#on autorecord\`
Mengaktifkan fitur auto record

Perintah Off:
\`#off autoread\`
Menonaktifkan fitur autoread story

\`#off autolike\`
Menonaktifkan fitur autolike story

\`#off dlmedia\`
Menonaktifkan fitur download media (foto, video, dan audio) dari story

\`#off sensornomor\`
Menonaktifkan sensor nomor

\`#off antitelpon\`
Menonaktifkan anti telpon

\`#off kickstory\`
Menonaktifkan auto kick story tag grup

\`#off autotyping\`
Menonaktifkan fitur auto typing

\`#off autorecord\`
Menonaktifkan fitur auto record

Perintah Add:
\`#add blacklist nomornya\`
Menambahkan nomor ke blacklist

\`#add whitelist nomornya\`
Menambahkan nomor ke whitelist

\`#add emojis emojinya\`
Menambahkan emoji ke daftar emojis

Perintah Remove:
\`#remove blacklist nomornya\`
Menghapus nomor dari blacklist

\`#remove whitelist nomornya\`
Menghapus nomor dari whitelist

\`#remove emojis emojinya\`
Menghapus emoji dari daftar emojis

Perintah Info:
\`#info\`
Menampilkan informasi status fitur, daftar nomor/emoji yang ada di blacklist, whitelist dan emojis

Perintah Viewonce:
\`#viewonce\`
Mengambil/download foto, video, audio dari pesan sementara/sekali liat dari yang kamu reply
`;

          await sock.sendMessage(
            `${loggedInNumber}@s.whatsapp.net`,
            { text: menuMessage },
            { quoted: msg },
          );
          break;
        case "viewonce":
          if (msg.isQuoted && msg.quoted && msg.quoted.quotedMessage) {
            if (msg.quoted.quotedMessage.imageMessage) {
              let buffer = await downloadMediaMessage(
                {
                  message: {
                    imageMessage: msg.quoted.quotedMessage.imageMessage,
                  },
                  key: msg.quoted.key,
                },
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                },
              );

              await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  image: Buffer.from(buffer),
                },
                { quoted: msg },
              );

              logCuy(
                `Berhasil mengambil gambar sekali liat dari yang kamu reply`,
                "blue",
              );

              buffer = null;
            } else if (msg.quoted.quotedMessage.videoMessage) {
              let buffer = await downloadMediaMessage(
                {
                  message: {
                    videoMessage: msg.quoted.quotedMessage.videoMessage,
                  },
                  key: msg.quoted.key,
                },
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                },
              );

              await socksendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  video: Buffer.from(buffer),
                },
                { quoted: msg },
              );

              logCuy(
                `Berhasil mengambil video sekali liat dari yang kamu reply`,
                "blue",
              );

              buffer = null;
            } else if (msg.quoted.quotedMessage.audioMessage) {
              let buffer = await downloadMediaMessage(
                {
                  message: {
                    audioMessage: msg.quoted.quotedMessage.audioMessage,
                  },
                  key: msg.quoted.key,
                },
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                },
              );

              await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  audio: Buffer.from(buffer),
                },
                { quoted: msg },
              );

              logCuy(
                `Berhasil mengambil audio sekali liat dari yang kamu reply`,
                "blue",
              );

              buffer = null;
            } else {
              await sock.sendMessage(
                `${loggedInNumber}@s.whatsapp.net`,
                {
                  text: `Pesan yang kamu reply bukan pesan yang bertipe foto, video, audio dan sekali liat`,
                },
                { quoted: msg },
              );
              logCuy(
                `Pesan yang kamu reply bukan pesan yang bertipe foto, video, audio dan sekali liat`,
                "yellow",
              );
            }
          } else {
            await sock.sendMessage(
              `${loggedInNumber}@s.whatsapp.net`,
              {
                text: `Reply/balas pesan sekali liat dengan perintah #viewonce`,
              },
              { quoted: msg },
            );
          }
          break;
        case "info":
          const infoMessage = `Informasi Status Fitur:
- Auto Read Status: ${autoReadStatus ? "*Aktif*" : "*Nonaktif*"}
- Auto Like Status: ${autoLikeStatus ? "*Aktif*" : "*Nonaktif*"}
- Download Media Status: ${downloadMediaStatus ? "*Aktif*" : "*Nonaktif*"}
- Sensor Nomor: ${sensorNomor ? "*Aktif*" : "*Nonaktif*"}
- Anti Telpon: ${antiTelpon ? "*Aktif*" : "*Nonaktif*"}
- Auto Kick tag Story: ${autoKickStory ? "*Aktif*" : "*Nonaktif*"}
- Auto Typing: ${autoTypingStatus ? "*Aktif*" : "*Nonaktif*"}`;

          const formatList = (list) =>
            list
              .map((number, index) => {
                let displayNumber = number;
                if (sensorNomor) {
                  displayNumber =
                    displayNumber.slice(0, 3) +
                    "****" +
                    displayNumber.slice(-2);
                }
                return `\u25CF ${displayNumber}`;
              })
              .join("\n");
          const formatEmojiList = (list) =>
            list.map((emoji, index) => `${emoji}`).join(", ");

          const blacklistMessage =
            blackList.length > 0
              ? `Blacklist:\n${formatList(blackList)}`
              : "Blacklist kosong.";
          const whitelistMessage =
            whiteList.length > 0
              ? `Whitelist:\n${formatList(whiteList)}`
              : "Whitelist kosong.";
          const emojisMessage =
            emojis.length > 0
              ? `Emojis:\n${formatEmojiList(emojis)}`
              : "Emojis kosong.";
          const listMessage = `\n\n${blacklistMessage}\n\n${whitelistMessage}\n\n${emojisMessage}\n\nKetik \`#add\` untuk menambahkan nomor atau emoji ke blacklist, whitelist, dan emojis\nKetik \`#remove\` untuk menghapus nomor atau emoji dari blacklist, whitelist, dan emojis\nKetik \`#on\` untuk mengaktifkan fitur\nKetik \`#off\` untuk menonaktifkan fitur\nKetik \`#menu\` untuk melihat menu perintah yang tersedia`;

          await sock.sendMessage(
            `${loggedInNumber}@s.whatsapp.net`,
            { text: infoMessage + listMessage },
            { quoted: msg },
          );
          break;
      }
    }

    if (autoKickStory) {
      if (msg.message.groupStatusMentionMessage && !msg.key.fromMe) {
        const groupId = msg.key.remoteJid;
        const participant = msg.key.participant;

        const groupMetadata = await sock.groupMetadata(groupId);
        const groupName = groupMetadata.subject;
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const isAdmin = groupMetadata.participants.some(
          (member) => member.id === botNumber && member.admin !== null,
        );

        if (isAdmin) {
          await sock.sendMessage(
            groupId,
            {
              text: `@${
                participant.split("@")[0]
              } terdeteksi tag grup di story, kamu akan dikick.`,
              mentions: [participant],
            },
            { quoted: msg },
          );

          await sock.groupParticipantsUpdate(groupId, [participant], "remove");
          logCuy(
            `Kamu mengeluarkan sesorang dari group ${groupName} karena telah tag grup di story.`,
            "red",
          );
        } else {
          // await sock.sendMessage(
          //   `${loggedInNumber}@s.whatsapp.net`,
          //   {
          //     text: `terdeteksi ada yang tag grup di story, namun bot bukan admin jadi tidak bisa kick.`,
          //   },
          //   { quoted: msg }
          // );
          logCuy(
            `Kamu bukan admin di grup ${groupName} jadi tidak bisa kick.`,
            "yellow",
          );
        }
      }
    }
  });
}

connectToWhatsApp();
