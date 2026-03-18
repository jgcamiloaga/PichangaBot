import supabase from '../config/database';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { refreshPlayerListNicknames } from './nickname.service';

export interface ActiveMatch {
    messageId: string;
    channelId: string;
    guildId: string;
}

export const saveActiveMatch = async (messageId: string, channelId: string, guildId: string): Promise<void> => {
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

    return data as ActiveMatch[];
};

export const deleteActiveMatch = async (messageId: string): Promise<void> => {
    const { error } = await supabase
        .from('partidos_activos')
        .delete()
        .eq('messageId', messageId);

    if (error) {
        console.error('[DB Error] eliminando partido activo:', error);
    }
};

export const refreshAllActiveMatchEmbeds = async (client: Client, guildId: string): Promise<void> => {
    const activeMatches = await getActiveMatches(guildId);
    for (const matchDef of activeMatches) {
        try {
            const channel = client.channels.cache.get(matchDef.channelId) || await client.channels.fetch(matchDef.channelId);
            if (!channel || !channel.isTextBased()) continue;

            const fetchResult = await (channel as TextChannel).messages.fetch({ message: matchDef.messageId, force: true });
            const matchMsg = Array.isArray(fetchResult) ? null : fetchResult;
            if (!matchMsg || !matchMsg.embeds.length) continue;

            const embed = EmbedBuilder.from(matchMsg.embeds[0]);
            const fieldIndex = embed.data.fields?.findIndex(f => f.name === '📋 Lista de Jugadores');
            if (fieldIndex === undefined || fieldIndex === -1 || !embed.data.fields) continue;

            const currentPlayers = embed.data.fields[fieldIndex].value;
            const newPlayers = await refreshPlayerListNicknames(currentPlayers, guildId);

            if (currentPlayers !== newPlayers) {
                const updatedFields = embed.data.fields.map(f =>
                    f.name === '📋 Lista de Jugadores' ? { ...f, value: newPlayers } : f
                );
                embed.setFields(updatedFields);
                await matchMsg.edit({ embeds: [embed] });
            }
        } catch (err: any) {
            if (err?.code === 10003 || err?.code === 10008) {
                console.warn(`Partido activo ${matchDef.messageId} apunta a un canal/mensaje inexistente. Eliminando registro...`);
                await deleteActiveMatch(matchDef.messageId);
            } else {
                console.error(`Error actualizando partido activo ${matchDef.messageId}:`, err);
            }
        }
    }
};
