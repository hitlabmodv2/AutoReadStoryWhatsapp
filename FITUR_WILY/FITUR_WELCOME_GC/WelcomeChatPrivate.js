
import moment from 'moment-timezone';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

export const handlePrivateWelcome = async (sock, groupMetadata, num) => {
  try {
    // Check if welcomeChatPrivate is enabled
    if (!config.welcomeChatPrivate) {
      return;
    }

    // Add configurable delay from config
    await new Promise(resolve => setTimeout(resolve, config.welcomeChatPrivateDelay || 1000));

    // Get user info
    const user = groupMetadata.participants.find(p => p.id === num);
    const username = user?.notify || user?.verifiedName || user?.pushName || user?.name || num.split('@')[0];
    const guildName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;
    const ownerMention = groupMetadata.owner || num;
    const adminCount = groupMetadata.participants.filter(p => p.admin).length;

    // Get user avatar
    let avatar;
    try {
      avatar = await sock.profilePictureUrl(num, 'image');
    } catch {
      avatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
    }

    // Get time of day greeting
    const jakartaTime = moment().tz('Asia/Jakarta');
    const hour = jakartaTime.hour();
    let greeting = '';
    if (hour >= 3 && hour < 11) greeting = 'Selamat Pagi';
    else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else greeting = 'Selamat Malam';

    // Get group icon and convert to buffer
    const welcomeImage = await fetch(avatar).then(res => res.arrayBuffer()).then(buffer => Buffer.from(buffer));

    // Join info removed
    const joinInfo = '';

    // Send private welcome message
    const mentions = [num, ownerMention];

    await sock.sendMessage(num, {
      image: welcomeImage,
      caption: `╭─『 👋 *WELCOME MESSAGE* 』─╮
│ ${greeting} @${num.split('@')[0]}! ✨
│ Selamat datang di grup *${guildName}*
│
├─『 📊 *GROUP INFO* 』
│ 🏷️ *Nama Group :* ${guildName}
│ 👥 *Total Member :* ${memberCount}
│ 👑 *Total Admin :* ${adminCount}
│ 💫 *Owner :* @${ownerMention.split('@')[0]}${joinInfo}
│ ⏰ *Waktu :* ${jakartaTime.format('HH:mm')} WIB ${(() => {
  const hour = jakartaTime.hour();
  if (hour >= 3 && hour < 11) return '🌅 Pagi';
  if (hour >= 11 && hour < 15) return '☀️ Siang';
  if (hour >= 15 && hour < 18) return '🌇 Sore';
  if (hour >= 18 && hour < 24) return '🌙 Malam';
  return '🌚 Tengah Malam';
})()}
│ 📅 *Tanggal :* ${jakartaTime.format('DD/MM/YYYY')}
│
├─『 📜 *RULES* 』
│ 1️⃣ Patuhi peraturan grup 📜
│ 2️⃣ Hormati sesama member 🤝
│ 3️⃣ Jaga ketertiban grup 🎯
│ 4️⃣ No spam/floods 🚫
│ 5️⃣ Dilarang share konten 18+ 🔞
│ 6️⃣ Dilarang promosi tanpa izin 📢
│ 7️⃣ Gunakan bahasa yang sopan 🗣️
│ 8️⃣ Hindari SARA dan politik ⚖️
│ 9️⃣ Jaga privasi member lain 🔒
│ 🔟 Ikuti arahan admin grup 👑
│
└─『 ✨ *SELAMAT BERGABUNG* 』`,
      mentions: mentions,
      contextInfo: {
        mentionedJid: mentions,
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: config.idSaluran || "120363312297133690@newsletter",
          newsletterName: config.namaSaluran || "Info Seputar Anime Dll 👤",
          serverMessageId: 999
        }
      }
    });

  } catch (error) {
    console.log(`
╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╮
│ 🤖 BOT PRIVATE WELCOME MESSAGE              │
│─────────────────────────────────────────────│
│ Status           : Error ❌                  │
│ Group Name       : ${groupMetadata.subject}  │
│ New Member       : @${num.split('@')[0]}     │
│ Error Message    : ${error.message}          │
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╯`);
  }
};
