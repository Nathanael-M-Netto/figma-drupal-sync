import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login } from '../../../api/authClient';
import useAuthStore from '../../stores/authStore';
import useAppStore from '../../stores/appStore';
import { postToFigma } from '../../hooks/useFigmaMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useAppStore((s) => s.navigate);
  const addToast = useAppStore((s) => s.addToast);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(username.trim(), password);

      // Salva no estado global
      setUser(result.user);
      setToken(result.token);

      // Persiste no clientStorage do Figma
      try {
        postToFigma({
          type: 'save-session',
          user: result.user,
          token: result.token,
        });
      } catch {}

      addToast({ type: 'success', message: `Bem-vindo, ${result.user.name}!` });
      navigate('home');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center min-h-full p-6 overflow-hidden bg-[#121212]">
      {/* Animated Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-10 -left-20 w-[250px] h-[250px] bg-brand/40 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.25, 0.1],
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-20 -right-10 w-[300px] h-[300px] bg-purple/40 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        className="glass-panel relative z-10 overflow-hidden"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      >
        {/* Subtle highlight effect on top border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="p-8">
          {/* Logo / Branding */}
          <div className="text-center mb-8 relative">
            <motion.div 
              className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-gradient-to-tr from-brand to-purple rounded-2xl shadow-lg relative group"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300"
              />
              <Sparkles className="w-8 h-8 text-white absolute top-[-8px] right-[-8px] opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" />
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M12 14h16M12 20h10M12 26h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Cohesion Export</h1>
            <p className="text-xs text-text-tertiary uppercase tracking-widest font-medium">Figma ↔ Drupal Sync</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <label 
                className={`block text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors duration-300 ${focusedInput === 'user' ? 'text-brand' : 'text-text-secondary'}`}
              >
                Usuário
              </label>
              <div className="relative">
                <Input
                  id="login-user"
                  placeholder="UX ou DEV"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput('user')}
                  onBlur={() => setFocusedInput(null)}
                  autoFocus
                  disabled={isLoading}
                  className="bg-black/20 border-white/10 focus:border-brand/50 focus:ring-brand/30 h-11 text-sm pl-4 transition-all duration-300"
                />
              </div>
            </div>

            <div className="relative">
              <label 
                className={`block text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors duration-300 ${focusedInput === 'pass' ? 'text-purple' : 'text-text-secondary'}`}
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="login-pass"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('pass')}
                  onBlur={() => setFocusedInput(null)}
                  disabled={isLoading}
                  className="bg-black/20 border-white/10 focus:border-purple/50 focus:ring-purple/30 h-11 text-sm pl-4 transition-all duration-300"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger p-3 rounded-[var(--radius-sm)] text-[11px] font-medium"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-2"
            >
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-brand to-brand-hover text-white shadow-[0_0_20px_rgba(13,153,255,0.3)] hover:shadow-[0_0_25px_rgba(13,153,255,0.5)] border-none font-semibold text-sm transition-all duration-300 relative overflow-hidden group"
                disabled={isLoading}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <span>Acessar Plugin</span>
                )}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-black/20 border-t border-white/5 p-4 flex justify-center items-center gap-2 text-[10px] text-text-tertiary">
          <span className="font-mono">v4.1</span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="tracking-wide">CMS Cohesion</span>
        </div>
      </motion.div>
    </div>
  );
}
