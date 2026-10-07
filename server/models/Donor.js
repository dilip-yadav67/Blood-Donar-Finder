import mongoose from "mongoose";

const donorSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, trim: true, maxlength: 60 },
  group: { type: String, enum: ["A+","A-","B+","B-","O+","O-","AB+","AB-"] },
  city: { type: String, trim: true, maxlength: 60 },
  lastDonated: Date,
  available: { type: Boolean, default: true },
  isDonor: { type: Boolean, default: false },
  location: { type: { type: String, enum: ["Point"] }, coordinates: [Number] }, // [lng, lat]
  contactLog: [{ by: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

donorSchema.index({ location: "2dsphere" }, { sparse: true });
donorSchema.virtual("eligible").get(function () {
  return !this.lastDonated || Date.now() - this.lastDonated >= 90 * 864e5;
});
export default mongoose.model("Donor", donorSchema);
