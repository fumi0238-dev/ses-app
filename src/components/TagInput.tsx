'use client';

import React, { useRef, ClipboardEvent, KeyboardEvent } from 'react';

interface TagInputProps {
  value: string; // comma-separated tags
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const getTags = (): string[] => {
    return value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
  };

  const setTags = (tags: string[]) => {
    onChange(tags.join(','));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current!;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/,/g, '');
      if (val) {
        const tags = getTags();
        if (!tags.includes(val)) setTags([...tags, val]);
        input.value = '';
      }
    } else if (e.key === 'Backspace' && !input.value) {
      const tags = getTags();
      if (tags.length) setTags(tags.slice(0, -1));
    }
  };

  const handlePaste = (_e: ClipboardEvent<HTMLInputElement>) => {
    setTimeout(() => {
      const input = inputRef.current!;
      const parts = input.value.split(/[,、/]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const existing = getTags();
        const merged = [...existing, ...parts.filter(p => !existing.includes(p))];
        setTags(merged);
        input.value = '';
      }
    }, 0);
  };

  const removeTag = (idx: number) => {
    const tags = getTags();
    tags.splice(idx, 1);
    setTags(tags);
  };

  const tags = getTags();

  return (
    <div className="tag-input-wrap" onClick={() => inputRef.current?.focus()}>
      <div className="tag-list">
        {tags.map((t, i) => (
          <span key={i} className="tag-item">
            {t}
            <button
              type="button"
              className="tag-remove"
              onClick={e => { e.stopPropagation(); removeTag(i); }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="tag-input"
        placeholder={tags.length === 0 ? placeholder : ''}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
}
