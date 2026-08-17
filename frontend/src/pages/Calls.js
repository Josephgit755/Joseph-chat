import "./calls.css";

function Calls({
  user,
  onNavigate,
  callTarget,
  callType,
}) {
  const calls = [
    {
      id: 1,
      name: "John",
      type: "Incoming voice call",
      time: "Today, 10:42 AM",
      avatar: "J",
      missed: false,
      video: false,
    },
    {
      id: 2,
      name: "Mary",
      type: "Outgoing video call",
      time: "Yesterday, 8:15 PM",
      avatar: "M",
      missed: false,
      video: true,
    },
    {
      id: 3,
      name: "Chris",
      type: "Missed voice call",
      time: "Yesterday, 3:20 PM",
      avatar: "C",
      missed: true,
      video: false,
    },
  ];

  const targetName =
    callTarget?.name ||
    callTarget?.fullName ||
    "Contact";

  const targetAvatar =
    callTarget?.profilePhoto ||
    callTarget?.avatar ||
    targetName
      .charAt(0)
      .toUpperCase();

  const requestedCallType =
    callType === "video"
      ? "Video"
      : "Voice";

  return (
    <div className="calls-page">

      {/* HEADER */}

      <header className="calls-header">

        <div className="calls-title-area">

          <button
            type="button"
            className="calls-back-button"
            onClick={() =>
              onNavigate?.("chats")
            }
            aria-label="Back to chats"
          >
            ←
          </button>

          <div className="calls-logo">
            Z
          </div>

          <div>
            <h1>
              Calls
            </h1>

            <span>
              Call history and details
            </span>
          </div>

        </div>

      </header>


      {/* REQUESTED CALL */}

      {callTarget && (
        <section className="requested-call-card">

          <div className="requested-call-avatar">
            {callTarget?.profilePhoto ? (
              <img
                src={
                  callTarget.profilePhoto
                }
                alt={targetName}
              />
            ) : (
              targetAvatar
            )}
          </div>

          <div className="requested-call-info">

            <span>
              {requestedCallType} call
            </span>

            <h2>
              {targetName}
            </h2>

            <p>
              Call requested from Contacts
            </p>

          </div>

          <button
            type="button"
            className="requested-call-action"
            onClick={() =>
              console.log(
                `Starting ${callType || "voice"} call with`,
                callTarget
              )
            }
          >
            {callType === "video"
              ? "📹"
              : "📞"}
          </button>

        </section>
      )}


      {/* QUICK ACTIONS */}

      <section className="call-actions">

        <button
          type="button"
          className="call-action-card"
          onClick={() =>
            console.log(
              "Start voice call"
            )
          }
        >
          <div className="call-action-icon">
            📞
          </div>

          <div>
            <h3>
              Voice Call
            </h3>

            <p>
              Start a voice call
            </p>
          </div>
        </button>


        <button
          type="button"
          className="call-action-card"
          onClick={() =>
            console.log(
              "Start video call"
            )
          }
        >
          <div className="call-action-icon">
            🎥
          </div>

          <div>
            <h3>
              Video Call
            </h3>

            <p>
              Start a video call
            </p>
          </div>
        </button>

      </section>


      {/* RECENT CALLS */}

      <section className="recent-calls">

        <div className="calls-section-title">

          <div>
            <h2>
              Recent Calls
            </h2>

            <span>
              Your latest call activity
            </span>
          </div>

          <button
            type="button"
            className="clear-calls"
            onClick={() =>
              console.log(
                "Clear calls"
              )
            }
          >
            Clear
          </button>

        </div>


        <div className="call-list">

          {calls.map((call) => (

            <button
              type="button"
              className="call-item"
              key={call.id}
              onClick={() =>
                console.log(
                  "Call:",
                  call.name
                )
              }
            >

              <div className="call-avatar">
                {call.avatar}
              </div>


              <div className="call-information">

                <div className="call-name-row">

                  <h3>
                    {call.name}
                  </h3>

                  <span>
                    {call.time}
                  </span>

                </div>


                <div
                  className={
                    call.missed
                      ? "call-type missed"
                      : "call-type"
                  }
                >

                  <span>
                    {call.video
                      ? "🎥"
                      : "📞"}
                  </span>

                  {call.type}

                </div>

              </div>


              <div className="call-item-action">

                {call.video
                  ? "🎥"
                  : "📞"}

              </div>

            </button>

          ))}

        </div>

      </section>


      {/* SECURITY INFORMATION */}

      <section className="calls-info">

        <div className="calls-info-icon">
          🔐
        </div>

        <h3>
          Private and secure calls
        </h3>

        <p>
          Your future voice and video calls
          will be protected with secure
          communication technology.
        </p>

      </section>

    </div>
  );
}

export default Calls;