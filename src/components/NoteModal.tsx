import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import type { Note } from '../types';

interface Props {
  note: Note | null; // null = создание новой заметки
  onSave: (note: Note) => void;
  onDelete: () => void;
  onClose: () => void;
}

function uid(): string {
  return 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function todayParts(): { date: string; time: string } {
  const now = new Date();
  return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5) };
}

export default function NoteModal({ note, onSave, onDelete, onClose }: Props) {
  const initial = note ?? { id: '', title: '', date: todayParts().date, time: todayParts().time, content: '', updated_at: '' };

  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [content, setContent] = useState(initial.content);
  const titleRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    const noteData: Note = {
      id: note?.id ?? uid(),
      title: title.trim() || 'Без названия',
      date,
      time,
      content,
      updated_at: new Date().toISOString(),
    };
    onSave(noteData);
  }

  function handleBackdropClick(e: MouseEvent): void {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{note ? 'Редактировать заметку' : 'Новая заметка'}</h2>
        <label>
          Заголовок
          <input
            ref={titleRef}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Планёрка по проекту X"
          />
        </label>
        <div className="row">
          <label>
            Дата
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Время
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <label>
          Содержание
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ключевые тезисы, договорённости, задачи…"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Отмена
          </button>
          {note && (
            <button type="button" className="danger" onClick={onDelete}>
              Удалить
            </button>
          )}
          <button type="submit" className="primary">
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
