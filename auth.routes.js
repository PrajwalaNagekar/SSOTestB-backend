import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./User.js";
import { authMiddleware } from "./middleware/auth.js";

const router = express.Router();


/**
 * SSO LOGIN (via A)
 */
router.post("/sso/login", async (req, res) => {
  try {
    const { ssoToken } = req.body;

    if (!ssoToken) {
      return res.status(400).json({ message: "SSO token required" });
    }

    // 🔎 Verify token with A
    const verifyRes = await axios.post(
      "http://A-SERVER/sso/verify",
      {},
      {
        headers: {
          Authorization: `Bearer ${ssoToken}`,
        },
      }
    );

    const ssoUser = verifyRes.data.user;

    // 🔁 Auto-register or link user
    let user = await User.findOne({ email: ssoUser.email });

    if (!user) {
      user = await User.create({
        name: ssoUser.name,
        email: ssoUser.email,
        ssoId: ssoUser.id,
        provider: "A-SSO",
      });
    } else if (!user.ssoId) {
      // link existing local account
      user.ssoId = ssoUser.id;
      user.provider = "A-SSO";
      await user.save();
    }

    // 🔑 B's own token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "SSO login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid SSO token" });
  }
});

/**
 * REGISTER
 */
router.post("/register", async (req, res) => {
  console.log(req.body, "body")
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({ name, email, password: hashedPassword });

  res.json({ message: "Registered successfully" });
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // 🔑 SSO TOKEN
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

// routes/auth.js
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
