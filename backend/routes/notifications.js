const express = require("express");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications/:userId - Fetch user's latest notifications
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    // Verify the user is requesting their own notifications
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: "Not authorized to view this user's notifications" });
    }

    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ notifications });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify the user owns this notification
    if (notification.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ message: "Notification marked as read", notification });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read for a user
router.patch("/read-all/:userId", requireAuth, async (req, res) => {
  try {
    // Verify the user is updating their own notifications
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { isRead: true }
    );

    return res.json({ message: "All notifications marked as read" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;