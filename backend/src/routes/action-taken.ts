import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
const router = Router();

router.get("/", (req: AuthRequest, res: Response) => {
  res.json({ message: "Action Taken endpoint works" });
});

export default router;