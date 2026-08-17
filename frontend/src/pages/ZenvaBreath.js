import { useEffect, useState } from "react";

import "./zenva-breath.css";

const phases = [
  {
    name: "Breathe In",
    instruction: "Slowly breathe in",
    duration: 4,
  },
  {
    name: "Hold",
    instruction: "Hold your breath gently",
    duration: 4,
  },
  {
    name: "Release",
    instruction: "Slowly release your breath",
    duration: 4,
  },
];

function ZenvaBreath({ onBack }) {
  const [isRunning, setIsRunning] = useState(false);

  const [phaseIndex, setPhaseIndex] = useState(0);

  const [secondsLeft, setSecondsLeft] = useState(
    phases[0].duration
  );

  const [cycles, setCycles] = useState(0);

  const [showCongratulations, setShowCongratulations] =
    useState(false);

  const currentPhase = phases[phaseIndex];

  // ==========================================
  // BREATHING TIMER
  // ==========================================

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous > 1) {
          return previous - 1;
        }

        const nextPhase =
          (phaseIndex + 1) % phases.length;

        // ======================================
        // COMPLETED ONE FULL ROUND
        // ======================================

        if (nextPhase === 0) {
          setCycles((previousCycles) => {
            const newCycleCount =
              previousCycles + 1;

            // ==================================
            // CONGRATULATIONS AFTER 2 ROUNDS
            // ==================================

            if (newCycleCount >= 2) {
              setIsRunning(false);
              setShowCongratulations(true);
            }

            return newCycleCount;
          });
        }

        setPhaseIndex(nextPhase);

        return phases[nextPhase].duration;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phaseIndex]);

  // ==========================================
  // START / PAUSE
  // ==========================================

  const handleStartPause = () => {
    if (showCongratulations) {
      return;
    }

    setIsRunning((previous) => !previous);
  };

  // ==========================================
  // RESET
  // ==========================================

  const handleReset = () => {
    setIsRunning(false);

    setPhaseIndex(0);

    setSecondsLeft(
      phases[0].duration
    );

    setCycles(0);

    setShowCongratulations(false);
  };

  // ==========================================
  // CONTINUE BREATHING AFTER CONGRATULATIONS
  // ==========================================

  const handleContinue = () => {
    setShowCongratulations(false);

    setCycles(0);

    setPhaseIndex(0);

    setSecondsLeft(
      phases[0].duration
    );

    setIsRunning(true);
  };

  return (
    <div className="zenva-breath-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="zenva-breath-header">

        <button
          className="zenva-back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>

          <h1>
            Zenva Breath
          </h1>

          <p>
            Take a moment for yourself
          </p>

        </div>

      </header>


      {/* =====================================
          INTRO
      ===================================== */}

      <section className="zenva-breath-intro">

        <div className="zenva-breath-icon">
          🫁
        </div>

        <h2>
          Breathe. Reset. Continue.
        </h2>

        <p>
          If a conversation has been difficult,
          take a moment to slow down and regain
          your calm.
        </p>

      </section>


      {/* =====================================
          BREATHING AREA
      ===================================== */}

      <section className="breathing-area">

        <div
          className={`breathing-circle ${
            phaseIndex === 0
              ? "breathing-in"
              : phaseIndex === 1
                ? "breathing-hold"
                : "breathing-out"
          }`}
        >

          <div className="breathing-circle-inner">

            <span className="breathing-phase">
              {currentPhase.name}
            </span>

            <strong>
              {secondsLeft}
            </strong>

            <small>
              seconds
            </small>

          </div>

        </div>


        <h3>
          {currentPhase.instruction}
        </h3>

        <p className="breathing-cycle">
          4 seconds in · 4 seconds hold ·
          4 seconds release
        </p>

      </section>


      {/* =====================================
          CONTROLS
      ===================================== */}

      <section className="breath-controls">

        <button
          className="breath-primary-button"
          onClick={handleStartPause}
          disabled={showCongratulations}
        >
          {isRunning
            ? "Pause"
            : "Start Breathing"}
        </button>

        <button
          className="breath-reset-button"
          onClick={handleReset}
        >
          Reset
        </button>

      </section>


      {/* =====================================
          PROGRESS
      ===================================== */}

      <section className="breath-progress">

        <div className="breath-progress-header">

          <span>
            Breathing cycles
          </span>

          <strong>
            {cycles} / 2
          </strong>

        </div>

        <div className="breath-progress-bar">

          <div
            className="breath-progress-fill"
            style={{
              width: `${Math.min(
                cycles * 50,
                100
              )}%`,
            }}
          />

        </div>

      </section>


      {/* =====================================
          FOOTER MESSAGE
      ===================================== */}

      <section className="breath-message">

        <span>
          ✨
        </span>

        <p>
          There is no need to rush.
          Take a breath with ZenvaBreath,
          then continue the day when you're ready.
        </p>

      </section>


      {/* =====================================
          CONGRATULATIONS OVERLAY
      ===================================== */}

      {showCongratulations && (

        <div className="breath-congratulations-overlay">

          <div className="breath-congratulations-card">

            <div className="breath-confetti">
              ✨
            </div>

            <div className="breath-success-icon">
              🫁
            </div>

            <h2>
              Beautifully Done!
            </h2>

            <p className="breath-congratulations-main">
              You completed 2 full breathing rounds.
            </p>

            <p className="breath-congratulations-sub">
              You took a moment to slow down,
              breathe and reset. Give yourself
              credit for that.
            </p>

            <div className="breath-achievement">
              <span>
                ✓
              </span>

              <div>
                <strong>
                  Calm Moment Completed
                </strong>

                <small>
                  2 breathing rounds finished
                </small>
              </div>
            </div>

            <button
              className="breath-continue-button"
              onClick={handleContinue}
            >
              Continue Breathing
            </button>

            <button
              className="breath-finish-button"
              onClick={handleReset}
            >
              Finish Session
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default ZenvaBreath;