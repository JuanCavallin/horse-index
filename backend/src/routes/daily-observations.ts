import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Daily Observations endpoint works" });
});

export default router;