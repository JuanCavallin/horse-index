import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Treatments endpoint works" });
});

export default router;