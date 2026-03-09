"use client";

import { useRef } from "react";
import { Volume2, Upload, Trash2, Play } from "lucide-react";
import { type AlertSettings } from "@/lib/hooks";

/** Read a file as a data URL string */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Preview-play a sound briefly */
function previewSound(src: string, volume: number) {
  const a = new Audio(src);
  a.volume = volume / 100;
  a.play().catch(() => {});
  setTimeout(() => { a.pause(); a.src = ""; }, 3000);
}

export default function AlertSettingsPanel({
  settings,
  onChange,
  isHe,
}: {
  settings: AlertSettings;
  onChange: (partial: Partial<AlertSettings>) => void;
  isHe: boolean;
}) {
  const sirenInputRef = useRef<HTMLInputElement>(null);
  const earlyInputRef = useRef<HTMLInputElement>(null);
  const clearInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    file: File | undefined,
    key: "customSiren" | "customEarly" | "customClear"
  ) => {
    if (!file) return;
    // Limit to 2MB to avoid localStorage quota issues
    if (file.size > 2 * 1024 * 1024) {
      alert(isHe ? "הקובץ גדול מדי (מקסימום 2MB)" : "File too large (max 2MB)");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ [key]: dataUrl });
  };

  return (
    <div className="space-y-4">
      {/* Volume slider */}
      <div>
        <label className="flex items-center gap-2 text-xs text-text-secondary mb-2">
          <Volume2 size={14} />
          {isHe ? "עוצמת קול" : "Volume"}: {settings.volume}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          className="w-full accent-alert-red h-1.5"
        />
      </div>

      {/* City filter toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.cityFilterEnabled}
          onChange={(e) => onChange({ cityFilterEnabled: e.target.checked })}
          className="accent-alert-red w-4 h-4"
        />
        <span className="text-xs text-text-secondary">
          {isHe ? "התרעות רק עבור העיר שנבחרה" : "Alerts only for selected city"}
        </span>
      </label>

      {/* Sound pickers */}
      <SoundPicker
        label={isHe ? "צליל סירנה (התקפה)" : "Siren sound (attack)"}
        defaultLabel={isHe ? "סירנה ברירת מחדל" : "Default siren"}
        hasCustom={!!settings.customSiren}
        onUpload={() => sirenInputRef.current?.click()}
        onRemove={() => onChange({ customSiren: null })}
        onPreview={() => previewSound(settings.customSiren || "/siren.mp3", settings.volume)}
        isHe={isHe}
      />
      <input
        ref={sirenInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files?.[0], "customSiren")}
      />

      <SoundPicker
        label={isHe ? "צליל התרעה מקדימה" : "Early warning sound"}
        defaultLabel={isHe ? "צלצול ברירת מחדל" : "Default chime"}
        hasCustom={!!settings.customEarly}
        onUpload={() => earlyInputRef.current?.click()}
        onRemove={() => onChange({ customEarly: null })}
        onPreview={() => previewSound(settings.customEarly || "/alert-early.mp3", settings.volume)}
        isHe={isHe}
      />
      <input
        ref={earlyInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files?.[0], "customEarly")}
      />

      <SoundPicker
        label={isHe ? "צליל סיום התרעה" : "All-clear sound"}
        defaultLabel={isHe ? "סיום ברירת מחדל" : "Default clear"}
        hasCustom={!!settings.customClear}
        onUpload={() => clearInputRef.current?.click()}
        onRemove={() => onChange({ customClear: null })}
        onPreview={() => previewSound(settings.customClear || "/alert-clear.mp3", settings.volume)}
        isHe={isHe}
      />
      <input
        ref={clearInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files?.[0], "customClear")}
      />
    </div>
  );
}

function SoundPicker({
  label,
  defaultLabel,
  hasCustom,
  onUpload,
  onRemove,
  onPreview,
  isHe,
}: {
  label: string;
  defaultLabel: string;
  hasCustom: boolean;
  onUpload: () => void;
  onRemove: () => void;
  onPreview: () => void;
  isHe: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-bg rounded-lg border border-border">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">{label}</p>
        <p className="text-[10px] text-text-secondary">
          {hasCustom ? (isHe ? "צליל מותאם אישית" : "Custom sound") : defaultLabel}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onPreview}
          className="p-1.5 rounded-md hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors"
          title={isHe ? "נגן" : "Preview"}
        >
          <Play size={14} />
        </button>
        <button
          onClick={onUpload}
          className="p-1.5 rounded-md hover:bg-bg-card text-text-secondary hover:text-text-primary transition-colors"
          title={isHe ? "העלה קובץ" : "Upload file"}
        >
          <Upload size={14} />
        </button>
        {hasCustom && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md hover:bg-alert-red/10 text-text-secondary hover:text-alert-red transition-colors"
            title={isHe ? "חזור לברירת מחדל" : "Reset to default"}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
