const crypto = require("crypto");

const StudentRoom = require("../models/StudentRoom");
const User = require("../models/User");

// ==========================================
// HELPERS
// ==========================================

const normalizeUserId = (value) => {
  if (!value) {
    return null;
  }

  return (
    value._id ||
    value.id ||
    value.userId ||
    value
  );
};

// ==========================================
// GENERATE UNIQUE INVITE CODE
// ==========================================

const generateInviteCode = async () => {
  let inviteCode;
  let existingRoom;

  do {
    inviteCode =
      crypto
        .randomBytes(5)
        .toString("hex")
        .toUpperCase();

    existingRoom =
      await StudentRoom.findOne({
        inviteCode,
      });
  } while (existingRoom);

  return inviteCode;
};

// ==========================================
// FORMAT ROOM
// ==========================================

const formatRoom = (room) => {
  return {
    id: room._id.toString(),

    name: room.name,

    subject:
      room.subject ||
      "New Student Room",

    description:
      room.description || "",

    members:
      room.members?.length || 0,

    activity:
      room.activity ||
      "Room created",

    owner:
      room.owner?._id
        ? room.owner._id.toString()
        : room.owner?.toString(),

    inviteCode:
      room.inviteEnabled
        ? room.inviteCode || ""
        : "",

    inviteEnabled:
      room.inviteEnabled,

    isActive:
      room.isActive,

    createdAt:
      room.createdAt,

    updatedAt:
      room.updatedAt,

    memberList:
      (room.members || []).map(
        (member) => ({
          id:
            member.user?._id
              ? member.user._id.toString()
              : member.user?.toString(),

          fullName:
            member.user?.fullName || "",

          username:
            member.user?.username || "",

          profilePhoto:
            member.user?.profilePhoto || "",

          displayName:
            member.user?.displayName || "",

          role:
            member.role,

          joinedAt:
            member.joinedAt,
        })
      ),
  };
};

// ==========================================
// CREATE STUDENT ROOM
// ==========================================
//
// POST /api/student-rooms
//
// Body:
//
// {
//   "userId": "...",
//   "name": "Computer Engineering 2026",
//   "subject": "Computer Engineering",
//   "description": ""
// }
//
// ==========================================

const createRoom = async (
  req,
  res
) => {
  try {
    const {
      userId,
      name,
      subject,
      description,
    } = req.body;

    const normalizedUserId =
      normalizeUserId(userId);

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Room name is required.",
      });
    }

    // --------------------------------------
    // VERIFY USER
    // --------------------------------------

    const user =
      await User.findById(
        normalizedUserId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // --------------------------------------
    // GENERATE INVITE
    // --------------------------------------

    const inviteCode =
      await generateInviteCode();

    // --------------------------------------
    // CREATE ROOM
    // --------------------------------------

    const room =
      await StudentRoom.create({
        name: name.trim(),

        subject:
          subject?.trim() ||
          "New Student Room",

        description:
          description?.trim() || "",

        owner:
          user._id,

        members: [
          {
            user: user._id,
            role: "owner",
          },
        ],

        inviteCode,

        inviteEnabled: true,

        activity:
          "Room created",
      });

    // --------------------------------------
    // LOAD USER INFORMATION
    // --------------------------------------

    const populatedRoom =
      await StudentRoom.findById(
        room._id
      )
        .populate(
          "owner",
          "_id fullName username profilePhoto displayName"
        )
        .populate(
          "members.user",
          "_id fullName username profilePhoto displayName"
        );

    return res.status(201).json({
      success: true,

      message:
        "Student room created successfully.",

      room:
        formatRoom(
          populatedRoom
        ),
    });
  } catch (error) {
    console.error(
      "Create student room error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating student room.",
    });
  }
};

// ==========================================
// GET USER ROOMS
// ==========================================
//
// GET /api/student-rooms/user/:userId
//
// ==========================================

const getUserRooms = async (
  req,
  res
) => {
  try {
    const {
      userId,
    } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    // --------------------------------------
    // VERIFY USER
    // --------------------------------------

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // --------------------------------------
    // FIND ROOMS
    // --------------------------------------

    const rooms =
      await StudentRoom.find({
        isActive: true,

        "members.user":
          userId,
      })
        .populate(
          "owner",
          "_id fullName username profilePhoto displayName"
        )
        .populate(
          "members.user",
          "_id fullName username profilePhoto displayName"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,

      rooms:
        rooms.map(
          formatRoom
        ),
    });
  } catch (error) {
    console.error(
      "Get student rooms error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while loading student rooms.",
    });
  }
};

// ==========================================
// GET SINGLE ROOM
// ==========================================
//
// GET /api/student-rooms/:roomId
//
// ==========================================

