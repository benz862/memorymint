"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { OCCASION_SUBTYPE_GROUPS, TONES, LENGTH_OPTIONS } from "@/lib/constants";

export default function CreateCardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    senderName: "",
    recipientName: "",
    occasionSubtype: "happy-birthday",
    tone: "heartfelt",
    desiredLength: "medium",
    memories: "",
    qualities: "",
    desiredFeeling: "",
  });

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the real error from the API (e.g. "Invalid API key", "Quota exceeded")
        throw new Error(data.error || `Server error ${res.status}`);
      }

      if (data.projectId) {
        router.push(`/draft/${data.projectId}`);
      } else {
        throw new Error("No project ID returned. Please try again.");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Could not generate your card:\n\n${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Craft Your Message</h1>
        <p className={styles.subtitle}>
          Answer a few quick questions and we&apos;ll help you write the perfect card.
        </p>
      </header>

      <main className={styles.wizard}>
        <div className={styles.stepIndicator}>
          <span>Step {step} of 3</span>
          {step === 1 && <span>The Basics</span>}
          {step === 2 && <span>The Details</span>}
          {step === 3 && <span>The Vibe</span>}
        </div>

        {step === 1 && (
          <div>
            <h2 className={styles.stepTitle}>Who is this for?</h2>
            
            <div className={styles.formGroup}>
              <label>Your Name (Sender)</label>
              <input
                className={styles.input}
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                placeholder="E.g., Alex"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Their Name (Recipient)</label>
              <input
                className={styles.input}
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                placeholder="E.g., Jordan"
              />
            </div>

            <div className={styles.formGroup}>
              <label>What feeling or moment is this for?</label>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem', marginTop: '-0.25rem' }}>
                This shapes the tone of your message — not the card design.
              </p>
              {OCCASION_SUBTYPE_GROUPS.map((group) => (
                <div key={group.label} className={styles.occasionGroup}>
                  <div className={styles.occasionGroupLabel}>{group.label}</div>
                  <div className={styles.occasionGrid}>
                    {group.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`${styles.occasionTile} ${formData.occasionSubtype === o.value ? styles.occasionTileActive : ''}`}
                        onClick={() => setFormData({ ...formData, occasionSubtype: o.value })}
                      >
                        <span className={styles.occasionLabel}>{o.label}</span>
                        <span className={styles.occasionHint}>{o.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className={styles.stepTitle}>Let's get specific</h2>
            
            <div className={styles.formGroup}>
              <label>Share a favorite memory or two (Optional)</label>
              <textarea
                className={styles.textarea}
                value={formData.memories}
                onChange={(e) => setFormData({ ...formData, memories: e.target.value })}
                placeholder="E.g., Our trip to the coast when it rained all weekend..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>What do you love most about them?</label>
              <textarea
                className={styles.textarea}
                value={formData.qualities}
                onChange={(e) => setFormData({ ...formData, qualities: e.target.value })}
                placeholder="Their laugh, how they always support you, their kindness..."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className={styles.stepTitle}>Set the feeling</h2>

            <div className={styles.formGroup}>
              <label>What tone should the message have?</label>
              <div className={styles.radioGroup}>
                {TONES.map((t) => (
                  <label key={t.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="tone"
                      value={t.value}
                      checked={formData.tone === t.value}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    />
                    <div>
                      <div>{t.label}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{t.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '2rem' }}>
              <label>How long should the message be?</label>
              <div className={styles.radioGroup}>
                {LENGTH_OPTIONS.map((l) => (
                  <label key={l.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="length"
                      value={l.value}
                      checked={formData.desiredLength === l.value}
                      onChange={(e) => setFormData({ ...formData, desiredLength: e.target.value })}
                    />
                    <div>
                      <div>{l.label}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>{l.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '2rem' }}>
              <label>What feeling do you want to leave them with?</label>
              <input
                className={styles.input}
                value={formData.desiredFeeling}
                onChange={(e) => setFormData({ ...formData, desiredFeeling: e.target.value })}
                placeholder="E.g., Loved, appreciated, excited for the future..."
              />
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {step > 1 ? (
            <button className={styles.btnBack} onClick={handleBack} disabled={isGenerating}>Back</button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button className={styles.btnNext} onClick={handleNext} disabled={!formData.senderName || !formData.recipientName}>
              Continue
            </button>
          ) : (
            <button className={styles.btnNext} onClick={handleSubmit} disabled={isGenerating}>
              {isGenerating ? "Crafting Message..." : "Generate My Card"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
