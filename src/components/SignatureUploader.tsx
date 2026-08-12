import React, { useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface SignatureUploaderProps {
  signatureBase64: string | null;
  onSignatureChange: (base64: string | null) => void;
}

export const SignatureUploader: React.FC<SignatureUploaderProps> = ({
  signatureBase64,
  onSignatureChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/png') && !file.type.includes('image/jpeg') && !file.type.includes('image/webp')) {
      alert('Selezionare un file di immagine (formato consigliato: PNG trasparente).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      onSignatureChange(base64Str);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onSignatureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-base">Firma Digitale (PNG)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Carica un'immagine della tua firma autografa in formato PNG (preferibilmente con sfondo trasparente).
          </p>
        </div>
        {signatureBase64 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Firma Caricata
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {signatureBase64 ? (
        <div className="space-y-4">
          <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-center min-h-[120px]">
            <img
              src={signatureBase64}
              alt="Anteprima firma"
              className="max-h-24 object-contain"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Sostituisci Firma
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              Rimuovi
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 text-slate-500 group-hover:text-blue-600 transition-colors">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
            Clicca per caricare la firma PNG
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG fino a 2MB (Trasparenza supportata)</p>
        </div>
      )}
    </div>
  );
};
