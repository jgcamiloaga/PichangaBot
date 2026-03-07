import db from '../config/database';

export interface ActiveMatch {
    messageId: string;
    channelId: string;
    guildId: string;
}

export const saveActiveMatch = (messageId: string, channelId: string, guildId: string): void => {
    console.log(`[DB] Guardando partido activo: MsgID=${messageId}, Canal=${channelId}, Guild=${guildId}`);
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO partidos_activos (messageId, channelId, guildId)
        VALUES (?, ?, ?)
    `);
    
    stmt.run(messageId, channelId, guildId);
};

export const getActiveMatches = (guildId: string): ActiveMatch[] => {
    const stmt = db.prepare('SELECT messageId, channelId, guildId FROM partidos_activos WHERE guildId = ?');
    const matches = stmt.all(guildId) as ActiveMatch[];
    console.log(`[DB] Encontrados ${matches.length} partidos activos para el Guild=${guildId}`);
    return matches;
};
