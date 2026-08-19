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
    user?.user?._id ||
    user?.user?.id ||
    "";

  // ==========================================
  // NORMALIZE USER ID
  // ==========================================

  const getUserId = (item) => {
    if (!item) {
      return "";
    }

    return (
      item._id ||
      item.id ||
      item.userId ||
      item.user?._id ||
      item.user?.id ||
      ""
    );
  };

  // ==========================================
  // NORMALIZE ROOM
  // ==========================================
  //
  // IMPORTANT:
  //
  // Backend formatRoom() returns:
  //
  // members: NUMBER
  //
  // memberList: ARRAY
  //
  // Therefore we must not assume that
  // room.members is always an array.
  // ==========================================

  const normalizeRoom = (room) => {
    if (!room) {
      return null;
    }

    // ----------------------------------------
    // BACKEND MEMBER LIST
    // ----------------------------------------

    const backendMemberList =
      Array.isArray(room.memberList)
        ? room.memberList
        : [];

    // ----------------------------------------
    // SUPPORT ARRAY MEMBER RESPONSES TOO
    // ----------------------------------------

    const membersArray =
      Array.isArray(room.members)
        ? room.members
        : [];

    // ----------------------------------------
    // BUILD MEMBER LIST
    // ----------------------------------------

    const sourceMembers =
      backendMemberList.length > 0
        ? backendMemberList
        : membersArray;

    const memberList =
      sourceMembers
        .map((member) => {
          const memberUser =
            member?.user || member;

          const memberId =
            getUserId(memberUser);

          return {
            ...member,

            id: memberId,

            userId: memberId,
          };
        })
        .filter(
          (member) =>
            Boolean(member.id)
        );

    // ----------------------------------------
    // REAL SERVER MEMBER COUNT
    // ----------------------------------------

    let memberCount = 0;

    if (
      typeof room.members ===
      "number"
    ) {
      memberCount =
        room.members;
    } else if (
      Number.isFinite(
        Number(room.memberCount)
      )
    ) {
      memberCount =
        Number(room.memberCount);
    } else {
      memberCount =
        memberList.length;
    }

    return {
      ...room,

      id:
        room.id ||
        room._id ||
        "",

      name:
        room.name ||
        "Student Room",

      subject:
        room.subject ||
        "New Student Room",

      description:
        room.description ||
        "",

      activity:
        room.activity ||
        "Room created",

      // ======================================
      // IMPORTANT:
      // THIS IS ALWAYS THE SERVER COUNT
      // ======================================

      members:
        memberCount,

      memberCount:
        memberCount,

      memberList,

      inviteCode:
        room.inviteCode ||
        "",

      inviteEnabled:
        room.inviteEnabled !== false,

      isActive:
        room.isActive !== false,
    };
  };

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
      const response =
        await fetch(
          `${API_URL}/api/student-rooms/user/${encodeURIComponent(
            currentUserId
          )}`
        );

      let data = null;

      try {
        data =
          await response.json();
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

      const serverRooms =
        Array.isArray(data.rooms)
          ? data.rooms
          : [];

      const normalizedRooms =
        serverRooms
          .map(normalizeRoom)
          .filter(Boolean);

      console.log(
        "ZenvaZapp student rooms loaded:",
        normalizedRooms
      );

      setRooms(
        normalizedRooms
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
      const response =
        await fetch(
          `${API_URL}/api/users`
        );

      let data = null;

      try {
        data =
          await response.json();
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
            "Unable to load registered users."
        );
      }

      const registeredUsers =
        Array.isArray(
          data.users
        )
          ? data.users
          : [];

      const filteredUsers =
        registeredUsers.filter(
          (account) => {
            const accountId =
              getUserId(account);

            return (
              accountId &&
              String(accountId) !==
                String(
                  currentUserId
                )
            );
          }
        );

      setContacts(
        filteredUsers
      );
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

  const createRoom = async () => {
    const trimmedRoomName =
      roomName.trim();

    if (!trimmedRoomName) {
      setCreateRoomError(
        "Room name is required."
      );

      return;
    }

    if (!currentUserId) {
      setCreateRoomError(
        "Your user ID is not available. Please log in again."
      );

      return;
    }

    setCreatingRoom(true);

    setCreateRoomError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/student-rooms`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                currentUserId,

              name:
                trimmedRoomName,

              subject:
                "New Student Room",

              description:
                "",
            }),
          }
        );

      let data = null;

      try {
        data =
          await response.json();
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

      const createdRoom =
        normalizeRoom(
          data.room
        );

      if (createdRoom) {
        setRooms(
          (previousRooms) => {
            const withoutDuplicate =
              previousRooms.filter(
                (room) =>
                  String(
                    room.id
                  ) !==
                  String(
                    createdRoom.id
                  )
              );

            return [
              createdRoom,
              ...withoutDuplicate,
            ];
          }
        );
      }

      await loadRooms();

      setRoomName("");

      setCreateRoomError("");

      setShowCreateRoom(
        false
      );
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

  const openInviteStudents =
    async (room) => {
      const normalizedRoom =
        normalizeRoom(room);

      setSelectedRoom(
        normalizedRoom
      );

      setSelectedStudents([]);

      setContactSearch("");

      setContactsError("");

      setShowInviteStudents(
        true
      );

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
    const studentId =
      getUserId(student);

    if (!studentId) {
      return;
    }

    // ----------------------------------------
    // CURRENT USER
    // ----------------------------------------

    if (
      String(studentId) ===
      String(currentUserId)
    ) {
      return;
    }

    // ----------------------------------------
    // ALREADY MEMBER
    // ----------------------------------------

    const isAlreadyMember =
      selectedRoom?.memberList?.some(
        (member) =>
          String(
            member.id
          ) ===
          String(
            studentId
          )
      );

    if (isAlreadyMember) {
      return;
    }

    setSelectedStudents(
      (previousStudents) => {
        const alreadySelected =
          previousStudents.some(
            (item) =>
              String(
                getUserId(
                  item
                )
              ) ===
              String(
                studentId
              )
          );

        if (
          alreadySelected
        ) {
          return previousStudents.filter(
            (item) =>
              String(
                getUserId(
                  item
                )
              ) !==
              String(
                studentId
              )
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

  const inviteStudents =
    async () => {
      if (
        !selectedRoom
      ) {
        return;
      }

      if (
        selectedStudents.length ===
        0
      ) {
        setContactsError(
          "Select at least one student."
        );

        return;
      }

      if (!currentUserId) {
        setContactsError(
          "Your user ID is not available. Please log in again."
        );

        return;
      }

      const memberIds =
        selectedStudents
          .map(
            (student) =>
              getUserId(
                student
              )
          )
          .filter(Boolean);

      if (
        memberIds.length ===
        0
      ) {
        setContactsError(
          "No valid students were selected."
        );

        return;
      }

      setInvitingStudents(
        true
      );

      setContactsError("");

      try {
        console.log(
          "=========================================="
        );

        console.log(
          "INVITING STUDENTS TO ROOM"
        );

        console.log(
          "Room ID:",
          selectedRoom.id
        );

        console.log(
          "Owner ID:",
          currentUserId
        );

        console.log(
          "Member IDs:",
          memberIds
        );

        console.log(
          "=========================================="
        );

        const response =
          await fetch(
            `${API_URL}/api/student-rooms/${encodeURIComponent(
              selectedRoom.id
            )}/members`,
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
          data =
            await response.json();
        } catch (error) {
          data = null;
        }

        console.log(
          "Add students response:",
          data
        );

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
        // SERVER RETURNED ROOM
        // --------------------------------------

        const updatedRoom =
          normalizeRoom(
            data.room
          );

        if (
          updatedRoom
        ) {
          console.log(
            "Updated room from add-members response:",
            updatedRoom
          );

          setRooms(
            (previousRooms) =>
              previousRooms.map(
                (room) =>
                  String(
                    room.id
                  ) ===
                  String(
                    updatedRoom.id
                  )
                    ? updatedRoom
                    : room
              )
          );

          setSelectedRoom(
            updatedRoom
          );
        }

        // --------------------------------------
        // IMPORTANT:
        // GET THE ROOM LIST AGAIN FROM MONGODB
        // --------------------------------------

        await loadRooms();

        // --------------------------------------
        // CLOSE MODAL ONLY AFTER SUCCESS
        // --------------------------------------

        setShowInviteStudents(
          false
        );

        setSelectedStudents(
          []
        );

        setSelectedRoom(
          null
        );

        setContactSearch("");

        setContactsError("");
      } catch (error) {
        console.error(
          "Invite students error:",
          error
        );

        setContactsError(
          error.message ||
            "Unable to add students."
        );

        return;
      } finally {
        setInvitingStudents(
          false
        );
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
            .includes(
              search
            ) ||
          contact.username
            ?.toLowerCase()
            .includes(
              search
            ) ||
          contact.displayName
            ?.toLowerCase()
            .includes(
              search
            )
      );
    }, [
      contacts,
      contactSearch,
    ]);

  // ==========================================
  // CHECK ROOM MEMBER
  // ==========================================

  const isStudentRoomMember = (
    room,
    student
  ) => {
    const studentId =
      getUserId(student);

    if (!studentId) {
      return false;
    }

    return Boolean(
      room?.memberList?.some(
        (member) =>
          String(
            member.id
          ) ===
          String(
            studentId
          )
      )
    );
  };

  // ==========================================
  // CHECK SELECTED
  // ==========================================

  const isStudentSelected = (
    student
  ) => {
    const studentId =
      getUserId(student);

    if (!studentId) {
      return false;
    }

    return selectedStudents.some(
      (item) =>
        String(
          getUserId(item)
        ) ===
        String(
          studentId
        )
    );
  };

  // ==========================================
  // GENERATE REAL INVITE LINK
  // ==========================================

  const generateInviteLink =
    async (room) => {
      if (!currentUserId) {
        return;
      }

      const normalizedRoom =
        normalizeRoom(room);

      setSelectedRoom(
        normalizedRoom
      );

      setInviteLoading(
        true
      );

      setInviteLink("");

      setShowInviteLink(
        true
      );

      try {
        const response =
          await fetch(
            `${API_URL}/api/student-rooms/${encodeURIComponent(
              normalizedRoom.id
            )}/invite?userId=${encodeURIComponent(
              currentUserId
            )}`
          );

        let data = null;

        try {
          data =
            await response.json();
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

        setInviteLink(
          link
        );

        // --------------------------------------
        // UPDATE LOCAL ROOM
        // --------------------------------------

        setRooms(
          (previousRooms) =>
            previousRooms.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  normalizedRoom.id
                )
                  ? normalizeRoom({
                      ...item,

                      inviteCode,

                      inviteEnabled:
                        data.inviteEnabled !==
                        undefined
                          ? data.inviteEnabled
                          : item.inviteEnabled,
                    })
                  : item
            )
        );

        setSelectedRoom(
          normalizeRoom({
            ...normalizedRoom,

            inviteCode,

            inviteEnabled:
              data.inviteEnabled !==
              undefined
                ? data.inviteEnabled
                : normalizedRoom.inviteEnabled,
          })
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
        setInviteLoading(
          false
        );
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
  // CLOSE INVITE STUDENTS
  // ==========================================

  const closeInviteStudents =
    () => {
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

      setContactSearch("");

      setContactsError("");
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
          type="button"
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
          type="button"
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
              Ask questions and learn faster
            </small>

          </span>

          <b>
            →
          </b>

        </button>

        <button
          className="student-ai-card"
          type="button"
          onClick={() =>
            setActiveSection("assignments")
          }
        >

          <span className="student-ai-card-icon">
            📚
          </span>

          <span>

            <strong>
              Study Help
            </strong>

            <small>
              Work through assignments
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
              type="button"
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

        <button
          type="button"
          className={
            activeSection === "ai"
              ? "student-section-button active"
              : "student-section-button"
          }
          onClick={() =>
            setActiveSection("ai")
          }
        >

          <span>
            🤖
          </span>

          <small>
            AI
          </small>

        </button>

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
                Create rooms and collaborate with classmates.
              </p>

            </div>

            <button
              type="button"
              className="create-room-button"
              onClick={() => {
                setCreateRoomError("");
                setRoomName("");
                setShowCreateRoom(
                  true
                );
              }}
            >
              + Create
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
                Loading rooms...
              </h3>

              <p>
                Loading your rooms from ZenvaZapp.
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
                  type="button"
                  className="create-room-submit"
                  onClick={
                    loadRooms
                  }
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
                          {room.memberCount}
                          {" members"}
                          {" · "}
                          {room.activity ||
                            "Room created"}
                        </small>

                      </div>

                      <div className="room-actions">

                        <button
                          className="room-invite-button"
                          type="button"
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
                          type="button"
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
                  type="button"
                  className="create-room-submit"
                  onClick={() => {
                    setCreateRoomError("");
                    setRoomName("");
                    setShowCreateRoom(
                      true
                    );
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
              type="button"
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
                Smart Files
              </h2>

              <p>
                Keep your study documents organized.
              </p>

            </div>

          </div>

          <div className="student-file-actions">

            <button
              type="button"
              onClick={() =>
                console.log(
                  "Upload study file"
                )
              }
            >
              📤 Upload File
            </button>

            <button
              type="button"
              onClick={() =>
                console.log(
                  "Open file library"
                )
              }
            >
              📁 File Library
            </button>

          </div>

          <section className="student-empty-state">

            <div>
              📁
            </div>

            <h3>
              No study files yet
            </h3>

            <p>
              Upload notes, PDFs and other study
              materials here.
            </p>

          </section>

        </main>

      )}

      {/* =====================================
          ASSIGNMENTS
      ===================================== */}

      {activeSection ===
        "assignments" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Assignments
              </h2>

              <p>
                Manage your assignments and study tasks.
              </p>

            </div>

          </div>

          <section className="student-empty-state">

            <div>
              📚
            </div>

            <h3>
              No assignments yet
            </h3>

            <p>
              Your assignments and study tasks
              will appear here.
            </p>

          </section>

        </main>

      )}

      {/* =====================================
          CALENDAR
      ===================================== */}

      {activeSection ===
        "calendar" && (

        <main className="student-content">

          <div className="student-section-header">

            <div>

              <h2>
                Study Calendar
              </h2>

              <p>
                Organize your classes and study schedule.
              </p>

            </div>

          </div>

          <section className="student-empty-state">

            <div>
              📅
            </div>

            <h3>
              Your study calendar
            </h3>

            <p>
              Classes, deadlines and study sessions
              will appear here.
            </p>

          </section>

        </main>

      )}

      {/* =====================================
          AI
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
              Ask questions, explain difficult
              concepts and get help with your studies.
            </p>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Zenva AI Tutor will be connected to the AI system."
                )
              }
            >
              Start AI Tutor
            </button>

          </section>

        </main>

      )}

      {/* =====================================
          CREATE ROOM MODAL
      ===================================== */}

      {showCreateRoom && (

        <div
          className="student-modal-overlay"
          onClick={() => {
            if (!creatingRoom) {
              setShowCreateRoom(
                false
              );
            }
          }}
        >

          <div
            className="student-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="student-modal-close"
              onClick={() => {
                if (
                  !creatingRoom
                ) {
                  setShowCreateRoom(
                    false
                  );
                }
              }}
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
              Create a private study room for your classmates.
            </p>

            <input
              type="text"
              value={roomName}
              onChange={(event) =>
                setRoomName(
                  event.target.value
                )
              }
              placeholder="Room name"
              disabled={
                creatingRoom
              }
              autoFocus
            />

            {createRoomError && (

              <p
                style={{
                  color: "#ff8fbf",
                  marginBottom:
                    "10px",
                }}
              >
                {createRoomError}
              </p>

            )}

            <button
              type="button"
              className="create-room-submit"
              onClick={
                createRoom
              }
              disabled={
                creatingRoom
              }
            >
              {creatingRoom
                ? "Creating..."
                : "Create Room"}
            </button>

          </div>

        </div>

      )}

      {/* =====================================
          INVITE STUDENTS MODAL
      ===================================== */}

      {showInviteStudents &&
        selectedRoom && (

        <div
          className="student-modal-overlay"
          onClick={
            closeInviteStudents
          }
        >

          <div
            className="student-modal invite-students-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="student-modal-close"
              onClick={
                closeInviteStudents
              }
              disabled={
                invitingStudents
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
              Add students to{" "}
              <strong>
                {selectedRoom.name}
              </strong>
            </p>

            <span className="selected-room-name">
              Current members:{" "}
              {selectedRoom.memberCount}
            </span>

            <div className="student-contact-search">

              <span>
                🔍
              </span>

              <input
                type="text"
                value={contactSearch}
                onChange={(event) =>
                  setContactSearch(
                    event.target.value
                  )
                }
                placeholder="Search registered users..."
                disabled={
                  invitingStudents
                }
              />

            </div>

            {contactsLoading && (

              <p>
                Loading registered users...
              </p>

            )}

            {contactsError && (

              <p
                style={{
                  color: "#ff8fbf",
                  marginBottom:
                    "10px",
                }}
              >
                {contactsError}
              </p>

            )}

            {!contactsLoading && (
              <div className="student-contact-list">

                {filteredContacts.length ===
                  0 ? (

                  <div className="student-empty-state">

                    <div>
                      👤
                    </div>

                    <h3>
                      No students found
                    </h3>

                    <p>
                      There are no available registered users to add.
                    </p>

                  </div>

                ) : (

                  filteredContacts.map(
                    (contact) => {

                      const contactId =
                        getUserId(
                          contact
                        );

                      const alreadyMember =
                        isStudentRoomMember(
                          selectedRoom,
                          contact
                        );

                      const selected =
                        isStudentSelected(
                          contact
                        );

                      return (
                        <button
                          key={
                            contactId
                          }
                          type="button"
                          className={
                            selected
                              ? "student-contact selected"
                              : "student-contact"
                          }
                          onClick={() =>
                            toggleStudent(
                              contact
                            )
                          }
                          disabled={
                            alreadyMember ||
                            invitingStudents
                          }
                        >

                          <div className="student-contact-avatar">

                            {contact.profilePhoto ? (

                              <img
                                src={
                                  contact.profilePhoto
                                }
                                alt={
                                  contact.displayName ||
                                  contact.fullName ||
                                  contact.username ||
                                  "Student"
                                }
                                style={{
                                  width:
                                    "100%",
                                  height:
                                    "100%",
                                  borderRadius:
                                    "50%",
                                  objectFit:
                                    "cover",
                                }}
                              />

                            ) : (

                              (
                                contact.displayName ||
                                contact.fullName ||
                                contact.username ||
                                "S"
                              )
                                .charAt(0)
                                .toUpperCase()

                            )}

                          </div>

                          <div className="student-contact-info">

                            <strong>
                              {contact.displayName ||
                                contact.fullName ||
                                contact.username ||
                                "Student"}
                            </strong>

                            <small>
                              {contact.username
                                ? `@${String(
                                    contact.username
                                  ).replace(
                                    /^@/,
                                    ""
                                  )}`
                                : "Registered ZenvaZapp user"}
                            </small>

                          </div>

                          <div
                            className={
                              selected
                                ? "student-check selected"
                                : "student-check"
                            }
                          >
                            {alreadyMember
                              ? "✓"
                              : selected
                              ? "✓"
                              : ""}
                          </div>

                        </button>
                      );
                    }
                  )

                )}

              </div>
            )}

            <p className="selected-students-count">
              {selectedStudents.length}{" "}
              {selectedStudents.length ===
              1
                ? "student"
                : "students"}{" "}
              selected
            </p>

            <button
              type="button"
              className="create-room-submit"
              onClick={
                inviteStudents
              }
              disabled={
                selectedStudents.length ===
                  0 ||
                invitingStudents
              }
            >
              {invitingStudents
                ? "Inviting..."
                : `Invite ${selectedStudents.length} ${
                    selectedStudents.length ===
                    1
                      ? "Student"
                      : "Students"
                  }`}
            </button>

          </div>

        </div>

      )}

      {/* =====================================
          INVITE LINK MODAL
      ===================================== */}

      {showInviteLink &&
        selectedRoom && (

        <div
          className="student-modal-overlay"
          onClick={() =>
            setShowInviteLink(
              false
            )
          }
        >

          <div
            className="student-modal invite-link-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="student-modal-close"
              onClick={() =>
                setShowInviteLink(
                  false
                )
              }
            >
              ×
            </button>

            <div className="student-modal-icon">
              🔗
            </div>

            <h2>
              Room Invite Link
            </h2>

            <p>
              Share this real ZenvaZapp
              invitation with your classmates.
            </p>

            <div className="invite-preview">

              <div className="invite-preview-icon">
                👥
              </div>

              <div>

                <strong>
                  {selectedRoom.name}
                </strong>

                <span>
                  {selectedRoom.memberCount} members
                </span>

              </div>

            </div>

            {inviteLoading ? (

              <p>
                Loading real invite URL...
              </p>

            ) : inviteLink ? (

              <div className="invite-link-box">

                <span>
                  {inviteLink}
                </span>

              </div>

            ) : (

              <p>
                Invite link unavailable.
              </p>

            )}

            <div className="invite-link-actions">

              <button
                type="button"
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
                type="button"
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
