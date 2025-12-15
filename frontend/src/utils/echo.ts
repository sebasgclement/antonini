import Echo from "laravel-echo";
import Pusher from "pusher-js";

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

  console.log("🛠️ Conectando a Reverb...");

  // Usamos el host actual (la web) o el fallback
  const host = window.location.hostname;

  const echo = new Echo({
    broadcaster: "reverb",
    key: "AnoniniAutoReverb",
    wsHost: host,

    // Puerto estándar para producción (o el que estés usando con SSL)
    wsPort: 9000,
    wssPort: 9000,

    forceTLS: false, // Probá true si tenés certificados SSL en el socket
    enabledTransports: ["ws", "wss"],

    // ✅ CORREGIDO: Auth endpoint apunta al servidor real
    authEndpoint: "https://antoniniautomotores.com.ar/api/broadcasting/auth",

    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
    disableStats: true,
  });

  window.Echo = echo;
  return echo;
};
