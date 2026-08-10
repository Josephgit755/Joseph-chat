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

  const currentPhase = phases[phaseIndex];

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

        if (nextPhase === 0) {
          setCycles((previousCycles) => previousCycles + 1);
        }

        setPhaseIndex(nextPhase);

        return phases[nextPhase].duration;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phaseIndex]);

  const handleStartPause = () => {
    setIsRunning((previous) => !previous);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhaseIndex(0);
    setSecondsLeft(phases[0].duration);
    setCycles(0);
  };

  return (
    <div className="zenva-breath-page">

      {/* HEADER */}
      <header className="zenva-breath-header">

        <button
          className="zenva-back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div>
          <h1>Zenva Breath</h1>

          <p>
            Take a moment for yourself
          </p>
        </div>

      </header>


      {/* INTRO */}
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


      {/* BREATHING AREA */}
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


      {/* CONTROLS */}
      <section className="breath-controls">

        <button
          className="breath-primary-button"
          onClick={handleStartPause}
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


      {/* PROGRESS */}
      <section className="breath-progress">

        <div className="breath-progress-header">

          <span>
            Breathing cycles
          </span>

          <strong>
            {cycles}
          </strong>

        </div>

        <div className="breath-progress-bar">

          <div
            className="breath-progress-fill"
            style={{
              width: `${Math.min(
                cycles * 20,
                100
              )}%`,
            }}
          />

        </div>

      </section>


      {/* FOOTER MESSAGE */}
      <section className="breath-message">

        <span>✨</span>

        <p>
          There is no need to rush.
          Take a breath, then continue
          when you're ready.
        </p>

      </section>

    </div>
  );
}

export default ZenvaBreath;