import os from 'os';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import moment from 'moment-timezone';

function formatp(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function speed() {
  return performance.now();
}

function runtime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

const imageUrls = [
  "https://files.catbox.moe/m6tz77.jpg",
  "https://files.catbox.moe/kiacyc.htm",
  "https://files.catbox.moe/8b881u.jpg",
  "https://files.catbox.moe/azbrp4.jpg",
  "https://files.catbox.moe/zrezka.jpg",
  "https://files.catbox.moe/iemyvc.png",
  "https://files.catbox.moe/1vvl3c.jpg",
  "https://files.catbox.moe/wdmwak.jpg",
  "https://files.catbox.moe/tidjwu.jpg",
  "https://files.catbox.moe/v7q2xu.jpg",
  "https://files.catbox.moe/oz501h.jpg",
  "https://files.catbox.moe/2ks7l7.jpg",
  "https://files.catbox.moe/766r3z.png",
  "https://files.catbox.moe/mc2q7x.png"
];

function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * imageUrls.length);
  return imageUrls[randomIndex];
}

// Initialize moment with Asia/Jakarta timezone
moment.tz.setDefault('Asia/Jakarta');
// Set locale to Indonesian
moment.locale('id');

async function handleMessage(sock, msg, config) {
  if (!msg || !msg.key) return;

  // Helper function for loading message
  const showLoading = async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Permintaan anda sedang diproses!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Processing Your Request",
                body: "Please wait while we process your request ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    //await sock.sendMessage(msg.key.remoteJid, { delete: loadingMsg.key });
  };

  if (msg.key.fromMe) {
    switch (msg.cmd) {
      case 's':
      case 'sticker': {
        try {
          let buffer;
          if (msg.quoted && msg.quoted.quotedMessage.imageMessage) {
            buffer = await downloadMediaMessage(
              {
                message: {
                  imageMessage: msg.quoted.quotedMessage.imageMessage
                },
                key: msg.quoted.key
              },
              "buffer",
              {},
              {
                logger: pino({ level: "fatal" })
              }
            );
          } else if (msg.message.imageMessage) {
            buffer = await downloadMediaMessage(
              msg,
              "buffer",
              {},
              {
                logger: pino({ level: "fatal" })
              }
            );
          } else {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `╭━━━『 *STICKER MAKER* 』━━━┄⊱\n┃\n┃ Kirim gambar dengan caption .s\n┃ atau reply gambar dengan .s\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`
            });
            return;
          }

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *STICKER MAKER* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Membuat Sticker
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Sticker sedang diproses!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Sticker Creation Process",
                body: "Creating your sticker with love ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          // Format date/time for watermark
          const watermarkDate = moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]');

          // Create sticker using wa-sticker-formatter
          const { Sticker } = await import('wa-sticker-formatter');
          const sticker = new Sticker(buffer, {
            pack: "✨ Wily Kun ✨",
            author: `Created: ${watermarkDate}`,
            type: 'full',
            categories: ['🎨', '✨'],
            id: 'BOT',
            quality: 100,
            background: '#00000000'
          });

          const stickerBuffer = await sticker.toBuffer();

          await sock.sendMessage(msg.key.remoteJid, {
            sticker: stickerBuffer,
            mimetype: 'image/webp',
            quoted: msg,
            contextInfo: {
              externalAdReply: {
                title: "✨ Wily Kun Sticker ✨",
                body: `Created: ${watermarkDate}`,
                mediaType: 1,
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                showAdAttribution: true,
                renderLargerThumbnail: true
              },
              isForwarded: true,
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.idSaluran,
                newsletterName: config.namaSaluran
              }
            }
          });

          // Success message instead of deleting loading message
          await sock.sendMessage(msg.key.remoteJid, {
            text: "✅ Sticker berhasil dibuat!",
            contextInfo: {
              externalAdReply: {
                title: "Sticker Created",
                body: "Powered by Wily Kun",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: false
              }
            }
          });

        } catch (error) {
          console.error('Error in sticker command:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal membuat sticker'
          });
        }
        break;
      }
      case 'brat': {
        try {
          if (!msg.args[0]) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `╭━━━『 *BRAT STICKER* 』━━━┄⊱\n┃\n┃ Masukkan teks!\n┃ Contoh: .brat Halo nama saya Wily\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`
            });
            return;
          }

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Permintaan anda sedang diproses!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Processing Your Request",
                body: "Please wait while we process your request ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          const text = encodeURIComponent(msg.args.join(' '));
          const now = moment().format('dddd, D MMMM YYYY HH:mm:ss');

          const response = await fetch(`https://api.siputzx.my.id/api/m/brat?text=${text}&isVideo=false&delay=500`);
          const buffer = await response.arrayBuffer();


          // Format date/time for watermark
          const watermarkDate = moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]');

          // Add metadata to sticker
          const stickerMetadata = {
            packname: "✨ Wily Kun ✨",
            author: `Created: ${watermarkDate}`,
            categories: ['🎨', '👻'],
            id: 'BOT',
            quality: 100,
            background: '#00000000'
          };

          await sock.sendMessage(msg.key.remoteJid, {
            sticker: Buffer.from(buffer),
            mimetype: 'image/webp',
            quoted: msg,
            ...stickerMetadata,
            contextInfo: {
              externalAdReply: {
                title: "✨ Wily Kun Sticker ✨",
                body: `Created: ${watermarkDate} | WM by @Wilykun`,
                mediaType: 1,
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                showAdAttribution: true,
                renderLargerThumbnail: true
              },
              isForwarded: true,
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.idSaluran,
                newsletterName: config.namaSaluran
              }
            },
            ...stickerMetadata
          });

        } catch (error) {
          console.error('Error in brat command:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal membuat sticker'
          });
        }
        break;
      }

      case 'ssweb': {
        try {
          if (!msg.args[0]) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `╭━━━━『 *SCREENSHOT WEB* 』━━━━┄⊱
┃
┃ 📝 *Cara Penggunaan*
┃ Format: .ssweb [url] [theme] [device]
┃
┃ 🌐 *Contoh:*
┃ .ssweb https://google.com dark desktop
┃
┃ 🎨 *Theme Options:*
┃ • light - Mode Terang
┃ • dark  - Mode Gelap
┃
┃ 📱 *Device Options:*
┃ • desktop - Tampilan Desktop
┃ • tablet  - Tampilan Tablet
┃ • phone   - Tampilan HP
┃
╰━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
              contextInfo: {
                externalAdReply: {
                  title: "Screenshot Web Service",
                  body: "Capture any website easily",
                  thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/870/870175.png",
                  sourceUrl: msg.key.remoteJid,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            });
            return;
          }

          const url = encodeURIComponent(msg.args[0]);
          const theme = msg.args[1]?.toLowerCase() === 'dark' ? 'dark' : 'light';
          const device = msg.args[2]?.toLowerCase() || 'desktop';

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Permintaan anda sedang diproses!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Processing Your Request",
                body: "Please wait while we process your request ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          const response = await fetch(`https://api.siputzx.my.id/api/tools/ssweb?url=${url}&theme=${theme}&device=${device}`);
          const buffer = await response.arrayBuffer();

          await sock.sendMessage(msg.key.remoteJid, {
            image: Buffer.from(buffer),
            caption: `╭━━━━『 *SCREENSHOT RESULT* 』━━━━┄⊱
┃
┃ 🌐 *Website URL*
┃ ${decodeURIComponent(url)}
┃
┃ 🎨 *Theme Mode*
┃ ${theme.charAt(0).toUpperCase() + theme.slice(1)}
┃
┃ 📱 *Device Type*
┃ ${device.charAt(0).toUpperCase() + device.slice(1)}
┃
┃ ⏱️ *Generated Time*
┃ ${moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "📸 Website Screenshot Service",
                body: "✨ Generated with SiputZX API",
                thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/870/870175.png",
                sourceUrl: decodeURIComponent(url),
                mediaType: 1,
                renderLargerThumbnail: true
              },
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.idSaluran,
                newsletterName: config.namaSaluran
              }
            }
          });
        } catch (error) {
          console.error('Error in ssweb:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal mengambil screenshot website',
            contextInfo: {
              externalAdReply: {
                title: "Error",
                body: "Failed to capture screenshot",
                thumbnailUrl: "https://cdn-icons-png.flaticon.com/512/1304/1304037.png",
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: false
              }
            }
          });
        }
        break;
      }
      case 'menu2': {
        try {
          await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

          // Get user profile picture with better error handling
          let profilePicture;
          try {
            profilePicture = { url: await sock.profilePictureUrl(msg.key.participant || msg.key.remoteJid, 'image') };
          } catch (error) {
            try {
              profilePicture = { url: await sock.profilePictureUrl(msg.key.remoteJid, 'image') };
            } catch {
              profilePicture = { url: getRandomImage() }; // Use random image as fallback
            }
          }

          // Get current time in Asia/Jakarta timezone
          const now = moment().tz('Asia/Jakarta');
          const hours = now.hours();
          let greeting = '';

          if (hours >= 4 && hours < 11) greeting = "🌅 Selamat Pagi";
          else if (hours >= 11 && hours < 15) greeting = "☀️ Selamat Siang";
          else if (hours >= 15 && hours < 18) greeting = "🌅 Selamat Sore";
          else greeting = "🌙 Selamat Malam";

          // Calculate total features accurately
          const totalFitur = {
            downloader: 2,    // mediafire, otakudesudownload
            anime: 3,         // otakudesuongoing, waifu, neko
            sticker: 2,       // sticker, brat
            tools: 1,         // ssweb
            system: 3,        // ping, botstatus, statusbot
            viewonce: 1,      // viewoncev2/lihat/buka/view
            other: 3          // toimg, restart, autoclearsession
          };

          const totalAllFitur = Object.values(totalFitur).reduce((a, b) => a + b, 0);

          const menuMessage = `╭━━━━『 *WILY KUN BOT MENU* 』━━━━┄⊱
┃
┃ ${greeting} *${msg.pushName || 'User'}* 👋
┃ Total Fitur: ${totalAllFitur} 📊
┃
┃━━━『 *INFORMASI* 』━━┄⊱
┃ • Ketik #menu
┃   Untuk melihat menu perintah yang tersedia
┃ • Ketik #info
┃   Untuk Melihat Fitur Auto Yang Aktif/Nonaktif
┃ • Ketik #menu2
┃   Untuk Melihat Fitur Special
┃
┃━━━『 *DOWNLOADER* 』━━┄⊱
┃ • .mediafire | .mdf | .mf
┃   Download file dari MediaFire
┃
┃ • .otakudesudownload
┃   Download anime dari OtakuDesu
┃
┃━━━『 *ANIME* 』━━┄⊱
┃ • .otakudesuongoing
┃   Cek anime ongoing di OtakuDesu
┃ • .waifu
┃   Generate random waifu image
┃ • .neko
┃   Generate random neko image
┃
┃━━━『 *STICKER* 』━━┄⊱
┃ • .s | .sticker
┃   Buat sticker dari gambar
┃
┃ • .brat [teks]
┃   Buat sticker brat dengan teks
┃
┃━━━『 *TOOLS* 』━━┄⊱
┃ • .ssweb [url] [theme] [device]
┃   Screenshot website dengan custom theme
┃   Theme: light/dark
┃   Device: desktop/tablet/phone
┃
┃━━━『 *SYSTEM* 』━━┄⊱
┃ • .ping | .botstatus | .statusbot
┃   Cek status dan performa bot
┃
┃━━━『 *VIEW ONCE* 』━━┄⊱
┃ • .viewoncev2 | .lihat | .buka | .view
┃   Lihat/ekstrak media view once
┃
┃━━━『 *OTHER* 』━━┄⊱
┃ • .toimg
┃   Convert sticker to image
┃
┃ • .autoclearsession
┃   Clear temporary session files
┃
┃ • .restart
┃   Restart the bot
┃
┃━━━『 *INFO* 』━━┄⊱
┃ • Prefix: .
┃ • Creator: @Wilykun
┃ • Note: Gunakan fitur dengan bijak!
╰━━━━━━━━━━━━━━━━━┄⊱`;

          // First try to fetch as buffer
          let imageBuffer;
          try {
            const response = await fetch(profilePicture.url);
            imageBuffer = Buffer.from(await response.arrayBuffer());
          } catch (error) {
            // If fetch fails, use default image
            imageBuffer = fs.readFileSync("./generated-icon.png");
          }

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              image: imageBuffer,
              caption: menuMessage,
              quoted: msg,
              contextInfo: {
                externalAdReply: {
                  title: "✨ Wily Kun Bot Menu ✨",
                  body: "Klik untuk info lebih lanjut",
                  thumbnailUrl: profilePicture.url || null,
                  sourceUrl: "https://whatsapp.com/channel/" + config.idSaluran,
                  mediaType: 1,
                  renderLargerThumbnail: true
                },
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: config.idSaluran,
                  newsletterName: config.namaSaluran
                }
              }
            }
          );
        } catch (error) {
          console.error('Error in menu2:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Terjadi kesalahan saat menampilkan menu',
            quoted: msg
          });
        }
        break;
      }




case 'mediafire':
      case 'mdf': 
      case 'mf': {
        try {
          if (!msg.args[0]) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `╭━━━『 *MEDIAFIRE DOWNLOAD* 』━━━┄⊱\n┃\n┃ Masukkan URL file MediaFire!\n┃ Contoh: .mediafire https://www.mediafire.com/file/xxx/file\n┃\n┃ Alias command:\n┃ • .mediafire\n┃ • .mdf\n┃ • .mf\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`
            });
            return;
          }

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Permintaan anda sedang diproses!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Processing Your Request",
                body: "Please wait while we process your request ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          // Keep processing delay for stability
          await new Promise(resolve => setTimeout(resolve, 5000));

          const response = await fetch(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(msg.args[0])}`);
          const data = await response.json();


          if (!data.status || !data.data) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: '❌ URL tidak valid atau file tidak ditemukan'
            });
            return;
          }

          let message = `╭━━━『 *MEDIAFIRE DOWNLOAD* 』━━━┄⊱\n`;
          message += `┃\n`;
          message += `┃ *Nama File:* ${data.data.fileName}\n`;
          message += `┃ *Ukuran:* ${data.data.fileSize}\n`;
          message += `┃ *Tipe:* ${data.data.fileType}\n`;
          message += `┃ *Upload:* ${data.data.uploadDate}\n`;
          message += `┃\n`;
          message += `┃ *Link Download:*\n`;
          message += `┃ ${data.data.downloadLink}\n`;
          message += `┃\n`;
          message += `╰━━━━━━━━━━━━━━━━━┄⊱`;

          await sock.sendMessage(msg.key.remoteJid, {
            text: message,
            contextInfo: {
              externalAdReply: {
                title: "MediaFire Download",
                body: data.data.fileName,
                thumbnailUrl: data.data.meta?.image || "https://static.mediafire.com/images/filetype/download/zip.jpg",
                sourceUrl: msg.args[0],
                mediaType: 1,
                renderLargerThumbnail: true
              },
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.idSaluran,
                newsletterName: config.namaSaluran
              }
            }
          });

          // Download and send the file
          try {
            const downloadMsg = await sock.sendMessage(msg.key.remoteJid, {
              text: "⏳ Sedang mengunduh file..."
            });

            const fileResponse = await fetch(data.data.downloadLink);
            const fileBuffer = await fileResponse.arrayBuffer();

            await sock.sendMessage(msg.key.remoteJid, {
              document: Buffer.from(fileBuffer),
              mimetype: data.data.meta?.mimeType || "application/octet-stream",
              fileName: data.data.fileName
            });

            // Delete the download message
            await sock.sendMessage(msg.key.remoteJid, {
              delete: downloadMsg.key
            });
          } catch (error) {
            console.error('Error downloading file:', error);
            await sock.sendMessage(msg.key.remoteJid, {
              text: "❌ Gagal mengunduh file"
            });
          }
        } catch (error) {
          console.error('Error in mediafire download:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Terjadi kesalahan saat mengambil data file'
          });
        }
        break;
      }




case 'toimg': {
  try {
    if (!msg.quoted || !msg.quoted.quotedMessage || !msg.quoted.quotedMessage.stickerMessage) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `╭━━━『 *STICKER TO IMAGE* 』━━━┄⊱\n┃\n┃ Reply sticker dengan caption .toimg\n┃ untuk mengubah sticker menjadi gambar\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`,
        contextInfo: {
          externalAdReply: {
            title: "Sticker to Image Converter",
            body: "Convert your stickers back to images ✨",
            thumbnailUrl: getRandomImage(),
            sourceUrl: msg.key.remoteJid,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      });
      return;
    }

    await sock.sendMessage(msg.key.remoteJid, {
      text: `╭━━━━━━━『 *STICKER TO IMAGE* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Mengkonversi Sticker
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Sticker sedang dikonversi!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
      contextInfo: {
        externalAdReply: {
          title: "Converting Sticker",
          body: "Please wait while we process your sticker   ",
          thumbnailUrl: getRandomImage(),
          sourceUrl: msg.key.remoteJid,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      },
      quoted: msg
    });

    const buffer = await downloadMediaMessage(
      {
        message: {
          stickerMessage: msg.quoted.quotedMessage.stickerMessage
        },
        key: msg.quoted.key
      },
      "buffer",
      {},
      {
        logger: pino({ level: "fatal" })
      }
    );

    await sock.sendMessage(msg.key.remoteJid, {
      image: buffer,
      caption: `╭━━━━━━━『 *STICKER TO IMAGE* 』━━━━━━━┄⊱
┃
┃ ✅ *Status* : Berhasil Mengkonversi
┃ ⏰ *Waktu* : ${moment().tz('Asia/Jakarta').format('HH:mm:ss')} WIB
┃ 📅 *Tanggal* : ${moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}
┃ 
┃ Sticker berhasil dikonversi menjadi gambar!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
      contextInfo: {
        externalAdReply: {
          title: "✨ Sticker Converted Successfully ✨",
          body: `Converted: ${moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]')}`,
          thumbnailUrl: getRandomImage(),
          sourceUrl: msg.key.remoteJid,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: msg });

  } catch (error) {
    console.error('Error in toimg command:', error);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ Gagal mengkonversi sticker ke gambar'
    });
  }
  break;
}

