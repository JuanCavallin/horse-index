// delete this file in the future
import { Router } from "express";
const router = Router();

router.get("/ping", (req, res) => {
  res.json({ message: "Backend is alive!" });
});

export default router;
