/**
 * @file DevSettingsTab.jsx
 * Aba Dev Settings — Ferramentas para desenvolvedores.
 *
 * Funcionalidades:
 *   - NID management (forçar/desvincular)
 *   - API Key
 *   - Schema de módulos (buscar na API, carregar manual, limpar, injetar)
 *   - JSON de conteúdo (sync manual)
 *   - Preview de extração
 */

import React, { useState } from 'react';
import NidBadge from './NidBadge';
import PropertyList from './PropertyList';
import StatusBar from './StatusBar';
import Modal from './Modal';

export default function DevSettingsTab({
  linkedNid,
  apiKey: initialApiKey,
  currentModuleName,
  extractedData,
  currentMeta,
  schemaStatus,
  onForceNid,
  onUnlinkNid,
  onSaveApiKey,
  onLoadSchema,
  onClearSchema,
  onUpdateProps,
  onFetchSchema,
  onApplyManualJson,
  onDevDeploy,
  onDevDownload,
  status,
}) {
  const [forceNidInput, setForceNidInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(initialApiKey || '');
  const [schemaFetchModule, setSchemaFetchModule] = useState('');
  const [devNidOverride, setDevNidOverride] = useState('');
  const [devModuleName, setDevModuleName] = useState('');

  // Modais
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  const [jsonText, setJsonText] = useState('');

  // Atualiza inputs quando props mudam
  React.useEffect(() => {
    if (linkedNid) setForceNidInput(linkedNid);
  }, [linkedNid]);

  React.useEffect(() => {
    setApiKeyInput(initialApiKey || '');
  }, [initialApiKey]);

  React.useEffect(() => {
    setDevModuleName(currentModuleName || '');
  }, [currentModuleName]);

  return (
    <div className="tab-content active">
      {/* ── NID Binding ── */}
      <div className="section-title">NID Binding</div>
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Arquivo vinculado a:
          </span>
          <NidBadge nid={linkedNid} small />
        </div>
        <div className="input-group">
          <label>Forçar NID</label>
          <input
            type="text"
            className="input-field"
            placeholder="Digite o NID para forçar vínculo"
            value={forceNidInput}
            onChange={(e) => setForceNidInput(e.target.value)}
          />
        </div>
        <div className="flex-row">
          <button
            className="btn btn-outline"
            onClick={() => {
              if (forceNidInput.trim()) onForceNid(forceNidInput.trim());
            }}
          >
            Salvar NID
          </button>
          <button className="btn btn-danger-outline" onClick={onUnlinkNid}>
            Desvincular
          </button>
        </div>
      </div>

      {/* ── API Key ── */}
      <div className="section-title">Autenticação</div>
      <div className="card">
        <div className="input-group">
          <label>X-TIM-Key (API Key)</label>
          <input
            type="password"
            className="input-field"
            placeholder="Insira a API Key"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
          />
        </div>
        <button
          className="btn btn-outline"
          onClick={() => onSaveApiKey(apiKeyInput.trim())}
        >
          Salvar Chave
        </button>
      </div>

      <div className="divider" />

      {/* ── Schema ── */}
      <div className="section-title">Schema de Módulos</div>
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '12px',
          lineHeight: '1.6',
        }}
      >
        Define as propriedades esperadas de cada módulo. Não altera valores —
        apenas injeta as <em>prop definitions</em> no componente Figma.
      </p>

      {/* Indicador de schema */}
      <div
        className={`schema-indicator ${
          schemaStatus.loaded ? 'schema-loaded' : 'schema-free'
        }`}
      >
        {schemaStatus.loaded ? (
          <>
            <strong>{schemaStatus.name}</strong> — {schemaStatus.propCount}{' '}
            propriedades
          </>
        ) : (
          'Modo Livre — sem schema carregado'
        )}
      </div>

      {/* Buscar schema na API */}
      <div>
        <label
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '6px',
            textTransform: 'uppercase',
          }}
        >
          Buscar schema na API
        </label>
        <div className="flex-row" style={{ marginBottom: '12px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Nome do módulo (ex: modulo_hero)"
            value={schemaFetchModule}
            onChange={(e) => setSchemaFetchModule(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0 16px' }}
            onClick={() =>
              onFetchSchema(schemaFetchModule.trim() || currentModuleName)
            }
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Botões de schema */}
      <div className="flex-row" style={{ marginBottom: '8px' }}>
        <button
          className="btn btn-outline"
          onClick={() => setShowSchemaModal(true)}
        >
          Carregar JSON
        </button>
        {schemaStatus.loaded && (
          <button className="btn btn-outline" onClick={onClearSchema}>
            Limpar Schema
          </button>
        )}
      </div>
      {schemaStatus.loaded && (
        <div style={{ marginBottom: '14px' }}>
          <button className="btn btn-success" onClick={onUpdateProps}>
            Injetar Props no Componente
          </button>
        </div>
      )}

      <div className="divider" />

      {/* ── JSON de Conteúdo ── */}
      <div className="section-title">Conteúdo JSON</div>
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          lineHeight: '1.6',
        }}
      >
        Cola um JSON com os valores reais de conteúdo para atualizar os nós de
        texto no Figma.
      </p>
      <button
        className="btn btn-outline"
        onClick={() => setShowJsonModal(true)}
      >
        Carregar JSON de Conteúdo
      </button>

      <div className="divider" />

      {/* ── Dev Preview ── */}
      <div className="section-title">Preview de Extração</div>
      {currentModuleName && (
        <div>
          <div className="module-chip">
            <span className="mc-label">MÓDULO</span>
            <input
              type="text"
              value={devModuleName}
              onChange={(e) => setDevModuleName(e.target.value)}
            />
          </div>
          <PropertyList data={extractedData} meta={currentMeta} />
          <div className="input-group">
            <label>NID (override pontual)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Deixe vazio para usar o NID vinculado"
              value={devNidOverride}
              onChange={(e) => setDevNidOverride(e.target.value)}
            />
          </div>
          <div className="flex-row">
            <button
              className="btn btn-deploy"
              onClick={() =>
                onDevDeploy(
                  devNidOverride.trim() || linkedNid,
                  devModuleName.trim()
                )
              }
            >
              Deploy
            </button>
            <button
              className="btn btn-outline"
              onClick={() =>
                onDevDownload(
                  devNidOverride.trim() || linkedNid,
                  devModuleName.trim()
                )
              }
            >
              JSON
            </button>
          </div>
        </div>
      )}

      <StatusBar text={status.text} type={status.type} visible={status.visible} />

      {/* ── Modal: Schema ── */}
      <Modal
        show={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        title="Carregar Schema de Módulo"
        description="Cole o JSON do schema que define as propriedades do módulo. Isso não altera nenhum valor de conteúdo."
      >
        <textarea
          className="input-field"
          placeholder='{ "componentName": "...", "properties": [...] }'
          value={schemaText}
          onChange={(e) => setSchemaText(e.target.value)}
        />
        <div className="modal-actions">
          <button
            className="btn btn-outline"
            onClick={() => setShowSchemaModal(false)}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              try {
                const data = JSON.parse(schemaText);
                onLoadSchema(data);
                setShowSchemaModal(false);
                setSchemaText('');
              } catch {
                alert('JSON inválido');
              }
            }}
          >
            Carregar
          </button>
        </div>
      </Modal>

      {/* ── Modal: JSON Conteúdo ── */}
      <Modal
        show={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        title="Sync via JSON de Conteúdo"
        description="Cole o JSON com os valores de conteúdo. O plugin atualiza diretamente os nós de texto no Figma, sem chamar a API."
      >
        <textarea
          className="input-field"
          placeholder='{ "TXT_TITULO": "Novo Título", "TXT_SUBTITULO": "Subtítulo aqui" }'
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div className="modal-actions">
          <button
            className="btn btn-outline"
            onClick={() => setShowJsonModal(false)}
          >
            Cancelar
          </button>
          <button
            className="btn btn-success"
            onClick={() => {
              try {
                const data = JSON.parse(jsonText);
                onApplyManualJson(data);
                setShowJsonModal(false);
                setJsonText('');
              } catch {
                alert('JSON inválido');
              }
            }}
          >
            Aplicar no Figma
          </button>
        </div>
      </Modal>
    </div>
  );
}
