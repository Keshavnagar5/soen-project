import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized User - No Token" });
    }

    const isBlacklisted = await redisClient.get(token);
    if (isBlacklisted) {
      res.clearCookie('token'); // clear the expired token
      return res.status(401).json({ error: "Unauthorized User - Token Blacklisted" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.error("Auth Error:", error);

    if (error.name === "TokenExpiredError") {
      res.clearCookie('token');
      return res.status(401).json({ error: "Session expired, please login again" });
    }

    return res.status(401).json({ error: "Unauthorized User - Invalid Token" });
  }
};
