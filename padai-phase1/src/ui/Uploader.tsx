export function Uploader({ onLoad }: { onLoad: (text: string) => void }) {
  const onFile = async (file: File) => onLoad(await file.text());
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void onFile(f);
  };
  return (
    <div className="w-full">
      <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
          className="border-2 border-dashed rounded-xl p-3 text-center transition border-gray-300">
        <div className="flex items-center justify-center gap-2 text-xs">
          <label className="cursor-pointer underline">
            Load .jsonl
            <input type="file" accept=".jsonl,application/jsonl,text/plain" className="hidden"
                  onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void onFile(f); }} />
          </label>
          <span>·</span>
        </div>
      </div>
    </div>
  );
}
