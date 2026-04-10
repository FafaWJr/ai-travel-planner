"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface DayNotesProps {
  dayIndex: number;
  initialNote: string;
  onSave: (dayIndex: number, note: string) => void;
}

export default function DayNotes({ dayIndex, initialNote, onSave }: DayNotesProps) {
  const [text, setText] = useState(initialNote || "");
  const [savedText, setSavedText] = useState(initialNote || "");
  const [saved, setSaved] = useState(false);

  // Sync if parent reloads (e.g. trip loaded from DB)
  useEffect(() => {
    setText(initialNote || "");
    setSavedText(initialNote || "");
  }, [initialNote]);

  const isDirty = text !== savedText;

  const handleSave = () => {
    setSavedText(text);
    onSave(dayIndex, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: "24px",
        borderTop: "1px solid #e5e7eb",
        paddingTop: "16px",
      }}
    >
      <p
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#00447B",
          fontFamily: "Poppins, sans-serif",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        My Notes for this day
      </p>

      <div style={{ position: "relative" }}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
          }}
          placeholder="Add any personal notes, reminders, or tips for this day..."
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            border: "1px solid #C0C0C0",
            borderRadius: "8px",
            padding: "10px 44px 10px 12px",
            fontSize: "14px",
            fontFamily: "Inter, Lato, sans-serif",
            color: "#3b3b3b",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
            backgroundColor: "#fafafa",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#FF8210";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#C0C0C0";
          }}
        />

        {/* Save tick button */}
        <button
          onClick={handleSave}
          disabled={!isDirty && !saved}
          title={saved ? "Saved!" : isDirty ? "Save note" : "No changes"}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "none",
            cursor: isDirty ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: saved
              ? "#22c55e"
              : isDirty
              ? "#FF8210"
              : "#e5e7eb",
            transition: "background-color 0.2s",
            flexShrink: 0,
          }}
        >
          <Check
            size={15}
            color={isDirty || saved ? "#fff" : "#9ca3af"}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {saved && (
        <p
          style={{
            fontSize: "12px",
            color: "#22c55e",
            marginTop: "4px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Note saved!
        </p>
      )}
    </div>
  );
}
