const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return res.status(401).json({ error: "Authentication required." });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "Authentication is not configured correctly." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({ error: "Invalid authentication token." });
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Your session has expired. Please log in again." });
    }
};

module.exports = authMiddleware;