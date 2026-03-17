import supabase from '../config/database';

export const setGuildRole = async (guildId: string, roleId: string): Promise<void> => {
    const { error } = await supabase
        .from('configuracion')
        .upsert({ guildId, roleId }, { onConflict: 'guildId' });

    if (error) {
        console.error('[DB Error] guardando roleId:', error);
    }
};

export const getGuildRole = async (guildId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('configuracion')
        .select('roleId')
        .eq('guildId', guildId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[DB Error] obteniendo roleId:', error);
    }

    return data ? data.roleId : null;
};

export const clearGuildRole = async (guildId: string): Promise<void> => {
    const { error } = await supabase
        .from('configuracion')
        .delete()
        .eq('guildId', guildId);

    if (error) {
        console.error('[DB Error] eliminando roleId:', error);
    }
};
