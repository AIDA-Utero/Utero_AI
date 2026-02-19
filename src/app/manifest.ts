import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'CarubraAI - Virtual Assistant by Utero Indonesia',
        short_name: 'CarubraAI',
        description: 'CarubraAI - Virtual Assistant by Utero Indonesia',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#991b1b',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}
