// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import User from "./User.js";
// import { authMiddleware } from "./middleware/auth.js";

// const router = express.Router();


// /**
//  * SSO LOGIN (via A)
//  */
// router.post("/sso/login", async (req, res) => {
//   try {
//     const { ssoToken } = req.body;

//     if (!ssoToken) {
//       return res.status(400).json({ message: "SSO token required" });
//     }

//     // 🔎 Verify token with A
//     const verifyRes = await axios.post(
//       "http://A-SERVER/sso/verify",
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${ssoToken}`,
//         },
//       }
//     );

//     const ssoUser = verifyRes.data.user;

//     // 🔁 Auto-register or link user
//     let user = await User.findOne({ email: ssoUser.email });

//     if (!user) {
//       user = await User.create({
//         name: ssoUser.name,
//         email: ssoUser.email,
//         ssoId: ssoUser.id,
//         provider: "A-SSO",
//       });
//     } else if (!user.ssoId) {
//       // link existing local account
//       user.ssoId = ssoUser.id;
//       user.provider = "A-SSO";
//       await user.save();
//     }

//     // 🔑 B's own token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({
//       message: "SSO login success",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         provider: user.provider,
//       },
//     });
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid SSO token" });
//   }
// });

// /**
//  * REGISTER
//  */
// router.post("/register", async (req, res) => {
//   console.log(req.body, "body")
//   const { name, email, password } = req.body;

//   const exists = await User.findOne({ email });
//   if (exists) return res.status(409).json({ message: "User already exists" });

//   const hashedPassword = await bcrypt.hash(password, 10);

//   await User.create({ name, email, password: hashedPassword });

//   res.json({ message: "Registered successfully" });
// });

// /**
//  * LOGIN
//  */
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) return res.status(401).json({ message: "Invalid credentials" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//   // 🔑 SSO TOKEN
//   const token = jwt.sign(
//     { userId: user._id, email: user.email },
//     process.env.JWT_SECRET,
//     { expiresIn: "1h" }
//   );

//   res.json({
//     token,
//     user: { id: user._id, name: user.name, email: user.email },
//   });
// });

// // routes/auth.js
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.post("/sso/login", async (req, res) => {
//   try {
//     const { ssoToken } = req.body;
    
//     console.log("SSO login request received");
    
//     if (!ssoToken) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "SSO token is required" 
//       });
//     }

//     // 1. Validate the SSO token with App A's backend
//     console.log("Validating token with App A...");
    
//     const validationUrl = `${process.env.APP_A_BACKEND_URL || 'http://localhost:3001'}/api/auth/validate-sso-token`;
    
//     const validationResponse = await axios.get(validationUrl, {
//       params: { 
//         token: ssoToken 
//       },
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log("Validation response:", validationResponse.data);

//     if (!validationResponse.data.valid) {
//       return res.status(401).json({ 
//         success: false, 
//         message: validationResponse.data.message || "Invalid SSO token" 
//       });
//     }

//     const userData = validationResponse.data.user;
//     console.log("User data from App A:", userData);

//     // 2. Find or create user in App B's database
//     let user = await User.findOne({ 
//       $or: [
//         { email: userData.email },
//         { ssoId: userData.id }
//       ]
//     });

//     if (!user) {
//       // Create new user from SSO data
//       console.log("Creating new user from SSO data:", userData.email);
      
//       user = await User.create({
//         email: userData.email,
//         name: userData.name,
//         ssoId: userData.id,
//         ssoProvider: 'app-a',
//         createdAt: new Date(),
//         isSsoUser: true
//       });
      
//       console.log("User created:", user._id);
//     } else {
//       console.log("Existing user found:", user.email);
      
//       // Update user info if needed
//       if (!user.ssoId) {
//         user.ssoId = userData.id;
//         user.ssoProvider = 'app-a';
//         await user.save();
//       }
//     }

//     // 3. Create App B's JWT token
//     const appBToken = jwt.sign(
//       {
//         userId: user._id,
//         email: user.email,
//         name: user.name,
//         isSsoUser: true,
//         ssoProvider: 'app-a'
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRY || "1d" }
//     );

//     // 4. Set cookie for App B
//     res.cookie("token", appBToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//       path: "/"
//     });

//     // 5. Return success response
//     res.status(200).json({
//       success: true,
//       message: "SSO login successful",
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         isSsoUser: true,
//         ssoProvider: 'app-a'
//       },
//       token: appBToken // Optional: can also return token in response
//     });

//   } catch (error) {
//     console.error("SSO login error:", error);

//     // Handle specific errors
//     if (error.response) {
//       // App A validation failed
//       if (error.response.status === 401) {
//         return res.status(401).json({
//           success: false,
//           message: "SSO token validation failed: " + (error.response.data?.message || "Unauthorized")
//         });
//       }
      
//       if (error.response.status === 400) {
//         return res.status(400).json({
//           success: false,
//           message: "Bad request to SSO provider"
//         });
//       }
//     }

//     if (error.code === 'ECONNREFUSED') {
//       return res.status(503).json({
//         success: false,
//         message: "Cannot connect to SSO provider. Please try again later."
//       });
//     }

//     // Generic error
//     res.status(500).json({
//       success: false,
//       message: "SSO authentication failed",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined
//     });
//   }
// });

// /**
//  * Regular login endpoint (for comparison)
//  */
// router.post("/login", async (req, res) => {
//   // Your existing login logic here...
// });

// /**
//  * Get current user
//  */
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "User not found" 
//       });
//     }

//     res.status(200).json({
//       success: true,
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         isSsoUser: user.isSsoUser || false,
//         ssoProvider: user.ssoProvider
//       }
//     });
//   } catch (err) {
//     console.error("ME API ERROR:", err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error" 
//     });
//   }
// });

// /**
//  * Logout endpoint
//  */
// router.post("/logout", (req, res) => {
//   res.clearCookie("token", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//     path: "/"
//   });
  
//   res.status(200).json({
//     success: true,
//     message: "Logged out successfully"
//   });
// });


// export default router;


// In App B's backend (routes/auth.js or similar)
import express from "express";
import jwt from "jsonwebtoken";
import User from "./User.js";
import axios from "axios";
import { authMiddleware, verifySsoToken } from "./middleware/auth.js";

const router = express.Router();

/**
 * SSO LOGIN - Exchange App A's token for App B's session
 */
// router.post("/sso/login", verifySsoToken, async (req, res) => {
//   try {
//     console.log(req.ssoUser,"req.ssoUser")
//     const ssoUser = req.ssoUser;

//     let user = await User.findOne({ email: ssoUser.email });

//     if (!user) {
//       user = await User.create({
//         email: ssoUser.email,
//         name: ssoUser.name,
//         ssoId: ssoUser.userId,
//         isSsoUser: true,
//       });
//     }

//     // 🔑 Create App B session
//     const appBToken = jwt.sign(
//       { userId: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.cookie("token1", appBToken, {
//       httpOnly: true,
//       sameSite: "lax",
//     });

//     res.json({
//       success: true,
//       message: "SSO login successful",
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//       },
//     });
//   } catch (err) {
//     console.error("SSO LOGIN ERROR:", err);
//     res.status(500).json({ success: false, message: "SSO authentication failed" });
//   }
// });
router.post("/sso/login", verifySsoToken, async (req, res) => {
  try {
    const ssoUser = req.ssoUser;

    let user = await User.findOne({ email: ssoUser.email });

    if (!user) {
      user = await User.create({
        email: ssoUser.email,
        name: ssoUser.name || "SSO User",
        ssoId: ssoUser.userId,
        isSsoUser: true,
      });
    }

    // 🔑 Create App B session token
    const appBToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🍪 IMPORTANT: cookie config
    res.cookie("token1", appBToken, {
      httpOnly: true,
      sameSite: "lax",          // localhost friendly
      secure: false,            // true ONLY in HTTPS
      path: "/",                // available everywhere
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json({
      success: true,
      message: "SSO login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (err) {
    console.error("SSO LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "SSO authentication failed",
    });
  }
});

/**
 * Regular login endpoint (for comparison)
 */
router.post("/login", async (req, res) => {
  // Your existing login logic here...
});

/**
 * Get current user
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isSsoUser: user.isSsoUser || false,
        ssoProvider: user.ssoProvider
      }
    });
  } catch (err) {
    console.error("ME API ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

/**
 * Logout endpoint
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  });
  
  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

export default router;