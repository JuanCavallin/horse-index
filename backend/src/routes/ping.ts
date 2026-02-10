// delete this file in the future
import { Router, Response, Request } from "express";
const router = Router();

router.get("/ping", (req: Request, res: Response) => {
  res.json({ message: "Backend is alive!" });
});

export default router;