case 'otakudesudownload': {
        try {
          if (!msg.args[0]) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `╭━━━『 *OTAKUDESU DOWNLOAD* 』━━━┄⊱\n┃\n┃ Masukkan URL anime dari OtakuDesu!\n┃ Contoh: .otakudesudownload https://otakudesu.cloud/lengkap/btr-nng-sub-indo-part-1\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`
            });
            return;
          }

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Permintaan anda sedang diproses!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Processing Your Request",
                body: "Please wait while we process your request ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

          const response = await fetch(`https://api.siputzx.my.id/api/anime/otakudesu/download?url=${encodeURIComponent(msg.args[0])}`);
          const data = await response.json();


          if (!data.status || !data.data || !data.data.downloads) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: '❌ URL tidak valid atau anime tidak ditemukan'
            });
            return;
          }

          let message = `╭━━━『 *OTAKUDESU DOWNLOAD* 』━━━┄⊱\n`;
          message += `┃\n┃ *${data.data.title || 'Tidak ada judul'}*\n┃\n`;

          let grouped = {};
          data.data.downloads.forEach(dl => {
            if (!grouped[dl.quality]) {
              grouped[dl.quality] = [];
            }
            grouped[dl.quality].push(dl);
          });

          for (let quality in grouped) {
            message += `┃ *Kualitas ${quality}*\n`;
            grouped[dl.quality].forEach(dl => {
              message += `┃ • ${dl.host}: ${dl.link}\n`;
            });
            message += `┃\n`;
          }

          message += `╰━━━━━━━━━━━━━━━━━┄⊱`;

          await sock.sendMessage(msg.key.remoteJid, {
            text: message,
            contextInfo: {
              externalAdReply: {
                title: "OtakuDesu Download Links",
                body: "Data diambil dari OtakuDesu",
                thumbnailUrl: "https://otakudesu.cloud/wp-content/uploads/2025/04/148242.jpg",
                sourceUrl: msg.args[0],
                mediaType: 1,
                renderLargerThumbnail: true
              },
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.idSaluran,
                newsletterName: config.namaSaluran
              }
            }
          });
        } catch (error) {
          console.error('Error in otakudesudownload:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Terjadi kesalahan saat mengambil data download'
          });
        }
        break;
      }
      case 'autoclearsession': {
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *AUTO CLEAR SESSION* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Membersihkan Session
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Session sedang dibersihkan!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Auto Clear Session",
                body: "Cleaning up session files ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          const sessionDir = './sessions';
          const files = fs.readdirSync(sessionDir);
          const filteredFiles = files.filter(file => 
            (file.startsWith('pre-key') ||
            file.startsWith('sender-key') ||
            file.startsWith('session-') ||
            file.startsWith('app-state')) &&
            file !== 'creds.json'
          );

          let deletedCount = 0;
          for (const file of filteredFiles) {
            const filePath = path.join(sessionDir, file);
            try {
              fs.unlinkSync(filePath);
              deletedCount++;
            } catch (err) {
              console.error(`Failed to delete ${file}:`, err);
            }
          }

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *SESSION CLEARED* 』━━━━━━━┄⊱
┃
┃ 📂 *Session Files*
┃ ├─ Pre-key: ${filteredFiles.filter(f => f.startsWith('pre-key')).length} files
┃ ├─ Sender-key: ${filteredFiles.filter(f => f.startsWith('sender-key')).length} files
┃ ├─ Session: ${filteredFiles.filter(f => f.startsWith('session-')).length} files
┃ └─ App-state: ${filteredFiles.filter(f => f.startsWith('app-state')).length} files
┃
┃ ✨ *Total Files* : ${filteredFiles.length}
┃ 🗑️ *Deleted* : ${deletedCount} files
┃ ⏱️ *Time* : ${moment().format('dddd, D MMMM YYYYHH:mm:ss [WIB]')}
┃ ✅ *Status* : Success┃
┃ Session files have been cleaned!
┃ Bot will continue running normally.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "✨ Session Cleanup Complete ✨",
                body: `Cleaned ${deletedCount} files successfully!`,
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          });

        } catch (error) {
          console.error('Error in autoclearsession:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal membersihkan session'
          });
        }
        break;
      }

      case 'restart': {
        if (!msg.key.fromMe) {
          await sock.sendMessage(
            msg.key.remoteJid,
            { text: "❌ Maaf, hanya owner yang dapat menggunakan perintahini!" },
            { quoted: msg }
          );
          return;
        }

        try {
          // Send initial restart message
          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *SYSTEM RESTART* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Memulai Proses Restart
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Sistem sedang melakukan restart!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "System Restart Initiated",
                body: "Restarting bot system for optimal performance ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          // Wait for 3 seconds to show processing
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Send countdown message
          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *RESTARTING BOT* 』━━━━━━━┄⊱
┃
┃ 🔄 *Progress* : Sistem akan restart dalam
┃ ⏰ *Countdown* : 3 detik...
┃ 
┃ Mohon tunggu hingga bot kembali online
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            quoted: msg
          });

          // Final countdown
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Final message before restart
          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *SYSTEM SHUTDOWN* 』━━━━━━━┄⊱
