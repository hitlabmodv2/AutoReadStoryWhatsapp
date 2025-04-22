import fs from 'fs';
import moment from 'moment-timezone';

const handleGoodbye = async (sock, groupMetadata, num, action) => {
  try {
    // Load config
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

    // Check if Goodbye V2 is enabled
    if (!config.goodbyev2) return;

    // Don't run if regular goodbye is enabled
    if (config.goodbyeMessage) return;

    // Add delay before sending goodbye
    await new Promise(resolve => setTimeout(resolve, config.goodbyeDelayV2 || 1000));

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

    // Get profile picture for goodbye image
    const goodbyeImage = await fetch(avatar).then(res => res.arrayBuffer()).then(buffer => Buffer.from(buffer));

    // Random goodbye messages
    const goodbyes = [
      '👋 Selamat tinggal, semoga kita bertemu lagi!',
      '🌟 Terima kasih telah menjadi bagian dari grup ini!',
      '💫 Sampai jumpa di lain kesempatan!',
      '🙏 Semoga sukses di perjalanan selanjutnya!'
    ];

    const randomGoodbye = goodbyes[Math.floor(Math.random() * goodbyes.length)];
    const leaveReason = action === 'remove' ? 'dikeluarkan dari' : 'meninggalkan';

    // Send Goodbye Message
    await sock.sendMessage(groupMetadata.id, {
      image: goodbyeImage,
      caption: `╭━━━『 👋 *GOODBYE MESSAGE* 』━━━╮
┃ ${greeting} ${username}! ✨
┃ ${randomGoodbye}
┃
┣━━━『 📊 *GROUP INFO* 』━━━┫
┃ 🏷️ *Nama Group:* ${guildName}
┃ 👥 *Member tersisa:* ${memberCount}
┃ 👑 *Admin:* ${adminCount}
┃ 💫 *Owner:* @${ownerMention.split('@')[0]}
┃ 
┣━━━『 📅 *DATE INFO* 』━━━┫
┃ 🎉 *Dibuat:* ${creationDate}
┃ 📆 *Hari ini:* ${currentDate}
┃ ⏰ *Waktu:* ${currentTime} WIB
┃
┣━━━『 ℹ️ *INFO* 』━━━┫
┃ Telah ${leaveReason} grup ini
┃
┗━━━『 🌟 *SELAMAT TINGGAL* 』━━━╯`,
      mentions: [num, ownerMention],
      contextInfo: {
        mentionedJid: [num, ownerMention],
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
│ 🤖 BOT GOODBYE V2 MESSAGE                   │
│─────────────────────────────────────────────│
│ Status           : Error ❌                  │
│ Group Name       : ${groupMetadata.subject}  │
│ Member Left      : @${num.split('@')[0]}     │
│ Error Message    : ${error.message}          │
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─╯`);
  }
};

export { handleGoodbye };