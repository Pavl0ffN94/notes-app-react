// Ambient-декларации для File System Access API — на момент написания не входят
// в стандартный lib.dom.d.ts во всех версиях TypeScript, поэтому объявлены явно.

export interface FileSystemFileHandleLike {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStreamLike>;
}

export interface FileSystemWritableFileStreamLike {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}

export interface OpenFilePickerOptions {
  types?: { description: string; accept: Record<string, string[]> }[];
  multiple?: boolean;
}

export interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandleLike[]>;
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
  }
}
