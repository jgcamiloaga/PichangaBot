export const parseMatchDate = (input: string): Date | null => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/;
    const match = input.trim().match(regex);
    if (!match) return null;

    const [, day, month, year, hours, minutes] = match;
    const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
    );

    if (
        date.getDate() !== parseInt(day) ||
        date.getMonth() !== parseInt(month) - 1 ||
        isNaN(date.getTime())
    ) {
        return null;
    }

    return date;
};

export const isDateInPast = (date: Date): boolean => {
    return date.getTime() <= Date.now();
};

export const isValidSpots = (input: string): boolean => {
    const value = parseInt(input.trim(), 10);
    return !isNaN(value) && Number.isInteger(value) && value >= 2 && value <= 50;
};

export const getDiscordTimestamp = (date: Date): string => {
    const unix = Math.floor(date.getTime() / 1000);
    return `<t:${unix}:F>`;
};

export const extractUnixFromDiscordTimestamp = (fieldValue: string): number | null => {
    const match = fieldValue.match(/<t:(\d+):/);
    if (!match) return null;
    return parseInt(match[1], 10);
};

export const formatDateForInput = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const EMPTY_LIST_MSG = 'Nadie se ha inscrito aún... ¡Sé el primero!';

export const parseAvailableSpots = (spotsRaw: string): number => {
    const clean = spotsRaw.replace(/\*/g, '').trim();
    return spotsRaw.includes('/')
        ? parseInt(clean.split('/')[0].trim(), 10)
        : parseInt(clean, 10);
};

export const updateSpotsField = (spotsRaw: string, delta: number): string => {
    if (!spotsRaw.includes('/')) return spotsRaw;
    const parts = spotsRaw.split('/');
    const available = parseInt(parts[0].replace(/\*/g, '').trim(), 10) + delta;
    const total = parts[1].replace(/\*/g, '').trim();
    return `**${available} / ${total}**`;
};

export const countPlayers = (playersValue: string): number => {
    return playersValue === EMPTY_LIST_MSG || playersValue === '' ? 0 : playersValue.split('\n').length;
};
