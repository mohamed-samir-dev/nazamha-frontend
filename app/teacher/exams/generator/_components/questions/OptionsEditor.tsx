"use client";

import { useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import { QuestionFormState } from "./types";
import { TRUE_FALSE_OPTIONS } from "./constants";
import { compressImage } from "@/lib/utils/compressImage";
import { questionsService } from "@/lib/services/questionsService";
import { resolveImageUrl } from "@/lib/utils/resolveImageUrl";

interface OptionsEditorProps {
  f: QuestionFormState;
  setF: React.Dispatch<React.SetStateAction<QuestionFormState>>;
  questionIdx: number;
}

export function OptionsEditor({ f, setF }: OptionsEditorProps) {
  const { questionType, options, optionImages, correctAnswer, correctAnswers } = f;
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // index-based correct tracking — supports image-only options
  const parseCorrectIdx = (val: string) => {
    if (val.startsWith("__idx__") || val.startsWith("__img__")) {
      return parseInt(val.slice(7), 10);
    }
    const i = options.indexOf(val);
    return i !== -1 ? i : -1;
  };

  const correctIdxSet = new Set(
    questionType === "multiple_choice"
      ? correctAnswers.map(parseCorrectIdx).filter((i) => i !== -1)
      : correctAnswer !== ""
      ? [parseCorrectIdx(correctAnswer)]
      : []
  );

  const updateOption = (i: number, val: string) => {
    setF((p) => {
      const opts = [...p.options];
      opts[i] = val;
      return { ...p, options: opts };
    });
  };

  const updateOptionImage = (i: number, img: string | null) => {
    setF((p) => {
      const imgs = [...p.optionImages];
      imgs[i] = img;
      return { ...p, optionImages: imgs };
    });
  };

  const handleImageUpload = async (i: number, file: File) => {
    setUploadingIdx(i);
    try {
      const compressed = await compressImage(file);
      const res = await questionsService.uploadImage(compressed);
      updateOptionImage(i, res.url);
    } catch {
      const r = new FileReader();
      r.onloadend = () => updateOptionImage(i, r.result as string);
      r.readAsDataURL(file);
    } finally {
      setUploadingIdx(null);
    }
  };

  const removeOption = (i: number) => {
    setF((p) => {
      const opts = [...p.options];
      const imgs = [...p.optionImages];
      const removed = opts[i];
      opts.splice(i, 1);
      imgs.splice(i, 1);
      return {
        ...p,
        options: opts,
        optionImages: imgs,
        correctAnswer: p.correctAnswer === removed ? "" : p.correctAnswer,
        correctAnswers: p.correctAnswers.filter((ca) => ca !== removed),
      };
    });
  };

  const addOption = () =>
    setF((p) => ({
      ...p,
      options: [...p.options, ""],
      optionImages: [...p.optionImages, null],
    }));

  const toggleCorrect = (i: number) => {
    if (questionType === "true_false") {
      setF((p) => ({ ...p, correctAnswer: TRUE_FALSE_OPTIONS[i] }));
      return;
    }
    // use index key when option has image or empty text
    const optVal = optionImages[i] || !options[i]?.trim() ? `__idx__${i}` : options[i];
    if (questionType === "single_choice") {
      setF((p) => ({ ...p, correctAnswer: optVal }));
    } else {
      setF((p) => ({
        ...p,
        correctAnswers: p.correctAnswers.includes(optVal)
          ? p.correctAnswers.filter((c) => c !== optVal)
          : [...p.correctAnswers, optVal],
      }));
    }
  };

  const isCorrectIdx = (i: number) => correctIdxSet.has(i);

  const displayOptions =
    questionType === "true_false" ? TRUE_FALSE_OPTIONS : options;

  const readOnly = questionType === "true_false";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label className="form-label">الاختيارات</label>

      {displayOptions.map((opt, i) => {
        const img = optionImages[i] ?? null;
        const correct = isCorrectIdx(i);

        return (
          <div
            key={`opt-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 0.6rem",
              borderRadius: 9,
              border: `1px solid ${correct ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.07)"}`,
              background: correct ? "rgba(20,184,166,0.06)" : "rgba(255,255,255,0.02)",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            {/* correct indicator */}
            <button
              type="button"
              onClick={() => toggleCorrect(i)}
              title="تحديد كإجابة صحيحة"
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: questionType === "multiple_choice" ? 4 : "50%",
                border: `2px solid ${correct ? "var(--color-teal)" : "rgba(255,255,255,0.2)"}`,
                background: correct ? "var(--color-teal)" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                padding: 0,
              }}
            >
              {correct && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 18, textAlign: "center" }}>
              {i + 1}
            </span>

            {/* option image preview */}
            {img ? (
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img src={resolveImageUrl(img)} alt="" style={{ maxHeight: 48, maxWidth: "100%", borderRadius: 6, display: "block" }} />
                {!readOnly && (
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder="نص توضيحي للخيار (اختياري)"
                    style={{
                      flex: 1,
                      padding: "0.3rem 0.5rem",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--text-primary)",
                      fontSize: "0.82rem",
                      outline: "none",
                    }}
                  />
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => updateOptionImage(i, null)}
                    style={{ background: "rgba(239,68,68,0.8)", border: "none", borderRadius: "50%", padding: 3, cursor: "pointer", display: "flex", color: "#fff" }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ) : (
              <input
                value={opt}
                onChange={(e) => !readOnly && updateOption(i, e.target.value)}
                readOnly={readOnly}
                placeholder={`خيار ${i + 1}`}
                style={{
                  flex: 1,
                  padding: "0.4rem 0.6rem",
                  borderRadius: 7,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            )}

            {/* image upload per option */}
            {!readOnly && !img && (
              <label
                title="إرفاق صورة للخيار"
                style={{ cursor: uploadingIdx === i ? "wait" : "pointer", color: "var(--text-muted)", display: "flex", padding: "3px", borderRadius: 6, flexShrink: 0 }}
              >
                <ImageIcon size={13} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingIdx !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(i, file);
                  }}
                />
              </label>
            )}

            {/* remove option */}
            {!readOnly && options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "3px", borderRadius: 6, flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}

      {/* add option */}
      {!readOnly && (
        <button
          type="button"
          onClick={addOption}
          style={{
            padding: "0.45rem",
            borderRadius: 8,
            border: "1px dashed rgba(255,255,255,0.12)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
        >
          <Plus size={13} /> إضافة خيار
        </button>
      )}
    </div>
  );
}
