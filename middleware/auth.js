// // middleware/auth.js
// import jwt from "jsonwebtoken";



import jwt from "jsonwebtoken";


// export const authMiddleware = (req, res, next) => {
//   try {
//     // 1. Check for token in cookies first
//     let token = req.cookies?.token;
//     console.log(token)
//     // 2. If not in cookies, check Authorization header (for API calls)
//     if (!token && req.headers.authorization) {
//       const authHeader = req.headers.authorization;
//       if (authHeader.startsWith('Bearer ')) {
//         token = authHeader.substring(7);
//       }
//     }
    
//     if (!token) {
//       return res.status(401).json({ 
//         message: "No authentication token provided" 
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
    
//     next();
//   } catch (err) {
//     console.error("Auth middleware error:", err.message);
    
//     if (err.name === "JsonWebTokenError") {
//       return res.status(401).json({ 
//         message: "Invalid token" 
//       });
//     }
    
//     if (err.name === "TokenExpiredError") {
//       return res.status(401).json({ 
//         message: "Token expired" 
//       });
//     }
    
//     res.status(500).json({ 
//       message: "Authentication failed" 
//     });
//   }
// };
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.token1;
console.log(token,"token")
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};


/**
 * 🔐 Verify SSO token (issued by App A)
 * Used ONLY for /sso/login
 */
export const verifySsoToken = (req, res, next) => {
  const { ssoToken } = req.body;

  // 1️⃣ Check token presence
  if (!ssoToken) {
    return res.status(400).json({ message: "SSO token missing" });
  }

  try {
    // 2️⃣ Verify token signature
    const decoded = jwt.verify(
      ssoToken,
      process.env.SSO_JWT_SECRET
    );

    // 3️⃣ Validate claims
    if (decoded.iss !== "app-a") {
      return res.status(401).json({ message: "Invalid SSO issuer" });
    }

    if (decoded.aud !== "app-b") {
      return res.status(401).json({ message: "Invalid SSO audience" });
    }

    // 4️⃣ Attach user info for next middleware/controller
    req.ssoUser = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name || null,
    };

    next();
  } catch (err) {
    console.error("SSO TOKEN VERIFY ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired SSO token" });
  }
};

