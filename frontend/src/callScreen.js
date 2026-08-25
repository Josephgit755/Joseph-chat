import React, {
  useEffect,
  useState,
} from "react";

import "./call-screen.css";

function formatDuration(totalSeconds = 0) {
  const seconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(remainingSeconds).padStart(2, "0"),
    ].join(":");
  }

  return [
    String(minutes).padStart(2, "0"),
    String(remainingSeconds).padStart(2, "0"),
  ].join(":");
}

function CallScreen({
  callState = "idle",
  callType = "audio",

  contactName = "ZenvaZapp User",
  contactAvatar = "",
  contactPhoto = "",

  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,

  callSeconds = 0,

  microphoneEnabled = true,
  cameraEnabled = true,
  speakerEnabled = true,

  onToggleMicrophone,
  onToggleCamera,
  onToggleSpeaker,
  onShareScreen,
  onEndCall,
}) {
  const [
    isSharingScreen,
    setIsSharingScreen,
  ] = useState(false);

  const [
    showMoreControls,
    setShowMoreControls,
  ] = useState(false);

  const isVideoCall =
    callType === "video";

  const isConnected =
    callState === "connected";

  const isCalling =
    callState === "calling";

  const isConnecting =
    callState === "connecting";

  const statusText =
    isCalling
      ? "Calling..."
      : isConnecting
      ? "Connecting..."
      : isConnected
      ? formatDuration(callSeconds)
      : "Call";

  const handleScreenShare =
    async () => {
      if (
        typeof onShareScreen !==
        "function"
      ) {
        return;
      }

      try {
        const result =
          await onShareScreen();

        if (
          typeof result ===
          "boolean"
        ) {
          setIsSharingScreen(result);
        } else {
          setIsSharingScreen(
            (previous) =>
              !previous
          );
        }
      } catch (error) {
        console.error(
          "Screen sharing error:",
          error
        );
      }
    };

  const handleMoreToggle =
    (event) => {
      event.stopPropagation();

      setShowMoreControls(
        (previous) =>
          !previous
      );
    };

  useEffect(() => {
    if (
      callState === "idle"
    ) {
      setShowMoreControls(
        false
      );

      setIsSharingScreen(
        false
      );
    }
  }, [callState]);

  if (callState === "idle") {
    return null;
  }

  return (
    <section
      className={`zenvazapp-call-screen ${
        isVideoCall
          ? "zenvazapp-call-video"
          : "zenvazapp-call-audio"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={
        isVideoCall
          ? "Video call"
          : "Voice call"
      }
    >

      {/* =====================================
          REMOTE AUDIO
          ===================================== */}

      {!isVideoCall && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={!speakerEnabled}
          className="zenvazapp-call-remote-audio"
          aria-hidden="true"
        />
      )}

      {/* =====================================
          VIDEO BACKGROUND
          ===================================== */}

      {isVideoCall && (
        <div className="zenvazapp-call-video-stage">

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="zenvazapp-call-remote-video"
          />

          {!cameraEnabled && (
            <div className="zenvazapp-call-video-disabled">

              <div className="zenvazapp-call-video-avatar">

                {contactPhoto ? (
                  <img
                    src={contactPhoto}
                    alt={contactName}
                  />
                ) : (
                  contactAvatar ||
                  contactName
                    .charAt(0)
                    .toUpperCase()
                )}

              </div>

              <span>
                Camera off
              </span>

            </div>
          )}

          <div className="zenvazapp-call-local-video-wrapper">

            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={
                cameraEnabled
                  ? "zenvazapp-call-local-video"
                  : "zenvazapp-call-local-video hidden"
              }
            />

            {!cameraEnabled && (
              <div className="zenvazapp-call-local-camera-off">
                <span>
                  You
                </span>
              </div>
            )}

          </div>

        </div>
      )}

      {/* =====================================
          AUDIO BACKGROUND
          ===================================== */}

      {!isVideoCall && (
        <div className="zenvazapp-call-audio-stage">

          <div className="zenvazapp-call-audio-glow" />

          <div className="zenvazapp-call-avatar-large">

            {contactPhoto ? (
              <img
                src={contactPhoto}
                alt={contactName}
              />
            ) : (
              contactAvatar ||
              contactName
                .charAt(0)
                .toUpperCase()
            )}

          </div>

        </div>
      )}

      {/* =====================================
          TOP INFORMATION
          ===================================== */}

      <header className="zenvazapp-call-top">

        <div className="zenvazapp-call-contact">

          <div className="zenvazapp-call-mini-avatar">

            {contactPhoto ? (
              <img
                src={contactPhoto}
                alt={contactName}
              />
            ) : (
              contactAvatar ||
              contactName
                .charAt(0)
                .toUpperCase()
            )}

          </div>

          <div>

            <h1>
              {contactName}
            </h1>

            <p>
              {statusText}
            </p>

          </div>

        </div>

        {isVideoCall && (
          <span className="zenvazapp-call-type">
            Video call
          </span>
        )}

      </header>

      {/* =====================================
          AUDIO INFORMATION
          ===================================== */}

      {!isVideoCall && (
        <div className="zenvazapp-call-audio-info">

          <h2>
            {contactName}
          </h2>

          <p>
            {statusText}
          </p>

          <span>
            Voice call
          </span>

        </div>
      )}

      {/* =====================================
          MORE MENU
          ===================================== */}

      {showMoreControls && (
        <div className="zenvazapp-call-more-menu">

          <button
            type="button"
            onClick={() => {
              setShowMoreControls(
                false
              );

              handleScreenShare();
            }}
          >
            🖥
            <span>
              {isSharingScreen
                ? "Stop sharing"
                : "Share screen"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMoreControls(
                false
              );

              onToggleSpeaker?.();
            }}
          >
            🔊
            <span>
              {speakerEnabled
                ? "Speaker on"
                : "Speaker off"}
            </span>
          </button>

        </div>
      )}

      {/* =====================================
          CALL CONTROLS
          ===================================== */}

      <div
        className="zenvazapp-call-controls"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* SPEAKER */}

        <button
          type="button"
          className={
            speakerEnabled
              ? "zenvazapp-call-control active"
              : "zenvazapp-call-control"
          }
          onClick={
            onToggleSpeaker
          }
          aria-label={
            speakerEnabled
              ? "Turn speaker off"
              : "Turn speaker on"
          }
          title={
            speakerEnabled
              ? "Speaker on"
              : "Speaker off"
          }
        >
          <span>
            🔊
          </span>

          <small>
            Speaker
          </small>
        </button>

        {/* VIDEO */}

        {isVideoCall && (
          <button
            type="button"
            className={
              cameraEnabled
                ? "zenvazapp-call-control active"
                : "zenvazapp-call-control disabled"
            }
            onClick={
              onToggleCamera
            }
            aria-label={
              cameraEnabled
                ? "Turn camera off"
                : "Turn camera on"
            }
            title={
              cameraEnabled
                ? "Turn camera off"
                : "Turn camera on"
            }
          >
            <span>
              {cameraEnabled
                ? "🎥"
                : "🚫"}
            </span>

            <small>
              Camera
            </small>
          </button>
        )}

        {/* MICROPHONE */}

        <button
          type="button"
          className={
            microphoneEnabled
              ? "zenvazapp-call-control active"
              : "zenvazapp-call-control disabled"
          }
          onClick={
            onToggleMicrophone
          }
          aria-label={
            microphoneEnabled
              ? "Mute microphone"
              : "Unmute microphone"
          }
          title={
            microphoneEnabled
              ? "Mute"
              : "Unmute"
          }
        >
          <span>
            {microphoneEnabled
              ? "🎤"
              : "🔇"}
          </span>

          <small>
            {microphoneEnabled
              ? "Mute"
              : "Unmute"}
          </small>
        </button>

        {/* MORE */}

        <button
          type="button"
          className={
            showMoreControls
              ? "zenvazapp-call-control active"
              : "zenvazapp-call-control"
          }
          onClick={
            handleMoreToggle
          }
          aria-label="More call options"
          title="More options"
        >
          <span>
            ⋯
          </span>

          <small>
            More
          </small>
        </button>

        {/* END CALL */}

        <button
          type="button"
          className="zenvazapp-call-end"
          onClick={
            onEndCall
          }
          aria-label="End call"
          title="End call"
        >
          <span>
            ☎
          </span>

          <small>
            End
          </small>
        </button>

      </div>

    </section>
  );
}

export default CallScreen;