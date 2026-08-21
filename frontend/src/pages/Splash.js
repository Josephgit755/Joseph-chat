import React, { useEffect } from "react";
import "../styles/splash.css";

function Splash({ onFinished }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onFinished === "function") {
        onFinished();
      }
    }, 20000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <main className="splash-screen">
      <div className="splash-bg">
        <div className="splash-glow splash-glow-one"></div>
        <div className="splash-glow splash-glow-two"></div>
        <div className="splash-glow splash-glow-three"></div>

        <div className="splash-particle particle-one"></div>
        <div className="splash-particle particle-two"></div>
        <div className="splash-particle particle-three"></div>
        <div className="splash-particle particle-four"></div>
        <div className="splash-particle particle-five"></div>
      </div>

      <div className="splash-content">

        <div className="splash-logo-area">
          <div className="splash-logo-ring ring-one"></div>
          <div className="splash-logo-ring ring-two"></div>
          <div className="splash-logo-ring ring-three"></div>

          <div className="splash-logo">
            Zz
          </div>
        </div>

        <h1 className="splash-title">
          ZenvaZapp
        </h1>

        <p className="splash-tagline">
          Connect. Chat. Create. Sell.
        </p>

        <p className="splash-description">
          The smart communication platform built for people and businesses
        </p>

        <div className="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>
    </main>
  );
}

export default Splash;