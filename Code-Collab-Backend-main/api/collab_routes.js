import express from "express";
import * as uuid from "uuid";
import CollabSpace from './models/collabModel.js';
import mongoose from 'mongoose';

const collabRouter = express.Router();
collabRouter.use(express.json());

const collection = new Map();

collabRouter.post("/createRoom", async (req, res) => {
  console.log("Full request body:", req.body);
  console.log("Space name received:", req.body.spaceName);
  const collabId = uuid.v4();
  const entry = {
    users: [req.body.name],
    activeUsers: [],
    createdAt: Date.now(),
  };
  collection.set(collabId, entry);

  if (req.body.userId) {
    try {
      const collabSpace = new CollabSpace({
        collabId,
        name: req.body.spaceName || "Untitled Space",
        createdBy: new mongoose.Types.ObjectId(req.body.userId),
      });
      await collabSpace.save();
      console.log("CollabSpace document created in MongoDB");
    } catch (error) {
      console.error("Failed to create CollabSpace document:", error);
    }
  }

  console.log(`Room created at: ${entry.createdAt}`);
  console.log(collection);
  res.json({
    message: "room created",
    collabId: collabId,
  });
});

collabRouter.post("/joinRoom", (req, res) => {
  console.log("Request body:", req.body);
  const userName = req.body.name;
  const collabId = req.body.collabId;
  const hasId = collection.has(collabId);

  if (hasId) {
    const room = collection.get(collabId);
    const currentTime = Date.now();
    const oneHour = 60000 * 60 * 1000;

    if (currentTime - room.createdAt > oneHour) {
      console.log("Link has expired");
      return res.status(403).json({ error: "Link has expired" });
    }

    const oldUsers = room.users;
    const newUsers = [...oldUsers, userName];
    const entry = {
      ...room,
      users: newUsers,
    };
    collection.set(collabId, entry);
    console.log(collection);
    res.status(200).json({
      success: "Joined Space",
      collabId,
    });
  } else {
    res.status(404).json({
      error: "This collabID does not exist",
    });
  }
});

collabRouter.post("/activeHook", (req, res) => {
  console.log("Active hook called with:", req.body);
  const collabId = req.body.collabId;
  const activeUser = req.body.activeUser;

  if (!activeUser || typeof activeUser !== 'string' || activeUser.trim() === "") {
    console.error("Invalid username received:", activeUser);
    return res.status(400).json({ error: "Valid username required" });
  }

  if (!collection.has(collabId)) {
    console.error("Collab ID not found:", collabId);
    return res.status(404).json({ error: "Collab ID not found" });
  }

  const room = collection.get(collabId);
  if (!room.activeUsers) {
    room.activeUsers = [];
  }
  const oldActiveUsers = room.activeUsers;
  const normalizedUser = activeUser.trim();
  // Check for redundant active username
  if (!oldActiveUsers.includes(normalizedUser)) {
    const newActiveUsers = [...oldActiveUsers, normalizedUser];
    const entry = {
      ...room,
      activeUsers: newActiveUsers,
    };
    collection.set(collabId, entry);
    console.log(collection);
    console.log(`Added ${normalizedUser} to active users in ${collabId}`);
    console.log(`Active users now: ${newActiveUsers.join(', ')}`);
    console.log(`Added ${activeUser} to active users in ${collabId}`);
    console.log(`Active users now: ${newActiveUsers.join(', ')}`);
    res.status(200).json({
      message: "Success",
      activeUsers: newActiveUsers
    });
  } else {
    console.log(`User ${normalizedUser} already active in ${collabId}`);
    res.status(200).json({
      message: "User already active",
      activeUsers: oldActiveUsers
    });
  }
});

