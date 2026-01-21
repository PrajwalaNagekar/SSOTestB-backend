// B/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },

  // Local login (optional)
  password: { type: String }, // only for B-local users

  // SSO login (optional)
  ssoId: { type: String }, // A user _id
  provider: { type: String }, // "local" | "A-SSO"
});

export default mongoose.model("User", userSchema);
