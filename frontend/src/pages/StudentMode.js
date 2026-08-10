import { useState } from "react";

import "./student-mode.css";

function StudentMode({ onBack }) {
  const [activeSection, setActiveSection] = useState("rooms");

  const [showCreateRoom, setShowCreateRoom] =
    useState(false);

  const [showInviteStudents, setShowInviteStudents] =
    useState(false);

  const [showInviteLink, setShowInviteLink] =
    useState(false);

  const [selectedRoom, setSelectedRoom] =
    useState(null);

  const [roomName, setRoomName] =
    useState("");

  const [contactSearch, setContactSearch] =
    useState("");

  const [selectedStudents, setSelectedStudents] =
    useState([]);

  const [inviteLink, setInviteLink] =
    useState("");

  // ==========================================
  // DEMO STUDENT ROOMS
  // ==========================================

  const [rooms, setRooms] = useState([
    {
      id: 1,
      name: "Computer Engineering 2026",
      members: 24,
      subject: "Computer Engineering",
      activity: "12 new messages",
    },
    {
      id: 2,
      name: "Web Development Study",
      members: 8,
      subject: "Web Development",
      activity: "3 new assignments",
    },
  ]);

  // ==========================================
  // DEMO CONTACTS
  // Later this comes from MongoDB
  // ==========================================

  const contacts = [
    {
      id: 1,
      name: "John",
      username: "@john",
      avatar: "J",
    },
    {
      id: 2,
      name: "Mary",
      username: "@mary",
      avatar: "M",
    },
    {
      id: 3,
      name: "David",
      username: "@david",
      avatar: "D",
    },
    {
      id: 4,
      name: "Sarah",
      username: "@sarah",
      avatar: "S",
    },
    {
      id: 5,
      name: "Michael",
      username: "@michael",
      avatar: "M",
    },
    {
      id: 6,
      name: "Grace",
      username: "@grace",
      avatar: "G",
    },
  ];

  // ==========================================
  // STUDENT MODE SECTIONS
  // ==========================================

  const sections = [
    {
      id: "rooms",
      icon: "👥",
      label: "Rooms",
    },
    {
      id: "notes",
      icon: "📝",
      label: "Notes",
    },
    {
      id: "files",
      icon: "📁",
      label: "Files",
    },
    {
      id: "assignments",
      icon: "📚",
      label: "Assignments",
    },
    {
      id: "calendar",
      icon: "📅",
      label: "Calendar",
    },
  ];

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      return;
    }

    const newRoom = {
      id: Date.now(),
      name: roomName.trim(),
      members: 1,
      subject: "New Student Room",
      activity: "Room created",
    };

    setRooms((previousRooms) => [
      newRoom,
      ...previousRooms,
    ]);

    setRoomName("");
    setShowCreateRoom(false);
  };

  // ==========================================
  // OPEN ADD STUDENTS
  // ==========================================

  const openInviteStudents = (room) => {
    setSelectedRoom(room);

    setSelectedStudents([]);

    setContactSearch("");

    setShowInviteStudents(true);
  };

  // ==========================================
  // SELECT / UNSELECT STUDENT
  // ==========================================

  const toggleStudent = (student) => {
    setSelectedStudents((previousStudents) => {
      const alreadySelected =
        previousStudents.some(
          (item) => item.id === student.id
        );

      if (alreadySelected) {
        return previousStudents.filter(
          (item) => item.id !== student.id
        );
      }

      return [
        ...previousStudents,
        student,
      ];
    });
  };

  // ==========================================
  // INVITE SELECTED STUDENTS
  // ==========================================

  const inviteStudents = () => {
    if (
      !selectedRoom ||
      selectedStudents.length === 0
    ) {
      return;
    }

    setRooms((previousRooms) =>
      previousRooms.map((room) => {
        if (room.id !== selectedRoom.id) {
          return room;
        }

        return {
          ...room,
          members:
            room.members +
            selectedStudents.length,

          activity:
            `${selectedStudents.length} student${
              selectedStudents.length > 1
                ? "s"
                : ""
            } invited`,
        };
      })
    );

    setShowInviteStudents(false);

    setSelectedStudents([]);

    setSelectedRoom(null);
  };

  // ==========================================
  // FILTER CONTACTS
  // ==========================================

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name
        .toLowerCase()
        .includes(
          contactSearch.toLowerCase()
        ) ||
      contact.username
        .toLowerCase()
        .includes(
          contactSearch.toLowerCase()
        )
  );

  // ==========================================
  // GENERATE ROOM INVITE LINK
  // ==========================================

  const generateInviteLink = (room) => {
    const roomCode =
      `${room.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 8)
        .toUpperCase()}-${room.id}`;

    const link =
      `${window.location.origin}/join/${roomCode}`;

    setSelectedRoom(room);

    setInviteLink(link);

    setShowInviteLink(true);
  };

  // ==========================================
  // COPY INVITE LINK
  // ==========================================

  const copyInviteLink = async () => {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        inviteLink
      );

      alert("Invite link copied!");
    } catch (error) {
      console.error(
        "Could not copy invite link:",
        error
      );
    }
  };

  // ==========================================
  // SHARE INVITE LINK
  // ==========================================

  const shareInviteLink = async () => {
    if (
      !inviteLink ||
      !selectedRoom
    ) {
      return;
    }

    const shareData = {
      title:
        `Join ${selectedRoom.name}`,

      text:
        `Join my ZenvaZapp student room: ${selectedRoom.name}`,

      url: inviteLink,
    };

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share(
          shareData
        );
      } catch (error) {
        if (
          error.name !== "AbortError"
        ) {
          console.error(
            "Sharing failed:",
            error
          );
        }
      }

      return;
    }

    await copyInviteLink();
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="student-mode-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="student-header">

        <button
          className="student-back-button"
          onClick={onBack}
        >
          ←
        </button>

        <div className="student-header-icon">
          🎓
        </div>

        <div className="student-header-info">

          <h1>
            Student Mode
          </h1>

          <p>
            Learn, collaborate and study together
          </p>

        </div>

      </header>


      {/* =====================================
          HERO
      ===================================== */}

      <section className="student-hero">

        <div className="student-hero-icon">
          🎓
        </div>

        <div>

          <h2>
            Your study space
          </h2>

          <p>
            Create rooms, invite classmates
            and use Zenva AI as your personal tutor.
          </p>

        </div>

      </section>


      {/* =====================================
          AI QUICK TOOLS
      ===================================== */}

      <section className="student-ai-tools">

        <button
          className="student-ai-card"
          onClick={() =>
            setActiveSection("ai")
          }
        >

          <span className="student-ai-card-icon">
            🤖
          </span>

          <span>

            <strong>
              AI Tutor
            </strong>

            <small>
              Ask questions and understand lessons
            </small>

          </span>

          <b>
            →
          </b>

        </button>


        <button
          className="student-ai-card"
          onClick={() =>
            setActiveSection("quiz")
          }
        >

          <span className="student-ai-card-icon">
            🧠
          </span>

          <span>

            <strong>
              Quiz Generator
            </strong>

            <small>
              Turn documents into practice quizzes
            </small>

          </span>

          <b>
            →
          </b>

        </button>

      </section>


      {/* =====================================
          SECTION NAVIGATION
      ===================================== */}

      <nav className="student-section-navigation">

        {sections.map((section) => (

          <button
            key={section.id}
            className={
              activeSection === section.id
                ? "student-section-button active"
                : "student-section-button"
            }
            onClick={() =>
              setActiveSection(section.id)
            }
          >

            <span>
              {section.icon}
            </span>

            <small>
              {section.label}
            </small>

          </button>

        ))}

      </nav>


      {/* =====================================
          ROOMS
      ===================================== */}

      {activeSection === "rooms" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Student Rooms
              </h2>

              <p>
                Study together with your classmates.
              </p>

            </div>

            <button
              className="create-room-button"
              onClick={() =>
                setShowCreateRoom(true)
              }
            >
              + Room
            </button>

          </div>


          <section className="student-rooms">

            {rooms.map((room) => (

              <div
                key={room.id}
                className="student-room-card"
              >

                <div className="room-avatar">
                  {room.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="room-information">

                  <h3>
                    {room.name}
                  </h3>

                  <p>
                    {room.subject}
                  </p>

                  <small>
                    👥 {room.members} members
                    {" · "}
                    {room.activity}
                  </small>

                </div>


                {/* ROOM ACTIONS */}

                <div className="room-actions">

                  <button
                    className="room-invite-button"
                    onClick={() =>
                      openInviteStudents(room)
                    }
                  >
                    + Add
                  </button>


                  <button
                    className="room-link-button"
                    onClick={() =>
                      generateInviteLink(room)
                    }
                    title="Invite by link"
                  >
                    🔗
                  </button>

                </div>

              </div>

            ))}

          </section>

        </main>
      )}


      {/* =====================================
          NOTES
      ===================================== */}

      {activeSection === "notes" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Notes
              </h2>

              <p>
                Keep your study notes organized.
              </p>

            </div>

            <button
              className="create-room-button"
              onClick={() =>
                console.log("Create note")
              }
            >
              + Note
            </button>

          </div>


          <section className="student-empty-state">

            <div>
              📝
            </div>

            <h3>
              Your notes will appear here
            </h3>

            <p>
              Create notes for your courses,
              lessons and study sessions.
            </p>

          </section>

        </main>
      )}


      {/* =====================================
          FILES
      ===================================== */}

      {activeSection === "files" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Study Files
              </h2>

              <p>
                Share PDFs, documents, slides and
                other learning materials.
              </p>

            </div>

          </div>


          <section className="student-file-actions">

            <button>
              📄
              <span>
                Upload Document
              </span>
            </button>


            <button
              onClick={() =>
                setActiveSection("quiz")
              }
            >
              🧠
              <span>
                Generate Quiz
              </span>
            </button>

          </section>


          <section className="student-empty-state">

            <div>
              📁
            </div>

            <h3>
              No study files yet
            </h3>

            <p>
              Upload a document and Zenva can
              later help you summarize it or
              generate a quiz.
            </p>

          </section>

        </main>
      )}


      {/* =====================================
          ASSIGNMENTS
      ===================================== */}

      {activeSection === "assignments" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Assignments
              </h2>

              <p>
                Keep track of your academic work.
              </p>

            </div>

            <button
              className="create-room-button"
              onClick={() =>
                console.log(
                  "Create assignment"
                )
              }
            >
              + Assignment
            </button>

          </div>


          <section className="student-empty-state">

            <div>
              📚
            </div>

            <h3>
              No assignments yet
            </h3>

            <p>
              Assignments from your student
              rooms will appear here.
            </p>

          </section>

        </main>
      )}


      {/* =====================================
          CALENDAR
      ===================================== */}

      {activeSection === "calendar" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Study Calendar
              </h2>

              <p>
                Organize classes, exams and deadlines.
              </p>

            </div>

            <button
              className="create-room-button"
              onClick={() =>
                console.log("Create event")
              }
            >
              + Event
            </button>

          </div>


          <section className="student-empty-state">

            <div>
              📅
            </div>

            <h3>
              Your calendar is empty
            </h3>

            <p>
              Add classes, assignments, exams
              and study sessions.
            </p>

          </section>

        </main>
      )}


      {/* =====================================
          AI TUTOR
      ===================================== */}

      {activeSection === "ai" && (

        <main className="student-content">

          <section className="student-ai-panel">

            <div className="student-ai-panel-icon">
              🤖
            </div>

            <h2>
              Zenva AI Tutor
            </h2>

            <p>
              Ask questions about your lessons,
              get explanations, practice problems
              and study guidance.
            </p>

            <button>
              Start AI Tutor
            </button>

          </section>

        </main>
      )}


      {/* =====================================
          QUIZ GENERATOR
      ===================================== */}

      {activeSection === "quiz" && (

        <main className="student-content">

          <section className="student-ai-panel">

            <div className="student-ai-panel-icon">
              🧠
            </div>

            <h2>
              Quiz Generator
            </h2>

            <p>
              Upload a study document and Zenva
              AI will generate questions to test
              your understanding.
            </p>

            <div className="quiz-actions">

              <button>
                📄 Upload Document
              </button>

              <button>
                Generate Quiz
              </button>

            </div>

          </section>

        </main>
      )}


      {/* =====================================
          CREATE ROOM MODAL
      ===================================== */}

      {showCreateRoom && (

        <div className="student-modal-overlay">

          <div className="student-modal">

            <button
              className="student-modal-close"
              onClick={() =>
                setShowCreateRoom(false)
              }
            >
              ×
            </button>


            <div className="student-modal-icon">
              👥
            </div>


            <h2>
              Create Student Room
            </h2>


            <p>
              Create a room for your classmates,
              course or study group.
            </p>


            <input
              value={roomName}
              onChange={(event) =>
                setRoomName(
                  event.target.value
                )
              }
              placeholder="e.g. Computer Engineering 2026"
            />


            <button
              className="create-room-submit"
              onClick={handleCreateRoom}
            >
              Create Room
            </button>

          </div>

        </div>
      )}


      {/* =====================================
          ADD STUDENTS MODAL
      ===================================== */}

      {showInviteStudents && (

        <div className="student-modal-overlay">

          <div className="student-modal invite-students-modal">

            <button
              className="student-modal-close"
              onClick={() =>
                setShowInviteStudents(false)
              }
            >
              ×
            </button>


            <div className="student-modal-icon">
              👥
            </div>


            <h2>
              Add Students
            </h2>


            <p>
              Invite people from your ZenvaZapp
              chats and contacts to:
            </p>


            <strong className="selected-room-name">
              {selectedRoom?.name}
            </strong>


            {/* SEARCH */}

            <div className="student-contact-search">

              <span>
                🔍
              </span>

              <input
                value={contactSearch}
                onChange={(event) =>
                  setContactSearch(
                    event.target.value
                  )
                }
                placeholder="Search chats or contacts..."
              />

            </div>


            {/* CONTACT LIST */}

            <div className="student-contact-list">

              {filteredContacts.length === 0 ? (

                <div className="no-students-found">
                  No contacts found
                </div>

              ) : (

                filteredContacts.map(
                  (contact) => {

                    const isSelected =
                      selectedStudents.some(
                        (student) =>
                          student.id ===
                          contact.id
                      );

                    return (
                      <button
                        key={contact.id}
                        className={
                          isSelected
                            ? "student-contact selected"
                            : "student-contact"
                        }
                        onClick={() =>
                          toggleStudent(
                            contact
                          )
                        }
                      >

                        <div className="student-contact-avatar">
                          {contact.avatar}
                        </div>


                        <div className="student-contact-info">

                          <strong>
                            {contact.name}
                          </strong>

                          <small>
                            {contact.username}
                          </small>

                        </div>


                        <div
                          className={
                            isSelected
                              ? "student-check selected"
                              : "student-check"
                          }
                        >
                          {isSelected
                            ? "✓"
                            : ""}
                        </div>

                      </button>
                    );
                  }
                )
              )}

            </div>


            {/* SELECTED COUNT */}

            {selectedStudents.length > 0 && (

              <div className="selected-students-count">

                {selectedStudents.length}

                {" "}

                student
                {selectedStudents.length > 1
                  ? "s"
                  : ""}

                {" "}selected

              </div>

            )}


            {/* INVITE */}

            <button
              className="create-room-submit"
              disabled={
                selectedStudents.length === 0
              }
              onClick={inviteStudents}
            >
              Invite{" "}
              {selectedStudents.length > 0
                ? selectedStudents.length
                : ""}{" "}
              Student
              {selectedStudents.length === 1
                ? ""
                : "s"}
            </button>

          </div>

        </div>
      )}


      {/* =====================================
          INVITE BY LINK MODAL
      ===================================== */}

      {showInviteLink && (

        <div className="student-modal-overlay">

          <div className="student-modal invite-link-modal">

            <button
              className="student-modal-close"
              onClick={() =>
                setShowInviteLink(false)
              }
            >
              ×
            </button>


            <div className="student-modal-icon">
              🔗
            </div>


            <h2>
              Invite Classmates
            </h2>


            <p>
              Anyone with this invitation can
              use it to join:
            </p>


            <strong className="selected-room-name">
              {selectedRoom?.name}
            </strong>


            {/* INVITE PREVIEW */}

            <div className="invite-preview">

              <div className="invite-preview-icon">
                🎓
              </div>


              <div>

                <strong>
                  Join {selectedRoom?.name}
                </strong>

                <span>
                  ZenvaZapp Student Room
                </span>

              </div>

            </div>


            {/* INVITE LINK */}

            <div className="invite-link-box">

              <span>
                {inviteLink}
              </span>

            </div>


            {/* SHARE BUTTONS */}

            <div className="invite-link-actions">

              <button
                onClick={copyInviteLink}
                className="invite-copy-button"
              >
                📋 Copy Link
              </button>


              <button
                onClick={shareInviteLink}
                className="invite-share-button"
              >
                📤 Share Invite
              </button>

            </div>


            <p className="invite-link-note">
              Classmates who don't have ZenvaZapp
              will later be directed to download
              the app before joining the room.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}

export default StudentMode;