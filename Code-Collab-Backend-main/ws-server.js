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
});


// });
