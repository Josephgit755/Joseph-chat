const express = require("express");
const mongoose = require("mongoose");

const Business = require("../models/Business");
const BusinessPost = require("../models/BusinessPost");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =========================================================
// CREATE ARTICLE
// PRIVATE
// =========================================================

router.post("/", protect, async (req, res) => {
  try {
    const ownerId = req.user.id;

    const {
      businessId,
      title,
      content,
      excerpt,
      coverImage,
      category,
      isPublic,
      isPublished,
    } = req.body;

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID.",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Article title is required.",
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        message: "Article content is required.",
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      ownerId,
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this business.",
      });
    }

    const post = await BusinessPost.create({
      businessId,
      ownerId,
      title: String(title).trim(),
      content: String(content).trim(),
      excerpt: String(excerpt || "").trim(),
      coverImage: String(coverImage || "").trim(),
      category: String(category || "General").trim(),
      isPublic:
        isPublic !== undefined
          ? Boolean(isPublic)
          : true,
      isPublished:
        isPublished !== undefined
          ? Boolean(isPublished)
          : true,
    });

    return res.status(201).json({
      success: true,
      message: "Article published successfully.",
      post,
    });
  } catch (error) {
    console.error("Create Business Article error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create article.",
    });
  }
});

// =========================================================
// MY ARTICLES
// =========================================================

router.get(
  "/mine/:businessId",
  protect,
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const ownerId = req.user.id;

      if (!isValidObjectId(businessId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business ID.",
        });
      }

      const business = await Business.findOne({
        _id: businessId,
        ownerId,
      });

      if (!business) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized.",
        });
      }

      const posts = await BusinessPost.find({
        businessId,
        ownerId,
      }).sort({
        createdAt: -1,
      });

      return res.json({
        success: true,
        posts,
      });
    } catch (error) {
      console.error("Get business articles error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load articles.",
      });
    }
  }
);

// =========================================================
// PUBLIC ARTICLES FOR BUSINESS
// =========================================================

router.get(
  "/business/:businessId",
  async (req, res) => {
    try {
      const { businessId } = req.params;

      if (!isValidObjectId(businessId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business ID.",
        });
      }

      const business = await Business.findOne({
        _id: businessId,
        isPublic: true,
        isActive: true,
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const posts = await BusinessPost.find({
        businessId,
        isPublic: true,
        isPublished: true,
      })
        .sort({
          createdAt: -1,
        })
        .select(
          "businessId title content excerpt coverImage category views createdAt"
        );

      return res.json({
        success: true,
        posts,
      });
    } catch (error) {
      console.error(
        "Get public business articles error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load articles.",
      });
    }
  }
);

// =========================================================
// PUBLIC ARTICLE DISCOVERY
// =========================================================

router.get("/public", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      businessId = "",
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage =
      Math.max(Number(page) || 1, 1);

    const currentLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const filter = {
      isPublic: true,
      isPublished: true,
    };

    if (businessId) {
      if (!isValidObjectId(businessId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business ID.",
        });
      }

      filter.businessId = businessId;
    }

    if (category.trim()) {
      filter.category = {
        $regex: category.trim(),
        $options: "i",
      };
    }

    if (search.trim()) {
      filter.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          content: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          excerpt: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const skip =
      (currentPage - 1) * currentLimit;

    const total =
      await BusinessPost.countDocuments(filter);

    const posts = await BusinessPost.find(filter)
      .populate(
        "businessId",
        "businessName category logo coverImage isPublic isActive"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(currentLimit);

    const visiblePosts = posts.filter(
      (post) =>
        post.businessId &&
        post.businessId.isPublic &&
        post.businessId.isActive
    );

    return res.json({
      success: true,
      posts: visiblePosts,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(
          total / currentLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Business article discovery error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to discover business articles.",
    });
  }
});

// =========================================================
// UPDATE ARTICLE
// PRIVATE
// =========================================================

router.patch(
  "/:postId",
  protect,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const ownerId = req.user.id;

      if (!isValidObjectId(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid article ID.",
        });
      }

      const post =
        await BusinessPost.findOne({
          _id: postId,
          ownerId,
        });

      if (!post) {
        return res.status(404).json({
          success: false,
          message:
            "Article not found or you are not authorized.",
        });
      }

      const {
        title,
        content,
        excerpt,
        coverImage,
        category,
        isPublic,
        isPublished,
      } = req.body;

      if (title !== undefined) {
        if (!String(title).trim()) {
          return res.status(400).json({
            success: false,
            message: "Title cannot be empty.",
          });
        }

        post.title =
          String(title).trim();
      }

      if (content !== undefined) {
        if (!String(content).trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Content cannot be empty.",
          });
        }

        post.content =
          String(content).trim();
      }

      if (excerpt !== undefined) {
        post.excerpt =
          String(excerpt).trim();
      }

      if (coverImage !== undefined) {
        post.coverImage =
          String(coverImage).trim();
      }

      if (category !== undefined) {
        post.category =
          String(category).trim();
      }

      if (isPublic !== undefined) {
        post.isPublic =
          Boolean(isPublic);
      }

      if (isPublished !== undefined) {
        post.isPublished =
          Boolean(isPublished);
      }

      await post.save();

      return res.json({
        success: true,
        message:
          "Article updated successfully.",
        post,
      });
    } catch (error) {
      console.error(
        "Update business article error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update article.",
      });
    }
  }
);

// =========================================================
// DELETE ARTICLE
// PRIVATE
// =========================================================

router.delete(
  "/:postId",
  protect,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const ownerId = req.user.id;

      const post =
        await BusinessPost.findOneAndDelete({
          _id: postId,
          ownerId,
        });

      if (!post) {
        return res.status(404).json({
          success: false,
          message:
            "Article not found or you are not authorized.",
        });
      }

      return res.json({
        success: true,
        message:
          "Article deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete business article error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete article.",
      });
    }
  }
);

// =========================================================
// ARTICLE VIEW
// PUBLIC
// =========================================================

router.post(
  "/:postId/view",
  async (req, res) => {
    try {
      const { postId } = req.params;

      if (!isValidObjectId(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid article ID.",
        });
      }

      const post =
        await BusinessPost.findOneAndUpdate(
          {
            _id: postId,
            isPublic: true,
            isPublished: true,
          },
          {
            $inc: {
              views: 1,
            },
          },
          {
            new: true,
          }
        );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Article not found.",
        });
      }

      return res.json({
        success: true,
        views: post.views,
      });
    } catch (error) {
      console.error(
        "Business article view error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to record article view.",
      });
    }
  }
);

module.exports = router;