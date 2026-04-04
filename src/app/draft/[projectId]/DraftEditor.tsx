"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./draft.module.css";

interface Props {
  projectId: string;
  initialText: string;
  initialRecipientName?: string;
  initialSenderName?: string;
}

function getPlainText(html: string): string {
  // Convert <br> / <div> to newlines, strip all tags
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function wordCount(html: string): number {
  const plain = getPlainText(html);
  return plain.split(/\s+/).filter((w) => w.length > 0).length;
}

export default function DraftEditor({ projectId, initialText, initialRecipientName = "", initialSenderName = "" }: Props) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recipientName, setRecipientName] = useState(initialRecipientName);
  const [senderName, setSenderName] = useState(initialSenderName);
  const [wordCountVal, setWordCountVal] = useState(() =>
    initialText.split(/\s+/).filter((w) => w.length > 0).length
  );
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false });

  // Seed the editor with the initial text on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = initialText;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setWordCountVal(wordCount(editorRef.current.innerHTML));
      updateActiveFormats();
    }
  }, []);

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
    });
  };

  const execFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateActiveFormats();
  };

  const handleDownload = () => {
    const plain = editorRef.current
      ? getPlainText(editorRef.current.innerHTML)
      : initialText;
    const blob = new Blob([plain], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memorymint-message.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApprove = async () => {
    const plain = editorRef.current
      ? getPlainText(editorRef.current.innerHTML)
      : initialText;
    if (!plain.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/project/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edited_text: plain,
          recipient_name: recipientName,
          sender_name: senderName,
        }),
      });
      if (res.ok) {
        router.push(`/choose-card/${projectId}`);
      } else {
        throw new Error("Save failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving your message. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.editorWrap}>

      {/* ── To / From name fields ── */}
      <div className={styles.nameFields}>
        <div className={styles.nameField}>
          <label className={styles.nameLabel}>To</label>
          <input
            className={styles.nameInput}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Recipient's name"
            aria-label="Recipient name"
          />
        </div>
        <div className={styles.nameField}>
          <label className={styles.nameLabel}>From</label>
          <input
            className={styles.nameInput}
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Your name"
            aria-label="Sender name"
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            type="button"
            title="Bold (⌘B)"
            className={`${styles.toolBtn} ${activeFormats.bold ? styles.toolBtnActive : ""}`}
            onMouseDown={(e) => { e.preventDefault(); execFormat("bold"); }}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            title="Italic (⌘I)"
            className={`${styles.toolBtn} ${activeFormats.italic ? styles.toolBtnActive : ""}`}
            onMouseDown={(e) => { e.preventDefault(); execFormat("italic"); }}
          >
            <em>I</em>
          </button>
          <div className={styles.toolbarDivider} />
          <button
            type="button"
            title="Undo (⌘Z)"
            className={styles.toolBtn}
            onMouseDown={(e) => { e.preventDefault(); execFormat("undo"); }}
          >
            ↩
          </button>
          <button
            type="button"
            title="Redo (⌘⇧Z)"
            className={styles.toolBtn}
            onMouseDown={(e) => { e.preventDefault(); execFormat("redo"); }}
          >
            ↪
          </button>
          <div className={styles.toolbarDivider} />
          <button
            type="button"
            title="Remove formatting"
            className={styles.toolBtn}
            onMouseDown={(e) => { e.preventDefault(); execFormat("removeFormat"); }}
          >
            T̶
          </button>
        </div>

        <button
          type="button"
          className={styles.downloadBtn}
          onClick={handleDownload}
          title="Download as .txt"
        >
          ⬇ Download .txt
        </button>
      </div>

      {/* ── Editor ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={styles.editor}
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        spellCheck
        data-placeholder="Your message will appear here…"
      />

      {/* ── Footer ── */}
      <div className={styles.editorFooter}>
        <span className={styles.wordCount}>{wordCountVal} words</span>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.btnBack}
            onClick={() => router.push("/create")}
            disabled={isSaving}
          >
            Start Over
          </button>
          <button
            type="button"
            className={styles.btnApprove}
            onClick={handleApprove}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Love it — Choose a Card →"}
          </button>
        </div>
      </div>
    </div>
  );
}
