import supabase from '../config/database';

export const saveNickname = async (guildId: string, userId: string, nickname: string): Promise<void> => {
    const { error } = await supabase
        .from('apodos')
        .upsert({ guildId, userId, nickname }, { onConflict: 'guildId,userId' });

    if (error) {
        console.error('[DB Error] guardando apodo:', error);
    }
};

export const getNickname = async (guildId: string, userId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('apodos')
        .select('nickname')
        .eq('guildId', guildId)
        .eq('userId', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[DB Error] obteniendo apodo:', error);
    }
    return data ? data.nickname : null;
};

export const removeNickname = async (guildId: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('apodos')
        .delete()
        .eq('guildId', guildId)
        .eq('userId', userId);

    if (error) {
        console.error('[DB Error] eliminando apodo:', error);
    }
};

export const refreshPlayerListNicknames = async (currentPlayers: string, guildId: string): Promise<string> => {
    if (currentPlayers === 'Nadie se ha inscrito aún... ¡Sé el primero!') return currentPlayers;

    const lines = currentPlayers.split('\n');
    const newLines = [];

    for (const line of lines) {
        const match = line.match(/<@(\d+)>/);
        if (match) {
            const userId = match[1];
            const nickname = await getNickname(guildId, userId);

            const isGuest = line.includes('Invitado de');

            if (isGuest) {
                newLines.push(nickname ? `• Invitado de <@${userId}> (${nickname})` : `• Invitado de <@${userId}>`);
            } else {
                newLines.push(nickname ? `• <@${userId}> (${nickname})` : `• <@${userId}>`);
            }
        } else {
            newLines.push(line);
        }
    }

    return newLines.join('\n');
};
