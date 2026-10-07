import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const t = (req.headers.authorization || "").replace("Bearer ", "");
  try {
    req.user = jwt.verify(t, process.env.JWT_SECRET); // { id, phone }
    next();
  } catch {
    res.status(401).json({ error: "Pehle login karo." });
  }
}
