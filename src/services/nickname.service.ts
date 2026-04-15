import supabase from '../config/database';
import { EMPTY_LIST_MSG } from './validation.service';

type NickCacheEntry = {
    nickname: string | null;
    expiresAt: number;
};

const NICK_CACHE_TTL_MS = 60_000;
const nicknameCache = new Map<string, NickCacheEntry>();

const buildCacheKey = (guildId: string, userId: string) => `${guildId}:${userId}`;

const getCachedNickname = (guildId: string, userId: string): string | null | undefined => {
    const key = buildCacheKey(guildId, userId);
    const entry = nicknameCache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
        nicknameCache.delete(key);
        return undefined;
    }
    return entry.nickname;
};

const setCachedNickname = (guildId: string, userId: string, nickname: string | null) => {
    const key = buildCacheKey(guildId, userId);
    nicknameCache.set(key, { nickname, expiresAt: Date.now() + NICK_CACHE_TTL_MS });
};

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

export const getNicknameCached = async (guildId: string, userId: string): Promise<string | null> => {
    const cached = getCachedNickname(guildId, userId);
    if (cached !== undefined) return cached;

    const nickname = await getNickname(guildId, userId);
    setCachedNickname(guildId, userId, nickname);
    return nickname;
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
    if (currentPlayers === EMPTY_LIST_MSG) return currentPlayers;

    const lines = currentPlayers.split('\n');
    const userIds = new Set<string>();

    for (const line of lines) {
        const match = line.match(/<@(\d+)>/);
        if (match) userIds.add(match[1]);
    }

    const nicknameEntries = await Promise.all(
        Array.from(userIds).map(async (userId) => {
            const nickname = await getNicknameCached(guildId, userId);
            return [userId, nickname] as const;
        })
    );

    const nicknameMap = new Map<string, string | null>(nicknameEntries);

    const newLines = lines.map((line) => {
        const match = line.match(/<@(\d+)>/);
        if (!match) return line;

        const userId = match[1];
        const nickname = nicknameMap.get(userId) ?? null;
        const isGuest = line.includes('Invitado de');

        if (isGuest) {
            return nickname ? `• Invitado de <@${userId}> (${nickname})` : `• Invitado de <@${userId}>`;
        }
        return nickname ? `• <@${userId}> (${nickname})` : `• <@${userId}>`;
    });

    return newLines.join('\n');
};
