/**
 * @file DeployReviewScreen.jsx
 * Tela de confirmação final antes de enviar para o Drupal.
 * Mostra a árvore de módulos e permite exclusões.
 */

import React from 'react';
import { motion } from 'framer-motion';
import useDeployStore from '../../stores/deployStore';
import useAppStore from '../../stores/appStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Trash2, 
  PlusCircle, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  Package,
  ArrowRight
} from 'lucide-react';

export default function DeployReviewScreen({ onConfirm }) {
  const navigate = useAppStore((s) => s.navigate);
  const { 
    pageModules, 
    deletedModules, 
    toggleModuleDelete, 
    isDeploying,
    reset 
  } = useDeployStore();

  const handleCancel = () => {
    reset();
    navigate('home');
  };

  const activeModules = pageModules.filter(m => !deletedModules.has(m.id));
  const removedCount = deletedModules.size;

  return (
    <div className="flex flex-col h-full bg-bg-secondary overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-bg border-b border-border">
        <button 
          onClick={handleCancel}
          className="p-1.5 hover:bg-bg-hover rounded-full transition-colors border-none bg-transparent text-text-tertiary"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-[14px] font-bold text-text-primary">Revisar Alterações</h2>
          <span className="text-[10px] text-text-tertiary">Confirme a estrutura da página antes do deploy</span>
        </div>
      </div>

      {/* Lista de Módulos */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Estrutura da Página ({activeModules.length})</span>
          {removedCount > 0 && (
            <Badge variant="danger" size="sm">-{removedCount} módulos removidos</Badge>
          )}
        </div>

        {pageModules.map((mod, index) => {
          const isDeleted = deletedModules.has(mod.id);
          
          return (
            <Card 
              key={mod.id} 
              className={`relative overflow-hidden border-l-4 transition-all ${
                isDeleted ? 'opacity-50 grayscale border-l-danger bg-danger-soft/10' : 
                mod.isNew ? 'border-l-success' : 
                mod.isModified ? 'border-l-warning' : 'border-l-border'
              }`}
            >
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    isDeleted ? 'bg-danger/20 text-danger' : 'bg-brand-soft text-brand'
                  }`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-text-primary truncate">{mod.name}</span>
                      {!isDeleted && (
                        <>
                          {mod.isNew ? (
                            <Badge variant="success" size="xs">Novo</Badge>
                          ) : mod.isModified ? (
                            <Badge variant="warning" size="xs">Editado</Badge>
                          ) : (
                            <Badge variant="muted" size="xs">Original</Badge>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-text-tertiary font-mono truncate">Posição: {index + 1}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleModuleDelete(mod.id)}
                    className={`p-2 rounded transition-colors border-none bg-transparent ${
                      isDeleted ? 'text-success hover:bg-success/10' : 'text-danger hover:bg-danger/10'
                    }`}
                    title={isDeleted ? "Restaurar" : "Remover do Drupal"}
                  >
                    {isDeleted ? <PlusCircle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {pageModules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">Nenhum módulo detectado na página.</p>
          </div>
        )}
      </div>

      {/* Footer Ações */}
      <div className="p-4 bg-bg border-t border-border flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[11px] p-2 bg-brand-soft/10 border border-brand/10 rounded">
          <CheckCircle className="w-3.5 h-3.5 text-brand" />
          <span className="text-text-secondary">O Drupal será atualizado para refletir **exatamente** esta lista.</span>
        </div>
        
        <Button 
          variant="deploy" 
          size="lg" 
          onClick={onConfirm}
          disabled={isDeploying}
          className="w-full h-12 shadow-lg"
        >
          {isDeploying ? 'Publicando...' : 'Confirmar e Publicar'}
          {!isDeploying && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
