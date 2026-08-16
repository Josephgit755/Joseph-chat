const mongoose = require("mongoose");

const Contact = require("../models/Contact");
const User = require("../models/User");
const Invitation = require("../models/Invitation");

// ==========================================
// HELPER: GET USER ID
// ==========================================

const getUserId = (req) => {
  return (
    req.body?.userId ||
    req.query?.userId ||
    req.params?.userId
  );
};

// ==========================================
// HELPER: VALIDATE MONGODB ID
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// HELPER: NORMALIZE PHONE
// ==========================================

const normalizePhone = (phone) => {
  if (!phone) {
    return "";
  }

  return String(phone)
    .trim()
    .replace(/[^\d+]/g, "");
};

// ==========================================
// ADD CONTACT BY PHONE NUMBER
// ==========================================
//
// Important:
//
// We DO NOT search the ZenvaZapp database
// for people to display.
//
// The user must intentionally provide
// a phone number.
//
// If that phone belongs to a ZenvaZapp user:
// -> save them as a contact.
//
// If not:
// -> return an invitation response.
//
// No fake contact is created.
// No chat is created.
// ==========================================

const addContact = async (req, res) => {
  try {
    const userId =
      req.body?.userId;

    const contactUserId =
      req.body?.contactUserId ||
      req.body?.contactId;

    const phone =
      normalizePhone(
        req.body?.phone
      );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    // ========================================
    // MAKE SURE OWNER EXISTS
    // ========================================

    const owner =
      await User.findById(
        userId
      )
        .select("_id phone")
        .lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    let contactUser = null;

    // ========================================
    // OPTION 1:
    // EXISTING USER ID
    // ========================================

    if (contactUserId) {
      if (
        !isValidObjectId(
          contactUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid contact ID.",
        });
      }

      if (
        String(userId) ===
        String(contactUserId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot add yourself as a contact.",
        });
      }

      contactUser =
        await User.findById(
          contactUserId
        );
    }

    // ========================================
    // OPTION 2:
    // PHONE NUMBER
    // ========================================
    //
    // Because User.phone is unique, there
    // is no reason to load every user.
    //
    // We directly check the intentionally
    // supplied phone number.
    // ========================================

    if (!contactUser && phone) {
      contactUser =
        await User.findOne({
          phone,
        })
          .select(
            "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
          )
          .lean();
    }

    // ========================================
    // NO CONTACT INFORMATION
    // ========================================

    if (
      !contactUserId &&
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a phone number to add a contact.",
      });
    }

    // ========================================
    // NOT REGISTERED
    // ========================================

    if (!contactUser) {
      return res.status(200).json({
        success: true,
        registered: false,
        invitation: true,
        phone,
        message:
          "This phone number is not registered on ZenvaZapp yet.",
      });
    }

    // ========================================
    // PREVENT SELF
    // ========================================

    if (
      String(userId) ===
      String(contactUser._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot add yourself as a contact.",
      });
    }

    // ========================================
    // CHECK EXISTING CONTACT
    // ========================================

    const existingContact =
      await Contact.findOne({
        owner: userId,
        contact:
          contactUser._id,
      });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        registered: true,
        message:
          "This person is already in your contacts.",
        contact:
          existingContact,
      });
    }

    // ========================================
    // CREATE CONTACT
    // ========================================

    const contact =
      await Contact.create({
        owner: userId,
        contact:
          contactUser._id,
        favorite: false,
        lastContactedAt: null,
      });

    // ========================================
    // POPULATE CONTACT
    // ========================================

    const populatedContact =
      await Contact.findById(
        contact._id
      )
        .populate(
          "contact",
          "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
        )
        .lean();

    return res.status(201).json({
      success: true,
      registered: true,
      invitation: false,
      message:
        "Contact added successfully.",
      contact:
        populatedContact,
    });
  } catch (error) {
    console.error(
      "Add contact error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This person is already in your contacts.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to add contact.",
    });
  }
};

// ==========================================
// CREATE / RECORD INVITATION
// ==========================================
//
// This endpoint is called only after the
// user intentionally enters a phone number
// and chooses to invite the person.
//
// The backend verifies that the number is
// still not registered before creating the
// invitation record.
// ==========================================

const createInvitation = async (
  req,
  res
) => {
  try {
    const userId =
      req.body?.userId;

    const phone =
      normalizePhone(
        req.body?.phone
      );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number is required.",
      });
    }

    // ========================================
    // VERIFY INVITER
    // ========================================

    const inviter =
      await User.findById(
        userId
      )
        .select("_id phone")
        .lean();

    if (!inviter) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    // ========================================
    // PREVENT INVITING YOURSELF
    // ========================================

    if (
      normalizePhone(
        inviter.phone
      ) === phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot invite your own phone number.",
      });
    }

    // ========================================
    // CHECK WHETHER NUMBER REGISTERED
    // ========================================
    //
    // We only check the exact phone number
    // intentionally supplied by the user.
    // ========================================

    const registeredUser =
      await User.findOne({
        phone,
      })
        .select("_id")
        .lean();

    if (registeredUser) {
      return res.status(409).json({
        success: false,
        registered: true,
        invitation: false,
        message:
          "This phone number is already registered on ZenvaZapp.",
      });
    }

    // ========================================
    // CREATE OR REUSE INVITATION
    // ========================================

    const invitation =
      await Invitation.findOneAndUpdate(
        {
          inviter: userId,
          phone,
        },
        {
          $set: {
            status: "pending",
            invitedAt: new Date(),
            acceptedAt: null,
            acceptedBy: null,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      success: true,
      registered: false,
      invitation: true,
      message:
        "Invitation recorded successfully.",
      phone,
      invitationId:
        invitation._id,
    });
  } catch (error) {
    console.error(
      "Create invitation error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An invitation for this phone number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create invitation.",
    });
  }
};

