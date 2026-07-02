import type { Note } from './types';
import type { FileSystemFileHandleLike } from './fs-access';

export function parseNotesJson(text: string): Note[] {
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? (parsed as Note[]) : ((parsed.notes ?? []) as Note[]);
}

export function serializeNotes(notes: Note[]): string {
  return JSON.stringify({ exported_at: new Date().toISOString(), notes }, null, 2);
}

export interface OpenedFile {
  handle: FileSystemFileHandleLike | null;
  name: string;
  notes: Note[];
}

/** Открывает файл через File System Access API. Возвращает null, если API недоступен или пользователь отменил выбор. */
export async function pickAndReadFile(): Promise<OpenedFile | null> {
  if (!window.showOpenFilePicker) return null;
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Заметки JSON', accept: { 'application/json': ['.json'] } }],
    });
    const file = await handle.getFile();
    const notes = parseNotesJson(await file.text());
    return { handle, name: file.name, notes };
  } catch (err) {
    if ((err as DOMException)?.name !== 'AbortError') console.error(err);
    return null;
  }
}

export async function readFromInputFile(file: File): Promise<Note[]> {
  return parseNotesJson(await file.text());
}

/** Сохраняет заметки в уже открытый handle (перезапись того же файла). */
export async function saveToHandle(handle: FileSystemFileHandleLike, notes: Note[]): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(serializeNotes(notes));
  await writable.close();
}

/** Открывает системный диалог "Сохранить как" и возвращает новый handle, либо null при отмене/отсутствии API. */
export async function pickAndSaveFile(notes: Note[]): Promise<FileSystemFileHandleLike | null> {
  if (!window.showSaveFilePicker) return null;
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'notes.json',
      types: [{ description: 'Заметки JSON', accept: { 'application/json': ['.json'] } }],
    });
    await saveToHandle(handle, notes);
    return handle;
  } catch (err) {
    if ((err as DOMException)?.name !== 'AbortError') console.error(err);
    return null;
  }
}

/** Фолбэк для браузеров без File System Access API (например, iOS Safari): скачивание файла. */
export function downloadNotesFile(notes: Note[]): void {
  const blob = new Blob([serializeNotes(notes)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notes.json';
  a.click();
  URL.revokeObjectURL(url);
}
