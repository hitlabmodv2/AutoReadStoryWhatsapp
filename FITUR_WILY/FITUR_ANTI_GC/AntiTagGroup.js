import fs from 'fs';
import path from 'path';

const WARNING_DATA_FILE = path.join(process.cwd(), 'DATA', 'tag_warnings.json');

function loadWarningData() {
  try {
    if (fs.existsSync(WARNING_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(WARNING_DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error saat memuat data peringatan:', error);
  }
  return {};
}

function saveWarningData(data) {
  try {
    fs.writeFileSync(WARNING_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saat menyimpan data peringatan:', error);
  }
}

async function handleAntiTagSWV2(sock, msg, config, logCuy) {
  try {
    if (!config.antitagswv2) return;

    // Check both regular group mentions and newsletter mentions
    if ((msg.message?.groupStatusMentionMessage || 
        (msg.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid === config.idSaluran)) 
        && !msg.key.fromMe) {
      const groupId = msg.key.remoteJid;
      const participant = msg.key.participant;

      // Muat data peringatan
      const warningData = loadWarningData();

      // Inisialisasi data grup jika belum ada
      if (!warningData[groupId]) {
        warningData[groupId] = {};
      }

      // Inisialisasi peringatan user jika belum ada
      if (!warningData[groupId][participant]) {
        warningData[groupId][participant] = 0;
      }

      // Tambah peringatan
      warningData[groupId][participant]++;

      const groupMetadata = await sock.groupMetadata(groupId);
      const groupName = groupMetadata.subject;
      const isNewsletter = msg.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;
      const sourceInfo = isNewsletter ? config.namaSaluran : groupName;
      const groupOwner = groupMetadata.owner || "";
      const contextInfo = {
        mentionedJid: [participant, groupOwner],
        forwardingScore: 100,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363312297133690@newsletter',
          newsletterName: 'Info Anime Dll 🌟',
          serverMessageId: 143
        }
      };

      // Get sorted list of violators
      const sortedViolators = Object.entries(warningData[groupId])
        .map(([jid, count]) => `┃ - @${jid.split('@')[0]} (${count}x)`)
        .sort();

      const warningMessages = [
        `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃⚠️ Peringatan 1 (1/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @user\n┃🚫 Dilarang tag grup distory ya!\n┃⚡ Ini peringatan pertama kamu.\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃List Yang Melanggar\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃Name Group : ${groupName}\n┃Total Melanggar : ${Object.keys(warningData[groupId]).length} orang\n┃Nama Pelanggar :\n${sortedViolators.join('\n')}\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`,
        `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃😠 Peringatan 2 (2/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @user\n┃🚫 Stop tag grup di story!\n┃⚡ Peringatan kedua nih.\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃List Yang Melanggar\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃Name Group : ${groupName}\n┃Total Melanggar : ${Object.keys(warningData[groupId]).length} orang\n┃Nama Pelanggar :\n${sortedViolators.join('\n')}\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`,
        `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃😡 Peringatan 3 (3/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @user\n┃❌ Masih nekat tag grup?\n┃⚡ Ini sudah peringatan ketiga!\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃List Yang Melanggar\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃Name Group : ${groupName}\n┃Total Melanggar : ${Object.keys(warningData[groupId]).length} orang\n┃Nama Pelanggar :\n${sortedViolators.join('\n')}\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`,
        `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃🤬 Peringatan 4 (4/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @user\n┃⛔ INI PERINGATAN TERAKHIR!\n┃🚨 Sekali lagi tag grup, kamu akan dikick!\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃List Yang Melanggar\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃Name Group : ${groupName}\n┃Total Melanggar : ${Object.keys(warningData[groupId]).length} orang\n┃Nama Pelanggar :\n${sortedViolators.join('\n')}\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`
      ];

      const warningLevel = warningData[groupId][participant];
      let warningMsg = '';
      if (warningLevel > 0 && warningLevel <= warningMessages.length) {
        warningMsg = warningMessages[warningLevel - 1].replace('@user', `@${participant.split('@')[0]}`);
      }

      // Ambil foto profil pengguna dalam kualitas tinggi
      let ppuser;
      try {
        ppuser = await sock.profilePictureUrl(participant, 'image');
      } catch {
        ppuser = 'https://i.ibb.co/T1DqdYz/profile-pic-default.png';
      }

      if (warningLevel <= 4) {
        await sock.sendMessage(groupId, {
          image: { url: ppuser },
          caption: warningMsg,
          mentions: [participant],
          contextInfo: {
            mentionedJid: [participant, groupMetadata.owner || ""],
            forwardingScore: 100,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363312297133690@newsletter',
              newsletterName: 'Info Anime Dll 🌟',
              serverMessageId: 143
            }
          }
        }, { quoted: msg });

        await sock.sendMessage(groupId, { 
          delete: msg.key 
        });

        saveWarningData(warningData);
      }

      if (warningLevel >= 5) {
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const isAdmin = groupMetadata.participants.some(
          (member) => member.id === botNumber && member.admin !== null
        );

        if (isAdmin) {
          // Send final warning message before kick
          await sock.sendMessage(
            groupId,
            {
              image: { url: ppuser },
              caption: `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃💢 Peringatan 5 (5/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @${participant.split("@")[0]}\n┃💀 Kamu sudah diperingati 5 kali!\n┃🚫 Selamat tinggal~\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃List Yang Melanggar\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃Name Group : ${groupMetadata.subject}\n┃Total Melanggar : ${Object.keys(warningData[groupId]).length} orang\n┃Nama Pelanggar :\n${sortedViolators.join('\n')}\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`,
              mentions: [participant],
              contextInfo: {
                mentionedJid: [participant, groupMetadata.owner || ""],
                forwardingScore: 100,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363312297133690@newsletter',
                  newsletterName: 'Info Anime Dll 🌟',
                  serverMessageId: 143
                }
              }
            },
            { quoted: msg }
          );

          await sock.groupParticipantsUpdate(groupId, [participant], "remove");
          await sock.sendMessage(groupId, { 
            delete: msg.key 
          });

          delete warningData[groupId][participant];
          saveWarningData(warningData);

          logCuy(
            `Kamu mengeluarkan seseorang dari grup ${groupName} karena telah tag grup di story 5 kali.`,
            "red"
          );
        } else {
          logCuy(
            `Kamu bukan admin di grup ${groupName} jadi tidak bisa kick.`,
            "yellow"
          );
        }
      }
    }
  } catch (error) {
    if (config.lewatierror) {
      console.log('[ERROR HANDLER]'.red.bold + ' Error pada antitagswv2:'.yellow, error);
      console.log('[INFO]'.cyan.bold + ' Melanjutkan eksekusi karena lewatierror diaktifkan...'.yellow);
    } else {
      throw error;
    }
  }
}

export {
  handleAntiTagSWV2
};