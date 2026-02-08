import express from "express";
import cors from "cors";

import pingRouter from "./routes/ping";
import usersRouter from "./routes/users";
import horsesRouter from "./routes/horses";
import medicalRecordsRouter from "./routes/medical-records";
import treatmentsRouter from "./routes/treatments";
import actionTakenRouter from "./routes/action-taken";
import dailyObsRouter from "./routes/daily-observations";
import auditLogsRouter from "./routes/audit-trail";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
// Increase JSON body size limit to 50MB to accommodate base64-encoded images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/", pingRouter);
app.use("/api/users", usersRouter);
app.use("/api/horses", horsesRouter);
app.use("/api/medical-records", medicalRecordsRouter);
app.use("/api/treatments", treatmentsRouter);
app.use("/api/action-taken", actionTakenRouter);
app.use("/api/daily-observations", dailyObsRouter);
app.use("/api/audit_logs", auditLogsRouter);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