const getRoom = async (
  req,
  res
) => {
  try {
    const {
      roomId,
    } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message:
          "Room ID is required.",
      });
    }

    const room =
      await StudentRoom.findOne({
        _id: roomId,
        isActive: true,
      })
        .populate(
          "owner",
          "_id fullName username profilePhoto displayName"
        )
        .populate(
          "members.user",
          "_id fullName username profilePhoto displayName"
        );

    if (!room) {
      return res.status(404).json({
        success: false,
        message:
          "Student room not found.",
      });
    }

    return res.status(200).json({
      success: true,

      room:
        formatRoom(room),
    });
  } catch (error) {
    console.error(
      "Get student room error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while loading student room.",
    });
  }
};

// ==========================================
// ADD MEMBERS
// ==========================================
//
// PATCH /api/student-rooms/:roomId/members
//
// Body:
//
// {
//   "userId": "OWNER_ID",
//   "memberIds": [
//      "USER_ID_1",
//      "USER_ID_2"
//   ]
// }
//
// ==========================================

const addMembers = async (
  req,
  res
) => {
  try {
    const {
      roomId,
    } = req.params;

    const {
      userId,
      memberIds,
    } = req.body;

    const normalizedUserId =
      normalizeUserId(userId);

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (
      !normalizedUserId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (
      !Array.isArray(
        memberIds
      ) ||
      memberIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one student must be selected.",
      });
    }

    // --------------------------------------
    // FIND ROOM
    // --------------------------------------

    const room =
      await StudentRoom.findOne({
        _id: roomId,
        isActive: true,
      });

    if (!room) {
      return res.status(404).json({
        success: false,
        message:
          "Student room not found.",
      });
    }

    // --------------------------------------
    // ONLY OWNER CAN ADD MEMBERS
    // --------------------------------------

    if (
      room.owner.toString() !==
      normalizedUserId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the room owner can add students.",
      });
    }

    // --------------------------------------
    // CLEAN MEMBER IDS
    // --------------------------------------

    const uniqueMemberIds =
      [
        ...new Set(
          memberIds
            .filter(Boolean)
            .map(
              (id) =>
                id.toString()
            )
        ),
      ];

    // --------------------------------------
    // VERIFY USERS
    // --------------------------------------

    const users =
      await User.find({
        _id: {
          $in:
            uniqueMemberIds,
        },
      }).select(
        "_id fullName username profilePhoto displayName"
      );

    if (
      users.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "No valid students were found.",
      });
    }

    // --------------------------------------
    // EXISTING MEMBERS
    // --------------------------------------

    const existingMemberIds =
      new Set(
        room.members.map(
          (member) =>
            member.user.toString()
        )
      );

    // --------------------------------------
    // ADD NEW MEMBERS
    // --------------------------------------

    const newMembers = [];

    for (const user of users) {
      const id =
        user._id.toString();

      // Already inside room
      if (
        existingMemberIds.has(id)
      ) {
        continue;
      }

      // Owner is already a member
      if (
        id ===
        room.owner.toString()
      ) {
        continue;
      }

      room.members.push({
        user:
          user._id,

        role:
          "member",

        joinedAt:
          new Date(),
      });

      newMembers.push(user);

      existingMemberIds.add(id);
    }

    // --------------------------------------
    // UPDATE ACTIVITY
    // --------------------------------------

    if (
      newMembers.length > 0
    ) {
      room.activity =
        `${newMembers.length} student${
          newMembers.length > 1
            ? "s"
            : ""
        } invited`;
    }

    await room.save();

    // --------------------------------------
    // POPULATE
    // --------------------------------------

    const populatedRoom =
      await StudentRoom.findById(
        room._id
      )
        .populate(
          "owner",
          "_id fullName username profilePhoto displayName"
        )
        .populate(
          "members.user",
          "_id fullName username profilePhoto displayName"
        );

    return res.status(200).json({
      success: true,

      message:
        newMembers.length > 0
          ? `${newMembers.length} student${
              newMembers.length > 1
                ? "s"
                : ""
            } added successfully.`
          : "All selected students are already members.",

      addedCount:
        newMembers.length,

      room:
        formatRoom(
          populatedRoom
        ),
    });
  } catch (error) {
    console.error(
      "Add student room members error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding students.",
    });
  }
};

// ==========================================
// GET INVITE
// ==========================================
//
// GET /api/student-rooms/:roomId/invite
//
// ==========================================

const getInvite = async (
  req,
  res
) => {
  try {
    const {
      roomId,
    } = req.params;

    const {
      userId,
    } = req.query;

    if (
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const room =
      await StudentRoom.findOne({
        _id: roomId,
        isActive: true,
      });

    if (!room) {
      return res.status(404).json({
        success: false,
        message:
          "Student room not found.",
      });
    }

    // --------------------------------------
    // ONLY OWNER CAN ACCESS INVITE
    // --------------------------------------

    if (
      room.owner.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the room owner can manage this invite.",
      });
    }

    // --------------------------------------
    // CREATE CODE IF MISSING
    // --------------------------------------

    if (
      !room.inviteCode
    ) {
      room.inviteCode =
        await generateInviteCode();

      await room.save();
    }

    return res.status(200).json({
      success: true,

      inviteCode:
        room.inviteCode,

      inviteEnabled:
        room.inviteEnabled,
    });
  } catch (error) {
    console.error(
      "Get student room invite error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while loading invite.",
    });
  }
};

