"use client";

import { useId, useState } from "react";
import { FileImage, UploadCloud, X } from "lucide-react";

export function ProofFilePicker({ file, onFileChange }: { file: File | null; onFileChange: (file: File | null) => void }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const choose = (next: File | null) => { setDragging(false); onFileChange(next); };
  return <div className="proof-file-picker">
    <input id={id} className="proof-file-input" type="file" accept="image/jpeg,image/png" onChange={(event) => choose(event.target.files?.[0] ?? null)} />
    <label htmlFor={id} className={`proof-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files?.[0] ?? null); }}>
      <span className="proof-dropzone-icon">{file ? <FileImage /> : <UploadCloud />}</span>
      <span className="proof-dropzone-copy"><strong>{file ? file.name : "Pilih bukti pembayaran"}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · siap diunggah` : "Tarik file ke sini atau pilih dari perangkat"}</small><em>JPG, JPEG, atau PNG · maksimum 5 MB</em></span>
      <span className="proof-picker-action">{file ? "Ganti file" : "Pilih file"}</span>
    </label>
    {file ? <button type="button" className="proof-remove" onClick={() => choose(null)}><X /> Hapus file</button> : null}
  </div>;
}
