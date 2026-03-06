import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataFolderPath = path.join(__dirname, '../../data');
if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath, { recursive: true });
}

const dbPath = path.join(dataFolderPath, 'pichanga.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL'); 

db.exec(`
    CREATE TABLE IF NOT EXISTS apodos (
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        nickname TEXT NOT NULL,
        PRIMARY KEY (guildId, userId)
    );

    CREATE TABLE IF NOT EXISTS partidos_activos (
        messageId TEXT PRIMARY KEY,
        channelId TEXT NOT NULL,
        guildId TEXT NOT NULL
    );
`);

export default db;
