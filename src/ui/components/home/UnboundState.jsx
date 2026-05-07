/**
 * @file UnboundState.jsx
 * Estado "não vinculado" da tela Home — quando o NID não está definido.
 *
 * Mostra: card de aviso, campo para vincular NID, deploy para nova página.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link, PlusCircle } from 'lucide-react';

export default function UnboundState({ onBind, onDeployNewPage, currentModuleName }) {
  const [nidInput, setNidInput] = useState('');

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Deploy Nova Página */}
      <Card className="glass-panel border-purple bg-purple/5 mb-0 p-5">
        <div className="text-[10px] font-bold text-purple uppercase tracking-[1px] mb-2.5 mt-1">
          Página Nova
        </div>
        <p className="text-[11px] text-text-secondary mb-3">
          Crie uma nova página no Drupal com o conteúdo do Figma.
        </p>
        <Button variant="deploy" size="lg" onClick={onDeployNewPage}>
          <PlusCircle className="w-3.5 h-3.5" />
          Deploy numa Página Nova
        </Button>
      </Card>

      {/* Vincular NID */}
      <div className="flex flex-col items-center text-center py-5">
        <div className="text-text-tertiary mb-4">
          <Link className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold mb-3">Vincular Página Drupal</h2>
        <p className="text-xs text-text-secondary leading-relaxed mb-6">
          Insira o NID da página para conectar este arquivo Figma.
          Todos os deploys e syncs usarão esse vínculo automaticamente.
        </p>
        <Card className="glass-panel w-full p-6">
          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">NID da Página</label>
            <Input
              type="text"
              placeholder="Ex: 140421"
              value={nidInput}
              onChange={(e) => setNidInput(e.target.value)}
              className="text-base font-semibold text-center font-mono"
            />
          </div>
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              if (nidInput.trim()) {
                onBind(nidInput.trim());
                setNidInput('');
              }
            }}
          >
            Vincular e Continuar
          </Button>
        </Card>
      </div>
    </motion.div>
  );
}
