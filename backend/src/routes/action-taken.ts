import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Action Taken endpoint works" });
});

export default router;