import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useAuthStore from "../../stores/authStore";
import useAppStore from "../../stores/appStore";
import { postToFigma } from "../../hooks/useFigmaMessages";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function LoginScreen() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useAppStore((s) => s.navigate);
  const addToast = useAppStore((s) => s.addToast);

  const handleEntraLogin = () => {
    setIsLoading(true);
    setError("");

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    // Gera um ID de sessão para fazer polling
    const stateId = crypto.randomUUID();
    const authUrl = backendUrl + "/auth/login?state_id=" + stateId;

    const width = 600;
    const height = 800;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    window.open(authUrl, "EntraLogin", "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left);

    // No desktop do Figma o window.opener não funciona entre janelas do OS e o iframe.
    // Usar polling para pegar a confirmação no backend.
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/auth/status?state_id=${stateId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success") {
            clearInterval(pollInterval);
            
            const { token, user: backendUser } = data;
            const user = {
              id: backendUser.sub || backendUser.email,
              name: backendUser.name || "User",
              email: backendUser.preferred_username || backendUser.email || "",
              role: "dev",
            };

            setUser(user);
            setToken(token);

            try {
              postToFigma({ type: "save-session", user, token });
            } catch (err) {}

            addToast({ type: "success", message: "Bem-vindo, " + user.name + "!" });
            navigate("home");
            setIsLoading(false);
          }
        }
      } catch (err) {
        // Ignora erros de rede temporários
      }
    }, 2000);

    // Cancelar interval após 3 minutos (timeout)
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isLoading) {
        setIsLoading(false);
        setError("Login expirou. Tente novamente.");
      }
    }, 180000);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "OAUTH_SUCCESS") {
        const { token, user: backendUser } = event.data;
        
        const user = {
          id: backendUser.sub || backendUser.email,
          name: backendUser.name || "User",
          email: backendUser.preferred_username || backendUser.email || "",
          role: "dev",
        };

        setUser(user);
        setToken(token);

        try {
          postToFigma({
            type: "save-session",
            user: user,
            token: token,
          });
        } catch (err) {}

        addToast({ type: "success", message: "Bem-vindo, " + user.name + "!" });
        navigate("home");
        setIsLoading(false);
      } else if (event.data && event.data.type === "OAUTH_ERROR") {
        setError(event.data.error || "Erro no login OAUTH");
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setUser, setToken, navigate, addToast]);

  return (
    <div className="relative flex flex-col justify-center min-h-full p-6 overflow-hidden bg-[#121212]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], x: [0, 20, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -left-20 w-[250px] h-[250px] bg-brand/40 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.25, 0.1], x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-20 -right-10 w-[300px] h-[300px] bg-purple/40 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        className="glass-panel relative z-10 overflow-hidden"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="p-8">
          <div className="text-center mb-8 relative">
            <motion.div 
              className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-gradient-to-tr from-brand to-purple rounded-2xl shadow-lg relative group"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Sparkles className="w-8 h-8 text-white absolute top-[-8px] right-[-8px] opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" />
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M12 14h16M12 20h10M12 26h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Cohesion Export</h1>
            <p className="text-xs text-text-tertiary uppercase tracking-widest font-medium">Figma ↔ Drupal Sync</p>
          </div>

          <div className="space-y-5">
            <Button 
                onClick={handleEntraLogin} 
                disabled={isLoading}
                className="w-full h-11 bg-white text-black hover:bg-gray-200"
            >
                {isLoading ? "Aguardando login..." : "Sign in com Microsoft (Entra ID)"}
            </Button>
            
            {error && (
              <p className="text-red-400 text-xs text-center mt-4">
                {error}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
