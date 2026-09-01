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

const addContact = async (req, res) => {
  try {
    const userId = req.body?.userId;
    const contactUserId = req.body?.contactUserId || req.body?.contactId;
    const phone = normalizePhone(req.body?.phone);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const owner = await User.findById(userId).select("_id phone").lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    let contactUser = null;

    if (contactUserId) {
      if (!isValidObjectId(contactUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact ID.",
        });
      }

      if (String(userId) === String(contactUserId)) {
        return res.status(400).json({
          success: false,
          message: "You cannot add yourself as a contact.",
        });
      }

      contactUser = await User.findById(contactUserId);
    }

    if (!contactUser && phone) {
      // Extract key digits (e.g. "677059585" from "+237677059585")
      const rawDigits = phone.replace(/[^\d]/g, "");
      const noLeadingZero = rawDigits.replace(/^0+/, "");
      
      // Get core local number (strips 237 country code if present)
      const coreLocalNumber = noLeadingZero.replace(/^237/, "");

      // Flexible search using Regex to catch any format variant stored in MongoDB
      contactUser = await User.findOne({
        $or: [
          { phone: phone },
          { phone: new RegExp(coreLocalNumber + "$") }, // Matches numbers ending in the core digits
          { phone: rawDigits },
          { phone: `+${rawDigits}` }
        ]
      })
        .select(
          "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
        )
        .lean();
    }

    if (!contactUserId && !phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a phone number to add a contact.",
      });
    }

    if (!contactUser) {
      return res.status(200).json({
        success: true,
        registered: false,
        invitation: true,
        phone,
        message: "This phone number is not registered on ZenvaZapp yet.",
      });
    }

    if (String(userId) === String(contactUser._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a contact.",
      });
    }

    const existingContact = await Contact.findOne({
      owner: userId,
      contact: contactUser._id,
    });

    if (existingContact) {
      return res.status(409).json({
        success: false,
        registered: true,
        message: "This person is already in your contacts.",
        contact: existingContact,
      });
    }

    const contact = await Contact.create({
      owner: userId,
      contact: contactUser._id,
      favorite: false,
      lastContactedAt: null,
    });

    const populatedContact = await Contact.findById(contact._id)
      .populate(
        "contact",
        "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
      )
      .lean();

    return res.status(201).json({
      success: true,
      registered: true,
      invitation: false,
      message: "Contact added successfully.",
      contact: populatedContact,
    });
  } catch (error) {
    console.error("Add contact error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This person is already in your contacts.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to add contact.",
    });
  }
};

const createInvitation = async (req, res) => {
  try {
    const userId = req.body?.userId;
    const phone = normalizePhone(req.body?.phone);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const inviter = await User.findById(userId).select("_id phone").lean();

    if (!inviter) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (normalizePhone(inviter.phone) === phone) {
      return res.status(400).json({
        success: false,
        message: "You cannot invite your own phone number.",
      });
    }

    const registeredUser = await User.findOne({ phone }).select("_id").lean();

    if (registeredUser) {
      return res.status(409).json({
        success: false,
        registered: true,
        invitation: false,
        message: "This phone number is already registered on ZenvaZapp.",
      });
    }

    const invitation = await Invitation.findOneAndUpdate(
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
      message: "Invitation recorded successfully.",
      phone,
      invitationId: invitation._id,
    });
  } catch (error) {
    console.error("Create invitation error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An invitation for this phone number already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create invitation.",
    });
  }
};

const getContacts = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const contacts = await Contact.find({ owner: userId })
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
    console.error("Get contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load contacts.",
    });
  }
};

const removeContact = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId;
    const contactUserId =
      req.body?.contactUserId ||
      req.body?.contactId ||
      req.params?.contactId;

    if (!userId || !contactUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID and contact ID are required.",
      });
    }

    if (!isValidObjectId(userId) || !isValidObjectId(contactUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or contact ID.",
      });
    }

    const deletedContact = await Contact.findOneAndDelete({
      owner: userId,
      contact: contactUserId,
    });

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact was not found.",
      });
    }

    return res.json({
      success: true,
      message: "Contact removed successfully.",
    });
  } catch (error) {
    console.error("Remove contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove contact.",
    });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId;
    const contactUserId =
      req.body?.contactUserId ||
      req.body?.contactId ||
      req.params?.contactId;

    if (!userId || !contactUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID and contact ID are required.",
      });
    }

    if (!isValidObjectId(userId) || !isValidObjectId(contactUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or contact ID.",
      });
    }

    const contact = await Contact.findOne({
      owner: userId,
      contact: contactUserId,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact was not found.",
      });
    }

    contact.favorite = !contact.favorite;
    await contact.save();

    return res.json({
      success: true,
      message: contact.favorite
        ? "Contact added to favorites."
        : "Contact removed from favorites.",
      favorite: contact.favorite,
      contact,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update favorite status.",
    });
  }
};

const getContactProfile = async (req, res) => {
  try {
    const userId = req.query?.userId || req.body?.userId;
    const contactUserId = req.params?.contactId || req.query?.contactId;

    if (!userId || !contactUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID and contact ID are required.",
      });
    }

    if (!isValidObjectId(userId) || !isValidObjectId(contactUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or contact ID.",
      });
    }

    const contact = await Contact.findOne({
      owner: userId,
      contact: contactUserId,
    })
      .populate(
        "contact",
        "_id fullName username email phone profilePhoto avatar profileCompleted gender createdAt lastSeen"
      )
      .lean();

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact was not found.",
      });
    }

    return res.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("Get contact profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load contact profile.",
    });
  }
};

const markRecentlyContacted = async (req, res) => {
  try {
    const userId = req.body?.userId;
    const contactUserId =
      req.body?.contactUserId ||
      req.body?.contactId ||
      req.params?.contactId;

    if (!userId || !contactUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID and contact ID are required.",
      });
    }

    const contact = await Contact.findOne({
      owner: userId,
      contact: contactUserId,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact was not found.",
      });
    }

    contact.lastContactedAt = new Date();
    await contact.save();

    return res.json({
      success: true,
      message: "Recently contacted time updated.",
      contact,
    });
  } catch (error) {
    console.error("Mark recently contacted error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update recently contacted status.",
    });
  }
};

const getRecentlyContacted = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const contacts = await Contact.find({
      owner: userId,
      lastContactedAt: { $ne: null },
    })
      .populate(
        "contact",
        "_id fullName username email phone profilePhoto avatar profileCompleted"
      )
      .sort({ lastContactedAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error("Get recently contacted error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recently contacted users.",
    });
  }
};

const getFavoriteContacts = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const contacts = await Contact.find({
      owner: userId,
      favorite: true,
    })
      .populate(
        "contact",
        "_id fullName username email phone profilePhoto avatar profileCompleted"
      )
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error("Get favorite contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load favorite contacts.",
    });
  }
};

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
};