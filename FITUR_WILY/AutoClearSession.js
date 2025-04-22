
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

let autoClearInterval = null;

export function startAutoClearSession(sessionDir, config) {
    if (!config.autoClearSession) {
        console.log(chalk.yellow('Auto Clear Session is disabled'));
        return;
    }

    if (!config.autoClearSessionInterval || config.autoClearSessionInterval < 1000) {
        console.log(chalk.red('Invalid interval. Must be at least 1000ms (1 second)'));
        return;
    }

    if (autoClearInterval) {
        clearInterval(autoClearInterval);
        console.log(chalk.yellow('Stopping previous Auto Clear Session interval'));
    }

    console.log(chalk.green(`Starting Auto Clear Session with interval: ${config.autoClearSessionInterval}ms`));

    autoClearInterval = setInterval(() => {
        try {
            if (!fs.existsSync(sessionDir)) {
                console.log(chalk.yellow(`Session directory ${sessionDir} does not exist`));
                return;
            }

            const files = fs.readdirSync(sessionDir);
            const filteredFiles = files.filter(file => 
                (file.startsWith('pre-key') ||
                file.startsWith('sender-key') ||
                file.startsWith('session-') ||
                file.startsWith('app-state')) &&
                file !== 'creds.json' // Explicitly exclude creds.json
            );

            if (filteredFiles.length === 0) {
                console.log(chalk.yellow('No session files to clear'));
                return;
            }

            console.log(chalk.yellow('======================================================'));
            console.log(chalk.yellow('🧹 [AUTO CLEAN] Memulai pembersihan sesi otomatis...'));
            console.log(chalk.yellow('======================================================'));

            filteredFiles.forEach(file => {
                const filePath = path.join(sessionDir, file);
                fs.unlinkSync(filePath);
                console.log(chalk.cyan(`Deleted: ${file}`));
            });

            console.log(chalk.green('======================================================'));
            console.log(chalk.green(`🗑️ [AUTO CLEAN] Menghapus ${filteredFiles.length} file sesi`));
            console.log(chalk.green('✅ Berhasil Menghapus sesi'));
            console.log(chalk.green('======================================================'));
        } catch (error) {
            console.error(chalk.red('======================================================'));
            console.error(chalk.red('❌ [AUTO CLEAN] Terjadi kesalahan saat pembersihan sesi otomatis'));
            console.error(chalk.red('======================================================'), error);
        }
    }, config.autoClearSessionInterval);
}

export function stopAutoClearSession() {
    if (autoClearInterval) {
        clearInterval(autoClearInterval);
        autoClearInterval = null;
        console.log(chalk.yellow('Auto Clear Session stopped'));
    }
}
