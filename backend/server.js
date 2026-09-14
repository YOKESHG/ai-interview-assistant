const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI, Type } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-2.5-flash";

const interviewQuestions = {
    JavaScript: {
        Beginner: [
            "What is JavaScript and where is it commonly used?",
            "What is the difference between let, const, and var?",
            "What are JavaScript data types?",
            "What is a function in JavaScript?",
            "What is an array in JavaScript?",
            "What is an object in JavaScript?",
            "What is the difference between == and ===?",
            "What is the purpose of the return statement?",
            "What is a loop and what types of loops are available in JavaScript?",
            "What is the difference between null and undefined?"
        ],
        Intermediate: [
            "What is the difference between synchronous and asynchronous JavaScript?",
            "What is a Promise in JavaScript?",
            "What is async/await?",
            "What is a callback function?",
            "What is closure in JavaScript?",
            "What is the difference between map(), filter(), and reduce()?",
            "What is destructuring in JavaScript?",
            "What is the spread operator?",
            "What is hoisting in JavaScript?",
            "What is event bubbling?"
        ],
        Advanced: [
            "Explain the JavaScript event loop.",
            "How does the JavaScript execution context work?",
            "What is prototypal inheritance?",
            "Explain the difference between shallow copy and deep copy.",
            "How does garbage collection work in JavaScript?",
            "What are generators in JavaScript?",
            "Explain microtasks and macrotasks.",
            "What are Web Workers and when would you use them?",
            "How does JavaScript handle memory management?",
            "Explain currying and partial application in JavaScript."
        ]
    },

    React: {
        Beginner: [
            "What is React?",
            "What is a component in React?",
            "What is JSX?",
            "What are props in React?",
            "What is state in React?",
            "What is useState?",
            "What is useEffect?",
            "What is the difference between props and state?",
            "Why do we use keys when rendering lists in React?",
            "What is conditional rendering in React?"
        ],
        Intermediate: [
            "What is the Virtual DOM?",
            "How does useEffect work?",
            "What is lifting state up?",
            "What is prop drilling?",
            "What is React Context?",
            "What are controlled components?",
            "What are uncontrolled components?",
            "What is useMemo?",
            "What is useCallback?",
            "What are custom hooks?"
        ],
        Advanced: [
            "Explain how React reconciliation works.",
            "How does React's rendering process work?",
            "What causes unnecessary re-renders in React?",
            "Explain React.memo and when it should be used.",
            "What are concurrent rendering concepts in React?",
            "How would you optimize a large React application?",
            "Explain the difference between useMemo and useCallback.",
            "How would you design a reusable React component architecture?",
            "What are error boundaries in React?",
            "How would you manage complex global state in a React application?"
        ]
    },

    HTML: {
        Beginner: [
            "What is HTML?",
            "What is the purpose of the head element?",
            "What is the difference between div and span?",
            "What are HTML attributes?",
            "What is a hyperlink?",
            "What is an HTML form?",
            "What are headings in HTML?",
            "What is the purpose of the img tag?",
            "What are ordered and unordered lists?",
            "What is semantic HTML?"
        ],
        Intermediate: [
            "What are semantic HTML elements?",
            "What is the difference between localStorage and sessionStorage?",
            "What is the purpose of the data-* attribute?",
            "What is the difference between block and inline elements?",
            "How does form validation work in HTML?",
            "What is the purpose of the viewport meta tag?",
            "What is accessibility in HTML?",
            "What is the difference between id and class?",
            "What are HTML entities?",
            "What is the purpose of the iframe element?"
        ],
        Advanced: [
            "Explain the importance of semantic HTML for accessibility and SEO.",
            "How does the browser parse HTML?",
            "Explain the HTML document loading lifecycle.",
            "How can HTML affect web performance?",
            "What are ARIA attributes?",
            "How would you build an accessible form?",
            "Explain preload, prefetch, and resource hints.",
            "What are Web Components?",
            "Explain the difference between defer and async scripts.",
            "How would you optimize HTML for Core Web Vitals?"
        ]
    },

    CSS: {
        Beginner: [
            "What is CSS?",
            "What is the CSS box model?",
            "What is the difference between margin and padding?",
            "What are CSS selectors?",
            "What is the difference between class and ID selectors?",
            "What is Flexbox?",
            "What is CSS Grid?",
            "What is the position property?",
            "What is the display property?",
            "What is responsive design?"
        ],
        Intermediate: [
            "Explain CSS specificity.",
            "What is the difference between Flexbox and Grid?",
            "What are pseudo-classes?",
            "What are pseudo-elements?",
            "What is a media query?",
            "What is the difference between relative, absolute, fixed, and sticky positioning?",
            "What are CSS variables?",
            "What is the difference between em, rem, %, and px?",
            "What is z-index?",
            "How do you center an element using CSS?"
        ],
        Advanced: [
            "Explain how the CSS cascade works.",
            "How does CSS specificity get calculated?",
            "How would you optimize CSS performance?",
            "Explain layout reflow and repaint.",
            "What is CSS containment?",
            "How would you design a scalable CSS architecture?",
            "Explain responsive design strategies for complex applications.",
            "How does the browser calculate CSS layout?",
            "What are container queries?",
            "How would you debug a complex CSS layout problem?"
        ]
    },

    Bootstrap: {
        Beginner: [
            "What is Bootstrap?",
            "What is the Bootstrap grid system?",
            "What are Bootstrap containers?",
            "What are Bootstrap rows and columns?",
            "What are Bootstrap buttons?",
            "What are Bootstrap cards?",
            "What are Bootstrap utility classes?",
            "How do you create a responsive navbar in Bootstrap?",
            "What are Bootstrap alerts?",
            "How do Bootstrap breakpoints work?"
        ],
        Intermediate: [
            "How does the Bootstrap grid system work?",
            "What are Bootstrap responsive breakpoints?",
            "What is the difference between container and container-fluid?",
            "How do Bootstrap utility classes work?",
            "How can you customize Bootstrap?",
            "What are Bootstrap gutters?",
            "How do you create responsive layouts with Bootstrap?",
            "What are Bootstrap flex utilities?",
            "How do Bootstrap forms work?",
            "What are Bootstrap spacing utilities?"
        ],
        Advanced: [
            "How would you customize Bootstrap using Sass?",
            "How would you optimize Bootstrap for production?",
            "How does Bootstrap's responsive grid work internally?",
            "How would you create a custom Bootstrap theme?",
            "How would you reduce unused Bootstrap CSS?",
            "How would you combine Bootstrap with custom CSS?",
            "What are the advantages and disadvantages of using Bootstrap?",
            "How would you migrate a Bootstrap application between major versions?",
            "How would you design a reusable component system using Bootstrap?",
            "How would you optimize a large Bootstrap-based application?"
        ]
    }
};

