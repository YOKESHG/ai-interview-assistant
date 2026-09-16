const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const Interview = require("./models/Interview");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const DEV_MODE = process.env.DEV_MODE !== "false";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const MONGODB_URI = process.env.MONGODB_URI;

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map((item) => item.trim())
        : true
}));
app.use(express.json({ limit: "20kb" }));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests. Please wait a moment and try again."
    }
});

app.use("/api/", apiLimiter);

app.use("/api/auth", authRouter);

app.get("/api/interviews", authMiddleware, async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userId })
            .sort({ date: -1 })
            .lean();

        res.json({ interviews });
    } catch (error) {
        console.error("Interview history fetch error:", error.message);
        res.status(500).json({ error: "Unable to load interview history." });
    }
});

app.get("/api/dashboard", authMiddleware, async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userId })
            .sort({ date: -1 })
            .lean();

        const totalInterviews = interviews.length;
        const averageScore = totalInterviews
            ? Number((interviews.reduce((sum, item) => sum + item.score, 0) / totalInterviews).toFixed(1))
            : 0;
        const bestScore = totalInterviews
            ? Math.max(...interviews.map((item) => item.percentage))
            : 0;
        const averagePercentage = totalInterviews
            ? Math.round(interviews.reduce((sum, item) => sum + item.percentage, 0) / totalInterviews)
            : 0;
        const totalCorrect = interviews.reduce((sum, item) => sum + item.correctAnswers, 0);
        const totalPartial = interviews.reduce((sum, item) => sum + item.partialAnswers, 0);
        const totalIncorrect = interviews.reduce((sum, item) => sum + item.incorrectAnswers, 0);
        const totalAnswers = totalCorrect + totalPartial + totalIncorrect;
        const percentage = (value) => totalAnswers ? Math.round((value / totalAnswers) * 100) : 0;

        const technologyPerformance = allowedTechnologies.map((item) => {
            const category = interviews.filter((entry) => entry.technology === item);
            return {
                name: item,
                interviews: category.length,
                average: category.length
                    ? Math.round(category.reduce((sum, entry) => sum + entry.percentage, 0) / category.length)
                    : 0
            };
        });

        const difficultyPerformance = allowedDifficulties.map((item) => {
            const category = interviews.filter((entry) => entry.difficulty === item);
            return {
                name: item,
                interviews: category.length,
                average: category.length
                    ? Math.round(category.reduce((sum, entry) => sum + entry.percentage, 0) / category.length)
                    : 0
            };
        });

        res.json({
            dashboard: {
                totalInterviews,
                averageScore,
                bestScore,
                averagePercentage,
                totalCorrect,
                totalPartial,
                totalIncorrect,
                correctPercentage: percentage(totalCorrect),
                partialPercentage: percentage(totalPartial),
                incorrectPercentage: percentage(totalIncorrect),
                technologyPerformance,
                difficultyPerformance
            }
        });
    } catch (error) {
        console.error("Dashboard fetch error:", error.message);
        res.status(500).json({ error: "Unable to load dashboard data." });
    }
});

app.post("/api/interviews", authMiddleware, async (req, res) => {
    const allowedFinishReasons = ["completed", "time"];
    const technology = cleanText(req.body.technology, 50);
    const difficulty = cleanText(req.body.difficulty, 30);
    const questionLimit = Number(req.body.questionLimit);
    const timeLimit = Number(req.body.timeLimit);
    const score = Number(req.body.score);
    const maxScore = Number(req.body.maxScore);
    const percentage = Number(req.body.percentage);
    const correctAnswers = Number(req.body.correctAnswers);
    const partialAnswers = Number(req.body.partialAnswers);
    const incorrectAnswers = Number(req.body.incorrectAnswers);
    const totalQuestions = Number(req.body.totalQuestions);
    const finishReason = allowedFinishReasons.includes(req.body.finishReason)
        ? req.body.finishReason
        : "completed";

    if (!allowedTechnologies.includes(technology)) {
        return res.status(400).json({ error: "Invalid technology." });
    }

    if (!allowedDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty." });
    }

    const numbers = [
        questionLimit,
        timeLimit,
        score,
        maxScore,
        percentage,
        correctAnswers,
        partialAnswers,
        incorrectAnswers,
        totalQuestions
    ];

    if (numbers.some((value) => !Number.isFinite(value))) {
        return res.status(400).json({ error: "Invalid interview result." });
    }

    if (questionLimit < 1 || questionLimit > 50 || totalQuestions < 1 || totalQuestions > 50) {
        return res.status(400).json({ error: "Invalid question count." });
    }

    if (timeLimit < 1 || timeLimit > 180) {
        return res.status(400).json({ error: "Invalid time limit." });
    }

    if (score < 0 || maxScore < 0 || score > maxScore || percentage < 0 || percentage > 100) {
        return res.status(400).json({ error: "Invalid score values." });
    }

    if (correctAnswers < 0 || partialAnswers < 0 || incorrectAnswers < 0) {
        return res.status(400).json({ error: "Invalid answer statistics." });
    }

    if (correctAnswers + partialAnswers + incorrectAnswers > totalQuestions) {
        return res.status(400).json({ error: "Invalid answer statistics." });
    }

    try {
        const interview = await Interview.create({
            userId: req.userId,
            technology,
            difficulty,
            questionLimit,
            timeLimit,
            score,
            maxScore,
            percentage,
            correctAnswers,
            partialAnswers,
            incorrectAnswers,
            totalQuestions,
            finishReason
        });

        res.status(201).json({
            message: "Interview saved successfully.",
            interview
        });
    } catch (error) {
        console.error("Interview history save error:", error.message);
        res.status(500).json({ error: "Unable to save interview result." });
    }
});

