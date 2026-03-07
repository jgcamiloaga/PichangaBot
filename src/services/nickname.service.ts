import db from '../config/database';

export const saveNickname = (guildId: string, userId: string, nickname: string): void => {
    const stmt = db.prepare(`
        INSERT INTO apodos (guildId, userId, nickname)
        VALUES (?, ?, ?)
        ON CONFLICT(guildId, userId) DO UPDATE SET nickname = excluded.nickname
    `);
    
    stmt.run(guildId, userId, nickname);
};

export const getNickname = (guildId: string, userId: string): string | null => {
    const stmt = db.prepare('SELECT nickname FROM apodos WHERE guildId = ? AND userId = ?');
    const row = stmt.get(guildId, userId) as { nickname: string } | undefined;
    
    return row ? row.nickname : null;
};

export const removeNickname = (guildId: string, userId: string): void => {
    const stmt = db.prepare('DELETE FROM apodos WHERE guildId = ? AND userId = ?');
    stmt.run(guildId, userId);
};

export const refreshPlayerListNicknames = (currentPlayers: string, guildId: string): string => {
    if (currentPlayers === 'Nadie se ha inscrito aún... ¡Sé el primero!') return currentPlayers;
    
    return currentPlayers.split('\n').map(line => {
        const match = line.match(/<@(\d+)>/);
        if (match) {
            const userId = match[1];
            const nickname = getNickname(guildId, userId);
            
            const isGuest = line.includes('Invitado de');
            
            if (isGuest) {
                return nickname ? `• Invitado de <@${userId}> (${nickname})` : `• Invitado de <@${userId}>`;
            } else {
                return nickname ? `• <@${userId}> (${nickname})` : `• <@${userId}>`;
            }
        }
        return line;
    }).join('\n');
};
