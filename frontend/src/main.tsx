import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/theme.css";

// Contextos
import { AuthProvider } from "./context/AuthContext";
import { DolarProvider } from "./context/DolarContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // ❌ SACAMOS React.StrictMode para que el WebSocket no se conecte/desconecte a lo loco

  // 👇 ACÁ ESTÁ EL CAMBIO: basename="/app"
  <BrowserRouter basename="/app">
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <DolarProvider>
            <App />
          </DolarProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
