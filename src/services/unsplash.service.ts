import axios from 'axios';
import { config } from '../config/env';

export async function getRandomFootballImage(): Promise<string> {
    const fallbackImage = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop';
    
    if (!config.unsplashAccessKey) {
        return fallbackImage;
    }

    try {
        const response = await axios.get('https://api.unsplash.com/photos/random', {
            params: {
                query: 'soccer,football,stadium',
                client_id: config.unsplashAccessKey
            },
            timeout: 2000 
        });

        if (response.data && response.data.urls && response.data.urls.regular) {
            return response.data.urls.regular;
        }
        return fallbackImage;
    } catch (error) {
        console.error("Error al obtener imagen de Unsplash (Axios):", error);
        return fallbackImage; 
    }
}
