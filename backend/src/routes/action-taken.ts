import { Router, Response, Request } from "express";
import { AuthRequest } from "../middleware/auth";
const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Action Taken endpoint works" });
});

export default router;