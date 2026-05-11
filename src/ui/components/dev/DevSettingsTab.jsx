/**
 * @file DevSettingsTab.jsx
 * Aba Dev Settings — Ferramentas para desenvolvedores.
 */

import React, { useState, useEffect } from 'react';
import NidBadge from '../shared/NidBadge';
import PropertyList from '../shared/PropertyList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import useAppStore from '../../stores/appStore';
import { Link, Database, FileJson, Layers, RefreshCw, Upload, Download, Trash2, Zap, Eye, EyeOff, Globe } from 'lucide-react';

export default function DevSettingsTab({
  linkedNid,
  apiKey: initialApiKey,
  envHost: initialEnvHost,
  envName: initialEnvName,
  currentModuleName,
  extractedData,
  currentMeta,
  schemaStatus,
  onForceNid,
  onUnlinkNid,
  onSaveApiKey,
  onSaveEnvSettings,
  onLoadSchema,
  onClearSchema,
  onUpdateProps,
  onFetchSchema,
  onApplyManualJson,
  onDevDeploy,
  onDevDownload,
  onSyncProps,
  status,
}) {
  const addToast = useAppStore((s) => s.addToast);
  const [forceNidInput, setForceNidInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(initialApiKey || '');
  const [schemaFetchModule, setSchemaFetchModule] = useState('');
  const [devNidOverride, setDevNidOverride] = useState('');
  const [devModuleName, setDevModuleName] = useState('');

  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [envHostInput, setEnvHostInput] = useState(initialEnvHost || '');
  const [envInput, setEnvInput] = useState(initialEnvName || 'ambiteste');

  useEffect(() => {
    if (linkedNid) setForceNidInput(linkedNid);
  }, [linkedNid]);

  useEffect(() => {
    setApiKeyInput(initialApiKey || '');
  }, [initialApiKey]);

  useEffect(() => {
    setEnvHostInput(initialEnvHost || '');
  }, [initialEnvHost]);

  useEffect(() => {
    setEnvInput(initialEnvName || 'ambiteste');
  }, [initialEnvName]);

  useEffect(() => {
    setDevModuleName(currentModuleName || '');
  }, [currentModuleName]);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-5">
      {/* ── NID Binding ── */}
      <div className="p-5 pb-0">
        <h2 className="flex items-center gap-2 text-sm font-bold text-brand uppercase tracking-[1px] mb-3">
          <Link className="w-4 h-4" />
          NID Binding
        </h2>
        <Card className="p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium text-text-secondary">Arquivo vinculado a:</span>
            <NidBadge nid={linkedNid} small />
          </div>
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">Forçar NID</label>
            <Input
              type="text"
              placeholder="Digite o NID para forçar vínculo"
              value={forceNidInput}
              onChange={(e) => setForceNidInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1" onClick={() => forceNidInput.trim() && onForceNid(forceNidInput.trim())}>
              Salvar NID
            </Button>
            <Button variant="danger" className="flex-1" onClick={onUnlinkNid}>
              Desvincular
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">API Key (X-CMS-Key)</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="Digite a API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="pr-9"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                aria-label={showApiKey ? 'Ocultar API Key' : 'Mostrar API Key'}
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-black/10 transition-colors border-none bg-transparent outline-none"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <Button variant="outline" className="w-full mt-2" onClick={() => apiKeyInput.trim() && onSaveApiKey(apiKeyInput.trim())}>
              Salvar API Key
            </Button>
          </div>
        </Card>
      </div>

      <div className="h-px bg-border mx-5 my-2" />

      {/* ── Ambiente ── */}
      <div className="p-5 pb-0">
        <h2 className="flex items-center gap-2 text-sm font-bold text-success uppercase tracking-[1px] mb-3">
          <Globe className="w-4 h-4" />
          Ambiente
        </h2>
        <Card className="p-4 mb-5">
          <div className="mb-3">
            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">Env Host (SSH)</label>
            <Input
              type="text"
              placeholder="user@host.ssh.prod.acquia-sites.com"
              value={envHostInput}
              onChange={(e) => setEnvHostInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[10px] text-text-tertiary mt-1">Enviado em todos os payloads PUT/POST como env_host</p>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">Env</label>
            <select
              value={envInput}
              onChange={(e) => setEnvInput(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-[var(--radius-sm)] text-text-primary text-xs outline-none focus:border-brand transition-colors"
            >
              <option value="ambiteste">ambiteste</option>
              <option value="stage">stage</option>
              <option value="prod">prod</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (onSaveEnvSettings) onSaveEnvSettings(envHostInput.trim(), envInput);
              addToast({ type: 'success', message: 'Configurações de ambiente salvas.' });
            }}
          >
            Salvar Ambiente
          </Button>
        </Card>
      </div>

      <div className="h-px bg-border mx-5 my-2" />

      {/* ── Schema ── */}
      <div className="p-5 pb-0">
        <h2 className="flex items-center gap-2 text-sm font-bold text-purple uppercase tracking-[1px] mb-2">
          <Database className="w-4 h-4" />
          Schema de Módulos
        </h2>
        <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
          Define as propriedades esperadas de cada módulo. Não altera valores — apenas injeta as <em>prop definitions</em> no componente Figma.
        </p>

        <div className={`flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-sm)] text-[11px] font-bold border ${schemaStatus.loaded ? 'bg-success-soft border-success/30 text-success' : 'bg-black/20 border-border text-text-tertiary'}`}>
          {schemaStatus.loaded ? (
            <>
              <Database className="w-3.5 h-3.5" />
              <span className="flex-1 truncate">{schemaStatus.name}</span>
              <span className="bg-success/20 px-1.5 py-0.5 rounded text-[10px]">{schemaStatus.propCount} props</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 opacity-50" />
              <span>Modo Livre — sem schema carregado</span>
            </>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">Buscar schema na API</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nome do módulo"
              value={schemaFetchModule}
              onChange={(e) => setSchemaFetchModule(e.target.value)}
              className="flex-1 min-w-[120px]"
            />
            <Button variant="primary" className="w-auto shrink-0" onClick={() => onFetchSchema(schemaFetchModule.trim() || currentModuleName)}>
              Buscar
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSchemaModal(true)}>
              <FileJson className="w-3.5 h-3.5 mr-1.5" />
              Carregar JSON
            </Button>
            <Button variant="primary" className="flex-1" onClick={onSyncProps}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sync Local
            </Button>
          </div>
          {schemaStatus.loaded && (
            <>
              <Button variant="outline" onClick={onClearSchema}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Limpar Schema
              </Button>
              <Button variant="success" onClick={onUpdateProps}>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Injetar Props no Componente
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="h-px bg-border mx-5 my-6" />

      {/* ── JSON de Conteúdo ── */}
      <div className="px-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-warning uppercase tracking-[1px] mb-2">
          <FileJson className="w-4 h-4" />
          Conteúdo JSON
        </h2>
        <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
          Cola um JSON com os valores reais de conteúdo para atualizar os nós de texto no Figma.
        </p>
        <Button variant="outline" className="w-full" onClick={() => setShowJsonModal(true)}>
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Carregar JSON de Conteúdo
        </Button>
      </div>

      <div className="h-px bg-border mx-5 my-6" />

      {/* ── Dev Preview ── */}
      <div className="px-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-success uppercase tracking-[1px] mb-4">
          <Layers className="w-4 h-4" />
          Preview de Extração
        </h2>
        {currentModuleName ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-bg border border-border rounded-[var(--radius-sm)] py-2 px-3">
              <span className="text-[10px] font-semibold text-text-tertiary tracking-[0.5px]">MÓDULO</span>
              <input
                type="text"
                value={devModuleName}
                onChange={(e) => setDevModuleName(e.target.value)}
                className="flex-1 bg-transparent border-none text-text-primary text-xs font-semibold outline-none"
              />
            </div>
            
            <PropertyList data={extractedData} meta={currentMeta} />
            
            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-[0.5px]">NID (override pontual)</label>
              <Input
                type="text"
                placeholder="Deixe vazio para usar o NID vinculado"
                value={devNidOverride}
                onChange={(e) => setDevNidOverride(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button variant="deploy" className="flex-[2]" onClick={() => onDevDeploy(devNidOverride.trim() || linkedNid, devModuleName.trim())}>
                Deploy
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onDevDownload(devNidOverride.trim() || linkedNid, devModuleName.trim())}>
                <Download className="w-3.5 h-3.5 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center border border-dashed border-border rounded-[var(--radius-md)] text-text-tertiary text-[11px]">
            Selecione um módulo no Figma para ver o preview.
          </div>
        )}
      </div>

      {status.visible && (
        <div className={`fixed bottom-[calc(var(--spacing-nav)+10px)] left-5 right-5 p-3 rounded-[var(--radius-sm)] text-[11px] font-bold z-50 shadow-md ${
          status.type === 'error' ? 'bg-danger text-white' : 
          status.type === 'success' ? 'bg-success text-white' : 
          'bg-brand text-white'
        }`}>
          {status.text}
        </div>
      )}

      {/* Modais */}
      <Dialog open={showSchemaModal} onOpenChange={setShowSchemaModal}>
        <DialogContent open={showSchemaModal} onClose={() => setShowSchemaModal(false)}>
          <DialogHeader>
            <DialogTitle>Carregar Schema de Módulo</DialogTitle>
            <DialogDescription>
              Cole o JSON do schema que define as propriedades do módulo. Isso não altera nenhum valor de conteúdo.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full mt-2 py-3 px-3 bg-bg-secondary border border-border text-text-primary rounded-[var(--radius-sm)] font-mono text-xs outline-none transition-colors focus:border-brand min-h-[200px] resize-y"
            placeholder='{ "componentName": "...", "properties": [...] }'
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchemaModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => {
              try {
                const data = JSON.parse(schemaText);
                onLoadSchema(data);
                setShowSchemaModal(false);
                setSchemaText('');
              } catch {
                alert('JSON inválido');
              }
            }}>Carregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
        <DialogContent open={showJsonModal} onClose={() => setShowJsonModal(false)}>
          <DialogHeader>
            <DialogTitle>Sync via JSON de Conteúdo</DialogTitle>
            <DialogDescription>
              Cole o JSON com os valores de conteúdo. O plugin atualiza diretamente os nós de texto no Figma, sem chamar a API.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="w-full mt-2 py-3 px-3 bg-bg-secondary border border-border text-text-primary rounded-[var(--radius-sm)] font-mono text-xs outline-none transition-colors focus:border-brand min-h-[200px] resize-y"
            placeholder='{ "TXT_TITULO": "Novo Título", "TXT_SUBTITULO": "Subtítulo aqui" }'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJsonModal(false)}>Cancelar</Button>
            <Button variant="success" onClick={() => {
              try {
                const data = JSON.parse(jsonText);
                onApplyManualJson(data);
                setShowJsonModal(false);
                setJsonText('');
              } catch {
                alert('JSON inválido');
              }
            }}>Aplicar no Figma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
