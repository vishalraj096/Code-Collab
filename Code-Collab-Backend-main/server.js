// HTTP Server Setup
import express from "express";
import cors from "cors";
import userRouter from "./api/user_routes.js";
import collabRouter from "./api/collab_routes.js";
import {connectdb} from "./api/models/db.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);
app.use("/collab", collabRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Helllo",
  });
});

// AI autocomplete feature removed - endpoint disabled to prevent errors
app.post("/complete", async (req, res) => {
  // Feature temporarily disabled
  return res.status(503).json({ 
    completion: null, 
    error: "AI autocomplete feature is currently disabled" 
  });
})




app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  connectdb()
});
