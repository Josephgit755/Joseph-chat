import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "./student-mode.css";

function StudentMode({
  user,
  onBack,
}) {
  // ==========================================
  // ACTIVE SECTION
  // ==========================================

  const [activeSection, setActiveSection] =
    useState("rooms");

  // ==========================================
  // API
  // ==========================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  // ==========================================
  // CURRENT USER ID
  // ==========================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.user?._id ||
    user?.user?.id ||
    "";

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
  // ADD STUDENT / PHONE INVITATION
  // ==========================================

  const [showInviteStudents, setShowInviteStudents] =
    useState(false);

  const [selectedRoom, setSelectedRoom] =
    useState(null);

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [contactsError, setContactsError] =
    useState("");

  const [invitingStudents, setInvitingStudents] =
    useState(false);

  const [inviteTargetPhone, setInviteTargetPhone] =
    useState("");

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
  // NOTES STATE
  // ==========================================

  const [notes, setNotes] =
    useState([]);

  const [notesLoading, setNotesLoading] =
    useState(false);

  const [notesError, setNotesError] =
    useState("");

  // ==========================================
  // NOTE EDITOR
  // ==========================================

  const [showNoteEditor, setShowNoteEditor] =
    useState(false);

  const [editingNote, setEditingNote] =
    useState(null);

  const [noteTitle, setNoteTitle] =
    useState("");

  const [noteContent, setNoteContent] =
    useState("");

  const [noteSubject, setNoteSubject] =
    useState("");

  const [noteColor, setNoteColor] =
    useState("purple");

  const [notePinned, setNotePinned] =
    useState(false);

  const [savingNote, setSavingNote] =
    useState(false);

  const [noteEditorError, setNoteEditorError] =
    useState("");

  // ==========================================
  // QUIZ STATE
  // ==========================================

  const [quizFile, setQuizFile] =
    useState(null);

  const [quizLoading, setQuizLoading] =
    useState(false);

  const [quizError, setQuizError] =
    useState("");

  const [quizResult, setQuizResult] =
    useState(null);

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
  // GET USER ID
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

  const normalizeRoom = useCallback((room) => {
    if (!room) {
      return null;
    }

    const membersArray =
      Array.isArray(room.members)
        ? room.members
        : [];

    const memberList =
      membersArray
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

    const memberCount =
      typeof room.members === "number"
        ? room.members
        : typeof room.memberCount === "number"
        ? room.memberCount
        : memberList.length;

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

      createdAt:
        room.createdAt,

      updatedAt:
        room.updatedAt,
    };
  }, []);

  // ==========================================
  // LOAD USER ROOMS
  // ==========================================

  const loadRooms = useCallback(async () => {
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
  }, [API_URL, currentUserId, normalizeRoom]);

  // ==========================================
  // LOAD USER NOTES
  // ==========================================

  const loadNotes = useCallback(async () => {
    if (!currentUserId) {
      setNotes([]);

      setNotesLoading(false);

      setNotesError(
        "Your user ID is not available. Please log in again."
      );

      return;
    }

    setNotesLoading(true);

    setNotesError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/student-notes/user/${encodeURIComponent(
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
            `Unable to load notes. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load notes."
        );
      }

      const serverNotes =
        Array.isArray(data.notes)
          ? data.notes
          : [];

      setNotes(serverNotes);
    } catch (error) {
      console.error(
        "Load student notes error:",
        error
      );

      setNotesError(
        error.message ||
          "Unable to load notes."
      );
    } finally {
      setNotesLoading(false);
    }
  }, [API_URL, currentUserId]);

  // ==========================================
  // LOAD ROOMS WHEN STUDENT MODE OPENS
  // ==========================================

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // ==========================================
  // LOAD NOTES WHEN STUDENT MODE OPENS
  // ==========================================

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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

  const openInviteStudents = (
    room
  ) => {
    const normalizedRoom =
      normalizeRoom(room);

    setSelectedRoom(
      normalizedRoom
    );

    setPhoneNumber("");

    setInviteTargetPhone("");

    setContactsError("");

    setShowInviteStudents(
      true
    );
  };

  // ==========================================
  // PHONE KEYPAD
  // ==========================================

  const handlePhoneKey = (
    value
  ) => {
    if (invitingStudents) {
      return;
    }

    if (
      value === "backspace"
    ) {
      setPhoneNumber(
        (previous) =>
          previous.slice(0, -1)
      );

      return;
    }

    if (
      value === "clear"
    ) {
      setPhoneNumber("");

      setContactsError("");

      return;
    }

    if (
      value === "+"
    ) {
      if (
        phoneNumber.length === 0
      ) {
        setPhoneNumber("+");
      }

      return;
    }

    const isNumber =
      /^[0-9]$/.test(
        value
      );

    if (!isNumber) {
      return;
    }

    if (
      phoneNumber.replace(
        /\D/g,
        ""
      ).length >= 15
    ) {
      return;
    }

    setPhoneNumber(
      (previous) =>
        `${previous}${value}`
    );

    setContactsError("");
  };

  // ==========================================
  // PHONE FORMAT
  // ==========================================

  const getCleanPhoneNumber =
    () => {
      return phoneNumber
        .trim()
        .replace(
          /\s+/g,
          ""
        );
    };

  // ==========================================
  // ADD STUDENT BY PHONE
  // ==========================================

  const inviteStudentByPhone =
    async () => {
      if (!selectedRoom) {
        return;
      }

      if (!currentUserId) {
        setContactsError(
          "Your user ID is not available. Please log in again."
        );

        return;
      }

      const cleanedPhone =
        getCleanPhoneNumber();

      if (!cleanedPhone) {
        setContactsError(
          "Please enter a phone number."
        );

        return;
      }

      const digits =
        cleanedPhone.replace(
          /\D/g,
          ""
        );

      if (
        digits.length < 7
      ) {
        setContactsError(
          "Please enter a valid phone number."
        );

        return;
      }

      setInvitingStudents(
        true
      );

      setContactsError("");

      try {
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

                phone:
                  cleanedPhone,
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
              `Unable to process phone number. Server returned ${response.status}.`
          );
        }

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Unable to process this phone number."
          );
        }

        if (
          data.contactMatched &&
          data.room
        ) {
          const updatedRoom =
            normalizeRoom(
              data.room
            );

          if (updatedRoom) {
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

          await loadRooms();

          setShowInviteStudents(
            false
          );

          setPhoneNumber("");

          setInviteTargetPhone("");

          setSelectedRoom(null);

          setContactsError("");

          return;
        }

        if (
          data.inviteRequired
        ) {
          setInviteTargetPhone(
            cleanedPhone
          );

          setShowInviteStudents(
            false
          );

          setPhoneNumber("");

          await generateInviteLink(
            selectedRoom
          );

          return;
        }

        throw new Error(
          "The server could not determine how to process this phone number."
        );
      } catch (error) {
        console.error(
          "Add student by phone error:",
          error
        );

        setContactsError(
          error.message ||
            "Unable to process this phone number."
        );
      } finally {
        setInvitingStudents(
          false
        );
      }
    };

  // ==========================================
  // GENERATE REAL INVITE LINK
  // ==========================================

  const generateInviteLink =
    async (
      room
    ) => {
      if (!currentUserId) {
        return;
      }

      const normalizedRoom =
        normalizeRoom(room);

      if (!normalizedRoom) {
        return;
      }

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

        const link =
          `${window.location.origin}/join/${inviteCode}`;

        setInviteLink(
          link
        );

        const updatedRoom =
          normalizeRoom({
            ...normalizedRoom,

            inviteCode,

            inviteEnabled:
              data.inviteEnabled !==
              undefined
                ? data.inviteEnabled
                : normalizedRoom.inviteEnabled,
          });

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
                  ? updatedRoom
                  : item
            )
        );

        setSelectedRoom(
          updatedRoom
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
  // CLOSE ADD STUDENTS
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

      setPhoneNumber("");

      setInviteTargetPhone("");

      setSelectedRoom(
        null
      );

      setContactsError("");
    };

  // ==========================================
  // OPEN NEW NOTE
  // ==========================================

  const openNewNote = () => {
    setEditingNote(null);

    setNoteTitle("");

    setNoteContent("");

    setNoteSubject("");

    setNoteColor("purple");

    setNotePinned(false);

    setNoteEditorError("");

    setShowNoteEditor(true);
  };

  // ==========================================
  // OPEN EDIT NOTE
  // ==========================================

  const openEditNote = (
    note
  ) => {
    if (!note) {
      return;
    }

    setEditingNote(note);

    setNoteTitle(
      note.title || ""
    );

    setNoteContent(
      note.content || ""
    );

    setNoteSubject(
      note.subject || ""
    );

    setNoteColor(
      note.color || "purple"
    );

    setNotePinned(
      Boolean(note.pinned)
    );

    setNoteEditorError("");

    setShowNoteEditor(true);
  };

  // ==========================================
  // CLOSE NOTE EDITOR
  // ==========================================

  const closeNoteEditor = () => {
    if (savingNote) {
      return;
    }

    setShowNoteEditor(false);

    setEditingNote(null);

    setNoteTitle("");

    setNoteContent("");

    setNoteSubject("");

    setNoteColor("purple");

    setNotePinned(false);

    setNoteEditorError("");
  };

  // ==========================================
  // SAVE NOTE
  // ==========================================

  const saveNote = async () => {
    if (!currentUserId) {
      setNoteEditorError(
        "Your user ID is not available. Please log in again."
      );

      return;
    }

    const trimmedTitle =
      noteTitle.trim();

    const trimmedContent =
      noteContent.trim();

    const trimmedSubject =
      noteSubject.trim();

    if (!trimmedTitle) {
      setNoteEditorError(
        "Note title is required."
      );

      return;
    }

    if (
      trimmedTitle.length >
      200
    ) {
      setNoteEditorError(
        "Note title cannot exceed 200 characters."
      );

      return;
    }

    if (
      trimmedContent.length >
      50000
    ) {
      setNoteEditorError(
        "Note content cannot exceed 50,000 characters."
      );

      return;
    }

    setSavingNote(true);

    setNoteEditorError("");

    try {
      const isEditing =
        Boolean(
          editingNote?._id ||
          editingNote?.id
        );

      const noteId =
        editingNote?._id ||
        editingNote?.id ||
        "";

      const endpoint =
        isEditing
          ? `${API_URL}/api/student-notes/${encodeURIComponent(
              noteId
            )}`
          : `${API_URL}/api/student-notes`;

      const method =
        isEditing
          ? "PATCH"
          : "POST";

      const response =
        await fetch(
          endpoint,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                currentUserId,

              title:
                trimmedTitle,

              content:
                trimmedContent,

              subject:
                trimmedSubject,

              color:
                noteColor ||
                "purple",

              pinned:
                notePinned,
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
            `Unable to save note. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to save note."
        );
      }

      if (data.note) {
        setNotes(
          (previousNotes) => {
            const withoutDuplicate =
              previousNotes.filter(
                (item) =>
                  String(
                    item._id ||
                    item.id
                  ) !==
                  String(
                    data.note._id ||
                    data.note.id
                  )
              );

            return [
              data.note,
              ...withoutDuplicate,
            ].sort(
              (a, b) => {
                if (
                  Boolean(a.pinned) !==
                  Boolean(b.pinned)
                ) {
                  return a.pinned
                    ? -1
                    : 1;
                }

                const aDate =
                  new Date(
                    a.updatedAt ||
                      a.createdAt ||
                      0
                  ).getTime();

                const bDate =
                  new Date(
                    b.updatedAt ||
                      b.createdAt ||
                      0
                  ).getTime();

                return (
                  bDate - aDate
                );
              }
            );
          }
        );
      }

      await loadNotes();

      closeNoteEditor();
    } catch (error) {
      console.error(
        "Save student note error:",
        error
      );

      setNoteEditorError(
        error.message ||
          "Unable to save note."
      );
    } finally {
      setSavingNote(false);
    }
  };

  // ==========================================
  // DELETE NOTE
  // ==========================================

  const deleteNote = async (
    note
  ) => {
    if (!note) {
      return;
    }

    if (!currentUserId) {
      setNotesError(
        "Your user ID is not available. Please log in again."
      );

      return;
    }

    const noteId =
      note._id ||
      note.id ||
      "";

    if (!noteId) {
      setNotesError(
        "This note does not have a valid ID."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${note.title || "this note"}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setNotesError("");

      const response =
        await fetch(
          `${API_URL}/api/student-notes/${encodeURIComponent(
            noteId
          )}`,
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                currentUserId,
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
            `Unable to delete note. Server returned ${response.status}.`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to delete note."
        );
      }

      setNotes(
        (previousNotes) =>
          previousNotes.filter(
            (item) =>
              String(
                item._id ||
                item.id
              ) !==
              String(noteId)
          )
      );

      await loadNotes();
    } catch (error) {
      console.error(
        "Delete student note error:",
        error
      );

      setNotesError(
        error.message ||
          "Unable to delete note."
      );
    }
  };

  // ==========================================
  // QUIZ FILE SELECT
  // ==========================================

  const handleQuizFileChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setQuizFile(file);

      setQuizError("");

      setQuizResult(null);
    };

  // ==========================================
  // QUIZ GENERATOR
  // ==========================================

  const generateQuiz =
    async () => {
      if (!quizFile) {
        setQuizError(
          "Please upload a study document first."
        );

        return;
      }

      setQuizLoading(true);

      setQuizError("");

      setQuizResult(null);

      try {
        setQuizResult({
          status:
            "ready",

          fileName:
            quizFile.name,

          message:
            "Your study document is ready for the Zenva AI quiz generator.",
        });
      } catch (error) {
        console.error(
          "Quiz generation error:",
          error
        );

        setQuizError(
          error.message ||
            "Unable to generate quiz."
        );
      } finally {
        setQuizLoading(false);
      }
    };

  // ==========================================
  // ROOM MEMBER CHECK
  // ==========================================

  const getRoomMemberCount =
    (room) => {
      const normalizedRoom =
        normalizeRoom(room);

      return (
        normalizedRoom?.memberCount ||
        0
      );
    };

  // ==========================================
  // FORMAT NOTE DATE
  // ==========================================

  const formatNoteDate = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // NOTE COLOR CLASS
  // ==========================================

  const getNoteColorClass =
    (color) => {
      const allowedColors = [
        "purple",
        "pink",
        "blue",
        "green",
        "orange",
      ];

      return allowedColors.includes(
        color
      )
        ? color
        : "purple";
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
          onClick={
            onBack
          }
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
              Ask questions and understand lessons
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
              key={
                section.id
              }
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

        <button
          type="button"
          className={
            activeSection === "quiz"
              ? "student-section-button active"
              : "student-section-button"
          }
          onClick={() =>
            setActiveSection("quiz")
          }
        >

          <span>
            🧠
          </span>

          <small>
            Quiz
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
                Create rooms and collaborate
                with classmates.
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


          {!roomsLoading &&
            !roomsError &&
            rooms.length > 0 && (

            <section className="student-rooms">

              {rooms.map(
                (room) => (

                  <article
                    className="student-room-card"
                    key={
                      room.id
                    }
                  >

                    <div className="room-avatar">

                      {room.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "R"}

                    </div>


                    <div className="room-information">

                      <h3>
                        {room.name}
                      </h3>

                      <p>
                        {room.subject}
                      </p>

                      <small>
                        {getRoomMemberCount(
                          room
                        )}{" "}
                        {getRoomMemberCount(
                          room
                        ) === 1
                          ? "member"
                          : "members"}
                        {" • "}
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
                        aria-label="Generate room invite link"
                      >
                        🔗
                      </button>

                    </div>

                  </article>

                )
              )}

            </section>

          )}


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
              onClick={
                openNewNote
              }
            >
              + Note
            </button>

          </div>


          {/* NOTES LOADING */}

          {notesLoading && (

            <section className="student-empty-state">

              <div>
                ⏳
              </div>

              <h3>
                Loading notes...
              </h3>

              <p>
                Loading your saved notes from ZenvaZapp.
              </p>

            </section>

          )}


          {/* NOTES ERROR */}

          {!notesLoading &&
            notesError && (

            <section className="student-empty-state">

              <div>
                ⚠️
              </div>

              <h3>
                Unable to load notes
              </h3>

              <p>
                {notesError}
              </p>

              <button
                type="button"
                className="create-room-submit"
                onClick={
                  loadNotes
                }
              >
                Try Again
              </button>

            </section>

          )}


          {/* NOTES LIST */}

          {!notesLoading &&
            !notesError &&
            notes.length > 0 && (

            <section
              className="student-notes-list"
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",

                gap:
                  "12px",

                width:
                  "100%",
              }}
            >

              {notes.map(
                (note) => {

                  const noteId =
                    note._id ||
                    note.id;

                  const noteColor =
                    getNoteColorClass(
                      note.color
                    );

                  return (

                    <article
                      key={
                        noteId
                      }
                      className={`student-note-card student-note-${noteColor}`}
                      style={{
                        padding:
                          "15px",

                        border:
                          "1px solid rgba(233,166,208,0.14)",

                        borderRadius:
                          "14px",

                        background:
                          "#160b12",

                        minWidth:
                          "0",
                      }}
                    >

                      {/* NOTE HEADER */}

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "flex-start",

                          justifyContent:
                            "space-between",

                          gap:
                            "10px",
                        }}
                      >

                        <div
                          style={{
                            minWidth:
                              "0",
                            flex:
                              "1",
                          }}
                        >

                          <h3
                            style={{
                              margin:
                                "0",

                              color:
                                "#fff7fc",

                              fontSize:
                                "14px",

                              lineHeight:
                                "1.3",

                              wordBreak:
                                "break-word",
                            }}
                          >

                            {note.title}

                          </h3>

                          {note.subject && (

                            <small
                              style={{
                                display:
                                  "block",

                                marginTop:
                                  "4px",

                                color:
                                  "#e9a6d0",

                                fontSize:
                                  "8px",

                                fontWeight:
                                  700,
                              }}
                            >
                              {note.subject}
                            </small>

                          )}

                        </div>


                        {note.pinned && (

                          <span
                            title="Pinned note"
                            style={{
                              flexShrink:
                                0,

                              fontSize:
                                "13px",
                            }}
                          >
                            📌
                          </span>

                        )}

                      </div>


                      {/* NOTE CONTENT */}

                      <p
                        style={{
                          margin:
                            "12px 0",

                          color:
                            "#c7aebe",

                          fontSize:
                            "9px",

                          lineHeight:
                            "1.6",

                          whiteSpace:
                            "pre-wrap",

                          wordBreak:
                            "break-word",

                          display:
                            "-webkit-box",

                          WebkitLineClamp:
                            6,

                          WebkitBoxOrient:
                            "vertical",

                          overflow:
                            "hidden",
                        }}
                      >

                        {note.content ||
                          "No note content."}

                      </p>


                      {/* NOTE FOOTER */}

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "space-between",

                          gap:
                            "8px",

                          marginTop:
                            "10px",

                          paddingTop:
                            "10px",

                          borderTop:
                            "1px solid rgba(233,166,208,0.08)",
                        }}
                      >

                        <small
                          style={{
                            color:
                              "#806878",

                            fontSize:
                              "7px",
                          }}
                        >
                          {formatNoteDate(
                            note.updatedAt ||
                              note.createdAt
                          )}
                        </small>


                        <div
                          style={{
                            display:
                              "flex",

                            gap:
                              "6px",
                          }}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              openEditNote(
                                note
                              )
                            }
                            style={{
                              border:
                                "1px solid rgba(233,166,208,0.15)",

                              borderRadius:
                                "8px",

                              background:
                                "rgba(218,112,170,0.06)",

                              color:
                                "#e9a6d0",

                              padding:
                                "6px 8px",

                              fontSize:
                                "8px",

                              fontWeight:
                                700,

                              cursor:
                                "pointer",
                            }}
                          >
                            📝 Edit
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              deleteNote(
                                note
                              )
                            }
                            style={{
                              border:
                                "1px solid rgba(255,107,157,0.14)",

                              borderRadius:
                                "8px",

                              background:
                                "rgba(255,107,157,0.05)",

                              color:
                                "#ff8db2",

                              padding:
                                "6px 8px",

                              fontSize:
                                "8px",

                              fontWeight:
                                700,

                              cursor:
                                "pointer",
                            }}
                          >
                            🗑️ Delete
                          </button>

                        </div>

                      </div>

                    </article>

                  );
                }
              )}

            </section>

          )}


          {/* EMPTY NOTES */}

          {!notesLoading &&
            !notesError &&
            notes.length === 0 && (

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

              <button
                type="button"
                className="create-room-submit"
                onClick={
                  openNewNote
                }
              >
                + Create Your First Note
              </button>

            </section>

          )}

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
                Share PDFs, documents, slides
                and other learning materials.
              </p>

            </div>

          </div>


          <section className="student-file-actions">

            <button
              type="button"
            >
              📄
              <span>
                Upload Document
              </span>
            </button>


            <button
              type="button"
              onClick={() =>
                setActiveSection("quiz")
              }
            >
              🧠
              <span>
                Create Quiz
              </span>
            </button>

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
              type="button"
              className="create-room-button"
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
                Organize classes, exams
                and deadlines.
              </p>

            </div>

            <button
              type="button"
              className="create-room-button"
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
              Add classes, assignments,
              exams and study sessions.
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

            <button
              type="button"
            >
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


            <div
              className="quiz-actions"
            >

              <label
                htmlFor="student-quiz-file"
                className="quiz-actions button"
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  minHeight:
                    "38px",

                  padding:
                    "0 13px",

                  borderRadius:
                    "9px",

                  background:
                    "rgba(218,112,170,0.08)",

                  border:
                    "1px solid rgba(233,166,208,0.18)",

                  color:
                    "#e9a6d0",

                  fontSize:
                    "8px",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",
                }}
              >
                📄 Upload Document
              </label>

              <input
                id="student-quiz-file"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                onChange={
                  handleQuizFileChange
                }
                style={{
                  display:
                    "none",
                }}
              />


              <button
                type="button"
                onClick={
                  generateQuiz
                }
                disabled={
                  quizLoading ||
                  !quizFile
                }
              >
                {quizLoading
                  ? "Preparing..."
                  : "Generate Quiz"}
              </button>

            </div>


            {quizFile && (

              <p
                style={{
                  marginTop:
                    "12px",

                  color:
                    "#e9a6d0",

                  fontSize:
                    "8px",
                }}
              >
                Selected:{" "}
                {quizFile.name}
              </p>

            )}


            {quizError && (

              <p
                style={{
                  marginTop:
                    "10px",

                  color:
                    "#ff6b9d",

                  fontSize:
                    "8px",
                }}
              >
                {quizError}
              </p>

            )}


            {quizResult && (

              <div
                style={{
                  marginTop:
                    "15px",

                  padding:
                    "13px",

                  border:
                    "1px solid rgba(218,112,170,0.12)",

                  borderRadius:
                    "12px",

                  background:
                    "#160b12",
                }}
              >

                <strong
                  style={{
                    display:
                      "block",

                    color:
                      "#fff7fc",

                    fontSize:
                      "10px",

                    marginBottom:
                      "5px",
                  }}
                >
                  Document ready
                </strong>

                <span
                  style={{
                    color:
                      "#a98a9e",

                    fontSize:
                      "8px",

                    lineHeight:
                      1.5,
                  }}
                >
                  {quizResult.message}
                </span>

              </div>

            )}

          </section>

        </main>

      )}


      {/* =====================================
          CREATE / EDIT NOTE MODAL
      ===================================== */}

      {showNoteEditor && (

        <div
          className="student-modal-overlay"
          onClick={() => {
            if (!savingNote) {
              closeNoteEditor();
            }
          }}
        >

          <div
            className="student-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              maxWidth:
                "520px",
            }}
          >

            <button
              className="student-modal-close"
              type="button"
              onClick={
                closeNoteEditor
              }
              disabled={
                savingNote
              }
            >
              ×
            </button>


            <div className="student-modal-icon">
              📝
            </div>


            <h2>
              {editingNote
                ? "Edit Note"
                : "Create Note"}
            </h2>


            <p>
              {editingNote
                ? "Update your study note and save your changes."
                : "Create a study note and save it to your ZenvaZapp account."}
            </p>


            {/* TITLE */}

            <input
              value={
                noteTitle
              }
              onChange={(event) => {
                setNoteTitle(
                  event.target.value
                );

                if (
                  noteEditorError
                ) {
                  setNoteEditorError(
                    ""
                  );
                }
              }}
              placeholder="Note title"
              disabled={
                savingNote
              }
              maxLength={200}
              autoFocus
            />


            {/* SUBJECT */}

            <input
              value={
                noteSubject
              }
              onChange={(event) => {
                setNoteSubject(
                  event.target.value
                );
              }}
              placeholder="Subject (optional)"
              disabled={
                savingNote
              }
              maxLength={100}
              style={{
                marginTop:
                  "9px",
              }}
            />


            {/* CONTENT */}

            <textarea
              value={
                noteContent
              }
              onChange={(event) => {
                setNoteContent(
                  event.target.value
                );

                if (
                  noteEditorError
                ) {
                  setNoteEditorError(
                    ""
                  );
                }
              }}
              placeholder="Write your note here..."
              disabled={
                savingNote
              }
              maxLength={50000}
              rows={9}
              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                marginTop:
                  "9px",

                padding:
                  "11px",

                border:
                  "1px solid rgba(233,166,208,0.18)",

                borderRadius:
                  "10px",

                background:
                  "#160b12",

                color:
                  "#fff7fc",

                fontSize:
                  "10px",

                lineHeight:
                  "1.5",

                resize:
                  "vertical",

                outline:
                  "none",

                fontFamily:
                  "inherit",
              }}
            />


            {/* COLOR */}

            <div
              style={{
                marginTop:
                  "12px",
              }}
            >

              <label
                style={{
                  display:
                    "block",

                  color:
                    "#a98a9e",

                  fontSize:
                    "8px",

                  marginBottom:
                    "6px",

                  fontWeight:
                    700,
                }}
              >
                Note color
              </label>

              <select
                value={
                  noteColor
                }
                onChange={(event) =>
                  setNoteColor(
                    event.target.value
                  )
                }
                disabled={
                  savingNote
                }
                style={{
                  width:
                    "100%",

                  boxSizing:
                    "border-box",

                  minHeight:
                    "38px",

                  padding:
                    "0 10px",

                  border:
                    "1px solid rgba(233,166,208,0.18)",

                  borderRadius:
                    "9px",

                  background:
                    "#160b12",

                  color:
                    "#fff7fc",

                  fontSize:
                    "9px",

                  outline:
                    "none",
                }}
              >

                <option value="purple">
                  Purple
                </option>

                <option value="pink">
                  Pink
                </option>

                <option value="blue">
                  Blue
                </option>

                <option value="green">
                  Green
                </option>

                <option value="orange">
                  Orange
                </option>

              </select>

            </div>


            {/* PIN */}

            <label
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "8px",

                marginTop:
                  "12px",

                color:
                  "#c7aebe",

                fontSize:
                  "8px",

                cursor:
                  savingNote
                    ? "not-allowed"
                    : "pointer",
              }}
            >

              <input
                type="checkbox"
                checked={
                  notePinned
                }
                onChange={(event) =>
                  setNotePinned(
                    event.target.checked
                  )
                }
                disabled={
                  savingNote
                }
              />

              Pin this note
            </label>


            {/* ERROR */}

            {noteEditorError && (

              <p
                style={{
                  color:
                    "#ff6b9d",

                  fontSize:
                    "8px",

                  lineHeight:
                    "1.5",

                  marginTop:
                    "10px",

                  marginBottom:
                    "0",
                }}
              >
                {noteEditorError}
              </p>

            )}


            {/* ACTIONS */}

            <div
              style={{
                display:
                  "flex",

                gap:
                  "8px",

                marginTop:
                  "14px",
              }}
            >

              <button
                type="button"
                onClick={
                  closeNoteEditor
                }
                disabled={
                  savingNote
                }
                style={{
                  flex:
                    "1",

                  minHeight:
                    "40px",

                  border:
                    "1px solid rgba(233,166,208,0.15)",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(218,112,170,0.05)",

                  color:
                    "#c7aebe",

                  fontSize:
                    "8px",

                  fontWeight:
                    700,

                  cursor:
                    savingNote
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Cancel
              </button>


              <button
                type="button"
                className="create-room-submit"
                onClick={
                  saveNote
                }
                disabled={
                  savingNote ||
                  !noteTitle.trim()
                }
                style={{
                  flex:
                    "1",

                  marginTop:
                    "0",
                }}
              >
                {savingNote
                  ? "Saving..."
                  : editingNote
                  ? "Save Changes"
                  : "Create Note"}
              </button>

            </div>

          </div>

        </div>

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
              className="student-modal-close"
              type="button"
              onClick={() => {
                if (
                  creatingRoom
                ) {
                  return;
                }

                setShowCreateRoom(
                  false
                );

                setCreateRoomError("");
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
              Create a private study room
              for your classmates.
            </p>


            <input
              value={
                roomName
              }
              onChange={(event) => {
                setRoomName(
                  event.target.value
                );

                if (
                  createRoomError
                ) {
                  setCreateRoomError(
                    ""
                  );
                }
              }}
              placeholder="Room name"
              disabled={
                creatingRoom
              }
              maxLength={100}
              autoFocus
            />


            {createRoomError && (

              <p
                style={{
                  color:
                    "#ff6b9d",

                  marginTop:
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
                creatingRoom ||
                !roomName.trim()
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
          ADD STUDENT PHONE KEYPAD
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
              📱
            </div>


            <h2>
              Add Student
            </h2>


            <p>
              Enter the student's phone
              number for:
            </p>


            <strong className="selected-room-name">
              {selectedRoom.name}
            </strong>


            <div
              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                minHeight:
                  "48px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                margin:
                  "10px 0 14px",

                padding:
                  "0 12px",

                border:
                  "1px solid rgba(233,166,208,0.18)",

                borderRadius:
                  "12px",

                background:
                  "#160b12",

                color:
                  "#fff7fc",

                fontSize:
                  "16px",

                fontWeight:
                  700,

                letterSpacing:
                  "1px",
              }}
            >
              {phoneNumber ||
                "Enter phone number"}
            </div>


            {contactsError && (

              <p
                style={{
                  color:
                    "#ff6b9d",

                  fontSize:
                    "8px",

                  lineHeight:
                    1.5,

                  margin:
                    "0 0 10px",
                }}
              >
                {contactsError}
              </p>

            )}


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(3, 1fr)",

                gap:
                  "8px",

                marginTop:
                  "10px",
              }}
            >

              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "+",
                "0",
                "backspace",
              ].map(
                (key) => (

                  <button
                    key={key}
                    type="button"
                    disabled={
                      invitingStudents
                    }
                    onClick={() =>
                      handlePhoneKey(
                        key
                      )
                    }
                    style={{
                      minHeight:
                        "48px",

                      border:
                        "1px solid rgba(218,112,170,0.12)",

                      borderRadius:
                        "12px",

                      background:
                        "#241020",

                      color:
                        "#fff7fc",

                      fontSize:
                        key ===
                        "backspace"
                          ? "15px"
                          : "14px",

                      fontWeight:
                        700,

                      cursor:
                        invitingStudents
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {key ===
                    "backspace"
                      ? "⌫"
                      : key}
                  </button>

                )
              )}

            </div>


            <button
              type="button"
              disabled={
                invitingStudents ||
                !phoneNumber
              }
              onClick={() =>
                handlePhoneKey(
                  "clear"
                )
              }
              style={{
                width:
                  "100%",

                minHeight:
                  "40px",

                marginTop:
                  "8px",

                border:
                  "1px solid rgba(233,166,208,0.15)",

                borderRadius:
                  "10px",

                background:
                  "rgba(218,112,170,0.06)",

                color:
                  "#e9a6d0",

                fontSize:
                  "8px",

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              Clear
            </button>


            <button
              type="button"
              className="create-room-submit"
              onClick={
                inviteStudentByPhone
              }
              disabled={
                invitingStudents ||
                !phoneNumber
              }
              style={{
                marginTop:
                  "10px",
              }}
            >
              {invitingStudents
                ? "Checking number..."
                : "Add Student"}
            </button>


            <p
              style={{
                marginTop:
                  "12px",

                color:
                  "#8f7185",

                fontSize:
                  "7px",

                lineHeight:
                  1.5,

                textAlign:
                  "center",
              }}
            >
              If the number belongs to a
              ZenvaZapp user, they will be
              added directly. Otherwise,
              ZenvaZapp will create a room
              invitation link for you to share.
            </p>

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
          onClick={() => {
            if (
              !inviteLoading
            ) {
              setShowInviteLink(
                false
              );

              setInviteLink("");

              setInviteTargetPhone("");

              setSelectedRoom(
                null
              );
            }
          }}
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
              onClick={() => {
                if (
                  inviteLoading
                ) {
                  return;
                }

                setShowInviteLink(
                  false
                );

                setInviteLink("");

                setInviteTargetPhone("");

                setSelectedRoom(
                  null
                );
              }}
            >
              ×
            </button>


            <div className="student-modal-icon">
              🔗
            </div>


            <h2>
              Invite Classmate
            </h2>


            <p>
              This phone number is not currently
              available as a ZenvaZapp member.
            </p>


            <strong className="selected-room-name">
              {selectedRoom.name}
            </strong>


            {inviteTargetPhone && (

              <p
                style={{
                  color:
                    "#c99ab8",

                  fontSize:
                    "8px",
                }}
              >
                Number:{" "}
                {inviteTargetPhone}
              </p>

            )}


            <div className="invite-preview">

              <div className="invite-preview-icon">
                👥
              </div>

              <div>

                <strong>
                  Join {selectedRoom.name}
                </strong>

                <span>
                  ZenvaZapp Student Room
                </span>

              </div>

            </div>


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
                  Invite link unavailable.
                </span>

              )}

            </div>


            <div className="invite-link-actions">

              <button
                type="button"
                className="invite-copy-button"
                onClick={
                  copyInviteLink
                }
                disabled={
                  !inviteLink ||
                  inviteLoading
                }
              >
                📋 Copy Link
              </button>


              <button
                type="button"
                className="invite-share-button"
                onClick={
                  shareInviteLink
                }
                disabled={
                  !inviteLink ||
                  inviteLoading
                }
              >
                📤 Share Invite
              </button>

            </div>


            <p className="invite-link-note">
              Anyone who receives this link can
              use it to join this student room.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default StudentMode;