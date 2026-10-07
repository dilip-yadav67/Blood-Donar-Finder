import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import Otp from "../models/Otp.js";
import Donor from "../models/Donor.js";
import { sendSms } from "../utils/sms.js";

const r = Router();
const phoneOk = (p) => /^[6-9]\d{9}$/.test(p || "");
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: "Bahut zyada OTP requests. 15 min baad try karo." } });

r.post("/send-otp", limiter, async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phoneOk(phone)) return res.status(400).json({ error: "Sahi 10 digit number daalo." });
    const otp = String(crypto.randomInt(100000, 1000000));
    await Otp.deleteMany({ phone });
    await Otp.create({ phone, hash: await bcrypt.hash(otp, 8) });
    await sendSms(phone, otp);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.post("/verify-otp", async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phoneOk(phone) || !/^\d{6}$/.test(otp || "")) return res.status(400).json({ error: "Phone ya OTP galat hai." });
    const rec = await Otp.findOne({ phone });
    if (!rec) return res.status(400).json({ error: "OTP expire ho gaya. Naya mangao." });
    if (rec.attempts >= 5) { await rec.deleteOne(); return res.status(429).json({ error: "Bahut galat attempts. Naya OTP mangao." }); }
    if (!(await bcrypt.compare(otp, rec.hash))) {
      rec.attempts++; await rec.save();
      return res.status(400).json({ error: "OTP galat hai." });
    }
    await rec.deleteOne();
    const user = await Donor.findOneAndUpdate({ phone }, { $setOnInsert: { phone } }, { upsert: true, new: true });
    const token = jwt.sign({ id: user.id, phone }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token });
  } catch (e) { next(e); }
});

export default r;