app.delete("/api/interviews", authMiddleware, async (req, res) => {
    try {
        await Interview.deleteMany({ userId: req.userId });
        res.json({ message: "Interview history cleared successfully." });
    } catch (error) {
        console.error("Interview history clear error:", error.message);
        res.status(500).json({ error: "Unable to clear interview history." });
    }
});

const cleanText = (value, maxLength) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
};

const allowedTechnologies = [
    "JavaScript",
    "React",
    "HTML",
    "CSS",
    "Bootstrap"
];

const allowedDifficulties = [
    "Beginner",
    "Intermediate",
    "Advanced"
];

const validateInterviewInput = (body) => {
    const technology = cleanText(body.technology, 50);
    const difficulty = cleanText(body.difficulty, 30);

    if (!allowedTechnologies.includes(technology)) {
        return "Invalid technology.";
    }

    if (!allowedDifficulties.includes(difficulty)) {
        return "Invalid difficulty.";
    }

    return null;
};

const mockQuestions = {
    JavaScript: {
        Beginner: [
            "What is the difference between let, const, and var in JavaScript?",
            "What is a JavaScript function and how do you define one?",
            "What is the difference between == and === in JavaScript?",
            "What is an array in JavaScript and how do you add an item to it?"
        ],
        Intermediate: [
            "Explain closures in JavaScript with a practical example.",
            "What is the event loop in JavaScript?",
            "Explain promises and async/await in JavaScript.",
            "What is the difference between map(), filter(), and reduce()?"
        ],
        Advanced: [
            "Explain the JavaScript prototype chain and inheritance.",
            "How does the JavaScript event loop handle microtasks and macrotasks?",
            "Explain memory management and garbage collection in JavaScript.",
            "What are generators and iterators in JavaScript?"
        ]
    },
    React: {
        Beginner: [
            "What is React and why is it used?",
            "What is a React component?",
            "What are props in React?",
            "What is state in React?"
        ],
        Intermediate: [
            "Explain the useEffect hook and its dependency array.",
            "What is the Virtual DOM in React?",
            "What is the difference between controlled and uncontrolled components?",
            "How does React reconciliation work?"
        ],
        Advanced: [
            "Explain React rendering and reconciliation in detail.",
            "How would you optimize a React application with unnecessary re-renders?",
            "Explain React Server Components at a high level.",
            "What are the tradeoffs of different React state management approaches?"
        ]
    },
    HTML: {
        Beginner: [
            "What is semantic HTML?",
            "What is the difference between div and span?",
            "What is the purpose of HTML forms?",
            "What are HTML attributes?"
        ],
        Intermediate: [
            "Explain the difference between localStorage, sessionStorage, and cookies.",
            "What is accessibility in HTML and why is it important?",
            "Explain the purpose of meta tags.",
            "What is the difference between block and inline elements?"
        ],
        Advanced: [
            "How would you structure a highly accessible complex HTML form?",
            "Explain the role of ARIA and when it should not be used.",
            "How do semantic elements affect accessibility and SEO?",
            "Explain the loading behavior of scripts in an HTML document."
        ]
    },
    CSS: {
        Beginner: [
            "What is the CSS box model?",
            "What is the difference between margin and padding?",
            "What is CSS specificity?",
            "What is the difference between class and id selectors?"
        ],
        Intermediate: [
            "Explain Flexbox and its main alignment properties.",
            "Explain CSS Grid and when you would use it.",
            "What is responsive web design?",
            "How does position: absolute differ from position: relative?"
        ],
        Advanced: [
            "Explain how CSS cascade layers affect specificity.",
            "How would you optimize CSS performance in a large application?",
            "Explain stacking contexts and z-index behavior.",
            "How would you design a scalable CSS architecture for a large application?"
        ]
    },
    Bootstrap: {
        Beginner: [
            "What is Bootstrap and why is it useful?",
            "What is the Bootstrap grid system?",
            "How do Bootstrap utility classes work?",
            "How do you create a Bootstrap button?"
        ],
        Intermediate: [
            "Explain how Bootstrap responsive breakpoints work.",
            "How would you customize Bootstrap components?",
            "What is the difference between Bootstrap containers and container-fluid?",
            "How do Bootstrap flex utilities help build layouts?"
        ],
        Advanced: [
            "How would you customize Bootstrap using Sass in a production project?",
            "How would you reduce unused Bootstrap CSS in a production application?",
            "Explain how Bootstrap's grid system is implemented conceptually.",
            "How would you build a consistent design system on top of Bootstrap?"
        ]
    }
};

