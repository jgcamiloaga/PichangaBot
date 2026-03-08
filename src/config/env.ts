import dotenv from 'dotenv';

dotenv.config();

export const config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
};
