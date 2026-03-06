import dotenv from 'dotenv';

dotenv.config();

export const config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
};
