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
  // Desconectar instancia previa si existe
  if (window.Echo) {
    window.Echo.disconnect();
  }

  console.log("☁️ Conectando a Pusher (Cloud)...");

  const echo = new Echo({
    broadcaster: "pusher",
    key: "9c7b153b06549e931b1b", // Tu Key Real
    cluster: "sa1",             // Tu Cluster Real
    forceTLS: true,             // Importante: Usar HTTPS

    // Al usar Pusher, NO definimos wsHost ni wsPort manualmente,
    // la librería sabe ir sola a pusher.com

    // Endpoint de autenticación (sigue apuntando a tu backend)
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