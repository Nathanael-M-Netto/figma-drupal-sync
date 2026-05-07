/**
 * @file DeployScreen.jsx
 * Tela completa de confirmação de deploy.
 *
 * Dois modos:
 *   1. Modo Atualização (tem NID): mostra diff + campos do content-type
 *   2. Modo Nova Página (sem NID): mostra resumo completo + formulário
 *
 * Fluxo: Preparação → Revisão → Confirmação → Resultado
 */

import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useDeployStore from '../../stores/deployStore';
import useAppStore from '../../stores/appStore';
import DeployDiff from './DeployDiff';
import NodeFieldsForm from './NodeFieldsForm';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import NidBadge from '../shared/NidBadge';
import { ChevronLeft, PartyPopper, XCircle, Send, FileText, Settings2 } from 'lucide-react';

export default function DeployScreen({
  linkedNid,
  currentModuleName,
  extractedData,
  client,
  onDeployDone,
}) {
  const deploy = useDeployStore();
  const navigate = useAppStore((s) => s.navigate);
  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    if (!extractedData || Object.keys(extractedData).length === 0) return;

    const prepare = async () => {
      deploy.setLoading(true);

      try {
        if (linkedNid) {
          const drupalData = await client.syncPull(linkedNid);

          let ctSchema = null;
          try {
            const ctInfo = await client.getContentType(linkedNid);
            if (ctInfo?.type) {
              ctSchema = await client.getContentTypeSchema(ctInfo.type);
              deploy.setContentType(ctInfo.type, ctSchema);
            }
          } catch (e) {}

          deploy.prepareDeploy('update', extractedData, drupalData || {}, ctSchema);
        } else {
          deploy.prepareDeploy('newPage', extractedData, null, null);
        }
      } catch (err) {
        deploy.setError(err.message);
        addToast({ type: 'error', message: 'Erro ao preparar deploy: ' + err.message });
      }
    };

    prepare();

    return () => deploy.reset();
  }, [linkedNid, extractedData]);

  const handleExecuteDeploy = useCallback(async () => {
    deploy.setDeploying(true);

    try {
      const cleanData = {};
      Object.entries(deploy.figmaData || {}).forEach(([k, v]) => {
        if (v !== null) cleanData[k] = v;
      });

      let result;
      if (deploy.mode === 'update') {
        result = await client.deployWithPreview(
          linkedNid,
          currentModuleName,
          cleanData,
          deploy.nodeFields
        );
      } else {
        result = await client.createPage(
          currentModuleName,
          cleanData,
          deploy.nodeFields
        );
      }

      deploy.setResult({
        success: true,
        nid: result.new_nid || result.target_nid || linkedNid,
        message: deploy.mode === 'update' ? 'Página atualizada!' : 'Página criada!',
      });

      addToast({ type: 'success', message: deploy.mode === 'update' ? 'Deploy realizado!' : 'Página criada!' });

      if (onDeployDone) {
        onDeployDone(result.new_nid || result.target_nid);
      }
    } catch (err) {
      deploy.setError(err.message);
      addToast({ type: 'error', message: 'Erro no deploy: ' + err.message });
    }
  }, [deploy.mode, deploy.figmaData, deploy.nodeFields, linkedNid, currentModuleName, client]);

  if (deploy.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-full">
        <Progress value={100} label="Preparando deploy..." variant="brand" className="w-full animate-pulse" />
      </div>
    );
  }

  if (deploy.error && !deploy.result) {
    return (
      <div className="flex flex-col p-5 h-full">
        <Card className="flex flex-col items-center text-center p-8 border-danger/30 bg-danger-soft">
          <XCircle className="w-12 h-12 text-danger mb-4" />
          <h3 className="text-sm font-bold text-danger mb-2">Erro no Deploy</h3>
          <p className="text-[11px] text-danger/80 mb-6">{deploy.error}</p>
          <Button variant="outline" onClick={() => navigate('home')}>Voltar</Button>
        </Card>
      </div>
    );
  }

  if (deploy.result) {
    return (
      <div className="flex flex-col p-5 h-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="flex flex-col items-center text-center p-8 border-success/30 bg-success-soft">
            <PartyPopper className="w-12 h-12 text-success mb-4" />
            <h3 className="text-lg font-bold text-success mb-4">{deploy.result.message}</h3>
            {deploy.result.nid && (
              <div className="flex items-center gap-2 mb-6 p-3 bg-black/10 rounded-[var(--radius-sm)]">
                <span className="text-[11px] font-semibold text-text-tertiary uppercase">NID vinculado:</span>
                <NidBadge nid={deploy.result.nid} small />
              </div>
            )}
            <Button variant="default" size="lg" className="w-full" onClick={() => navigate('home')}>
              Voltar ao Início
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-bg-secondary shrink-0">
        <button 
          className="flex items-center justify-center w-8 h-8 rounded-full border-none bg-transparent text-text-secondary cursor-pointer transition-colors hover:bg-black/10 hover:text-text-primary"
          onClick={() => navigate('home')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h3 className="text-[13px] font-bold text-text-primary m-0">
            {deploy.mode === 'update' ? 'Confirmar Atualização' : 'Criar Nova Página'}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-text-tertiary font-mono">
            <span>{currentModuleName}</span>
            {linkedNid && (
              <>
                <span>·</span>
                <span className="text-brand font-bold bg-brand-soft px-1 rounded">NID {linkedNid}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-5">
        {deploy.mode === 'update' && deploy.diff && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-brand text-[11px] font-bold uppercase tracking-[1px]">
              <Settings2 className="w-3.5 h-3.5" />
              Alterações Detectadas
            </div>
            <DeployDiff diff={deploy.diff} />
          </div>
        )}

        {deploy.mode === 'newPage' && deploy.figmaData && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-purple text-[11px] font-bold uppercase tracking-[1px]">
              <FileText className="w-3.5 h-3.5" />
              Dados para Envio ({Object.keys(deploy.figmaData).length} campos)
            </div>
            <div className="flex flex-col gap-1 border border-border rounded-[var(--radius-sm)] bg-bg-secondary overflow-hidden">
              {Object.entries(deploy.figmaData).map(([key, value]) => (
                <div key={key} className="flex border-b border-border/50 last:border-b-0 p-2.5 text-[11px]">
                  <span className="w-1/3 text-text-secondary font-semibold font-mono truncate mr-2" title={key}>{key}</span>
                  <span className="flex-1 text-text-primary font-mono truncate" title={String(value)}>
                    {value != null ? String(value) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {deploy.contentTypeSchema && (
          <div className="mt-6 border-t border-border pt-6">
            <NodeFieldsForm
              schema={deploy.contentTypeSchema}
              values={deploy.nodeFields}
              onChange={deploy.setNodeField}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-5 border-t border-border bg-bg-secondary shrink-0">
        {deploy.isDeploying ? (
          <div className="w-full flex justify-center items-center gap-2 p-2 text-[11px] font-semibold text-brand bg-brand-soft rounded-[var(--radius-sm)] border border-brand/20">
            <Send className="w-4 h-4 animate-bounce" />
            Enviando para o Drupal...
          </div>
        ) : (
          <>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('home')}>
              Cancelar
            </Button>
            <Button variant="deploy" size="lg" className="flex-[2]" onClick={handleExecuteDeploy}>
              <Send className="w-4 h-4 mr-2" />
              {deploy.mode === 'update'
                ? `Atualizar (${deploy.diff?.totalChanges || 0} alterações)`
                : 'Criar Página'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
