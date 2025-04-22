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

function hasMediaContent(msg) {
  return (
    msg.message?.imageMessage ||
    msg.message?.videoMessage ||
    msg.message?.audioMessage ||
    msg.message?.documentMessage ||
    (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage && (
      msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage ||
      msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage ||
      msg.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage ||
      msg.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage
    ))
  );
}

async function deleteUserMessages(sock, groupId, userId, hours = 24) {
  try {
    const messages = await sock.loadMessages(groupId, 100);
    if (!messages?.messages) return;

    const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
    const userMessages = messages.messages.filter(msg => 
      msg.key.participant === userId && 
      msg.messageTimestamp * 1000 > timeThreshold
    );

    for (const msg of userMessages) {
      await sock.sendMessage(groupId, { delete: msg.key });
    }
  } catch (error) {
    console.error('Error deleting messages:', error);
  }
}

async function handleAntiTagSWV2(sock, msg, config, logCuy) {
  try {
    if (!config.antitagswv2) return;

    // Check if message contains group mention in status
    if (msg.message?.groupStatusMentionMessage) {
      const groupId = msg.key.remoteJid;
      const participant = msg.key.participant;

      // Load warning data
      const warningData = loadWarningData();
      if (!warningData[groupId]) warningData[groupId] = {};
      if (!warningData[groupId][participant]) warningData[groupId][participant] = 0;
      warningData[groupId][participant]++;

      const groupMetadata = await sock.groupMetadata(groupId);
      const groupName = groupMetadata.subject;
      const sortedViolators = Object.entries(warningData[groupId])
        .map(([jid, count]) => `┃ - @${jid.split('@')[0]} (${count}x)`)
        .sort();

      let ppuser;
      try {
        ppuser = await sock.profilePictureUrl(participant, 'image');
      } catch {
        ppuser = 'https://i.ibb.co/T1DqdYz/profile-pic-default.png';
      }

      // Delete message
      await sock.sendMessage(groupId, { 
        delete: msg.key 
      });

      // Send warning
      const warningLevel = warningData[groupId][participant];
      if (warningLevel <= 4) {
        const warningTemplate = `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃⚠️ Peringatan ${warningLevel} (${warningLevel}/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @${participant.split('@')[0]}\n┃🚫 Dilarang tag grup di status!\n┃⚡ Pesan kamu telah dihapus.\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃List Yang Melanggar\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃Name Group : ${groupName}\n┃Total Melanggar : ${Object.keys(warningData[groupId]).length} orang\n┃Nama Pelanggar :\n${sortedViolators.join('\n')}\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`;

        await sock.sendMessage(groupId, {
          image: { url: ppuser },
          caption: warningTemplate,
          mentions: [participant],
          contextInfo: {
            mentionedJid: [participant],
            forwardingScore: 100,
            isForwarded: true,
            quotedMessage: msg.message
          }
        }, { quoted: msg });

        saveWarningData(warningData);
      }

      if (warningLevel >= 5) {
        const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const isAdmin = groupMetadata.participants.some(
          (member) => member.id === botNumber && member.admin !== null
        );

        if (isAdmin) {
          await sock.sendMessage(groupId, {
            image: { url: ppuser },
            caption: `┏━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┓\n┃💢 Peringatan 5 (5/5)\n┣━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┫\n┃👋 Hallo @${participant.split('@')[0]}\n┃💀 Kamu sudah diperingati 5 kali!\n┃🚫 Selamat tinggal~\n┗━━━━━━━━━⊰⋆⋆⋆⊱━━━━━━━━━┛`,
            mentions: [participant],
            contextInfo: {
              mentionedJid: [participant],
              forwardingScore: 100,
              isForwarded: true,
              quotedMessage: msg.message
            }
          }, { quoted: msg });

          await sock.groupParticipantsUpdate(groupId, [participant], "remove");
          delete warningData[groupId][participant];
          saveWarningData(warningData);
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