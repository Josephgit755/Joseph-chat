import "./calls.css";

function Calls({ user, onNavigate }) {
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

  return (
    <div className="calls-page">

      {/* HEADER */}
      <header className="calls-header">

        <div className="calls-title-area">
          <div className="calls-logo">
            Z
          </div>

          <div>
            <h1>Calls</h1>
            <span>
              Stay connected with everyone
            </span>
          </div>
        </div>

        <button
          className="new-call-button"
          onClick={() =>
            console.log("New call")
          }
        >
          + Call
        </button>

      </header>


      {/* QUICK ACTIONS */}
      <section className="call-actions">

        <button
          className="call-action-card"
          onClick={() =>
            console.log("Start voice call")
          }
        >
          <div className="call-action-icon">
            📞
          </div>

          <div>
            <h3>Voice Call</h3>
            <p>Start a voice call</p>
          </div>
        </button>


        <button
          className="call-action-card"
          onClick={() =>
            console.log("Start video call")
          }
        >
          <div className="call-action-icon">
            🎥
          </div>

          <div>
            <h3>Video Call</h3>
            <p>Start a video call</p>
          </div>
        </button>

      </section>


      {/* RECENT CALLS */}
      <section className="recent-calls">

        <div className="calls-section-title">
          <div>
            <h2>Recent Calls</h2>
            <span>
              Your latest conversations
            </span>
          </div>

          <button
            className="clear-calls"
            onClick={() =>
              console.log("Clear calls")
            }
          >
            Clear
          </button>
        </div>


        <div className="call-list">

          {calls.map((call) => (

            <button
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


      {/* EMPTY AREA / FUTURE FEATURES */}
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


      {/* BOTTOM NAVIGATION */}
      <nav className="calls-bottom-navigation">

        <button
          className="calls-nav-button"
          onClick={() =>
            onNavigate?.("chats")
          }
        >
          <span>💬</span>
          <small>Chats</small>
        </button>


        <button
          className="calls-nav-button active"
          onClick={() =>
            onNavigate?.("calls")
          }
        >
          <span>📞</span>
          <small>Calls</small>
        </button>


        <button
          className="calls-nav-button"
          onClick={() =>
            onNavigate?.("tools")
          }
        >
          <span>🛠️</span>
          <small>Tools</small>
        </button>


        <button
          className="calls-nav-button"
          onClick={() =>
            onNavigate?.("settings")
          }
        >
          <span>⚙️</span>
          <small>Settings</small>
        </button>

      </nav>

    </div>
  );
}

export default Calls;