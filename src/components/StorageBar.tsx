import type { ChangeEvent, RefObject } from 'react';
import type { StorageMode } from '../types';

interface Props {
  mode: StorageMode;
  status: string;
  onSwitchMode: (mode: StorageMode) => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function StorageBar({
  mode,
  status,
  onSwitchMode,
  onOpenFile,
  onSaveFile,
  fileInputRef,
  onFileInputChange,
}: Props) {
  return (
    <section className="storage-bar">
      <div className="storage-switch" role="tablist" aria-label="Способ хранения">
        <button
          className={`storage-tab ${mode === 'db' ? 'active' : ''}`}
          onClick={() => onSwitchMode('db')}
        >
          База данных (IndexedDB)
        </button>
        <button
          className={`storage-tab ${mode === 'file' ? 'active' : ''}`}
          onClick={() => onSwitchMode('file')}
        >
          Файл на устройстве
        </button>
      </div>
      <div className="storage-status">{status}</div>
      {mode === 'file' && (
        <div className="file-controls">
          <button onClick={onOpenFile}>Открыть файл…</button>
          <button onClick={onSaveFile}>Сохранить в файл</button>
          <input
            type="file"
            accept="application/json"
            hidden
            ref={fileInputRef}
            onChange={onFileInputChange}
          />
        </div>
      )}
    </section>
  );
}
