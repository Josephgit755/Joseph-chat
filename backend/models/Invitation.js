const mongoose = require("mongoose");

// ==========================================
// ZENVAZAPP INVITATION MODEL
// ==========================================
//
// An invitation is created only when a user
// intentionally enters a phone number that
// is not registered on ZenvaZapp and chooses
// to invite that person.
//
// We do NOT use this model to discover users.
// ==========================================

const invitationSchema = new mongoose.Schema(
  {
    // ========================================
    // SENDER
    // ========================================

    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // INVITED PHONE NUMBER
    // ========================================

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ========================================
    // INVITATION STATUS
    // ========================================

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "expired",
      ],
      default: "pending",
      index: true,
    },

    // ========================================
    // WHEN INVITATION WAS SENT
    // ========================================

    invitedAt: {
      type: Date,
      default: Date.now,
    },

    // ========================================
    // WHEN INVITATION WAS ACCEPTED
    // ========================================

    acceptedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // USER CREATED FROM THIS INVITATION
    // ========================================
    //
    // This will allow us later to connect
    // an invitation to the account created
    // with the invited phone number.
    //

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PREVENT DUPLICATE PENDING INVITATIONS
// ==========================================
//
// One person should not create multiple
// pending invitation records for the same
// phone number.
//

invitationSchema.index(
  {
    inviter: 1,
    phone: 1,
  },
  {
    unique: true,
  }
);

// ==========================================
// EXPORT
// ==========================================

module.exports =
  mongoose.model(
    "Invitation",
    invitationSchema
  );