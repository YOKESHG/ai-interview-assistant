const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const cleanText = (value, maxLength) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
};

router.post("/register", async (req, res) => {
    const name = cleanText(req.body.name, 100);
    const email = cleanText(req.body.email, 150).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name) {
        return res.status(400).json({ error: "Name is required." });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    if (password.length > 100) {
        return res.status(400).json({ error: "Password must not exceed 100 characters." });
    }

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration successful.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        res.status(500).json({ error: "Unable to create your account." });
    }
});

router.post("/login", async (req, res) => {
    const email = cleanText(req.body.email, 150).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (!password) {
        return res.status(400).json({ error: "Password is required." });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "Authentication is not configured correctly." });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: "Unable to log in." });
    }
});

module.exports = router;