const chooseMockQuestion = (technology, difficulty, usedQuestions = []) => {
    const questions =
        mockQuestions[technology]?.[difficulty] ||
        mockQuestions.JavaScript.Beginner;

    const available = questions.filter(
        (question) => !usedQuestions.includes(question)
    );

    if (available.length === 0) {
        return questions[Math.floor(Math.random() * questions.length)];
    }

    return available[Math.floor(Math.random() * available.length)];
};

const mockEvaluate = (question, answer, technology) => {
    const normalizedAnswer = answer.toLowerCase();
    const words = normalizedAnswer.split(/\s+/).filter(Boolean);

    const conceptGroups = {
        JavaScript: [
            ["let", "const", "var"],
            ["closure", "scope"],
            ["promise", "async", "await"],
            ["event", "loop"],
            ["map", "filter", "reduce"],
            ["prototype", "inheritance"],
            ["garbage", "collection"],
            ["generator", "iterator"]
        ],
        React: [
            ["component", "props"],
            ["state", "useState"],
            ["useEffect", "effect", "dependency"],
            ["virtual", "dom"],
            ["controlled", "uncontrolled"],
            ["render", "reconciliation"],
            ["memo", "useMemo", "useCallback"]
        ],
        HTML: [
            ["semantic", "element"],
            ["form", "input"],
            ["accessibility", "aria"],
            ["meta", "seo"],
            ["block", "inline"],
            ["script", "defer", "async"]
        ],
        CSS: [
            ["box", "model"],
            ["margin", "padding"],
            ["specificity"],
            ["flexbox", "flex"],
            ["grid"],
            ["responsive", "media"],
            ["position", "absolute", "relative"],
            ["stacking", "z-index"]
        ],
        Bootstrap: [
            ["grid", "container"],
            ["utility", "class"],
            ["breakpoint", "responsive"],
            ["sass", "customize"],
            ["flex"],
            ["button", "btn"]
        ]
    };

    const groups = conceptGroups[technology] || [];
    const matchedGroups = groups.filter((group) =>
        group.some((keyword) => normalizedAnswer.includes(keyword.toLowerCase()))
    ).length;

    let result = "incorrect";
    let points = 0;

    if (words.length >= 25 && matchedGroups >= 2) {
        result = "correct";
        points = 2;
    } else if (words.length >= 8 && matchedGroups >= 1) {
        result = "partial";
        points = 1;
    }

    const feedback =
        result === "correct"
            ? "Your answer covers the main concepts and provides enough technical detail."
            : result === "partial"
                ? "Your answer shows some understanding, but it should explain the key concepts more completely."
                : "Your answer needs more relevant technical concepts and a clearer explanation.";

    const modelAnswer = `A strong answer should directly explain the main concept in the question, mention the important technical details, and include a short practical example where appropriate.`;

    const improvement =
        result === "correct"
            ? "Make the answer even stronger by adding a concise real-world example and explaining the tradeoffs."
            : "Focus on the definition, the important concepts involved, and one practical example.";

    return {
        result,
        points,
        feedback,
        modelAnswer,
        improvement
    };
};

const generateWithGemini = async (technology, difficulty, usedQuestions) => {
    if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = `
Generate one technical interview question for ${technology} at ${difficulty} difficulty.

Rules:
- Return only one question.
- Do not repeat any question from the used questions list.
- The question should be suitable for a technical interview.
- Do not include the answer.

Used questions:
${usedQuestions.length ? usedQuestions.join("\n") : "None"}
`;

    const interaction = await ai.interactions.create({
        model: MODEL,
        input: prompt,
        response_format: {
            type: "text",
            mime_type: "application/json",
            schema: {
                type: "object",
                properties: {
                    question: {
                        type: "string"
                    }
                },
                required: ["question"]
            }
        },
        store: false
    });

    const responseText = interaction.output_text?.trim();

    if (!responseText) {
        throw new Error("Gemini returned an empty response.");
    }

    const data = JSON.parse(responseText);

    if (!data.question) {
        throw new Error("Gemini response did not contain a question.");
    }

    return cleanText(data.question, 500);
};