collabRouter.post("/leftHook", (req, res) => {
  console.log("Left hook called with:", req.body);
  const collabId = req.body.collabId;
  const userLeft = req.body.userLeft;

  if (!userLeft || typeof userLeft !== 'string' || userLeft.trim() === "") {
    console.error("Invalid username received:", userLeft);
    return res.status(400).json({ error: "Valid username required" });
  }

  if (!collection.has(collabId)) {
    console.error("Collab ID not found:", collabId);
    return res.status(404).json({ error: "Collab ID not found" });
  }

  const room = collection.get(collabId);
  if (!room.activeUsers) {
    room.activeUsers = [];
    return res.json({
      success: "User removal not needed (no active users)",
    });
  }
  const oldActiveUsers = room.activeUsers;
  const newActiveUsers = oldActiveUsers.filter((elem) => elem !== userLeft);

  const entry = {
    ...room,
    activeUsers: newActiveUsers,
  };

  collection.set(collabId, entry);
  console.log(collection);

  res.json({
    success: "User left successfully",
    activeUsers: newActiveUsers
  });
});

collabRouter.get("/getActiveUsers", (req, res) => {
  const collabId = req.query.id;

  if (!collection.has(collabId)) {
    return res.status(404).json({ error: "Collab ID not found" });
  }

  const activeUsers = collection.get(collabId).activeUsers;
  res.json(activeUsers);
});

// Add these routes to your existing collabRouter

// Save the current state of a collaboration space
collabRouter.post("/saveSpace", async (req, res) => {
  try {
    const { collabId, name, code, language, userId } = req.body;

    // Check if the collab space already exists
    let collabSpace = await CollabSpace.findOne({ collabId });

    if (collabSpace) {
      // Update existing collab space
      collabSpace.code = code;
      collabSpace.language = language;
      if (name) collabSpace.name = name;

      await collabSpace.save();
    } else {
      // Create new collab space
      collabSpace = new CollabSpace({
        collabId,
        name: name || "Untitled Space",
        code,
        language,
        createdBy: new mongoose.Types.ObjectId(userId),
      });

      await collabSpace.save();
    }

    res.status(200).json({
      message: "Collaboration space saved successfully",
      collabSpace
    });
  } catch (error) {
    console.error("Error saving collab space:", error);
    res.status(500).json({
      message: "Failed to save collaboration space",
      error: error.message
    });
  }
});

// Get all collaboration spaces for a user
collabRouter.get("/getUserSpaces/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const spaces = await CollabSpace.find({
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { participants: new mongoose.Types.ObjectId(userId) }
      ]
    }).sort({ updatedAt: -1 });

    res.status(200).json(spaces);
  } catch (error) {
    console.error("Error fetching user spaces:", error);
    res.status(500).json({
      message: "Failed to fetch collaboration spaces",
      error: error.message
    });
  }
});

// Get a specific collaboration space
collabRouter.get("/getSpace/:collabId", async (req, res) => {
  try {
    const collabId = req.params.collabId;

    const space = await CollabSpace.findOne({ collabId });

    if (!space) {
      return res.status(404).json({
        message: "Collaboration space not found"
      });
    }

    res.status(200).json(space);
  } catch (error) {
    console.error("Error fetching collab space:", error);
    res.status(500).json({
      message: "Failed to fetch collaboration space",
      error: error.message
    });
  }
});

// Delete a collaboration space
collabRouter.delete("/deleteSpace/:collabId", async (req, res) => {
  try {
    const collabId = req.params.collabId;

    const result = await CollabSpace.deleteOne({ collabId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Collaboration space not found"
      });
    }

    res.status(200).json({
      message: "Collaboration space deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting collab space:", error);
    res.status(500).json({
      message: "Failed to delete collaboration space",
      error: error.message
    });
  }
});

// Add this endpoint to rename a collaboration space
collabRouter.put("/renameSpace/:collabId", async (req, res) => {
  try {
    const { collabId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Name cannot be empty"
      });
    }

    const updatedSpace = await CollabSpace.findOneAndUpdate(
      { collabId },
      { name: name.trim() },
      { new: true }
    );

    if (!updatedSpace) {
      return res.status(404).json({
        message: "Collaboration space not found"
      });
    }

    res.status(200).json({
      message: "Collaboration space renamed successfully",
      collabSpace: updatedSpace
    });
  } catch (error) {
    console.error("Error renaming collab space:", error);
    res.status(500).json({
      message: "Failed to rename collaboration space",
      error: error.message
    });
  }
});

export default collabRouter;