import fetch from 'node-fetch';
import fs from 'fs';

const handlewelcome = async (sock, groupMetadata, num) => {
  try {
    // Load config
    const config = JSON.parse(await import('fs').then(fs => fs.readFileSync('./config.json', 'utf-8')));

    // Only run if welcome is enabled and welcomev2 is disabled
    if (!config.welcome || config.welcomev2) {
      return;
    }

    // Get actual group owner from metadata first
    const ownerMention = groupMetadata.owner || num; // Fallback to welcome user if no owner found

    // Get user info
    const user = groupMetadata.participants.find(p => p.id === num);
    const username = user?.notify || user?.verifiedName || user?.pushName || user?.name || num.split('@')[0];
    const guildName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;

    // Get owner name
    const ownerParticipant = groupMetadata.participants.find(p => p.id === ownerMention);
    const ownerName = ownerParticipant?.notify || ownerParticipant?.verifiedName || ownerParticipant?.pushName || ownerParticipant?.name || ownerMention.split('@')[0];

    // Get user avatar
    let avatar;
    try {
      avatar = await sock.profilePictureUrl(num, 'image');
    } catch {
      avatar = 'https://i.ibb.co/T1DqdYz/profile-pic-default.png';
    }

    // Get group background
    let background = 'https://i.ibb.co/4YBNyvP/images-76.jpg';

    // Welcome URL templates with fallbacks
    const welcomeUrls = [
      {
        url: `https://api.siputzx.my.id/api/canvas/welcomev1`,
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
        url: `https://api.siputzx.my.id/api/canvas/welcomev2`,
        params: {
          username: `@${num.split('@')[0]}`,
          guildName,
          memberCount: memberCount.toString(),
          avatar,
          background
        }
      },
      {
        url: `https://api.siputzx.my.id/api/canvas/welcomev3`,
        params: {
          username: `@${num.split('@')[0]}`,
          avatar
        }
      },
      {
        url: `https://api.siputzx.my.id/api/canvas/welcomev4`,
        params: {
          avatar,
          background,
          description: `Welcome to ${guildName}!`
        }
      }
    ];

    // Randomly select a welcome URL template and build URL with encoded parameters
    const template = welcomeUrls[Math.floor(Math.random() * welcomeUrls.length)];
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(template.params)) {
      params.append(key, value);
    }
    const welcomeUrl = `${template.url}?${params.toString()}`;

    // Fetch welcome image with retry logic
    let buffer;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // Increased to 30 second timeout
        
        const response = await fetch(welcomeUrl, {
          signal: controller.signal,
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }).catch(error => {
          clearTimeout(timeout);
          throw error;
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        buffer = Buffer.from(await response.arrayBuffer());
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error(`Failed to fetch welcome image after ${maxRetries} attempts:`, error);
          // Use default Welcome Group without image
          buffer = fs.readFileSync('./img/testing.jpg');
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
    }

    // Send Welcome Group with Jakarta timezone
    const moment = (await import('moment-timezone')).default;
    const jakartaTime = moment().tz('Asia/Jakarta');
    const currentTime = jakartaTime.format('HH:mm');
    const hour = jakartaTime.hour();

    let timeOfDay = '';
    if (hour >= 3 && hour < 11) timeOfDay = 'Pagi';
    else if (hour >= 11 && hour < 15) timeOfDay = 'Siang';
    else if (hour >= 15 && hour < 18) timeOfDay = 'Sore';
    else timeOfDay = 'Malam';

    // Get admin count and group info
    const adminCount = groupMetadata.participants.filter(p => p.admin).length;

    const groupCreation = new Date(groupMetadata.creation * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Format dates
    const creationDate = `${groupCreation.getDate()}/${months[groupCreation.getMonth()]}/${groupCreation.getFullYear()}`;
    const currentDate = `${jakartaTime.date()}/${months[jakartaTime.month()]}/${jakartaTime.year()}`;

    // Add configurable delay from config (default 1000ms if not set)
    await new Promise(resolve => setTimeout(resolve, config.welcomeDelay || 1000));

    await sock.sendMessage(groupMetadata.id, {
      image: buffer,
      caption: `╭═━━━━『 *WELCOME* 』━━━━═⊱
┃ ⟩⟩ 👋 *Halo* @${num.split('@')[0]}
┃ ⟩⟩ 🎉 *Selamat datang di group*
┃ ⟩⟩ 💭 *${guildName}*
┃
┃ ═━━━『 *INFO GROUP* 』━━━━═
┃ ⟩⟩ 👥 *Member ke* ⟩⟩ ${memberCount} 
┃ ⟩⟩ 👑 *Total Admin* ⟩⟩ ${adminCount} 
┃ ⟩⟩ 👨‍💼 *Pemilik Group* ⟩⟩ @${ownerMention.split('@')[0]}
┃ ⟩⟩ 📅 *Group Di Buat* ⟩⟩ ${creationDate}
┃ ⟩⟩ 📆 *Saat ini* ⟩⟩ ${currentDate}
┃ ⟩⟩ ⏰ *Waktu* ⟩⟩ ${currentTime} ${timeOfDay}
┃ ⟩⟩ 🎨 *Welcome Type* ⟩⟩ v${template.url.slice(-1)}
╰═━━━━━━━━━━━━━━━═⊱`,
      mentions: [num, ownerMention],
      contextInfo: {
        mentionedJid: [num, ownerMention],
        forwardingScore: 100,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363312297133690@newsletter',
          newsletterName: 'Info Anime Dll 🌟',
          serverMessageId: 143
        }
      }
    });

  } catch (error) {
    console.log(`
╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╮
│ 🤖 BOT WELCOME GROUP MESSAGE               │
│─────────────────────────────────────────────│
│ Status           : Error ❌                  │
│ Group Name       : ${groupMetadata.subject}  │
│ New Member       : @${num.split('@')[0]}     │
│ Error Message    : ${error.message}          │
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╯`);
  }
};

export { handlewelcome };