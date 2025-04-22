import fetch from 'node-fetch';
import fs from 'fs';

const handleGoodbyeMessage = async (sock, groupMetadata, num, action) => {
  try {
    // Load config
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

    // Check if Goodbye Message is enabled
    if (!config.goodbyeMessage) return;

    // Get group owner
    const ownerMention = groupMetadata.owner || num;

    // Get user info
    const user = groupMetadata.participants.find(p => p.id === num);
    const username = user?.notify || user?.verifiedName || user?.pushName || user?.name || num.split('@')[0];
    const guildName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;

    // Get user avatar
    let avatar;
    try {
      avatar = await sock.profilePictureUrl(num, 'image');
    } catch {
      avatar = 'https://i.ibb.co/T1DqdYz/profile-pic-default.png';
    }

    // Get background
    const background = 'https://i.ibb.co/4YBNyvP/images-76.jpg';

    // Get Jakarta timezone details
    const moment = (await import('moment-timezone')).default;
    const jakartaTime = moment().tz('Asia/Jakarta');
    const currentTime = jakartaTime.format('HH:mm');
    const hour = jakartaTime.hour();

    let timeOfDay = '';
    if (hour >= 3 && hour < 11) timeOfDay = 'Pagi';
    else if (hour >= 11 && hour < 15) timeOfDay = 'Siang';
    else if (hour >= 15 && hour < 18) timeOfDay = 'Sore';
    else timeOfDay = 'Malam';

    // Get admin count
    const adminCount = groupMetadata.participants.filter(p => p.admin).length;

    // Format dates
    const groupCreation = new Date(groupMetadata.creation * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const creationDate = `${groupCreation.getDate()}/${months[groupCreation.getMonth()]}/${groupCreation.getFullYear()}`;
    const currentDate = `${jakartaTime.date()}/${months[jakartaTime.month()]}/${jakartaTime.year()}`;

    // Goodbye URL templates
    const goodbyeUrls = [
      {
        url: 'https://api.siputzx.my.id/api/canvas/goodbyev1',
        params: {
          username: `@${num.split('@')[0]}`,
          guildName,
          memberCount: memberCount.toString(),
          guildIcon: avatar,
          avatar,
          background
        }
      },
      {
        url: 'https://api.siputzx.my.id/api/canvas/goodbyev2',
        params: {
          username: `@${num.split('@')[0]}`,
          guildName,
          memberCount: memberCount.toString(),
          avatar,
          background
        }
      },
      {
        url: 'https://api.siputzx.my.id/api/canvas/goodbyev3',
        params: {
          username: `@${num.split('@')[0]}`,
          avatar
        }
      },
      {
        url: 'https://api.siputzx.my.id/api/canvas/goodbyev4',
        params: {
          avatar,
          background,
          description: `Goodbye from ${guildName}!`
        }
      }
    ];

    // Randomly select a goodbye URL template
    const template = goodbyeUrls[Math.floor(Math.random() * goodbyeUrls.length)];
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(template.params)) {
      params.append(key, value);
    }
    const goodbyeUrl = `${template.url}?${params.toString()}`;

    // Add configurable delay
    await new Promise(resolve => setTimeout(resolve, config.goodbyeDelay));

    // Fetch goodbye image
    const response = await fetch(goodbyeUrl);
    const buffer = await response.buffer();

    const leaveReason = action === 'remove' ? 'telah di keluarkan dari' : 'telah meninggalkan';

    // Send message
    await sock.sendMessage(groupMetadata.id, {
      image: buffer,
      caption: `╭═━━━━『 *GOODBYE* 』━━━━═⊱
┃ ⟩⟩ 👋 *Sayonara* @${num.split('@')[0]}
┃ ⟩⟩ 💫 *${leaveReason} group*
┃ ⟩⟩ 💭 *${guildName}*
┃
┃ ═━━━『 *INFO GROUP* 』━━━━═
┃ ⟩⟩ 👥 *Member tersisa* ⟩⟩ ${memberCount} 
┃ ⟩⟩ 👑 *Total Admin* ⟩⟩ ${adminCount} 
┃ ⟩⟩ 👨‍💼 *Pemilik Group* ⟩⟩ @${ownerMention.split('@')[0]}
┃ ⟩⟩ 📅 *Group Di Buat* ⟩⟩ ${creationDate}
┃ ⟩⟩ 📆 *Saat ini* ⟩⟩ ${currentDate}
┃ ⟩⟩ ⏰ *Waktu* ⟩⟩ ${currentTime} ${timeOfDay}
┃ ⟩⟩ 🎨 *Goodbye Type* ⟩⟩ v${template.url.slice(-1)}
╰═━━━━━━━━━━━━━━━═⊱`,
      mentions: [num, ownerMention],
      contextInfo: {
        mentionedJid: [num, ownerMention],
        forwardingScore: 100,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363312297133690@newsletter',
          newsletterName: 'Info Seputar Anime Dll 👤',
          serverMessageId: 100
        }
      }
    });

  } catch (error) {
    console.log(`
╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╮
│ 🤖 BOT GOODBYE MESSAGE                       │
│─────────────────────────────────────────────│
│ Status           : Error ❌                  │
│ Group Name       : ${groupMetadata.subject}  │
│ Member Left      : @${num.split('@')[0]}     │
│ Error Message    : ${error.message}          │
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╯`);
  }
};

export {
  handleGoodbyeMessage
};