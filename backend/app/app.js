import express from "express";
import usersRouter from "./routes/users.js";
//import authRouter from "./routes/auth.js";
import horsesRouter from "./routes/horses.js";
import medicalRouter from "./routes/medical-records.js";
import tasks from "./routes/tasks.js";
import audit from "./routes/audit.js";

const app = express();

app.use(express.json());

//Sets the url to match with correct script under routes folder
app.use("/horses", horsesRouter);
app.use("/medical-records", medicalRouter);
app.use("/tasks", tasks);
app.use("/audit", audit);
app.use("/users", usersRouter);
//app.use("/auth", authRouter);

export default app;