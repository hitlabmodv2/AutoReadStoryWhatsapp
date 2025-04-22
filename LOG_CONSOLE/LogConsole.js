
import moment from "moment-timezone";
import colors from "colors";

export function displayStartupInfo(config, loggedInNumber, totalViewed, totalRestarts, totalFitur, totalAktif, totalNonaktif) {
  const now = moment().tz("Asia/Jakarta");
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let displayedLoggedInNumber = loggedInNumber;
  if (config.sensorNomor) {
    displayedLoggedInNumber = displayedLoggedInNumber.slice(0, 3) + "****" + displayedLoggedInNumber.slice(-2);
  }

  let timeDisplay;
  const speedInSeconds = config.SpeedReadStory/1000;
  if (speedInSeconds < 60) {
    timeDisplay = `${speedInSeconds} Detik`;
  } else if (speedInSeconds < 3600) {
    timeDisplay = `${Math.floor(speedInSeconds/60)} Menit`;
  } else if (speedInSeconds < 86400) {
    timeDisplay = `${Math.floor(speedInSeconds/3600)} Jam`;
  } else {
    timeDisplay = `${Math.floor(speedInSeconds/86400)} Hari`;
  }

  console.log("\n" + "╔═══════════════════════════════════════╗"["cyan"].bold);
  console.log("║     BOT AUTO LIHAT STATUS WHATSAPP    ║"["cyan"].bold);
  console.log("╠═══════════════════════════════════════╣"["cyan"].bold);
  console.log("║"["cyan"].bold + " ⚡ Status Bot : Aktif ✓               ║"["cyan"].bold);
  console.log("║"["cyan"].bold + ` 👤 Nomor Login : ${displayedLoggedInNumber}            ║`["cyan"].bold);
  console.log("║"["cyan"].bold + ` ⚙️  Speed Lihat Status : ${timeDisplay}       ║`["cyan"].bold);
  console.log("║"["cyan"].bold + ` 👁️  Melihat Status Orang : ${totalViewed}        ║`["cyan"].bold);
  console.log("║"["cyan"].bold + ` 🔄 Total Restart  : ${totalRestarts}               ║`["cyan"].bold);
  console.log("║                                       ║"["cyan"].bold);
  console.log("║"["cyan"].bold + " 🗓️ Informasi Waktu:                   ║"["cyan"].bold);
  console.log("║"["cyan"].bold + ` ├─⭓ Tanggal : ${days[now.day()]}, ${now.format("DD MMM YYYY")}      ║`["cyan"].bold);
  console.log("║"["cyan"].bold + ` ├─⭓ Waktu   : ${now.format("hh:mm A")} (${(() => {
    const hour = now.hour();
    if (hour >= 5 && hour < 11) return 'Pagi 🌅';
    if (hour >= 11 && hour < 15) return 'Siang 🌞';
    if (hour >= 15 && hour < 18) return 'Sore 🌇';
    return 'Malam 🌙';
  })()})     ║`["cyan"].bold);
  console.log("║"["cyan"].bold + " └─⭓ Status  : Sedang Aktif ✨         ║"["cyan"].bold);
  console.log("║                                       ║"["cyan"].bold);
  console.log("║"["cyan"].bold + " 📝 Credit & Information:              ║"["cyan"].bold);
  console.log("║"["cyan"].bold + " ├─⭓ Base Script    : Bang Jauhariel   ║"["cyan"].bold);
  console.log("║"["cyan"].bold + " └─⭓ Recode & Enhanced: Bang Wily      ║"["cyan"].bold);
  console.log("║                                       ║"["cyan"].bold);
  console.log("║"["cyan"].bold + " 📊 Status Fitur:                      ║"["cyan"].bold);
  console.log("║"["cyan"].bold + ` ├─⭓ Total Fitur    : ${totalFitur}               ║`["cyan"].bold);
  console.log("║"["cyan"].bold + ` ├─⭓ Fitur Aktif    : ${totalAktif}                ║`["cyan"].bold);
  console.log("║"["cyan"].bold + ` └─⭓ Fitur Nonaktif : ${totalNonaktif}               ║`["cyan"].bold);
  console.log("╚═══════════════════════════════════════╝"["cyan"].bold);
}