const evaluateWithGemini = async (
    technology,
    difficulty,
    question,
    answer
) => {
    if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = `
Evaluate a candidate's answer to a technical interview question.

Technology: ${technology}
Difficulty: ${difficulty}

Question:
${question}

Candidate answer:
${answer}

Evaluation rules:
- correct = accurate and sufficiently complete
- partial = some correct concepts but incomplete or contains notable gaps
- incorrect = fundamentally wrong, irrelevant, or demonstrates insufficient understanding
- points must be 0, 1, or 2
- Give useful technical feedback.
- Provide a strong model answer.
- Give specific improvement advice.
`;

    const interaction = await ai.interactions.create({
        model: MODEL,
        input: prompt,
        response_format: {
            type: "text",
            mime_type: "application/json",
            schema: {
                type: "object",
                properties: {
                    result: {
                        type: "string",
                        enum: ["correct", "partial", "incorrect"]
                    },
                    points: {
                        type: "integer",
                        minimum: 0,
                        maximum: 2
                    },
                    feedback: {
                        type: "string"
                    },
                    modelAnswer: {
                        type: "string"
                    },
                    improvement: {
                        type: "string"
                    }
                },
                required: [
                    "result",
                    "points",
                    "feedback",
                    "modelAnswer",
                    "improvement"
                ]
            }
        },
        store: false
    });

    const responseText = interaction.output_text?.trim();

    if (!responseText) {
        throw new Error("Gemini returned an empty response.");
    }

    const evaluation = JSON.parse(responseText);

    return {
        result: evaluation.result,
        points: Math.min(Math.max(Number(evaluation.points), 0), 2),
        feedback: cleanText(evaluation.feedback, 2000),
        modelAnswer: cleanText(evaluation.modelAnswer, 3000),
        improvement: cleanText(evaluation.improvement, 2000)
    };
};

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        aiMode: DEV_MODE ? "MOCK" : "GEMINI",
        database: mongoose.connection.readyState === 1
            ? "connected"
            : "disconnected"
    });
});

app.post("/api/generate-question", authMiddleware, async (req, res) => {
    const validationError = validateInterviewInput(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const technology = cleanText(req.body.technology, 50);
    const difficulty = cleanText(req.body.difficulty, 30);

    const usedQuestions = Array.isArray(req.body.usedQuestions)
        ? req.body.usedQuestions
            .filter((item) => typeof item === "string")
            .slice(-50)
            .map((item) => cleanText(item, 500))
        : [];

    try {
        let question;

        if (DEV_MODE) {
            question = chooseMockQuestion(
                technology,
                difficulty,
                usedQuestions
            );
        } else {
            question = await generateWithGemini(
                technology,
                difficulty,
                usedQuestions
            );
        }

        res.json({
            question,
            aiMode: DEV_MODE ? "MOCK" : "GEMINI"
        });
    } catch (error) {
        console.error("Question generation error:", error.message);
        res.status(500).json({
            error: "Unable to generate an interview question."
        });
    }
});

app.post("/api/evaluate-answer", authMiddleware, async (req, res) => {
    const validationError = validateInterviewInput(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const technology = cleanText(req.body.technology, 50);
    const difficulty = cleanText(req.body.difficulty, 30);
    const question = cleanText(req.body.question, 1000);
    const answer = cleanText(req.body.answer, 500);

    if (!question) {
        return res.status(400).json({ error: "Question is required." });
    }

    if (!answer) {
        return res.status(400).json({ error: "Answer is required." });
    }

    try {
        const evaluation = DEV_MODE
            ? mockEvaluate(question, answer, technology)
            : await evaluateWithGemini(
                technology,
                difficulty,
                question,
                answer
            );

        res.json({
            ...evaluation,
            aiMode: DEV_MODE ? "MOCK" : "GEMINI"
        });
    } catch (error) {
        console.error("Answer evaluation error:", error.message);
        res.status(500).json({
            error: "Unable to evaluate the answer."
        });
    }
});

const startServer = async () => {
    if (!MONGODB_URI) {
        console.error("MONGODB_URI is not configured.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);

        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(`Backend running on port ${PORT}`);
            console.log(`AI mode: ${DEV_MODE ? "MOCK" : "GEMINI"}`);
            console.log(`Gemini model: ${MODEL}`);
        });
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
        process.exit(1);
    }
};

startServer();