"use client";

import { useState, useRef } from "react";
import styles from "./page.module.css";

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputTouched, setInputTouched] = useState(false);
  const [checklistMode, setChecklistMode] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState({});
  const resultRef = useRef(null);

  const handleGenerate = async (targetDifficulty = null) => {
    setError("");
    setInputTouched(true);

    if (!input.trim()) {
      setError("Please paste a YouTube link or describe what you learned.");
      return;
    }

    setLoading(true);
    setChecklistMode(false);
    setCheckedSteps({});

    try {
      const payload = { input: input.trim() };
      if (targetDifficulty) {
        payload.difficulty = targetDifficulty;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyShift = (direction) => {
    if (!result) return;
    const currentIndex = DIFFICULTY_LEVELS.indexOf(result.difficulty);
    let targetIndex;

    if (direction === "easier") {
      targetIndex = Math.max(0, currentIndex - 1);
    } else {
      targetIndex = Math.min(DIFFICULTY_LEVELS.length - 1, currentIndex + 1);
    }

    handleGenerate(DIFFICULTY_LEVELS[targetIndex]);
  };

  const handleStartNow = () => {
    setChecklistMode(true);
    setCheckedSteps({});
  };

  const toggleStep = (index) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const totalSteps = result?.steps?.length || 0;
  const allDone = totalSteps > 0 && completedCount === totalSteps;

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return styles.badgeBeginner;
      case "intermediate":
        return styles.badgeIntermediate;
      case "advanced":
        return styles.badgeAdvanced;
      default:
        return styles.badgeBeginner;
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "🟢";
      case "intermediate":
        return "🟡";
      case "advanced":
        return "🔴";
      default:
        return "🟢";
    }
  };

  const isAtMinDifficulty = result && DIFFICULTY_LEVELS.indexOf(result.difficulty) === 0;
  const isAtMaxDifficulty = result && DIFFICULTY_LEVELS.indexOf(result.difficulty) === DIFFICULTY_LEVELS.length - 1;

  return (
    <main className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div>
          <h1 className={styles.title}>ActionBridge</h1>
        </div>
        <p className={styles.subtitle}>
          Turn what you learn into what you <em>do</em> — in under 60 minutes
        </p>
      </header>

      {/* ── Input ── */}
      <section className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <textarea
            id="learning-input"
            className={`${styles.textarea} ${inputTouched && !input.trim() ? styles.textareaError : ""}`}
            placeholder={"Paste a YouTube link, article, or describe what you learned...\n\ne.g. \"I just watched a video about React hooks\" or \"https://youtube.com/watch?v=...\""}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            maxLength={2000}
            disabled={loading}
          />
          <span className={styles.charCount}>{input.length} / 2000</span>
        </div>
      </section>

      {/* ── Generate Button ── */}
      <div className={styles.buttonGroup}>
        <button
          id="generate-btn"
          className={styles.generateBtn}
          onClick={() => handleGenerate()}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              <span className={styles.loadingText}>Finding your next action…</span>
            </>
          ) : (
            <>⚡ Get Your Next Action</>
          )}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && !result && (
        <section className={styles.outputSection}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonHeader} />
            <div className={styles.skeletonLine} style={{ width: "85%" }} />
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
            <div className={styles.skeletonDivider} />
            <div className={styles.skeletonLine} style={{ width: "40%" }} />
            <div className={styles.skeletonLine} style={{ width: "90%" }} />
            <div className={styles.skeletonLine} style={{ width: "75%" }} />
            <div className={styles.skeletonLine} style={{ width: "80%" }} />
            <div className={styles.skeletonDivider} />
            <div className={styles.skeletonLine} style={{ width: "55%" }} />
            <div className={styles.skeletonDivider} />
            <div className={styles.skeletonLine} style={{ width: "30%" }} />
          </div>
        </section>
      )}

      {/* ── Result ── */}
      {result && (
        <section className={styles.outputSection} ref={resultRef}>
          <div className={`${styles.resultCard} ${loading ? styles.resultCardLoading : ""}`}>
            {loading && (
              <div className={styles.resultOverlay}>
                <span className={styles.spinnerLarge} />
                <span>Regenerating…</span>
              </div>
            )}

            <div className={styles.resultHeader}>
              <span className={styles.resultHeaderDot} />
              Your Action is Ready
            </div>

            {/* ── Task Section ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🎯</span>
                <span className={styles.sectionLabel}>Your Task</span>
              </div>
              <p className={styles.taskText}>{result.task}</p>
            </div>

            {/* ── Steps Section (or Checklist) ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>{checklistMode ? "✏️" : "🚀"}</span>
                <span className={styles.sectionLabel}>
                  {checklistMode ? `Progress — ${completedCount}/${totalSteps} done` : "Start Here"}
                </span>
              </div>

              {checklistMode ? (
                <ul className={styles.checklistContainer}>
                  {result.steps.map((step, i) => (
                    <li
                      key={i}
                      className={`${styles.checklistItem} ${checkedSteps[i] ? styles.checklistItemDone : ""}`}
                      onClick={() => toggleStep(i)}
                    >
                      <span className={`${styles.checkbox} ${checkedSteps[i] ? styles.checkboxChecked : ""}`}>
                        {checkedSteps[i] ? "✓" : ""}
                      </span>
                      <span className={`${styles.checklistText} ${checkedSteps[i] ? styles.checklistTextDone : ""}`}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ol className={styles.stepsList}>
                  {result.steps.map((step, i) => (
                    <li key={i} className={styles.stepItem}>
                      <span className={styles.stepNumber}>{i + 1}</span>
                      <span className={styles.stepText}>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* ── Completion Message ── */}
            {allDone && (
              <div className={styles.completionBanner}>
                <span className={styles.completionIcon}>🎉</span>
                <span>You did it! All steps completed. Time to generate your next action!</span>
              </div>
            )}

            {/* ── Expected Outcome Section ── */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>✅</span>
                <span className={styles.sectionLabel}>What You'll Have</span>
              </div>
              <p className={styles.outcomeText}>{result.expected_outcome}</p>
            </div>

            {/* ── Difficulty Section ── */}
            <div className={styles.difficultyBlock}>
              <span className={styles.difficultyLabel}>Difficulty</span>
              <span className={`${styles.badge} ${getDifficultyClass(result.difficulty)}`}>
                {getDifficultyIcon(result.difficulty)} {result.difficulty}
              </span>
            </div>
          </div>

          {/* ── Start Now Button ── */}
          {!checklistMode && (
            <button
              id="start-now-btn"
              className={styles.startNowBtn}
              onClick={handleStartNow}
              disabled={loading}
            >
              🚀 Start Now
            </button>
          )}

          {/* ── Difficulty Adjustment Buttons ── */}
          <div className={styles.adjustGroup}>
            <button
              id="make-easier-btn"
              className={`${styles.adjustBtn} ${styles.adjustEasier}`}
              onClick={() => handleDifficultyShift("easier")}
              disabled={loading || isAtMinDifficulty}
              title={isAtMinDifficulty ? "Already at the easiest level" : "Generate an easier version"}
            >
              <span className={styles.adjustIcon}>↓</span>
              Make it easier
            </button>
            <button
              id="make-harder-btn"
              className={`${styles.adjustBtn} ${styles.adjustHarder}`}
              onClick={() => handleDifficultyShift("harder")}
              disabled={loading || isAtMaxDifficulty}
              title={isAtMaxDifficulty ? "Already at the hardest level" : "Generate a harder version"}
            >
              <span className={styles.adjustIcon}>↑</span>
              Make it harder
            </button>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        ActionBridge — Paste. Generate. Act.
      </footer>
    </main>
  );
}
