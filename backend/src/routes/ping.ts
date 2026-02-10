// delete this file in the future
import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
const router = Router();

router.get("/ping", (req: AuthRequest, res: Response) => {
  res.json({ message: "Backend is alive!" });
});

export default router;