┃
┃ ✅ *Status* : Memulai Ulang Sistem
┃ 🕐 *Time* : ${moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]')}
┃ 
┃ Bot akan segera aktif kembali...
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Bot is Restarting",
                body: "Please wait while the system restarts ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          // Wait 1 second before actual restart
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Perform the restart
          process.exit(1);

        } catch (error) {
          console.error('Error in restart command:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal melakukan restart bot'
          });
        }
        break;
      }

      case 'waifu': {
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Sedang mengambil gambar waifu!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Waifu Image Generator",
                body: "Generating beautiful waifu image for you ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          const response = await fetch('https://api.siputzx.my.id/api/r/waifu');
          const buffer = await response.arrayBuffer();

          await sock.sendMessage(msg.key.remoteJid, {
            image: Buffer.from(buffer),
            caption: `╭━━━━━━━『 *WAIFU IMAGE* 』━━━━━━━┄⊱
┃
┃ ✅ *Status* : Berhasil Generate
┃ ⏰ *Waktu* : ${moment().tz('Asia/Jakarta').format('HH:mm:ss')} WIB
┃ 📅 *Tanggal* : ${moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "✨ Waifu Image Generated ✨",
                body: "Powered by SiputZX API",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          });
        } catch (error) {
          console.error('Error in waifu command:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal mengambil gambar waifu'
          });
        }
        break;
      }


      case 'neko': {
        try {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱
┃
┃ 📍 *Status* : Sedang Memproses
┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}
┃ 
┃ Mohon tunggu sebentar...
┃ Sedang mengambil gambar neko!
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Neko Image Generator",
                body: "Generating cute neko image for you ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            },
            quoted: msg
          });

          const response = await fetch('https://api.siputzx.my.id/api/r/neko');
          const buffer = await response.arrayBuffer();

          await sock.sendMessage(msg.key.remoteJid, {
            image: Buffer.from(buffer),
            caption: `╭━━━━━━━『 *NEKO IMAGE* 』━━━━━━━┄⊱
┃
┃ ✅ *Status* : Berhasil Generate
┃ ⏰ *Waktu* : ${moment().tz('Asia/Jakarta').format('HH:mm:ss')} WIB
┃ 📅 *Tanggal* : ${moment().tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}
┃ 
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "✨ Neko Image Generated ✨",
                body: "Powered by SiputZX API",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          });
        } catch (error) {
          console.error('Error in neko command:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Gagal mengambil gambar neko'
          });
        }
        break;
      }

      case "viewoncev2":
      case "lihat":
      case "buka":
      case "view": {
        try {
          if (!msg.quoted) {
            await sock.sendMessage(msg.key.remoteJid, {
              text: `╭━━━『 *VIEW ONCE MEDIA* 』━━━┄⊱\n┃\n┃ Reply/balas pesan sekali lihat\n┃ dengan perintah #viewonce\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`,
              contextInfo: {
                externalAdReply: {
                  title: "View Once Media Viewer",
                  body: "Extract media from view once messages ✨",
                  thumbnailUrl: getRandomImage(),
                  sourceUrl: msg.key.remoteJid,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            });
            return;
          }

          await sock.sendMessage(msg.key.remoteJid, {
            text: `╭━━━━━━━『 *PROCESSING REQUEST* 』━━━━━━━┄⊱\n┃\n┃ 📍 *Status* : Sedang Memproses\n┃ ⏳ *Waktu* : ${moment().format('HH:mm:ss')}\n┃ \n┃ Mohon tunggu sebentar...\n┃ Media sedang diproses!\n┃ \n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━┄⊱`,
            contextInfo: {
              externalAdReply: {
                title: "Processing View Once Media",
                body: "Please wait while we process your media ✨",
                thumbnailUrl: getRandomImage(),
                sourceUrl: msg.key.remoteJid,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          });

          if (msg.isQuoted && msg.quoted && msg.quoted.quotedMessage) {
            const now = new Date();
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            const formatCaption = (type, originalCaption = '') => {
              return `╭━━━『 *👁️ VIEW ONCE MEDIA* 』━━━┄⊱\n┃\n┃ 📋 *Type:* ${type}\n┃ 📅 *Date:* ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}\n┃ ⏰ *Time:* ${now.toLocaleTimeString('id-ID')}\n┃ 💬 *Caption:* ${originalCaption || 'No caption'}\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`;
            };

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

              const caption = msg.quoted.quotedMessage.imageMessage.caption || '';

              await sock.sendMessage(
                msg.key.remoteJid,
                {
                  image: Buffer.from(buffer),
                  caption: formatCaption('Image', caption),
                  contextInfo: {
                    externalAdReply: {
                      title: "✨ View Once Image Extracted ✨",
                      body: `Extracted: ${moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]')}`,
                      thumbnailUrl: getRandomImage(),
                      sourceUrl: msg.key.remoteJid,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                },
                { quoted: msg },
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

              const caption = msg.quoted.quotedMessage.videoMessage.caption || '';

              await sock.sendMessage(
                msg.key.remoteJid,
                {
                  video: Buffer.from(buffer),
                  caption: formatCaption('Video', caption),
                  contextInfo: {
                    externalAdReply: {
                      title: "✨ View Once Video Extracted ✨", 
                      body: `Extracted: ${moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]')}`,
                      thumbnailUrl: getRandomImage(),
                      sourceUrl: msg.key.remoteJid,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                },
                { quoted: msg },
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
                msg.key.remoteJid,
                {
                  audio: Buffer.from(buffer),
                  caption: formatCaption('Audio'),
                  contextInfo: {
                    externalAdReply: {
                      title: "✨ View Once Audio Extracted ✨",
                      body: `Extracted: ${moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]')}`,
                      thumbnailUrl: getRandomImage(),
                      sourceUrl: msg.key.remoteJid,
                      mediaType: 1,
                      renderLargerThumbnail: true
                    }
                  }
                },
                { quoted: msg },
              );

              buffer = null;
            } else {
              await sock.sendMessage(
                msg.key.remoteJid,
                {
                  text: `╭━━━『 *ERROR* 』━━━┄⊱\n┃\n┃ Pesan yang direply bukan\n┃ media view once!\n┃\n╰━━━━━━━━━━━━━━━━━┄⊱`,
                  contextInfo: {
                    externalAdReply: {
                      title: "Invalid Media Type",
                      body: "Please reply to a view once media message",
                      thumbnailUrl: getRandomImage(),
                      sourceUrl: msg.key.remoteJid,
                      mediaType: 1,
                      renderLargerThumbnail: false
                    }
                  }
                },
                { quoted: msg },
              );
            }
          }
        } catch (error) {
          console.error('Error in viewonce command:', error);
          await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Terjadi kesalahan saat memproses media'
          });
        }
        break;
      }

      case 'ping':
      case 'botstatus': 
      case 'statusbot': {
        await showLoading(sock, msg);
        const used = process.memoryUsage();
        const cpus = os.cpus().map(cpu => {
          cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
          return cpu;
        });

        const cpu = cpus.reduce((last, cpu, _, { length }) => {
          last.total += cpu.total;
          last.speed += cpu.speed / length;
          last.times.user += cpu.times.user;
          last.times.nice += cpu.times.nice;
          last.times.sys += cpu.times.sys;
          last.times.idle += cpu.times.idle;
          last.times.irq += cpu.times.irq;
          return last;
        }, {
          speed: 0,
          total: 0,
          times: {
            user: 0,
            nice: 0,
            sys: 0,
            idle: 0,
            irq: 0
          }
        });

        let timestamp = speed();
        let latensi = speed() - timestamp;
        let neww = performance.now();
        let oldd = performance.now();

        const fetch = await import('node-fetch');

        // Get Indonesia time and weather
        const getIndonesiaInfo = async () => {
          try {
            const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar'];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];

            const indonesiaTime = moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]');

            try {
              const response = await fetch.default(`https://api.openweathermap.org/data/2.5/weather?q=${randomCity},ID&units=metric&appid=c12d0288ff08d2bee3a41e0b42878cc5`, {
                timeout: 5000,
                headers: {
                  'Accept': 'application/json'
                }
              });

              if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
              }

              const data = await response.json();

              if (!data || !data.main || !data.weather || !data.weather[0]) {
                throw new Error('Incomplete weather data');
              }

              return {
                city: randomCity,
                time: indonesiaTime,
                temp: Math.round(data.main.temp),
                condition: data.weather[0].description,
                humidity: data.main.humidity,
                feelslike: Math.round(data.main.feels_like)
              };
            } catch (weatherError) {
              console.log('Weather fetch error:', weatherError);
              // Return basic info without weather data
              return {
                city: randomCity,
                time: indonesiaTime,
                temp: '?',
                condition: 'Data cuaca tidak tersedia',
                humidity: '?',
                feelslike: '?'
              };
            }
          } catch (error) {
            console.error('Error fetching weather info:', error);
            return {
              city: 'Indonesia',
              time: moment().format('dddd, D MMMM YYYY HH:mm:ss [WIB]'),
              temp: '?',
              condition: 'Tidak tersedia',
              humidity: '?',
              feelslike: '?'
            };
          }
        };

        const indonesiaInfo = await getIndonesiaInfo();

        let respon = `╭━━『 *BOT STATUS* 』━━┄⊱
┃
┃ ⏱️ *Response Speed* : ${latensi.toFixed(4)} _Second_
┃ ⚡ *Processing Time* : ${oldd - neww} _ms_
┃ ⌛ *Runtime* : ${runtime(process.uptime())}
┃ 
┃━━『 *SYSTEM INFO* 』━━┄⊱
┃
┃ 💻 *OS Platform* : ${os.platform()}
┃ 🖥️ *OS Version* : ${os.version()}
┃ 📟 *Architecture* : ${os.arch()}
┃ 🌡️ *CPU Temp* : ${(os.cpus()[0].speed/1000).toFixed(1)}°C
┃ ⚙️ *CPU Model* : ${cpus[0].model.trim()}
┃ 🔢 *CPU Cores* : ${cpus.length} Core(s)
┃ 
┃━━『 *MEMORY USAGE* 』━━┄⊱
┃
┃ 💾 *RAM Used* : ${formatp(os.totalmem() - os.freemem())}
┃ 💿 *RAM Total* : ${formatp(os.totalmem())}
┃ 📊 *RAM Free* : ${formatp(os.freemem())}
╰━━━━━━━━━━━━━━━━━┄⊱`;

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: respon,
            fileLength: 9999999,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: true,
                title: 'STATUS SERVER',
                body: `${latensi.toFixed(4)} Second`,
                thumbnailUrl: getRandomImage(),
                sourceUrl: 'https://whatsapp.com/channel/120363312297133690@newsletter',
                mediaType: 1,
                renderLargerThumbnail: true
              },
              isForwarded: true,
              mentionedJid: [`6282263096788@s.whatsapp.net`],
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.idSaluran,
                newsletterName: config.namaSaluran
              }
            }
          },
          { quoted: msg }
        );
        break      }
      default:
        break;
    }
  }
}

export { handleMessage };