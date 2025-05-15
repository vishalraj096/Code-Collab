import express from "express";
import * as uuid from "uuid";

const collabRouter = express.Router();
collabRouter.use(express.json());

const collection = new Map();

collabRouter.post("/createRoom", (req, res) => {
  console.log(req.body);
  const collabId = uuid.v4();
  const entry = {
    users: [req.body.name],
    activeUsers: [],
    createdAt: Date.now(), // Store the creation time
  };
  collection.set(collabId, entry);
  console.log(`Room created at: ${entry.createdAt}`); // Log the creation time
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
    const tenMinutes = 100 * 60 * 1000; // Set to 10 minutes

    // Debug logs
    console.log(`Room object: ${JSON.stringify(room)}`);
    console.log(`Room created at: ${room.createdAt}`);
    console.log(`Current time: ${currentTime}`);
    console.log(`Time difference: ${currentTime - room.createdAt}`);
    console.log(`Expiration time: ${tenMinutes}`);

    if (currentTime - room.createdAt > tenMinutes) {
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
  const collabId = req.body.collabId;
  const activeUser  = req.body.activeUser ;

  if (!collection.has(collabId)) {
    return res.status(404).json({ error: "Collab ID not found" });
  }

  const room = collection.get(collabId);
  const oldActiveUsers = room.activeUsers;

  // Check for redundant active username
  if (!oldActiveUsers.includes(activeUser )) {
    const newActiveUsers = [...oldActiveUsers, activeUser ];
    const entry = {
      ...room,
      activeUsers: newActiveUsers,
    };
    collection.set(collabId, entry);
    console.log(collection);
    res.status(200).json({
      message: "Success",
    });
  } else {
    console.log("User  already exists, skipping");
    res.status(200).json({
      message: "User  already active",
    });
  }
});

collabRouter.post("/leftHook", (req, res) => {
  const collabId = req.body.collabId;
  const userLeft = req.body.userLeft;

  if (!collection.has(collabId)) {
    return res.status(404).json({ error: "Collab ID not found" });
  }

  const room = collection.get(collabId);
  const oldActiveUsers = room.activeUsers;
  const newActiveUsers = oldActiveUsers.filter((elem) => elem !== userLeft);

  const entry = {
    ...room,
    activeUsers: newActiveUsers,
  };

  collection.set(collabId, entry);
  console.log(collection);

  res.json({
    success: "User  left successfully",
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

export default collabRouter;