import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { Note, StorageMode } from './types';
import { dbGetAll, dbPut, dbDelete } from './db';
import {
  pickAndReadFile,
  readFromInputFile,
  saveToHandle,
  pickAndSaveFile,
  downloadNotesFile,
} from './fileStorage';
import type { FileSystemFileHandleLike } from './fs-access';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import StorageBar from './components/StorageBar';

function pluralNotes(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'заметка';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'заметки';
  return 'заметок';
}

function matchesSearch(note: Note, q: string): boolean {
  if (!q) return true;
  const query = q.toLowerCase();
  return (
    note.title.toLowerCase().includes(query) ||
    note.content.toLowerCase().includes(query) ||
    note.date.includes(query)
  );
}

export default function App() {
  const [mode, setMode] = useState<StorageMode>('db');
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Автосохранение в базе данных устройства');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandleLike | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dbGetAll().then(setNotes);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const filtered = useMemo(
    () =>
      notes
        .filter((n) => matchesSearch(n, search.trim()))
        .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)),
    [notes, search]
  );

  function openNewNote(): void {
    setEditingNote(null);
    setModalOpen(true);
  }

  function openExistingNote(id: string): void {
    const note = notes.find((n) => n.id === id) ?? null;
    setEditingNote(note);
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setEditingNote(null);
  }

  async function handleSaveNote(note: Note): Promise<void> {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = note;
        return copy;
      }
      return [...prev, note];
    });

    if (mode === 'db') {
      await dbPut(note);
      setStatus('Сохранено в базе данных · ' + new Date().toLocaleTimeString('ru-RU'));
    } else {
      setStatus('Есть несохранённые изменения — нажмите «Сохранить в файл»');
    }
    closeModal();
  }

  async function handleDeleteNote(): Promise<void> {
    if (!editingNote) return;
    if (!confirm('Удалить эту заметку без возможности восстановления?')) return;

    const id = editingNote.id;
    setNotes((prev) => prev.filter((n) => n.id !== id));

    if (mode === 'db') {
      await dbDelete(id);
      setStatus('Удалено · ' + new Date().toLocaleTimeString('ru-RU'));
    } else {
      setStatus('Есть несохранённые изменения — нажмите «Сохранить в файл»');
    }
    closeModal();
  }

  async function switchMode(next: StorageMode): Promise<void> {
    setMode(next);
    if (next === 'db') {
      setNotes(await dbGetAll());
      setStatus('Автосохранение в базе данных устройства');
    } else {
      setNotes([]);
      setFileHandle(null);
      setStatus('Файл не открыт — заметки хранятся только в памяти до сохранения');
    }
  }

  async function handleOpenFile(): Promise<void> {
    const opened = await pickAndReadFile();
    if (opened) {
      setFileHandle(opened.handle);
      setNotes(opened.notes);
      setStatus(`Открыт файл «${opened.name}»`);
      return;
    }
    // File System Access API недоступен (например, iOS Safari) — используем <input type="file">
    fileInputRef.current?.click();
  }

  async function handleFileInputChange(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await readFromInputFile(file);
      setNotes(loaded);
      setStatus(`Открыт файл «${file.name}» (сохранение — через скачивание)`);
    } catch {
      alert('Не удалось прочитать файл: некорректный JSON');
    } finally {
      e.target.value = '';
    }
  }

  async function handleSaveFile(): Promise<void> {
    if (fileHandle) {
      try {
        await saveToHandle(fileHandle, notes);
        setStatus('Сохранено в файл · ' + new Date().toLocaleTimeString('ru-RU'));
        return;
      } catch (err) {
        console.error(err);
      }
    }

    const newHandle = await pickAndSaveFile(notes);
    if (newHandle) {
      setFileHandle(newHandle);
      setStatus('Сохранено в файл · ' + new Date().toLocaleTimeString('ru-RU'));
      return;
    }

    if (!window.showSaveFilePicker) {
      downloadNotesFile(notes);
      setStatus('Файл notes.json скачан · ' + new Date().toLocaleTimeString('ru-RU'));
    }
  }

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">N</span>
          <div>
            <h1>Заметки</h1>
            <p>для совещаний, встреч и конференций</p>
          </div>
        </div>
        <button className="primary" onClick={openNewNote}>
          + Новая заметка
        </button>
      </header>

      <StorageBar
        mode={mode}
        status={status}
        onSwitchMode={(m) => void switchMode(m)}
        onOpenFile={() => void handleOpenFile()}
        onSaveFile={() => void handleSaveFile()}
        fileInputRef={fileInputRef}
        onFileInputChange={(e) => void handleFileInputChange(e)}
      />

      <section className="search-bar">
        <input
          type="search"
          placeholder="Поиск по заголовку, тексту, дате…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="count">
          {filtered.length} {pluralNotes(filtered.length)}
        </span>
      </section>

      <main className="notes-grid">
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note} onClick={openExistingNote} />
        ))}
      </main>

      {notes.length === 0 && (
        <p className="empty-state">
          Заметок пока нет. Нажмите «+ Новая заметка», чтобы начать вести записи со встречи.
        </p>
      )}

      {modalOpen && (
        <NoteModal
          note={editingNote}
          onSave={(n) => void handleSaveNote(n)}
          onDelete={() => void handleDeleteNote()}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
