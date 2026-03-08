import supabase from '../config/database';

export interface ActiveMatch {
    messageId: string;
    channelId: string;
    guildId: string;
}

export const saveActiveMatch = async (messageId: string, channelId: string, guildId: string): Promise<void> => {
    console.log(`[DB] Guardando partido activo en Supabase: MsgID=${messageId}, Canal=${channelId}, Guild=${guildId}`);

    const { error } = await supabase
        .from('partidos_activos')
        .insert([{ messageId, channelId, guildId }]);

    if (error) {
        if (error.code !== '23505') {
            console.error('[DB Error] guardando partido activo:', error);
        }
    }
};

export const getActiveMatches = async (guildId: string): Promise<ActiveMatch[]> => {
    const { data, error } = await supabase
        .from('partidos_activos')
        .select('messageId, channelId, guildId')
        .eq('guildId', guildId);

    if (error) {
        console.error('[DB Error] obteniendo partidos activos:', error);
        return [];
    }

    console.log(`[DB] Encontrados ${data?.length || 0} partidos activos para el Guild=${guildId}`);
    return data as ActiveMatch[];
};
