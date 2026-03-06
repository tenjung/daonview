'use client';

import { useMemo, useRef } from 'react';
import { Film, Image as ImageIcon, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  accept: string;
  label: string;
  helperText: string;
  maxFiles: number;
  kind: 'IMAGE' | 'VIDEO';
}

export function MediaUploader({ files, onChange, accept, label, helperText, maxFiles, kind }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  const handleAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    if (files.length + incoming.length > maxFiles) {
      toast.error(`최대 ${maxFiles}개까지만 업로드할 수 있습니다.`);
      return;
    }
    onChange([...files, ...incoming]);
    event.target.value = '';
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-bold text-text-main">{label}</label>
        <span className="text-xs font-bold text-text-secondary">{files.length}/{maxFiles}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {previews.map(({ file, url }, index) => (
          <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {kind === 'IMAGE' ? (
              <img src={url} alt={file.name} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <video src={url} className="aspect-[3/4] w-full object-cover" muted playsInline />
            )}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute top-2 right-2 rounded-full bg-black/55 p-1 text-white"
            >
              <X size={14} />
            </button>
            <div className="p-2">
              <p className="truncate text-[11px] font-bold text-slate-600">{file.name}</p>
            </div>
          </div>
        ))}
        {files.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <div className="flex h-full flex-col items-center justify-center gap-2">
              {kind === 'IMAGE' ? <ImageIcon size={22} /> : <Film size={22} />}
              <Plus size={18} />
            </div>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={handleAdd} />
      <p className="text-[11px] leading-relaxed text-text-secondary">{helperText}</p>
    </div>
  );
}
