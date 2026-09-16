import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const TECHNOLOGIES = ["JavaScript", "React", "HTML", "CSS", "Bootstrap"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const QUESTION_OPTIONS = [5, 10, 15];
const TIME_OPTIONS = [10, 15, 20];

function App() {
    const [technology, setTechnology] = useState("JavaScript");
    const [difficulty, setDifficulty] = useState("Beginner");
    const [questionLimit, setQuestionLimit] = useState(10);
    const [timeLimit, setTimeLimit] = useState(15);

    const [generatedQuestion, setGeneratedQuestion] = useState("");
    const [userAnswer, setUserAnswer] = useState("");
    const [aiFeedback, setAiFeedback] = useState("");
    const [modelAnswer, setModelAnswer] = useState("");
    const [improvement, setImprovement] = useState("");

    const [generatingQuestion, setGeneratingQuestion] = useState(false);
    const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);

    const [questionNumber, setQuestionNumber] = useState(0);
    const [score, setScore] = useState(0);

    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [partialAnswers, setPartialAnswers] = useState(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState(0);

    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewFinished, setInterviewFinished] = useState(false);
    const [answerEvaluated, setAnswerEvaluated] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [finishReason, setFinishReason] = useState("completed");

    const [registeredUser, setRegisteredUser] = useState(() => {
        const savedUser = localStorage.getItem("registeredUser");
        if (!savedUser) return null;
        try {
            return JSON.parse(savedUser);
        } catch {
            return null;
        }
    });
    const [registrationName, setRegistrationName] = useState("");
    const [registrationEmail, setRegistrationEmail] = useState("");
    const [registrationPassword, setRegistrationPassword] = useState("");
    const [registrationError, setRegistrationError] = useState("");
    const [registrationSuccess, setRegistrationSuccess] = useState("");
    const [registering, setRegistering] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const [usedQuestions, setUsedQuestions] = useState([]);
    const [questionResults, setQuestionResults] = useState([]);

    const [interviewHistory, setInterviewHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    const totalQuestions = questionLimit;
    const maxScore = totalQuestions * 2;

    const registerUser = async (event) => {
        event.preventDefault();
        setRegistrationError("");
        setRegistrationSuccess("");

        if (!registrationName.trim()) {
            setRegistrationError("Please enter your name.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationEmail.trim())) {
            setRegistrationError("Please enter a valid email address.");
            return;
        }

        if (registrationPassword.length < 8) {
            setRegistrationError("Password must be at least 8 characters.");
            return;
        }

        setRegistering(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: registrationName,
                    email: registrationEmail,
                    password: registrationPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed.");
            }

            setRegistrationName("");
            setRegistrationEmail("");
            setRegistrationPassword("");
            setLoginEmail(data.user.email);
            setRegistrationSuccess("Account created successfully. Please log in to continue.");
            setAuthMode("login");
        } catch (error) {
            setRegistrationError(error.message);
        } finally {
            setRegistering(false);
        }
    };

    const loginUser = async (event) => {
        event.preventDefault();
        setLoginError("");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
            setLoginError("Please enter a valid email address.");
            return;
        }

        if (!loginPassword) {
            setLoginError("Please enter your password.");
            return;
        }

        setLoggingIn(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed.");
            }

            localStorage.setItem("authToken", data.token);
            localStorage.setItem("registeredUser", JSON.stringify(data.user));
            localStorage.removeItem("interviewHistory");
            setRegisteredUser(data.user);
            setLoginPassword("");
            setLoginError("");
        } catch (error) {
            setLoginError(error.message);
        } finally {
            setLoggingIn(false);
        }
    };

    const handleUnauthorized = (message) => {
        logoutUser();
        return new Error(message || "Your session has expired. Please log in again.");
    };

    const loadInterviewHistory = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            logoutUser();
            return;
        }

        setHistoryLoading(true);
        setHistoryError("");

        try {
            const response = await fetch(`${API_URL}/api/interviews`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.status === 401) {
                throw handleUnauthorized(data.error);
            }

            if (!response.ok) {
                throw new Error(data.error || "Unable to load interview history.");
            }

            setInterviewHistory(data.interviews || []);
        } catch (error) {
            setHistoryError(error.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadDashboard = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            logoutUser();
            return;
        }

        setDashboardLoading(true);
        setHistoryError("");

        try {
            const response = await fetch(`${API_URL}/api/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.status === 401) {
                throw handleUnauthorized(data.error);
            }

            if (!response.ok) {
                throw new Error(data.error || "Unable to load dashboard data.");
            }

            setDashboardData(data.dashboard);
        } catch (error) {
            setHistoryError(error.message);
        } finally {
            setDashboardLoading(false);
        }
    };

    useEffect(() => {
        if (registeredUser) {
            loadInterviewHistory();
            loadDashboard();
        } else {
            setInterviewHistory([]);
            setDashboardData(null);
        }
    }, [registeredUser]);

    const logoutUser = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("registeredUser");
        setRegisteredUser(null);
        setInterviewStarted(false);
        setInterviewFinished(false);
        setGeneratedQuestion("");
        setUserAnswer("");
        setAiFeedback("");
        setModelAnswer("");
        setImprovement("");
        setQuestionNumber(0);
        setScore(0);
        setCorrectAnswers(0);
        setPartialAnswers(0);
        setIncorrectAnswers(0);
        setUsedQuestions([]);
        setQuestionResults([]);
        setTimeLeft(0);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
        const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    };

    const timerClass = timeLeft <= 60 ? "text-danger" : "text-primary";

    useEffect(() => {
        if (!interviewStarted || interviewFinished) return;

        const timer = setInterval(() => {
            setTimeLeft((current) => Math.max(current - 1, 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [interviewStarted, interviewFinished]);

    useEffect(() => {
        if (interviewStarted && timeLeft === 0) {
            finishInterview("time");
        }
    }, [timeLeft, interviewStarted]);

    useEffect(() => {
        if (userAnswer.trim() !== "") {
            setAiFeedback("");
            setModelAnswer("");
            setImprovement("");
            setAnswerEvaluated(false);
        }
    }, [userAnswer]);

    const callGenerateQuestion = async (questionsUsed) => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            logoutUser();
            throw new Error("Your session has ended. Please log in again.");
        }

        const response = await fetch(`${API_URL}/api/generate-question`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                technology,
                difficulty,
                usedQuestions: questionsUsed
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            logoutUser();
            throw new Error(data.error || "Your session has expired. Please log in again.");
        }

        if (!response.ok) {
            throw new Error(data.error || "Failed to generate question");
        }

        return data;
    };

    const startInterview = async () => {
        setInterviewStarted(true);
        setInterviewFinished(false);
        setQuestionNumber(1);
        setScore(0);
        setCorrectAnswers(0);
        setPartialAnswers(0);
        setIncorrectAnswers(0);
        setUsedQuestions([]);
        setQuestionResults([]);
        setGeneratedQuestion("");
        setUserAnswer("");
        setAiFeedback("");
        setModelAnswer("");
        setImprovement("");
        setAnswerEvaluated(false);
        setFinishReason("completed");
        setTimeLeft(timeLimit * 60);
        setGeneratingQuestion(true);

        try {
            const data = await callGenerateQuestion([]);
            setGeneratedQuestion(data.question);
            setUsedQuestions([data.question]);
        } catch (error) {
            setAiFeedback(error.message);
            setInterviewStarted(false);
        } finally {
            setGeneratingQuestion(false);
        }
    };

    const evaluateAnswer = async () => {
        if (!userAnswer.trim()) {
            setAiFeedback("Please enter your answer before submitting.");
            return;
        }

        if (timeLeft === 0) return;

        setEvaluatingAnswer(true);
        setAiFeedback("");
        setModelAnswer("");
        setImprovement("");

        try {
            const token = localStorage.getItem("authToken");

            if (!token) {
                logoutUser();
                throw new Error("Your session has ended. Please log in again.");
            }

            const response = await fetch(`${API_URL}/api/evaluate-answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    technology,
                    difficulty,
                    question: generatedQuestion,
                    answer: userAnswer
                })
            });

            const data = await response.json();

            if (response.status === 401) {
                logoutUser();
                throw new Error(data.error || "Your session has expired. Please log in again.");
            }

            if (!response.ok) {
                throw new Error(data.error || "Failed to evaluate answer");
            }

            setAiFeedback(data.feedback);
            setModelAnswer(data.modelAnswer);
            setImprovement(data.improvement);
            setAnswerEvaluated(true);

            setScore((previous) => previous + data.points);

            if (data.result === "correct") {
                setCorrectAnswers((previous) => previous + 1);
            } else if (data.result === "partial") {
                setPartialAnswers((previous) => previous + 1);
            } else {
                setIncorrectAnswers((previous) => previous + 1);
            }

            setQuestionResults((previous) => [
                ...previous,
                {
                    questionNumber,
                    question: generatedQuestion,
                    answer: userAnswer,
                    result: data.result,
                    points: data.points,
                    feedback: data.feedback,
                    modelAnswer: data.modelAnswer,
                    improvement: data.improvement
                }
            ]);
        } catch (error) {
            setAiFeedback(error.message);
        } finally {
            setEvaluatingAnswer(false);
        }
    };

    const nextQuestion = async () => {
        if (questionNumber >= totalQuestions) {
            finishInterview("completed");
            return;
        }

        setUserAnswer("");
        setAiFeedback("");
        setModelAnswer("");
        setImprovement("");
        setAnswerEvaluated(false);
        setGeneratingQuestion(true);

        try {
            const data = await callGenerateQuestion(usedQuestions);
            setGeneratedQuestion(data.question);
            setUsedQuestions((previous) => [...previous, data.question]);
            setQuestionNumber((previous) => previous + 1);
        } catch (error) {
            setAiFeedback(error.message);
        } finally {
            setGeneratingQuestion(false);
        }
    };

    const finishInterview = (reason = "completed") => {
        const percentage = Math.round((score / maxScore) * 100);

        const interview = {
            id: Date.now(),
            technology,
            difficulty,
            questionLimit: totalQuestions,
            timeLimit,
            score,
            maxScore,
            percentage,
            correctAnswers,
            partialAnswers,
            incorrectAnswers,
            totalQuestions,
            date: new Date().toISOString(),
            finishReason: reason
        };

        const saveInterview = async () => {
            const token = localStorage.getItem("authToken");

            if (!token) {
                logoutUser();
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/interviews`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(interview)
                });

                const data = await response.json();

                if (response.status === 401) {
                    throw handleUnauthorized(data.error);
                }

                if (!response.ok) {
                    throw new Error(data.error || "Unable to save interview result.");
                }

                setInterviewHistory((previous) => [data.interview, ...previous]);
                loadDashboard();
            } catch (error) {
                setHistoryError(error.message);
            }
        };

        setHistoryError("");
        saveInterview();
        setFinishReason(reason);
        setInterviewFinished(true);
        setInterviewStarted(false);
        setGeneratingQuestion(false);
        setEvaluatingAnswer(false);
    };

    const restartInterview = () => {
        setInterviewStarted(false);
        setInterviewFinished(false);
        setGeneratedQuestion("");
        setUserAnswer("");
        setAiFeedback("");
        setModelAnswer("");
        setImprovement("");
        setQuestionNumber(0);
        setScore(0);
        setCorrectAnswers(0);
        setPartialAnswers(0);
        setIncorrectAnswers(0);
        setAnswerEvaluated(false);
        setUsedQuestions([]);
        setQuestionResults([]);
        setTimeLeft(0);
        setFinishReason("completed");
    };

    const clearHistory = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            logoutUser();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/interviews`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.status === 401) {
                throw handleUnauthorized(data.error);
            }

            if (!response.ok) {
                throw new Error(data.error || "Unable to clear interview history.");
            }

            setInterviewHistory([]);
            setDashboardData(null);
            setHistoryError("");
            loadDashboard();
        } catch (error) {
            setHistoryError(error.message);
        }
    };

    const formatHistoryDate = (date) => new Date(date).toLocaleString();

    const dashboard = dashboardData || {
        totalInterviews: 0,
        averageScore: 0,
        bestScore: 0,
        averagePercentage: 0,
        totalCorrect: 0,
        totalPartial: 0,
        totalIncorrect: 0,
        correctPercentage: 0,
        partialPercentage: 0,
        incorrectPercentage: 0,
        technologyPerformance: [],
        difficultyPerformance: []
    };

    const getPerformanceLabel = (percentage) => {
        if (percentage >= 80) return "Excellent";
        if (percentage >= 60) return "Good";
        if (percentage >= 40) return "Needs Practice";
        return "Needs Improvement";
    };

    return (
        <div className="app-shell min-vh-100 py-4 py-md-5">
            <div className="container app-container">
                <header className="text-center mb-5">
                    <div className="brand-badge mb-3">AI • INTERVIEW • ASSISTANT</div>
                    <h1 className="display-5 fw-bold mb-2">
                        AI Interview Assistant
                    </h1>
                    <p className="lead text-secondary mb-0">
                        Practice technical interviews with AI-powered evaluation,
                        analytics, and timed sessions.
                    </p>
                </header>

                {!interviewStarted && !interviewFinished && !registeredUser && authMode === "login" && (
                    <section className="card app-card border-0 rounded-4 p-4 p-md-5 mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
                        <div className="section-heading mb-4">
                            <div>
                                <p className="eyebrow mb-1">WELCOME BACK</p>
                                <h2 className="h3 fw-bold mb-0">Login to continue</h2>
                            </div>
                        </div>
                        {loginError && <div className="alert alert-danger rounded-4">{loginError}</div>}
                        {registrationSuccess && <div className="alert alert-success rounded-4">{registrationSuccess}</div>}
                        <form onSubmit={loginUser}>
                            <div className="mb-3"><label className="form-label fw-bold">Email</label><input type="email" className="form-control form-control-lg" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Enter your email" maxLength="150" disabled={loggingIn} /></div>
                            <div className="mb-4"><label className="form-label fw-bold">Password</label><input type="password" className="form-control form-control-lg" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Enter your password" maxLength="100" disabled={loggingIn} /></div>
                            <button type="submit" className="btn btn-primary btn-lg w-100 py-3" disabled={loggingIn}>{loggingIn ? "Signing In..." : "Sign In"}</button>
                        </form>
                        <div className="text-center mt-4"><span className="text-secondary">Don't have an account? </span><button type="button" className="btn btn-link p-0 fw-bold text-decoration-none" onClick={() => { setAuthMode("register"); setLoginError(""); setRegistrationSuccess(""); }}>Create an account</button></div>
                    </section>
                )}

                {!interviewStarted && !interviewFinished && !registeredUser && authMode === "register" && (
                    <section className="card app-card border-0 rounded-4 p-4 p-md-5 mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
                        <div className="section-heading mb-4">
                            <div>
                                <p className="eyebrow mb-1">CREATE ACCOUNT</p>
                                <h2 className="h3 fw-bold mb-0">Register to continue</h2>
                            </div>
                        </div>

                        {registrationError && (
                            <div className="alert alert-danger rounded-4">
                                {registrationError}
                            </div>
                        )}

                        {registrationSuccess && (
                            <div className="alert alert-success rounded-4">
                                {registrationSuccess}
                            </div>
                        )}

                        <form onSubmit={registerUser}>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Name</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    value={registrationName}
                                    onChange={(event) => setRegistrationName(event.target.value)}
                                    placeholder="Enter your name"
                                    maxLength="100"
                                    disabled={registering}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                <input
                                    type="email"
                                    className="form-control form-control-lg"
                                    value={registrationEmail}
                                    onChange={(event) => setRegistrationEmail(event.target.value)}
                                    placeholder="Enter your email"
                                    maxLength="150"
                                    disabled={registering}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">Password</label>
                                <input
                                    type="password"
                                    className="form-control form-control-lg"
                                    value={registrationPassword}
                                    onChange={(event) => setRegistrationPassword(event.target.value)}
                                    placeholder="Minimum 8 characters"
                                    maxLength="100"
                                    disabled={registering}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-100 py-3"
                                disabled={registering}
                            >
                                {registering ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>
                        <div className="text-center mt-4"><span className="text-secondary">Already have an account? </span><button type="button" className="btn btn-link p-0 fw-bold text-decoration-none" onClick={() => { setAuthMode("login"); setRegistrationError(""); }}>Sign in</button></div>
                    </section>
                )}

                {!interviewStarted && !interviewFinished && registeredUser && (
                    <>
                        <section className="card app-card border-0 rounded-4 p-3 p-md-4 mb-4">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                                <div>
                                    <span className="text-secondary">Welcome, </span>
                                    <strong>{registeredUser.name}</strong>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <span className="text-secondary small">{registeredUser.email}</span>
                                    <button type="button" className="btn btn-outline-dark btn-sm" onClick={logoutUser}>Logout</button>
                                </div>
                            </div>
                        </section>

                        <section className="card app-card border-0 rounded-4 p-4 p-md-5 mb-4">
                            <div className="section-heading mb-4">
                                <div>
                                    <p className="eyebrow mb-1">INTERVIEW SETUP</p>
                                    <h2 className="h3 fw-bold mb-0">
                                        Configure your interview
                                    </h2>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Technology
                                    </label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={technology}
                                        onChange={(event) =>
                                            setTechnology(event.target.value)
                                        }
                                    >
                                        {TECHNOLOGIES.map((item) => (
                                            <option key={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Difficulty
                                    </label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={difficulty}
                                        onChange={(event) =>
                                            setDifficulty(event.target.value)
                                        }
                                    >
                                        {DIFFICULTIES.map((item) => (
                                            <option key={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Number of Questions
                                    </label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={questionLimit}
                                        onChange={(event) =>
                                            setQuestionLimit(Number(event.target.value))
                                        }
                                    >
                                        {QUESTION_OPTIONS.map((item) => (
                                            <option key={item} value={item}>
                                                {item} Questions
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Time Limit
                                    </label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={timeLimit}
                                        onChange={(event) =>
                                            setTimeLimit(Number(event.target.value))
                                        }
                                    >
                                        {TIME_OPTIONS.map((item) => (
                                            <option key={item} value={item}>
                                                {item} Minutes
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="interview-preview rounded-4 p-3 mt-4 mb-4">
                                <div className="row g-3 text-center">
                                    <div className="col-4">
                                        <div className="small text-secondary">
                                            Technology
                                        </div>
                                        <div className="fw-bold">{technology}</div>
                                    </div>
                                    <div className="col-4">
                                        <div className="small text-secondary">
                                            Questions
                                        </div>
                                        <div className="fw-bold">
                                            {questionLimit}
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="small text-secondary">
                                            Duration
                                        </div>
                                        <div className="fw-bold">
                                            {timeLimit} min
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg w-100 py-3"
                                onClick={startInterview}
                                disabled={generatingQuestion}
                            >
                                {generatingQuestion
                                    ? "Starting Interview..."
                                    : "Start Interview"}
                            </button>
                        </section>

                        {dashboard.totalInterviews > 0 && (
                            <section className="card app-card border-0 rounded-4 p-4 p-md-5 mb-4">
                                <div className="section-heading mb-4">
                                    <div>
                                        <p className="eyebrow mb-1">ANALYTICS</p>
                                        <h2 className="h3 fw-bold mb-0">
                                            Performance Dashboard
                                        </h2>
                                    </div>
                                    <span className="badge rounded-pill text-bg-light">
                                        {dashboard.totalInterviews} interviews
                                    </span>
                                </div>

                                <div className="row g-3 mb-5">
                                    <div className="col-md-6 col-lg-3">
                                        <div className="metric-card h-100">
                                            <p className="text-secondary mb-1">
                                                Total Interviews
                                            </p>
                                            <h2 className="fw-bold mb-0">
                                                {dashboard.totalInterviews}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-lg-3">
                                        <div className="metric-card h-100">
                                            <p className="text-secondary mb-1">
                                                Average Score
                                            </p>
                                            <h2 className="fw-bold mb-0">
                                                {dashboard.averageScore}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-lg-3">
                                        <div className="metric-card h-100">
                                            <p className="text-secondary mb-1">
                                                Best Percentage
                                            </p>
                                            <h2 className="fw-bold mb-0">
                                                {dashboard.bestScore}%
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-lg-3">
                                        <div className="metric-card h-100">
                                            <p className="text-secondary mb-1">
                                                Average Percentage
                                            </p>
                                            <h2 className="fw-bold mb-0">
                                                {dashboard.averagePercentage}%
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-4">
                                    <div className="col-lg-6">
                                        <div className="analytics-panel h-100">
                                            <h5 className="fw-bold mb-4">
                                                Answer Performance
                                            </h5>

                                            {[
                                                ["Correct", dashboard.totalCorrect, dashboard.correctPercentage, "bg-success"],
                                                ["Partial", dashboard.totalPartial, dashboard.partialPercentage, "bg-warning"],
                                                ["Incorrect", dashboard.totalIncorrect, dashboard.incorrectPercentage, "bg-danger"]
                                            ].map(([label, count, percent, color]) => (
                                                <div className="mb-4" key={label}>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fw-semibold">
                                                            {label}
                                                        </span>
                                                        <span>
                                                            {count} ({percent}%)
                                                        </span>
                                                    </div>
                                                    <div className="progress" style={{ height: "10px" }}>
                                                        <div
                                                            className={`progress-bar ${color}`}
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-lg-6">
                                        <div className="analytics-panel h-100">
                                            <h5 className="fw-bold mb-4">
                                                Technology Performance
                                            </h5>

                                            {dashboard.technologyPerformance.map((item) => (
                                                <div className="mb-3" key={item.name}>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fw-semibold">
                                                            {item.name}
                                                        </span>
                                                        <span>
                                                            {item.interviews
                                                                ? `${item.average}%`
                                                                : "No interviews"}
                                                        </span>
                                                    </div>
                                                    <div className="progress" style={{ height: "8px" }}>
                                                        <div
                                                            className="progress-bar"
                                                            style={{ width: `${item.average}%` }}
                                                        ></div>
                                                    </div>
                                                    <small className="text-secondary">
                                                        {item.interviews}{" "}
                                                        {item.interviews === 1
                                                            ? "interview"
                                                            : "interviews"}
                                                    </small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-lg-6">
                                        <div className="analytics-panel h-100">
                                            <h5 className="fw-bold mb-4">
                                                Difficulty Performance
                                            </h5>

                                            {dashboard.difficultyPerformance.map((item) => (
                                                <div className="mb-3" key={item.name}>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fw-semibold">
                                                            {item.name}
                                                        </span>
                                                        <span>
                                                            {item.interviews
                                                                ? `${item.average}%`
                                                                : "No interviews"}
                                                        </span>
                                                    </div>
                                                    <div className="progress" style={{ height: "8px" }}>
                                                        <div
                                                            className="progress-bar"
                                                            style={{ width: `${item.average}%` }}
                                                        ></div>
                                                    </div>
                                                    <small className="text-secondary">
                                                        {item.interviews}{" "}
                                                        {item.interviews === 1
                                                            ? "interview"
                                                            : "interviews"}
                                                    </small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-lg-6">
                                        <div className="analytics-panel h-100 d-flex flex-column justify-content-center">
                                            <p className="eyebrow mb-2">
                                                OVERALL PERFORMANCE
                                            </p>
                                            <h2 className="display-6 fw-bold mb-2">
                                                {getPerformanceLabel(
                                                    dashboard.averagePercentage
                                                )}
                                            </h2>
                                            <p className="text-secondary mb-0">
                                                Your current average interview
                                                performance is{" "}
                                                <strong>
                                                    {dashboard.averagePercentage}%
                                                </strong>
                                                .
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {(historyLoading || dashboardLoading) && (
                            <div className="alert alert-info rounded-4">Loading your dashboard data...</div>
                        )}

                        {historyError && (
                            <div className="alert alert-danger rounded-4">{historyError}</div>
                        )}

                        {interviewHistory.length > 0 && (
                            <section className="card app-card border-0 rounded-4 p-4 p-md-5">
                                <div className="section-heading mb-4">
                                    <div>
                                        <p className="eyebrow mb-1">HISTORY</p>
                                        <h2 className="h3 fw-bold mb-0">
                                            Interview History
                                        </h2>
                                    </div>
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={clearHistory}
                                    >
                                        Clear History
                                    </button>
                                </div>

                                <div className="table-responsive">
                                    <table className="table align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Technology</th>
                                                <th>Difficulty</th>
                                                <th>Questions</th>
                                                <th>Score</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {interviewHistory.map((interview) => (
                                                <tr key={interview.id}>
                                                    <td>
                                                        {formatHistoryDate(interview.date)}
                                                    </td>
                                                    <td>{interview.technology}</td>
                                                    <td>{interview.difficulty}</td>
                                                    <td>{interview.totalQuestions}</td>
                                                    <td>
                                                        {interview.score}/{interview.maxScore}
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold">
                                                            {interview.percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {interviewStarted && (
                    <section className="card app-card border-0 rounded-4 p-4 p-md-5">
                        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center mb-4">
                            <div>
                                <p className="eyebrow mb-1">LIVE INTERVIEW</p>
                                <h2 className="h3 fw-bold mb-0">
                                    {technology} Interview
                                </h2>
                            </div>

                            <div className={`timer-display ${timerClass}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="d-flex justify-content-between mb-2">
                            <span className="fw-semibold">
                                Question {questionNumber} of {totalQuestions}
                            </span>
                            <span className="text-secondary">
                                {Math.round((questionNumber / totalQuestions) * 100)}%
                            </span>
                        </div>

                        <div className="progress mb-4">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${(questionNumber / totalQuestions) * 100}%`
                                }}
                            ></div>
                        </div>

                        {generatingQuestion ? (
                            <div className="text-center py-5">
                                <div
                                    className="spinner-border text-primary mb-3"
                                    role="status"
                                ></div>
                                <p className="text-secondary mb-0">
                                    Generating your interview question...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="question-panel rounded-4 p-4 mb-4">
                                    <p className="eyebrow mb-2">
                                        INTERVIEW QUESTION
                                    </p>
                                    <h3 className="h4 fw-bold mb-0">
                                        {generatedQuestion}
                                    </h3>
                                </div>

                                <label className="form-label fw-bold">
                                    Your Answer
                                </label>

                                <textarea
                                    className="form-control form-control-lg answer-box"
                                    rows="7"
                                    maxLength="500"
                                    value={userAnswer}
                                    onChange={(event) =>
                                        setUserAnswer(event.target.value)
                                    }
                                    placeholder="Explain your answer clearly and concisely..."
                                    disabled={evaluatingAnswer || answerEvaluated}
                                ></textarea>

                                <div className="text-end text-secondary small mt-1 mb-3">
                                    {userAnswer.length}/500
                                </div>

                                <button
                                    className="btn btn-primary btn-lg w-100 py-3 mb-4"
                                    onClick={evaluateAnswer}
                                    disabled={
                                        evaluatingAnswer ||
                                        answerEvaluated ||
                                        timeLeft === 0
                                    }
                                >
                                    {evaluatingAnswer
                                        ? "Evaluating Answer..."
                                        : answerEvaluated
                                            ? "Answer Evaluated"
                                            : "Submit Answer"}
                                </button>

                                {aiFeedback && (
                                    <div className="alert alert-info rounded-4">
                                        <h5 className="fw-bold">AI Feedback</h5>
                                        <p
                                            className="mb-0"
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {aiFeedback}
                                        </p>
                                    </div>
                                )}

                                {modelAnswer && (
                                    <div className="alert alert-success rounded-4">
                                        <h5 className="fw-bold">
                                            Expected Answer
                                        </h5>
                                        <p
                                            className="mb-0"
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {modelAnswer}
                                        </p>
                                    </div>
                                )}

                                {improvement && (
                                    <div className="alert alert-warning rounded-4">
                                        <h5 className="fw-bold">
                                            How to Improve
                                        </h5>
                                        <p
                                            className="mb-0"
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {improvement}
                                        </p>
                                    </div>
                                )}

                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4">
                                    <span className="fw-bold">
                                        Score: {score}/{maxScore}
                                    </span>

                                    {answerEvaluated && (
                                        <button
                                            className="btn btn-success btn-lg px-4"
                                            onClick={nextQuestion}
                                        >
                                            {questionNumber >= totalQuestions
                                                ? "Finish Interview"
                                                : "Next Question"}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                )}

                {interviewFinished && (
                    <section className="card app-card border-0 rounded-4 p-4 p-md-5">
                        <div className="text-center mb-5">
                            <div className="result-icon mb-3">
                                {finishReason === "time" ? "⏱" : "✓"}
                            </div>
                            <p className="eyebrow mb-2">
                                INTERVIEW {finishReason === "time" ? "TIME UP" : "COMPLETE"}
                            </p>
                            <h2 className="display-6 fw-bold mb-2">
                                Interview Completed
                            </h2>
                            <p className="text-secondary mb-0">
                                {finishReason === "time"
                                    ? "The time limit was reached. Review your performance below."
                                    : "Here is your performance summary."}
                            </p>
                        </div>

                        <div className="row g-3 mb-5">
                            <div className="col-md-6 col-lg-3">
                                <div className="metric-card text-center h-100">
                                    <p className="text-secondary mb-1">Score</p>
                                    <h2 className="fw-bold">
                                        {score}/{maxScore}
                                    </h2>
                                </div>
                            </div>

                            <div className="col-md-6 col-lg-3">
                                <div className="metric-card text-center h-100">
                                    <p className="text-secondary mb-1">Percentage</p>
                                    <h2 className="fw-bold">
                                        {Math.round((score / maxScore) * 100)}%
                                    </h2>
                                </div>
                            </div>

                            <div className="col-md-6 col-lg-3">
                                <div className="metric-card text-center h-100">
                                    <p className="text-secondary mb-1">Correct</p>
                                    <h2 className="fw-bold text-success">
                                        {correctAnswers}
                                    </h2>
                                </div>
                            </div>

                            <div className="col-md-6 col-lg-3">
                                <div className="metric-card text-center h-100">
                                    <p className="text-secondary mb-1">Incorrect</p>
                                    <h2 className="fw-bold text-danger">
                                        {incorrectAnswers}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="analytics-panel rounded-4 p-4 mb-4">
                            <h4 className="fw-bold mb-3">
                                Performance Summary
                            </h4>
                            <p className="mb-0">
                                You answered {correctAnswers} correctly,{" "}
                                {partialAnswers} partially, and{" "}
                                {incorrectAnswers} incorrectly.
                            </p>
                        </div>

                        <h4 className="fw-bold mb-3">
                            Question Review
                        </h4>

                        {questionResults.length === 0 ? (
                            <div className="alert alert-warning rounded-4">
                                No answers were evaluated before the interview ended.
                            </div>
                        ) : (
                            questionResults.map((result) => (
                                <div
                                    className="border rounded-4 p-4 mb-3"
                                    key={result.questionNumber}
                                >
                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                        <h5 className="fw-bold mb-0">
                                            Question {result.questionNumber}
                                        </h5>

                                        <span
                                            className={`badge ${
                                                result.result === "correct"
                                                    ? "bg-success"
                                                    : result.result === "partial"
                                                        ? "bg-warning text-dark"
                                                        : "bg-danger"
                                            }`}
                                        >
                                            {result.result}
                                        </span>
                                    </div>

                                    <p className="fw-semibold">
                                        {result.question}
                                    </p>

                                    <p
                                        style={{ whiteSpace: "pre-line" }}
                                        className="mb-3"
                                    >
                                        <strong>Your Answer:</strong>{" "}
                                        {result.answer}
                                    </p>

                                    <p
                                        style={{ whiteSpace: "pre-line" }}
                                        className="mb-3"
                                    >
                                        <strong>Feedback:</strong>{" "}
                                        {result.feedback}
                                    </p>

                                    <p
                                        style={{ whiteSpace: "pre-line" }}
                                        className="mb-3"
                                    >
                                        <strong>Expected Answer:</strong>{" "}
                                        {result.modelAnswer}
                                    </p>

                                    <p
                                        style={{ whiteSpace: "pre-line" }}
                                        className="mb-0"
                                    >
                                        <strong>Improvement:</strong>{" "}
                                        {result.improvement}
                                    </p>
                                </div>
                            ))
                        )}

                        <button
                            className="btn btn-primary btn-lg w-100 py-3 mt-3"
                            onClick={restartInterview}
                        >
                            Start New Interview
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}

export default App;