// ==========================================
// GET MY CONTACTS
// ==========================================

const getContacts = async (
  req,
  res
) => {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    const contacts =
      await Contact.find({
        owner: userId,
      })
        .populate(
          "contact",
          "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
        )
        .sort({
          favorite: -1,
          updatedAt: -1,
        })
        .lean();

    return res.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error(
      "Get contacts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load contacts.",
    });
  }
};

// ==========================================
// REMOVE CONTACT
// ==========================================

const removeContact = async (
  req,
  res
) => {
  try {
    const userId =
      req.body?.userId ||
      req.query?.userId;

    const contactUserId =
      req.body?.contactUserId ||
      req.body?.contactId ||
      req.params?.contactId;

    if (
      !userId ||
      !contactUserId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID and contact ID are required.",
      });
    }

    if (
      !isValidObjectId(userId) ||
      !isValidObjectId(
        contactUserId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user or contact ID.",
      });
    }

    const deletedContact =
      await Contact.findOneAndDelete({
        owner: userId,
        contact: contactUserId,
      });

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message:
          "Contact was not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Contact removed successfully.",
    });
  } catch (error) {
    console.error(
      "Remove contact error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to remove contact.",
    });
  }
};

// ==========================================
// TOGGLE FAVORITE
// ==========================================

const toggleFavorite = async (
  req,
  res
) => {
  try {
    const userId =
      req.body?.userId ||
      req.query?.userId;

    const contactUserId =
      req.body?.contactUserId ||
      req.body?.contactId ||
      req.params?.contactId;

    if (
      !userId ||
      !contactUserId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID and contact ID are required.",
      });
    }

    if (
      !isValidObjectId(userId) ||
      !isValidObjectId(
        contactUserId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user or contact ID.",
      });
    }

    const contact =
      await Contact.findOne({
        owner: userId,
        contact: contactUserId,
      });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message:
          "Contact was not found.",
      });
    }

    contact.favorite =
      !contact.favorite;

    await contact.save();

    return res.json({
      success: true,
      message:
        contact.favorite
          ? "Contact added to favorites."
          : "Contact removed from favorites.",
      favorite:
        contact.favorite,
      contact,
    });
  } catch (error) {
    console.error(
      "Toggle favorite error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update favorite status.",
    });
  }
};

// ==========================================
// GET CONTACT PROFILE
// ==========================================

const getContactProfile =
  async (req, res) => {
    try {
      const userId =
        req.query?.userId ||
        req.body?.userId;

      const contactUserId =
        req.params?.contactId ||
        req.query?.contactId;

      if (
        !userId ||
        !contactUserId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User ID and contact ID are required.",
        });
      }

      if (
        !isValidObjectId(userId) ||
        !isValidObjectId(
          contactUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user or contact ID.",
        });
      }

      const contact =
        await Contact.findOne({
          owner: userId,
          contact:
            contactUserId,
        })
          .populate(
            "contact",
            "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
          )
          .lean();

      if (!contact) {
        return res.status(404).json({
          success: false,
          message:
            "Contact was not found.",
        });
      }

      return res.json({
        success: true,
        contact,
      });
    } catch (error) {
      console.error(
        "Get contact profile error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load contact profile.",
      });
    }
  };

// ==========================================
// MARK RECENTLY CONTACTED
// ==========================================

const markRecentlyContacted =
  async (req, res) => {
    try {
      const userId =
        req.body?.userId;

      const contactUserId =
        req.body?.contactUserId ||
        req.body?.contactId ||
        req.params?.contactId;

      if (
        !userId ||
        !contactUserId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User ID and contact ID are required.",
        });
      }

      const contact =
        await Contact.findOne({
          owner: userId,
          contact:
            contactUserId,
        });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message:
            "Contact was not found.",
        });
      }

      contact.lastContactedAt =
        new Date();

      await contact.save();

      return res.json({
        success: true,
        message:
          "Recently contacted time updated.",
        contact,
      });
    } catch (error) {
      console.error(
        "Mark recently contacted error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update recently contacted status.",
      });
    }
  };

// ==========================================
// GET RECENTLY CONTACTED
// ==========================================

const getRecentlyContacted =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const contacts =
        await Contact.find({
          owner: userId,
          lastContactedAt: {
            $ne: null,
          },
        })
          .populate(
            "contact",
            "_id fullName username email phone profilePhoto avatar profileCompleted"
          )
          .sort({
            lastContactedAt: -1,
          })
          .limit(20)
          .lean();

      return res.json({
        success: true,
        contacts,
      });
    } catch (error) {
      console.error(
        "Get recently contacted error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load recently contacted users.",
      });
    }
  };

// ==========================================
// GET FAVORITE CONTACTS
// ==========================================

const getFavoriteContacts =
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const contacts =
        await Contact.find({
          owner: userId,
          favorite: true,
        })
          .populate(
            "contact",
            "_id fullName username email phone profilePhoto avatar profileCompleted"
          )
          .sort({
            updatedAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        contacts,
      });
    } catch (error) {
      console.error(
        "Get favorite contacts error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load favorite contacts.",
      });
    }
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getContacts,
  addContact,
  createInvitation,
  removeContact,
  getContactProfile,
  toggleFavorite,
  markRecentlyContacted,
  getRecentlyContacted,
  getFavoriteContacts,
};s