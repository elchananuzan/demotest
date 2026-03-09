"use client";

import { useRef, useState, useMemo } from "react";
import { Volume2, Upload, Trash2, Play, MapPin, X, Search } from "lucide-react";
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
  allCityNames,
}: {
  settings: AlertSettings;
  onChange: (partial: Partial<AlertSettings>) => void;
  isHe: boolean;
  allCityNames: string[];
}) {
  const sirenInputRef = useRef<HTMLInputElement>(null);
  const earlyInputRef = useRef<HTMLInputElement>(null);
  const clearInputRef = useRef<HTMLInputElement>(null);
  const [zoneSearch, setZoneSearch] = useState("");

  const handleFileUpload = async (
    file: File | undefined,
    key: "customSiren" | "customEarly" | "customClear"
  ) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    try {
      onChange({ [key]: dataUrl });
    } catch {
      alert(isHe ? "לא ניתן לשמור — הקובץ גדול מדי לאחסון המקומי" : "Cannot save — file too large for local storage");
    }
  };

  const addZone = (zone: string) => {
    if (!settings.alertZones.includes(zone)) {
      onChange({ alertZones: [...settings.alertZones, zone] });
    }
    setZoneSearch("");
  };

  const removeZone = (zone: string) => {
    onChange({ alertZones: settings.alertZones.filter((z) => z !== zone) });
  };

  const filteredCities = useMemo(() => {
    const q = zoneSearch.trim();
    if (!q) return [];
    return allCityNames
      .filter((c) => c.includes(q) && !settings.alertZones.includes(c))
      .slice(0, 20);
  }, [allCityNames, zoneSearch, settings.alertZones]);

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

      {/* Zone filter toggle + zone picker */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.cityFilterEnabled}
            onChange={(e) => onChange({ cityFilterEnabled: e.target.checked })}
            className="accent-alert-red w-4 h-4"
          />
          <span className="text-xs text-text-secondary">
            {isHe ? "התרעות רק עבור אזורים נבחרים" : "Alerts only for selected zones"}
          </span>
        </label>

        {settings.cityFilterEnabled && (
          <div className="space-y-2 ps-6">
            {/* Selected zones */}
            {settings.alertZones.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {settings.alertZones.map((zone) => (
                  <span
                    key={zone}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-alert-red/10 text-alert-red rounded-full border border-alert-red/20"
                  >
                    <MapPin size={10} />
                    {zone}
                    <button
                      onClick={() => removeZone(zone)}
                      className="hover:bg-alert-red/20 rounded-full p-0.5 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search to add zones */}
            <div className="relative">
              <Search size={12} className="absolute start-2 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
                placeholder={isHe ? "חפש אזור להוספה..." : "Search zone to add..."}
                className="w-full ps-7 pe-3 py-1.5 text-xs bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:border-alert-red/50"
              />
              {filteredCities.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto bg-bg-card border border-border rounded-lg shadow-lg">
                  {filteredCities.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addZone(name)}
                      className="w-full text-start px-3 py-1.5 text-xs hover:bg-alert-red/10 transition-colors text-text-primary"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {settings.alertZones.length === 0 && (
              <p className="text-[10px] text-text-secondary/60">
                {isHe ? "הוסף אזורים כדי לסנן התרעות" : "Add zones to filter alerts"}
              </p>
            )}
          </div>
        )}
      </div>

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
