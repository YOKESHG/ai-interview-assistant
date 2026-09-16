const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        technology: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            required: true
        },
        questionLimit: {
            type: Number,
            required: true
        },
        timeLimit: {
            type: Number,
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        maxScore: {
            type: Number,
            required: true
        },
        percentage: {
            type: Number,
            required: true
        },
        correctAnswers: {
            type: Number,
            required: true
        },
        partialAnswers: {
            type: Number,
            required: true
        },
        incorrectAnswers: {
            type: Number,
            required: true
        },
        totalQuestions: {
            type: Number,
            required: true
        },
        finishReason: {
            type: String,
            enum: ["completed", "time"],
            default: "completed"
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Interview", interviewSchema);