import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./student-mode.css";

function StudentMode({
  user,
  onBack,
}) {
  const [activeSection, setActiveSection] =
    useState("rooms");

  // ==========================================
  // API
  // ==========================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  // ==========================================
  // ROOM STATE
  // ==========================================

  const [rooms, setRooms] =
    useState([]);

  const [roomsLoading, setRoomsLoading] =
    useState(true);

  const [roomsError, setRoomsError] =
    useState("");

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const [showCreateRoom, setShowCreateRoom] =
    useState(false);

  const [roomName, setRoomName] =
    useState("");

  const [creatingRoom, setCreatingRoom] =
    useState(false);

  const [createRoomError, setCreateRoomError] =
    useState("");

  // ==========================================
  // INVITE STUDENTS
  // ==========================================

  const [showInviteStudents, setShowInviteStudents] =
    useState(false);

  const [selectedRoom, setSelectedRoom] =
    useState(null);

  const [contactSearch, setContactSearch] =
    useState("");

  const [selectedStudents, setSelectedStudents] =
    useState([]);

  const [contacts, setContacts] =
    useState([]);

  const [contactsLoading, setContactsLoading] =
    useState(false);

  const [contactsError, setContactsError] =
    useState("");

  const [invitingStudents, setInvitingStudents] =
    useState(false);

  // ==========================================
  // INVITE LINK
  // ==========================================

  const [showInviteLink, setShowInviteLink] =
    useState(false);

  const [inviteLink, setInviteLink] =
    useState("");

  const [inviteLoading, setInviteLoading] =
    useState(false);

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
  // GET CURRENT USER ID
  // ==========================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    "";

  // ==========================================
  // LOAD USER ROOMS
  // ==========================================

  const loadRooms = async () => {
    if (!currentUserId) {
      setRooms([]);
      setRoomsLoading(false);
      setRoomsError(
        "Your user ID is not available. Please log in again."
      );
      return;
    }

    setRoomsLoading(true);
    setRoomsError("");

    try {
      const response = await fetch(
        `${API_URL}/api/student-rooms/user/${currentUserId}`
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load student rooms. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load student rooms."
        );
      }

      setRooms(
        Array.isArray(data.rooms)
          ? data.rooms
          : []
      );
    } catch (error) {
      console.error(
        "Load student rooms error:",
        error
      );

      setRoomsError(
        error.message ||
          "Unable to load student rooms."
      );
    } finally {
      setRoomsLoading(false);
    }
  };

  // ==========================================
  // LOAD ROOMS WHEN STUDENT MODE OPENS
  // ==========================================

  useEffect(() => {
    loadRooms();
  }, [currentUserId]);

  // ==========================================
  // LOAD REGISTERED USERS
  // ==========================================

  const loadContacts = async () => {
    setContactsLoading(true);
    setContactsError("");

    try {
      const response = await fetch(
        `${API_URL}/api/users`
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load users. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load users."
        );
      }

      const users =
        Array.isArray(data.users)
          ? data.users
          : [];

      // --------------------------------------
      // REMOVE CURRENT USER
      // --------------------------------------

      const otherUsers =
        users.filter(
          (item) =>
            item.id?.toString() !==
            currentUserId?.toString()
        );

      setContacts(otherUsers);
    } catch (error) {
      console.error(
        "Load student contacts error:",
        error
      );

      setContactsError(
        error.message ||
          "Unable to load registered users."
      );
    } finally {
      setContactsLoading(false);
    }
  };

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const handleCreateRoom = async () => {
    if (!currentUserId) {
      setCreateRoomError(
        "Your user ID is not available. Please log in again."
      );
      return;
    }

    if (!roomName.trim()) {
      setCreateRoomError(
        "Please enter a room name."
      );
      return;
    }

    setCreatingRoom(true);
    setCreateRoomError("");

    try {
      const response = await fetch(
        `${API_URL}/api/student-rooms`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId: currentUserId,

            name: roomName.trim(),

            subject:
              "New Student Room",

            description: "",
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to create room. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to create student room."
        );
      }

      // --------------------------------------
      // ADD SERVER ROOM TO UI
      // --------------------------------------

      if (data.room) {
        setRooms((previousRooms) => [
          data.room,
          ...previousRooms.filter(
            (room) =>
              room.id !== data.room.id
          ),
        ]);
      } else {
        await loadRooms();
      }

      // --------------------------------------
      // RESET
      // --------------------------------------

      setRoomName("");
      setShowCreateRoom(false);
    } catch (error) {
      console.error(
        "Create student room error:",
        error
      );

      setCreateRoomError(
        error.message ||
          "Unable to create student room."
      );
    } finally {
      setCreatingRoom(false);
    }
  };

  // ==========================================
  // OPEN ADD STUDENTS
  // ==========================================

  const openInviteStudents = async (
    room
  ) => {
    setSelectedRoom(room);

    setSelectedStudents([]);

    setContactSearch("");

    setContactsError("");

    setShowInviteStudents(true);

    // --------------------------------------
    // LOAD REAL USERS
    // --------------------------------------

    if (
      contacts.length === 0
    ) {
      await loadContacts();
    }
  };

  // ==========================================
  // SELECT / UNSELECT STUDENT
  // ==========================================

  const toggleStudent = (
    student
  ) => {
    setSelectedStudents(
      (previousStudents) => {
        const alreadySelected =
          previousStudents.some(
            (item) =>
              item.id ===
              student.id
          );

        if (alreadySelected) {
          return previousStudents.filter(
            (item) =>
              item.id !==
              student.id
          );
        }

        return [
          ...previousStudents,
          student,
        ];
      }
    );
  };

  // ==========================================
  // INVITE SELECTED STUDENTS
  // ==========================================

  const inviteStudents = async () => {
    if (
      !selectedRoom ||
      selectedStudents.length === 0
    ) {
      return;
    }

    if (!currentUserId) {
      return;
    }

    setInvitingStudents(true);

    try {
      const memberIds =
        selectedStudents
          .map(
            (student) =>
              student.id
          )
          .filter(Boolean);

      const response = await fetch(
        `${API_URL}/api/student-rooms/${selectedRoom.id}/members`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId:
              currentUserId,

            memberIds,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to add students. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to add students."
        );
      }

      // --------------------------------------
      // UPDATE ROOM FROM SERVER
      // --------------------------------------

      if (data.room) {
        setRooms(
          (previousRooms) =>
            previousRooms.map(
              (room) =>
                room.id ===
                data.room.id
                  ? data.room
                  : room
            )
        );
      } else {
        await loadRooms();
      }

      // --------------------------------------
      // CLOSE
      // --------------------------------------

      setShowInviteStudents(false);

      setSelectedStudents([]);

      setSelectedRoom(null);
    } catch (error) {
      console.error(
        "Invite students error:",
        error
      );

      setContactsError(
        error.message ||
          "Unable to add students."
      );
    } finally {
      setInvitingStudents(false);
    }
  };

  // ==========================================
  // FILTER CONTACTS
  // ==========================================

  const filteredContacts =
    useMemo(() => {
      const search =
        contactSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return contacts;
      }

      return contacts.filter(
        (contact) =>
          contact.fullName
            ?.toLowerCase()
            .includes(search) ||
          contact.username
            ?.toLowerCase()
            .includes(search) ||
          contact.displayName
            ?.toLowerCase()
            .includes(search)
      );
    }, [
      contacts,
      contactSearch,
    ]);

  // ==========================================
  // GET REAL INVITE CODE
  // ==========================================

  const generateInviteLink = async (
    room
  ) => {
    if (!currentUserId) {
      return;
    }

    setSelectedRoom(room);

    setInviteLoading(true);

    setInviteLink("");

    setShowInviteLink(true);

    try {
      const response = await fetch(
        `${API_URL}/api/student-rooms/${room.id}/invite?userId=${encodeURIComponent(
          currentUserId
        )}`
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load invite. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load invite."
        );
      }

      const inviteCode =
        data.inviteCode;

      if (!inviteCode) {
        throw new Error(
          "The server did not return an invite code."
        );
      }

      // --------------------------------------
      // REAL JOIN URL
      // --------------------------------------

      const link =
        `${window.location.origin}/join/${inviteCode}`;

      setInviteLink(link);

      // --------------------------------------
      // UPDATE ROOM
      // --------------------------------------

      setRooms(
        (previousRooms) =>
          previousRooms.map(
            (item) =>
              item.id === room.id
                ? {
                    ...item,
                    inviteCode,
                    inviteEnabled:
                      data.inviteEnabled,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Generate invite link error:",
        error
      );

      setInviteLink("");

      alert(
        error.message ||
          "Unable to generate invite link."
      );
    } finally {
      setInviteLoading(false);
    }
  };

  // ==========================================
  // COPY INVITE LINK
  // ==========================================

  const copyInviteLink =
    async () => {
      if (!inviteLink) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          inviteLink
        );

        alert(
          "Invite link copied!"
        );
      } catch (error) {
        console.error(
          "Could not copy invite link:",
          error
        );

        alert(
          "Could not copy the invite link."
        );
      }
    };

  // ==========================================
  // SHARE INVITE LINK
  // ==========================================

  const shareInviteLink =
    async () => {
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

        url:
          inviteLink,
      };

      if (
        navigator.share &&
        typeof navigator.share ===
          "function"
      ) {
        try {
          await navigator.share(
            shareData
          );
        } catch (error) {
          if (
            error.name !==
            "AbortError"
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

        {sections.map(
          (section) => (

            <button
              key={section.id}
              className={
                activeSection ===
                section.id
                  ? "student-section-button active"
                  : "student-section-button"
              }
              onClick={() =>
                setActiveSection(
                  section.id
                )
              }
            >

              <span>
                {section.icon}
              </span>

              <small>
                {section.label}
              </small>

            </button>

          )
        )}

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
              onClick={() => {
                setCreateRoomError("");
                setRoomName("");
                setShowCreateRoom(true);
              }}
            >
              + Room
            </button>

          </div>


          {/* =================================
              LOADING
          ================================= */}

          {roomsLoading && (

            <section className="student-empty-state">

              <div>
                ⏳
              </div>

              <h3>
                Loading your rooms...
              </h3>

              <p>
                Connecting to your ZenvaZapp student rooms.
              </p>

            </section>

          )}


          {/* =================================
              ERROR
          ================================= */}

          {!roomsLoading &&
            roomsError && (

              <section className="student-empty-state">

                <div>
                  ⚠️
                </div>

                <h3>
                  Unable to load rooms
                </h3>

                <p>
                  {roomsError}
                </p>

                <button
                  className="create-room-submit"
                  onClick={loadRooms}
                >
                  Try Again
                </button>

              </section>

            )}


          {/* =================================
              REAL MONGODB ROOMS
          ================================= */}

          {!roomsLoading &&
            !roomsError &&
            rooms.length > 0 && (

              <section className="student-rooms">

                {rooms.map(
                  (room) => (

                    <div
                      key={room.id}
                      className="student-room-card"
                    >

                      <div className="room-avatar">
                        {room.name
                          ?.charAt(0)
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
                          👥{" "}
                          {room.members || 0}
                          {" members"}
                          {" · "}
                          {room.activity ||
                            "Room created"}
                        </small>

                      </div>


                      {/* ROOM ACTIONS */}

                      <div className="room-actions">

                        <button
                          className="room-invite-button"
                          onClick={() =>
                            openInviteStudents(
                              room
                            )
                          }
                        >
                          + Add
                        </button>


                        <button
                          className="room-link-button"
                          onClick={() =>
                            generateInviteLink(
                              room
                            )
                          }
                          title="Invite by link"
                        >
                          🔗
                        </button>

                      </div>

                    </div>

                  )
                )}

              </section>

            )}


          {/* =================================
              EMPTY
          ================================= */}

          {!roomsLoading &&
            !roomsError &&
            rooms.length === 0 && (

              <section className="student-empty-state">

                <div>
                  👥
                </div>

                <h3>
                  No student rooms yet
                </h3>

                <p>
                  Create your first student room
                  and invite your classmates.
                </p>

                <button
                  className="create-room-submit"
                  onClick={() => {
                    setCreateRoomError("");
                    setRoomName("");
                    setShowCreateRoom(true);
                  }}
                >
                  + Create Your First Room
                </button>

              </section>

            )}

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
                console.log(
                  "Create note"
                )
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
                console.log(
                  "Create event"
                )
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
              onChange={(event) => {
                setRoomName(
                  event.target.value
                );

                if (
                  createRoomError
                ) {
                  setCreateRoomError("");
                }
              }}
              placeholder="e.g. Computer Engineering 2026"
              disabled={creatingRoom}
            />


            {createRoomError && (

              <p
                style={{
                  color: "#ff6b9d",
                  marginTop: "10px",
                }}
              >
                {createRoomError}
              </p>

            )}


            <button
              className="create-room-submit"
              onClick={
                handleCreateRoom
              }
              disabled={
                creatingRoom ||
                !roomName.trim()
              }
            >
              {creatingRoom
                ? "Creating Room..."
                : "Create Room"}
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
              onClick={() => {
                if (
                  invitingStudents
                ) {
                  return;
                }

                setShowInviteStudents(
                  false
                );

                setSelectedStudents(
                  []
                );

                setSelectedRoom(
                  null
                );
              }}
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
              Invite registered ZenvaZapp
              users to:
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
                placeholder="Search students..."
              />

            </div>


            {/* CONTACT ERROR */}

            {contactsError && (

              <div
                className="no-students-found"
                style={{
                  color: "#ff6b9d",
                }}
              >
                {contactsError}
              </div>

            )}


            {/* CONTACT LIST */}

            <div className="student-contact-list">

              {contactsLoading ? (

                <div className="no-students-found">
                  Loading registered students...
                </div>

              ) : filteredContacts.length === 0 ? (

                <div className="no-students-found">
                  No registered students found
                </div>

              ) : (

                filteredContacts.map(
                  (contact) => {

                    const isAlreadyMember =
                      selectedRoom?.memberList?.some(
                        (member) =>
                          member.id?.toString() ===
                          contact.id?.toString()
                      );

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
                        disabled={
                          isAlreadyMember ||
                          invitingStudents
                        }
                        onClick={() =>
                          toggleStudent(
                            contact
                          )
                        }
                      >

                        <div className="student-contact-avatar">
                          {contact.profilePhoto ? (

                            <img
                              src={
                                contact.profilePhoto
                              }
                              alt=""
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                objectFit:
                                  "cover",
                                borderRadius:
                                  "50%",
                              }}
                            />

                          ) : (

                            (
                              contact.displayName ||
                              contact.fullName ||
                              contact.username ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()

                          )}
                        </div>


                        <div className="student-contact-info">

                          <strong>
                            {contact.displayName ||
                              contact.fullName ||
                              contact.username}
                          </strong>

                          <small>
                            {contact.username
                              ? `@${contact.username.replace(
                                  /^@/,
                                  ""
                                )}`
                              : ""}
                          </small>

                        </div>


                        <div
                          className={
                            isSelected
                              ? "student-check selected"
                              : "student-check"
                          }
                        >
                          {isAlreadyMember
                            ? "✓"
                            : isSelected
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

            {selectedStudents.length >
              0 && (

              <div className="selected-students-count">

                {selectedStudents.length}

                {" "}

                student
                {selectedStudents.length >
                1
                  ? "s"
                  : ""}

                {" "}selected

              </div>

            )}


            {/* INVITE */}

            <button
              className="create-room-submit"
              disabled={
                selectedStudents.length ===
                  0 ||
                invitingStudents
              }
              onClick={
                inviteStudents
              }
            >
              {invitingStudents
                ? "Adding Students..."
                : `Invite ${
                    selectedStudents.length >
                    0
                      ? selectedStudents.length
                      : ""
                  } Student${
                    selectedStudents.length ===
                    1
                      ? ""
                      : "s"
                  }`}
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

              {inviteLoading ? (

                <span>
                  Generating secure invite...
                </span>

              ) : inviteLink ? (

                <span>
                  {inviteLink}
                </span>

              ) : (

                <span>
                  Unable to generate invite.
                </span>

              )}

            </div>


            {/* SHARE BUTTONS */}

            <div className="invite-link-actions">

              <button
                onClick={
                  copyInviteLink
                }
                className="invite-copy-button"
                disabled={
                  !inviteLink ||
                  inviteLoading
                }
              >
                📋 Copy Link
              </button>


              <button
                onClick={
                  shareInviteLink
                }
                className="invite-share-button"
                disabled={
                  !inviteLink ||
                  inviteLoading
                }
              >
                📤 Share Invite
              </button>

            </div>


            <p className="invite-link-note">
              This invitation uses a real
              MongoDB-backed room invite code.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default StudentMode;