// ==========================================
// JOIN ROOM USING INVITE CODE
// ==========================================
//
// POST /api/student-rooms/join
//
// Body:
//
// {
//   "userId": "...",
//   "inviteCode": "ABC123"
// }
//
// ==========================================

const joinRoom = async (
  req,
  res
) => {
  try {
    const {
      userId,
      inviteCode,
    } = req.body;

    const normalizedUserId =
      normalizeUserId(userId);

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (
      !normalizedUserId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (
      !inviteCode ||
      !inviteCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invite code is required.",
      });
    }

    // --------------------------------------
    // VERIFY USER
    // --------------------------------------

    const user =
      await User.findById(
        normalizedUserId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // --------------------------------------
    // FIND ROOM
    // --------------------------------------

    const room =
      await StudentRoom.findOne({
        inviteCode:
          inviteCode
            .trim()
            .toUpperCase(),

        inviteEnabled:
          true,

        isActive:
          true,
      });

    if (!room) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid or expired invite code.",
      });
    }

    // --------------------------------------
    // CHECK EXISTING MEMBER
    // --------------------------------------

    const alreadyMember =
      room.members.some(
        (member) =>
          member.user.toString() ===
          normalizedUserId.toString()
      );

    if (
      alreadyMember
    ) {
      const populatedRoom =
        await StudentRoom.findById(
          room._id
        )
          .populate(
            "owner",
            "_id fullName username profilePhoto displayName"
          )
          .populate(
            "members.user",
            "_id fullName username profilePhoto displayName"
          );

      return res.status(200).json({
        success: true,

        message:
          "You are already a member of this room.",

        alreadyMember: true,

        room:
          formatRoom(
            populatedRoom
          ),
      });
    }

    // --------------------------------------
    // ADD MEMBER
    // --------------------------------------

    room.members.push({
      user:
        user._id,

      role:
        "member",

      joinedAt:
        new Date(),
    });

    room.activity =
      `${user.fullName} joined the room`;

    await room.save();

    // --------------------------------------
    // POPULATE
    // --------------------------------------

    const populatedRoom =
      await StudentRoom.findById(
        room._id
      )
        .populate(
          "owner",
          "_id fullName username profilePhoto displayName"
        )
        .populate(
          "members.user",
          "_id fullName username profilePhoto displayName"
        );

    return res.status(200).json({
      success: true,

      message:
        "You joined the student room successfully.",

      alreadyMember:
        false,

      room:
        formatRoom(
          populatedRoom
        ),
    });
  } catch (error) {
    console.error(
      "Join student room error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while joining student room.",
    });
  }
};

// ==========================================
// LEAVE ROOM
// ==========================================
//
// PATCH /api/student-rooms/:roomId/leave
//
// Body:
//
// {
//   "userId": "..."
// }
//
// ==========================================

const leaveRoom = async (
  req,
  res
) => {
  try {
    const {
      roomId,
    } = req.params;

    const {
      userId,
    } = req.body;

    const normalizedUserId =
      normalizeUserId(userId);

    if (
      !normalizedUserId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const room =
      await StudentRoom.findOne({
        _id: roomId,
        isActive: true,
      });

    if (!room) {
      return res.status(404).json({
        success: false,
        message:
          "Student room not found.",
      });
    }

    // --------------------------------------
    // OWNER CANNOT LEAVE
    // --------------------------------------

    if (
      room.owner.toString() ===
      normalizedUserId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The room owner cannot leave the room. Transfer ownership or delete the room first.",
      });
    }

    // --------------------------------------
    // CHECK MEMBER
    // --------------------------------------

    const wasMember =
      room.members.some(
        (member) =>
          member.user.toString() ===
          normalizedUserId.toString()
      );

    if (!wasMember) {
      return res.status(400).json({
        success: false,
        message:
          "You are not a member of this room.",
      });
    }

    // --------------------------------------
    // REMOVE MEMBER
    // --------------------------------------

    room.members =
      room.members.filter(
        (member) =>
          member.user.toString() !==
          normalizedUserId.toString()
      );

    room.activity =
      "A student left the room";

    await room.save();

    return res.status(200).json({
      success: true,

      message:
        "You left the student room successfully.",
    });
  } catch (error) {
    console.error(
      "Leave student room error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while leaving student room.",
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createRoom,
  getUserRooms,
  getRoom,
  addMembers,
  getInvite,
  joinRoom,
  leaveRoom,
};