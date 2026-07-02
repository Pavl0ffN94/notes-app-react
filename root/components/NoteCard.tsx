import type { Note } from '../types';

interface Props {
  note: Note;
  onClick: (id: string) => void;
}

export default function NoteCard({ note, onClick }: Props) {
  return (
    <div className="note-card" onClick={() => onClick(note.id)}>
      <h3>{note.title}</h3>
      <div className="meta">
        {note.date} · {note.time}
      </div>
      <div className="preview">{note.content.slice(0, 180)}</div>
    </div>
  );
}
