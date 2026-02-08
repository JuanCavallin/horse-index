import express from "express";
import cors from "cors";
import pingRouter from "./routes/ping";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors()); // enables CORS for any route (later on, change this to specify allowed origins)
app.use(express.json());

// Routes
// Note: Mounting at "/" means your endpoint is http://localhost:3001/ping
app.use("/", pingRouter);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});