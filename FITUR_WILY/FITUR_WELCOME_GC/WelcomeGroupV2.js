import fs from 'fs';
import moment from 'moment-timezone';

const handlewelcome = async (sock, groupMetadata, num) => {
  try {
    // Load config
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

    // Only run if welcomev2 is enabled and welcome is disabled
    if (!config.welcomev2 || config.welcome) {
      return;
    }

    // Use minimal delay from config
    const delay = Math.min(config.welcomeDelayV2 || 1000, 1000); // Cap at 1 second max
    await new Promise(resolve => setTimeout(resolve, delay));

    const username = `@${num.split('@')[0]}`;
    const guildName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;
    const ownerMention = groupMetadata.owner || num;
    const adminCount = groupMetadata.participants.filter(p => p.admin).length;

    // Get user avatar
    let avatar;
    try {
      // Try to get user's WhatsApp profile picture
      avatar = await sock.profilePictureUrl(num, 'image');
    } catch {
      try {
        // If user profile fails, try group picture
        avatar = await sock.profilePictureUrl(groupMetadata.id, 'image');
      } catch {
        // If both fail, use a reliable default avatar
        avatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
      }
    }

    // Verify the avatar URL is accessible
    try {
      const response = await fetch(avatar, { timeout: 3000 });
      if (!response.ok) {
        throw new Error('Avatar fetch failed');
      }
    } catch {
      // Use reliable default if fetch fails
      avatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
      console.log('Using default avatar: Failed to fetch avatar image');
    }

    // Get group icon
    let groupIcon;
    try {
      groupIcon = await sock.profilePictureUrl(groupMetadata.id, 'image');
    } catch {
      // If group icon not available, use member's avatar
      groupIcon = avatar;
    }


    // Get Jakarta time
    const jakartaTime = moment().tz('Asia/Jakarta');
    const currentTime = jakartaTime.format('HH:mm');
    const currentDate = jakartaTime.format('DD/MM/YYYY');

    // Get time of day greeting
    const hour = jakartaTime.hour();
    let greeting = '';
    if (hour >= 3 && hour < 11) greeting = 'Selamat Pagi';
    else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else greeting = 'Selamat Malam';

    // Group creation date
    const groupCreation = new Date(groupMetadata.creation * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const creationDate = `${groupCreation.getDate()}/${months[groupCreation.getMonth()]}/${groupCreation.getFullYear()}`;

    // Use profile picture as welcome image
    const welcomeImage = await fetch(avatar).then(res => res.arrayBuffer()).then(buffer => Buffer.from(buffer));

    // Random welcome messages
    const welcomes = [
      '🌟 Selamat bergabung di keluarga baru kami!',
      '🎉 Yay! Member baru telah tiba!',
      '👋 Welcome to the squad!',
      '💫 Selamat datang di komunitas kami!'
    ];

    const randomWelcome = welcomes[Math.floor(Math.random() * welcomes.length)];

    // Initialize mentions array
    let mentions = [num, ownerMention];

    // Get join type and inviter info
    let joinInfo = '';
    try {
      const participant = groupMetadata.participants.find(p => p.id === num);
      
      if (participant?.invite) {
        const inviter = participant.invite;
        const inviterParticipant = groupMetadata.participants.find(p => p.id === inviter);
        
        // Check if inviter is an admin (admin will have either 'admin' or 'superadmin' role)
        const isAdmin = inviterParticipant?.admin === 'admin' || inviterParticipant?.admin === 'superadmin';
        
        if (isAdmin) {
          joinInfo = `\n┃ 📲 *Bergabung via:* Undangan Admin\n┃ 🎯 *Diundang oleh:* @${inviter.split('@')[0]}`;
        } else {
          joinInfo = `\n┃ 📲 *Bergabung via:* Undangan Member\n┃ 🎯 *Diundang oleh:* @${inviter.split('@')[0]}`;
        }
        
        // Add inviter to mentions for tagging
        if (!mentions.includes(inviter)) {
          mentions.push(inviter);
        }
        
        // Log detailed join info
        console.log(`Member ${num} joined via ${isAdmin ? 'admin' : 'member'} invite from ${inviter}`);
      } else {
        joinInfo = '\n┃ 📲 *Bergabung via:* Tautan Grup';
        console.log(`Member ${num} joined via group link`);
      }

    } catch (error) {
      console.error('Error getting join info:', error);
      joinInfo = '\n┃ 📲 *Bergabung via:* -';
    }

    // Send Welcome Message
    await sock.sendMessage(groupMetadata.id, {
      image: welcomeImage,
      caption: `╭━━━『 👋 *WELCOME MESSAGE* 』━━━╮
┃ ${greeting} ${username}! ✨
┃ ${randomWelcome}
┃
┣━━━『 📊 *GROUP INFO* 』━━━┫
┃ 🏷️ *Nama Group:* ${guildName}
┃ 👥 *Member ke:* ${memberCount}
┃ 👑 *Admin:* ${adminCount}
┃ 💫 *Owner:* @${ownerMention.split('@')[0]}${joinInfo}
┃ 
┣━━━『 📅 *DATE INFO* 』━━━┫
┃ 🎉 *Dibuat:* ${creationDate}
┃ 📆 *Hari ini:* ${currentDate}
┃ ⏰ *Waktu:* ${currentTime} WIB
┃
┣━━━『 📜 *RULES* 』━━━┫
┃ 1️⃣ Patuhi peraturan grup
┃ 2️⃣ Hormati sesama member
┃ 3️⃣ Jaga ketertiban grup
┃ 4️⃣ No spam/floods
┃
┗━━━『 🌟 *SELAMAT BERGABUNG* 』━━━╯

Note: Silakan baca deskripsi grup untuk info lebih lanjut.`,
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
│ 🤖 BOT WELCOME V2 MESSAGE                   │
│─────────────────────────────────────────────│
│ Status           : Error ❌                  │
│ Group Name       : ${groupMetadata.subject}  │
│ New Member       : @${num.split('@')[0]}     │
│ Error Message    : ${error.message}          │
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╯`);
  }
};

export { handlewelcome };