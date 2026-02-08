import express from "express";
import cors from "cors";
import pingRouter from "./routes/ping";

//Page routes for backend 
import horsesRouter from "./routes/horses.ts";
import medicalRouter from "./routes/medical-records.ts";
import tasks from "./routes/tasks.ts";
import audit from "./routes/audit.ts";
import usersRouter from "./routes/users.ts";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors()); // enables CORS for any route (later on, change this to specify allowed origins)
app.use(express.json());

// Routes
// Note: Mounting at "/" means your endpoint is http://localhost:3001/ping
app.use("/", pingRouter);
app.use("/horses", horsesRouter);
app.use("/medical-records", medicalRouter);
app.use("/tasks", tasks);
app.use("/audit", audit);
app.use("/users", usersRouter);


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});