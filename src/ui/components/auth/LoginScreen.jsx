/**
 * @file LoginScreen.jsx
 * Tela de login do plugin.
 *
 * Mock credentials:
 *   UX / 12345 → perfil UX Designer
 *   DEV / 12345 → perfil Desenvolvedor
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { login } from '../../../api/authClient';
import useAuthStore from '../../stores/authStore';
import useAppStore from '../../stores/appStore';
import { postToFigma } from '../../hooks/useFigmaMessages';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="login-screen">
      <motion.div
        className="login-container glass-panel"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo / Branding */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
              <path d="M12 14h16M12 20h10M12 26h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#a371f7" />
                  <stop offset="1" stopColor="#0d99ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="login-title">Cohesion Export</h1>
          <p className="login-subtitle">Figma ↔ Drupal Sync Plugin</p>
        </div>

        {/* Formulário */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="login-user">Usuário</label>
            <input
              id="login-user"
              type="text"
              className="input-field"
              placeholder="UX ou DEV"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-pass">Senha</label>
            <input
              id="login-pass"
              type="password"
              className="input-field"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 4.5v3M7 9.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className={`btn btn-primary btn-lg login-btn ${isLoading ? 'btn-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>v3.0</span>
          <span>•</span>
          <span>TIM Cohesion</span>
        </div>
      </motion.div>
    </div>
  );
}
