import jwt from "jsonwebtoken";
import "dotenv/config";

export const authMiddleware = (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    const authHeader = req?.headers?.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. No token
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Not authorized. No token provided",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user to request
    req.body.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      status: "failed",
      message: "Not authorized. Invalid token",
    });
  }
};
