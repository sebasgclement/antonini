import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

window.Pusher = Pusher;

export const setupEcho = (token: string) => {
    if (window.Echo) {
        window.Echo.disconnect();
    }

    console.log("🛠️ Intentando conectar a Reverb MANUALMENTE...");

    const echo = new Echo({
        broadcaster: 'reverb',
        key: 'AnoniniAutoReverb', // <--- Pongo la key directo
        wsHost: window.location.hostname,
        
        // 🔥 HARDCODEAMOS EL PUERTO 9000
        wsPort: 9000,
        wssPort: 9000,
        
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        
        // Autenticación
        authEndpoint: 'http://127.0.0.1:8000/api/broadcasting/auth', 
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
        disableStats: true,
    });

    window.Echo = echo;
    return echo;
};