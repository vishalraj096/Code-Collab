// WS Server Setup
import { Server } from "socket.io";
import axios from 'axios';

const io = new Server(4001, {
  cors: {
    origin: "*",
  },
  pingTimeout: 30000000,
});

io.on("connection", (socket) => {
  console.log(`New connection`);
  socket.collabId = null;
  // handle room-join
  socket.on("join-room", async (message) => {
    console.log(
      `${socket.id} joined collab ${message.collabId} with username ${message.user || 'Guest'}`
    );
    socket.collabId = message.collabId;
    socket.join(message.collabId);
    // socket.broadcast.to(message.collabId).emit("user-joined", message.user);
    if (message.user && typeof message.user === 'string' && message.user.trim() !== '') {
      // Store socket data first so it's available for disconnect
      socket.userData = {
        name: message.user,
        collabId: message.collabId
      };

      // Then broadcast the join
      socket.broadcast.to(message.collabId).emit("user-joined", message.user);

      // Make active hook call after setting userData
      try {
        const response = await fetch("http://localhost:4000/collab/activeHook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activeUser: message.user,
            collabId: message.collabId,
          }),
        });

        if (!response.ok) {
          console.error("Failed to update active users:", await response.text());
        }
      } catch (e) {
        console.error("Failed to call activeHook:", e);
      }

      try {
        // Get current code state from database
        console.log(`Fetching initial state for ${message.collabId}...`);
        const response = await axios.get(`http://localhost:4000/collab/getSpace/${message.collabId}`);

        console.log("Response from getSpace:", response.status,
          response.data ? "Data received" : "No data received");

        if (response.data) {
          // Log what we're sending
          console.log(`Sending initial state to ${message.user}:`, {
            codeLength: response.data.code ? response.data.code.length : 0,
            language: response.data.language,
            name: response.data.name
          });

          // Send the current state only to the socket that just joined
          socket.emit("initial-code-state", {
            code: response.data.code || "",
            language: response.data.language || { name: "javascript", val: "js" },
            name: response.data.name || "Untitled Space"
          });
          console.log(`Sent initial code state to ${message.user}`);
        } else {
          console.log(`No data found for space ${message.collabId}`);
          // Send empty defaults
          socket.emit("initial-code-state", {
            code: "",
            language: { name: "javascript", val: "js" },
            name: "Untitled Space"
          });
        }
      } catch (error) {
        console.error("Failed to send initial code state:", error);
        // Send empty defaults on error
        socket.emit("initial-code-state", {
          code: "",
          language: { name: "javascript", val: "js" },
          name: "Untitled Space"
        });
      }
    }
  });

  socket.on("send-code-change", (codeChange) => {
    if (socket.collabId) {
      socket.broadcast
        .to(socket.collabId)  // Use socket.collabId instead
        .emit("receive-code-change", codeChange);
      console.log(`${codeChange.user.name} wrote code`);
    }
  });

  socket.on("send-left-room", async (userLeft, codeState, languageState, userId) => {
    console.log(`${userLeft} left the room`);

    // Use socket.collabId instead of message.collabId
    if (socket.collabId) {
      socket.broadcast.to(socket.collabId).emit("receive-left-room", userLeft);

      // Save the current state when user leaves
      if (codeState) {
        try {
          await axios.post("http://localhost:4000/collab/saveSpace", {
            collabId: socket.collabId,  // Fixed reference
            code: codeState,
            language: languageState,
            userId: userId
          });
        } catch (error) {
          console.log("Failed to save collab state:", error);
        }
      }

      // Existing leftHook code
      try {
        await fetch("http://localhost:4000/collab/leftHook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userLeft: userLeft,
            collabId: socket.collabId,  // Fixed reference
          }),
        });
      } catch (e) {
        console.log("crashed 62");
        console.log(e);
      }
    } else {
      console.log("Cannot process 'left room' event: collabId not set on socket");
    }
  });

  // Add this socket disconnect handler 
  socket.on("disconnect", async () => {
    if (socket.userData) {
      console.log(`User ${socket.userData.name} disconnected from ${socket.userData.collabId}`);
      try {
        // Clean up the user from activeUsers list
        const response = await fetch("http://localhost:4000/collab/leftHook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userLeft: socket.userData.name,
            collabId: socket.userData.collabId,
          }),
        });

        if (!response.ok) {
          console.error("Failed to process user leaving:", await response.text());
        }

        // Notify others
        socket.broadcast.to(socket.userData.collabId).emit(
          "receive-left-room",
          socket.userData.name
        );
      } catch (e) {
        console.error("Error in disconnect handler:", e);
      }
    }
  });

  // Add after the other socket event handlers
  socket.on("save-collab-space", async (data) => {
    try {
      await axios.post("http://localhost:4000/collab/saveSpace", {
        collabId: data.collabId,
        name: data.name,
        code: data.code,
        language: data.language,
        userId: data.userId
      });

      socket.emit("collab-space-saved", { success: true });
    } catch (error) {
      console.log("Failed to save collab space:", error);
      socket.emit("collab-space-saved", { success: false, error: error.message });
    }
  });

  socket.on("space-renamed", (data) => {
    console.log(`Space ${data.collabId} renamed to "${data.newName}" by ${data.renamedBy}`);

    if (socket.collabId) {
      // Broadcast to all other users in the room
      socket.broadcast
        .to(socket.collabId)
        .emit("space-renamed", {
          newName: data.newName,
          renamedBy: data.renamedBy
        });
    }
  });

  socket.on("lang-change", async (changedLang, changedByUser) => {
    console.log(`${changedByUser} changed language to ${changedLang.name}`);

    if (socket.collabId) {
      socket.broadcast
        .to(socket.collabId)
        .emit("lang-change", changedLang, changedByUser);
    }
  });
});


// });
