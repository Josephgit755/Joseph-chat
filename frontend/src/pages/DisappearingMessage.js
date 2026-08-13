import React from "react";

const disappearingOptions = [
  {
    label: "Off",
    value: null,
    description: "Messages will remain normally",
  },
  {
    label: "5 minutes",
    value: 5 * 60 * 1000,
    description: "New messages disappear after 5 minutes",
  },
  {
    label: "1 hour",
    value: 60 * 60 * 1000,
    description: "New messages disappear after 1 hour",
  },
  {
    label: "24 hours",
    value: 24 * 60 * 60 * 1000,
    description: "New messages disappear after 24 hours",
  },
  {
    label: "7 days",
    value: 7 * 24 * 60 * 60 * 1000,
    description: "New messages disappear after 7 days",
  },
];

function DissappearingMessage({
  value = null,
  onChange,
  onClose,
}) {
  const selectedOption =
    disappearingOptions.find(
      (option) => option.value === value
    ) || disappearingOptions[0];

  const handleSelect = (duration) => {
    if (onChange) {
      onChange(duration);
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="disappearing-message-panel"
      onClick={(event) => event.stopPropagation()}
    >
      {/* HEADER */}
      <div className="disappearing-message-header">
        <div>
          <h3>Disappearing messages</h3>

          <p>
            Choose when new messages should disappear.
          </p>
        </div>

        <button
          type="button"
          className="disappearing-message-close"
          onClick={onClose}
          aria-label="Close disappearing messages"
        >
          ×
        </button>
      </div>

      {/* OPTIONS */}
      <div className="disappearing-message-options">
        {disappearingOptions.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.label}
              type="button"
              className={`disappearing-message-option ${
                active ? "active" : ""
              }`}
              onClick={() =>
                handleSelect(option.value)
              }
            >
              <span className="disappearing-message-option-icon">
                {option.value === null ? "○" : "⏱"}
              </span>

              <span className="disappearing-message-option-text">
                <strong>{option.label}</strong>

                <small>
                  {option.description}
                </small>
              </span>

              <span className="disappearing-message-check">
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* CURRENT SETTING */}
      <div className="disappearing-message-current">
        <span>Current setting</span>

        <strong>
          {selectedOption.label}
        </strong>
      </div>
    </div>
  );
}

export default DissappearingMessage;