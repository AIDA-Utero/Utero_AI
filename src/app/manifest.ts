import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Utero AI Avatar',
        short_name: 'Utero AI',
        description: 'Virtual Assistant berbasis AI untuk PT Utero Kreatif Indonesia',
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
