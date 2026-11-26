'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import JSZip from 'jszip';
import { ChaosText } from '@/components/ContactHeroTitle';

type ImageStatus = 'ready' | 'uploading' | 'processing' | 'done' | 'error';
type EditorImage = {
  id: string;
  file: File;
  name: string;
  originalUrl: string;
  resultUrl?: string;
  resultData?: string;
  resultMimeType?: string;
  status: ImageStatus;
  error?: string;
};

type AspectRatio = 'auto' | '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
const MAX_FILES = 30;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function safeName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-90);
}

function imageToBlob(data: string, mimeType: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

function statusLabel(status: ImageStatus) {
  return ({ ready: 'PRONTA', uploading: 'ENVIANDO', processing: 'EDITANDO', done: 'CONCLUÍDA', error: 'ERRO' })[status];
}

export function EditorClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<EditorImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [password, setPassword] = useState('');
  const [configured, setConfigured] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [notice, setNotice] = useState('');

  const completedCount = useMemo(() => images.filter((image) => image.status === 'done').length, [images]);
  const failedCount = useMemo(() => images.filter((image) => image.status === 'error').length, [images]);
  const readyCount = useMemo(() => images.filter((image) => image.status === 'ready' || image.status === 'error').length, [images]);
  const progress = images.length ? Math.round((completedCount / images.length) * 100) : 0;

  useEffect(() => {
    let active = true;
    fetch('/api/editor/auth', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setConfigured(Boolean(data.configured));
        setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setLoginError('Não foi possível verificar o acesso.'))
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const valid: EditorImage[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: formato não suportado.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ultrapassa 12 MB.`);
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        originalUrl: URL.createObjectURL(file),
        status: 'ready',
      });
    }

    setImages((current) => {
      const available = Math.max(0, MAX_FILES - current.length);
      if (valid.length > available) errors.push(`O limite é de ${MAX_FILES} imagens por lote.`);
      return [...current, ...valid.slice(0, available)];
    });
    setNotice(errors.join(' '));
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const removeImage = (id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      return current.filter((image) => image.id !== id);
    });
  };

  const clearImages = () => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.originalUrl);
      if (image.resultUrl) URL.revokeObjectURL(image.resultUrl);
    });
    setImages([]);
    setNotice('');
  };

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/editor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Falha na autenticação.');
    }
  };

  const logout = async () => {
    await fetch('/api/editor/auth', { method: 'DELETE' });
    setAuthenticated(false);
  };

  const processOne = async (image: EditorImage) => {
    setImages((current) => current.map((item) => item.id === image.id ? { ...item, status: 'uploading', error: undefined } : item));
    try {
      const blob = await upload(`pv-editor/input/${Date.now()}-${safeName(image.name)}`, image.file, {
        access: 'private',
        handleUploadUrl: '/api/editor/upload',
        contentType: image.file.type,
      });

      setImages((current) => current.map((item) => item.id === image.id ? { ...item, status: 'processing' } : item));
      const response = await fetch('/api/editor/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrl: blob.url, prompt, aspectRatio, imageSize }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'A edição falhou.');

      const resultBlob = imageToBlob(data.imageData, data.mimeType || 'image/png');
      const resultUrl = URL.createObjectURL(resultBlob);
      setImages((current) => current.map((item) => item.id === image.id ? {
        ...item,
        status: 'done',
        resultUrl,
        resultData: data.imageData,
        resultMimeType: data.mimeType || 'image/png',
        error: undefined,
      } : item));
    } catch (error) {
      setImages((current) => current.map((item) => item.id === image.id ? {
        ...item,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      } : item));
    }
  };

  const processBatch = async () => {
    if (!prompt.trim()) {
      setNotice('Escreva um prompt antes de iniciar.');
      return;
    }
    const pending = images.filter((image) => image.status === 'ready' || image.status === 'error');
    if (!pending.length) return;

    setIsProcessing(true);
    setNotice('');
    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        const current = pending[cursor];
        cursor += 1;
        await processOne(current);
      }
    };
    await Promise.all([worker(), worker()]);
    setIsProcessing(false);
  };

  const downloadZip = async () => {
    const finished = images.filter((image) => image.status === 'done' && image.resultData);
    if (!finished.length) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      finished.forEach((image, index) => {
        const extension = image.resultMimeType === 'image/jpeg' ? 'jpg' : 'png';
        const base = safeName(image.name.replace(/\.[^.]+$/, '')) || `imagem-${index + 1}`;
        zip.file(`${base}-editada.${extension}`, image.resultData!, { base64: true });
      });
      const archive = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'pedro-vileira-imagens-editadas.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  if (authLoading) {
    return <section className="editor-page"><div className="editor-loading">CARREGANDO IMAGE LAB<span>...</span></div></section>;
  }

  if (!configured || !authenticated) {
    return (
      <section className="editor-page">
        <div className="editor-topline"><span>PV / CREATIVE TOOLS</span><span>01 — IMAGE LAB</span></div>
        <div className="editor-auth-wrap">
          <p className="editor-eyebrow">PEDRO VILEIRA / EXPERIMENTAL TOOL</p>
          <ChaosText as="h1" lines={['IMAGE', 'LAB.']} className="editor-title title-lab" />
          {!configured ? (
            <div className="editor-auth-card">
              <h2>Configuração necessária</h2>
              <p>Antes de usar o editor, adicione as variáveis de ambiente descritas no arquivo <code>EDITOR_SETUP.md</code> e conecte um Vercel Blob ao projeto.</p>
            </div>
          ) : (
            <form className="editor-auth-card" onSubmit={login}>
              <label htmlFor="editor-password">ACESSO RESTRITO</label>
              <input id="editor-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha de acesso" required />
              {loginError && <p className="editor-error">{loginError}</p>}
              <button className="editor-button editor-button--light" type="submit">ENTRAR NO EDITOR <span>↗</span></button>
            </form>
          )}
          <p className="editor-auth-foot">PRIVATE WORKSPACE · POWERED BY GEMINI</p>
        </div>
      </section>
    );
  }

  return (
    <section className="editor-page">
      <div className="editor-topline"><span>PV / CREATIVE TOOLS</span><span>01 — IMAGE LAB</span></div>

      <header className="editor-hero">
        <div>
          <p className="editor-eyebrow">PEDRO VILEIRA / EXPERIMENTAL TOOL</p>
          <ChaosText as="h1" lines={['IMAGE', 'LAB.']} className="editor-title title-lab" />
        </div>
        <div className="editor-intro">
          <p>Uma direção. Várias imagens. Cada fotografia, uma edição independente.</p>
          <span>GEMINI 3 PRO IMAGE / NANO BANANA PRO</span>
        </div>
      </header>

      <div className="editor-section-head">
        <span>01 / SOURCE IMAGES</span>
        <span>{images.length.toString().padStart(2, '0')} / {MAX_FILES.toString().padStart(2, '0')}</span>
      </div>

      <div
        className={`editor-dropzone ${isDragging ? 'is-dragging' : ''} ${images.length ? 'has-images' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(event.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => event.target.files && addFiles(event.target.files)} />
        <div className="editor-drop-icon">＋</div>
        <div><strong>ARRASTE SUAS IMAGENS AQUI</strong><span>ou clique para selecionar arquivos</span></div>
        <small>JPG / PNG / WEBP · ATÉ 12 MB CADA · MÁXIMO 30 IMAGENS</small>
      </div>

      {images.length > 0 && (
        <div className="editor-image-list">
          <div className="editor-list-toolbar"><span>ARQUIVOS ADICIONADOS</span><button type="button" onClick={clearImages} disabled={isProcessing}>REMOVER TODAS ×</button></div>
          <div className="editor-source-grid">
            {images.map((image, index) => (
              <article className="editor-source-card" key={image.id}>
                <div className="editor-source-thumb"><img src={image.originalUrl} alt={`Original ${image.name}`} /><span>{String(index + 1).padStart(2, '0')}</span></div>
                <div className="editor-source-meta"><span title={image.name}>{image.name}</span><small className={`editor-status editor-status--${image.status}`}>{statusLabel(image.status)}</small></div>
                {image.status === 'error' && <p className="editor-card-error">{image.error}</p>}
                {image.status === 'ready' && <button type="button" className="editor-remove" onClick={() => removeImage(image.id)} aria-label={`Remover ${image.name}`} disabled={isProcessing}>×</button>}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="editor-section-head editor-section-head--spaced"><span>02 / ART DIRECTION</span><span>ONE PROMPT / ALL IMAGES</span></div>
      <div className="editor-prompt-block">
        <label htmlFor="editor-prompt">DESCREVA A TRANSFORMAÇÃO</label>
        <textarea id="editor-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} placeholder="Ex.: Transforme a iluminação de todas as fotografias em um pôr do sol cinematográfico. Preserve a arquitetura, os móveis, os materiais e a composição original de cada ambiente..." />
        <div className="editor-prompt-foot"><span>O mesmo prompt será aplicado individualmente a cada fotografia.</span><span>{prompt.length}/4000</span></div>
      </div>

      <div className="editor-options">
        <div className="editor-option"><label htmlFor="editor-ratio">PROPORÇÃO</label><select id="editor-ratio" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as AspectRatio)}>
          <option value="auto">Original / automática</option><option value="9:16">9:16 · Vertical</option><option value="16:9">16:9 · Horizontal</option><option value="1:1">1:1 · Quadrada</option><option value="4:5">4:5 · Retrato</option><option value="3:2">3:2 · Paisagem</option><option value="2:3">2:3 · Retrato clássico</option><option value="3:4">3:4 · Retrato</option><option value="4:3">4:3 · Paisagem</option><option value="5:4">5:4 · Paisagem</option><option value="21:9">21:9 · Cinematográfica</option>
        </select></div>
        <div className="editor-option"><label htmlFor="editor-size">RESOLUÇÃO</label><select id="editor-size" value={imageSize} onChange={(event) => setImageSize(event.target.value as '1K' | '2K' | '4K')}><option value="1K">1K · Padrão</option><option value="2K">2K · Alta</option><option value="4K">4K · Máxima</option></select></div>
        <div className="editor-model"><span>MODELO DE IA</span><strong>NANO BANANA PRO</strong><small>GEMINI 3 PRO IMAGE</small></div>
      </div>

      {notice && <p className="editor-notice">{notice}</p>}

      <div className="editor-run-row">
        <div><span className="editor-run-label">{isProcessing ? 'PROCESSANDO LOTE' : 'PRONTO PARA CRIAR'}</span><p>{images.length ? `${completedCount} de ${images.length} imagens concluídas${failedCount ? ` · ${failedCount} com erro` : ''}` : 'Adicione imagens para começar.'}</p></div>
        <button className="editor-button" type="button" onClick={processBatch} disabled={isProcessing || !images.length || !readyCount || !prompt.trim()}>{isProcessing ? 'PROCESSANDO...' : `EDITAR ${readyCount || images.length} IMAGENS`} <span>↗</span></button>
      </div>

      {(isProcessing || completedCount > 0) && (
        <div className="editor-progress-wrap"><div className="editor-progress-meta"><span>PROGRESSO DO LOTE</span><strong>{progress}%</strong></div><div className="editor-progress"><span style={{ width: `${progress}%` }} /></div></div>
      )}

      {completedCount > 0 && (
        <section className="editor-results">
          <div className="editor-section-head"><span>03 / RESULTS</span><span>{completedCount.toString().padStart(2, '0')} FILES READY</span></div>
          <div className="editor-results-head"><h2>THE<br /><span>OUTPUT.</span></h2><button className="editor-button editor-button--light" type="button" onClick={downloadZip} disabled={isZipping}>{isZipping ? 'PREPARANDO ZIP...' : 'BAIXAR TODAS (.ZIP)'} <span>↓</span></button></div>
          <div className="editor-result-grid">
            {images.filter((image) => image.status === 'done' && image.resultUrl).map((image, index) => (
              <article className="editor-result-card" key={image.id}>
                <div className="editor-result-images"><figure><img src={image.originalUrl} alt={`Original ${image.name}`} /><figcaption>ORIGINAL</figcaption></figure><figure><img src={image.resultUrl} alt={`Editada ${image.name}`} /><figcaption>EDITADA</figcaption></figure></div>
                <div className="editor-result-meta"><span>{String(index + 1).padStart(2, '0')} / {image.name}</span><a href={image.resultUrl} download={`${safeName(image.name.replace(/\.[^.]+$/, ''))}-editada.png`}>DOWNLOAD ↗</a></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="editor-footnote"><span>PRIVATE CREATIVE TOOL / PEDRO VILEIRA</span><span>ORIGINAL FILES ARE DELETED AFTER PROCESSING</span><button type="button" onClick={logout}>SAIR DO EDITOR ↗</button></footer>
    </section>
  );
}