app.post("/api/generate-question", async (req, res) => {
    try {
        const { technology, difficulty, usedQuestions = [] } = req.body;

        if (!technology || !difficulty) {
            return res.status(400).json({
                error: "Technology and difficulty are required."
            });
        }

        const prompt = `
You are an expert technical interviewer.

Generate exactly ONE technical interview question.

Technology: ${technology}
Difficulty: ${difficulty}

Previously asked questions:
${usedQuestions.length > 0 ? usedQuestions.join("\n") : "None"}

Requirements:
- Ask a technical interview question about ${technology}.
- Match the ${difficulty} difficulty level.
- Do not repeat or closely duplicate any previously asked question.
- Return only the question.
- Do not provide the answer.
- Do not add numbering.
- Do not add explanations.
`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt
        });

        const question = response.text.trim();

        if (!question) {
            return res.status(500).json({
                error: "Gemini did not return a question."
            });
        }

        res.json({
            question
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to generate interview question."
        });
    }
});

app.post("/api/evaluate-answer", async (req, res) => {
    try {
        const {
            technology,
            difficulty,
            question,
            userAnswer
        } = req.body;

        if (!technology || !difficulty || !question || !userAnswer) {
            return res.status(400).json({
                error: "Technology, difficulty, question, and answer are required."
            });
        }

        const prompt = `
You are an expert technical interviewer evaluating a candidate's answer.

Technology: ${technology}
Difficulty: ${difficulty}

Interview Question:
${question}

Candidate Answer:
${userAnswer}

Evaluate the candidate's answer.

Scoring:
2 points = Correct and demonstrates a good understanding.
1 point = Partially correct but missing important information.
0 points = Incorrect, irrelevant, or demonstrates insufficient understanding.

Provide:
- result
- points
- detailed feedback
- a correct model answer
- one practical improvement suggestion

Return the result strictly according to the provided JSON schema.
`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        result: {
                            type: Type.STRING,
                            enum: ["correct", "partial", "incorrect"]
                        },
                        points: {
                            type: Type.INTEGER,
                            enum: [0, 1, 2]
                        },
                        feedback: {
                            type: Type.STRING
                        },
                        modelAnswer: {
                            type: Type.STRING
                        },
                        improvement: {
                            type: Type.STRING
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
            }
        });

        const evaluation = JSON.parse(response.text);

        res.json(evaluation);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to evaluate answer."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});