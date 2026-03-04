"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { WHERE_WERE_YOU_OPTIONS } from "@/lib/oref";
import { submitWhereWereYou } from "@/lib/supabase";

interface WhereWereYouModalProps {
  alertId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function WhereWereYouModal({ alertId, isOpen, onClose }: WhereWereYouModalProps) {
  const { locale, t } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = async (key: string) => {
    setSelectedOption(key);
    try {
      await submitWhereWereYou(alertId, key);
    } catch {
      // Continue even if submission fails
    }
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-bg-card border border-border rounded-3xl p-8 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-alert-red/5 blur-3xl pointer-events-none" />

            {!submitted ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {t.whereWereYou.title}
                  </h2>
                  <p className="text-text-secondary text-sm">
                    {t.whereWereYou.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {WHERE_WERE_YOU_OPTIONS.map((option) => (
                    <motion.button
                      key={option.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(option.key)}
                      className={`flex items-center gap-3 p-4 rounded-2xl bg-bg border border-border hover:border-alert-red/30 hover:glow-red transition-all ${
                        selectedOption === option.key ? "border-alert-red glow-red" : ""
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-sm font-medium text-text-primary">
                        {locale === "he" ? option.he : option.en}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="mt-6 w-full text-center text-text-secondary text-xs hover:text-text-primary transition-colors"
                >
                  {locale === "he" ? "לא עכשיו" : "Not now"}
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-4">🙏</div>
                <h3 className="text-xl font-bold text-text-primary">
                  {t.whereWereYou.thanks}
                </h3>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
