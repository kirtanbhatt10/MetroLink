import { useEffect, useId, useRef, useState } from 'react';
import { searchPlaces } from '../api/client';
import type { Place } from '../api/types';
import { TransportModeIcon } from './common';

interface Props {
  label: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
  placeholder?: string;
}

export function PlaceAutocomplete({ label, value, onChange, placeholder }: Props) {
  const id = useId();
  const [text, setText] = useState(value?.name ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);

  // Keep the text in sync when parent swaps/clears the value.
  useEffect(() => { setText(value?.name ?? ''); }, [value]);

  useEffect(() => {
    const q = text.trim();
    if (!open || q.length < 2 || (value && value.name === text)) { setResults([]); setStatus('idle'); return; }
    const ctrl = new AbortController();
    setStatus('loading');
    const t = setTimeout(() => {
      searchPlaces(q, ctrl.signal)
        .then((r) => { setResults(r); setStatus('done'); setActive(-1); })
        .catch((e) => { if ((e as Error).name !== 'AbortError') setStatus('error'); });
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [text, open, value]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (p: Place) => { onChange(p); setText(p.name); setOpen(false); };
  const listId = `${id}-list`;

  return (
    <div className="field" ref={wrap}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && status !== 'idle'}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        placeholder={placeholder}
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); if (value) onChange(null); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === 'Enter' && open && active >= 0 && results[active]) { e.preventDefault(); pick(results[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && status !== 'idle' && (
        <ul className="suggestions" id={listId} role="listbox" aria-label={`${label} suggestions`}>
          {status === 'loading' && <li className="suggestion-note" role="status">Searching…</li>}
          {status === 'error' && <li className="suggestion-note" role="alert">Search failed. Is the backend running?</li>}
          {status === 'done' && results.length === 0 && <li className="suggestion-note" role="status">No matching stops found in the imported data.</li>}
          {status === 'done' && results.map((p, i) => (
            <li key={p.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}
              className={i === active ? 'active' : ''} onMouseDown={(e) => { e.preventDefault(); pick(p); }}>
              <TransportModeIcon mode={p.mode} size={18} />
              <span className="s-name">{p.name}</span>
              <span className="s-meta">{p.mode}{p.verificationStatus !== 'verified' ? ' · unverified' : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
