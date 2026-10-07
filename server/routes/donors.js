import { Router } from "express";
import rateLimit from "express-rate-limit";
import Donor from "../models/Donor.js";
import requireAuth from "../middleware/auth.js";

const r = Router();
const GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const revealLimit = rateLimit({ windowMs: 864e5, max: 20, keyGenerator: (req) => req.user.id, message: { error: "Aaj ke 20 contact reveal poore ho gaye." } });

// ~1 km fuzzing so the exact home location is never stored or exposed
const fuzz = (v) => Math.round(v * 100) / 100;
const publicView = (d) => ({ id: d.id, name: d.name, group: d.group, city: d.city, distanceKm: d.distanceKm });

r.get("/search", async (req, res, next) => {
  try {
    const { group, city } = req.query;
    const lat = parseFloat(req.query.lat), lng = parseFloat(req.query.lng);
    const km = Math.min(parseFloat(req.query.km) || 25, 200);
    const q = { isDonor: true, available: true };
    if (GROUPS.includes(group)) q.group = group;

    let docs;
    if (!isNaN(lat) && !isNaN(lng)) {
      const rows = await Donor.aggregate([
        { $geoNear: { near: { type: "Point", coordinates: [lng, lat] }, distanceField: "dist", maxDistance: km * 1000, query: q, spherical: true } },
        { $limit: 50 },
      ]);
      docs = rows.map((d) => Object.assign(Donor.hydrate(d), { distanceKm: Math.round(d.dist / 100) / 10 }));
    } else {
      if (city) q.city = new RegExp(String(city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      docs = await Donor.find(q).limit(50);
    }
    res.json(docs.filter((d) => d.eligible).map(publicView));
  } catch (e) { next(e); }
});

r.get("/me", requireAuth, async (req, res) => {
  const d = await Donor.findById(req.user.id);
  if (!d) return res.status(404).json({ error: "Profile nahi mili." });
  res.json({ phone: d.phone, name: d.name, group: d.group, city: d.city, lastDonated: d.lastDonated, available: d.available, isDonor: d.isDonor });
});

r.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, group, city, lastDonated, available, lat, lng } = req.body;
    if (!name?.trim() || !GROUPS.includes(group) || !city?.trim()) return res.status(400).json({ error: "Naam, blood group aur sheher zaroori hain." });
    const set = { name: name.trim(), group, city: city.trim(), available: available !== false, isDonor: true, lastDonated: lastDonated || null };
    if (typeof lat === "number" && typeof lng === "number") set.location = { type: "Point", coordinates: [fuzz(lng), fuzz(lat)] };
    await Donor.findByIdAndUpdate(req.user.id, set);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.delete("/me", requireAuth, async (req, res) => {
  await Donor.findByIdAndDelete(req.user.id);
  res.json({ ok: true });
});

r.post("/:id/contact", requireAuth, revealLimit, async (req, res, next) => {
  try {
    const d = await Donor.findOne({ _id: req.params.id, isDonor: true, available: true });
    if (!d) return res.status(404).json({ error: "Donor available nahi hai." });
    d.contactLog.push({ by: req.user.phone });
    await d.save();
    res.json({ phone: d.phone });
  } catch (e) { next(e); }
});

export default r;
