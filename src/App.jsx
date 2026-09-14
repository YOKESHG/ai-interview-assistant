import { useState } from "react";

function App() {
    const [technology, setTechnology] = useState("JavaScript");
    const [difficulty, setDifficulty] = useState("Beginner");

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

    const [usedQuestions, setUsedQuestions] = useState([]);
    const [questionResults, setQuestionResults] = useState([]);

    const [error, setError] = useState("");

    const totalQuestions = 10;
    const maxScore = totalQuestions * 2;

    const startInterview = async () => {
        setInterviewStarted(true);
        setInterviewFinished(false);
        setQuestionNumber(0);
        setScore(0);
        setCorrectAnswers(0);
        setPartialAnswers(0);
        setIncorrectAnswers(0);
        setUsedQuestions([]);
        setQuestionResults([]);
        setUserAnswer("");
        setAiFeedback("");
        setModelAnswer("");
        setImprovement("");
        setAnswerEvaluated(false);
        setError("");

        await generateQuestion([]);
    };

    const generateQuestion = async (questionsUsed = usedQuestions) => {
        try {
            setGeneratingQuestion(true);
            setError("");
            setUserAnswer("");
            setAiFeedback("");
            setModelAnswer("");
            setImprovement("");
            setAnswerEvaluated(false);

            const response = await fetch(
                "http://localhost:5001/api/generate-question",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        technology,
                        difficulty,
                        usedQuestions: questionsUsed
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate question.");
            }

            setGeneratedQuestion(data.question);
            setUsedQuestions([...questionsUsed, data.question]);
        } catch (error) {
            setError(error.message);
        } finally {
            setGeneratingQuestion(false);
        }
    };

    const evaluateAnswer = async () => {
        if (!userAnswer.trim()) {
            setError("Please enter your answer before submitting.");
            return;
        }

        try {
            setEvaluatingAnswer(true);
            setError("");

            const response = await fetch(
                "http://localhost:5001/api/evaluate-answer",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        technology,
                        difficulty,
                        question: generatedQuestion,
                        userAnswer
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to evaluate answer.");
            }

            setAiFeedback(data.feedback);
            setModelAnswer(data.modelAnswer);
            setImprovement(data.improvement);
            setAnswerEvaluated(true);

            setScore((previousScore) => previousScore + data.points);

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
            setError(error.message);
        } finally {
            setEvaluatingAnswer(false);
        }
    };

    const nextQuestion = async () => {
        if (questionNumber + 1 >= totalQuestions) {
            setInterviewFinished(true);
            return;
        }

        const nextNumber = questionNumber + 1;
        setQuestionNumber(nextNumber);

        await generateQuestion([...usedQuestions]);
    };

    const finishInterview = () => {
        setInterviewFinished(true);
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
        setUsedQuestions([]);
        setQuestionResults([]);
        setAnswerEvaluated(false);
        setError("");
    };

    const percentage = Math.round((score / maxScore) * 100);

    const getPerformanceMessage = () => {
        if (percentage >= 80) {
            return "Excellent performance! You have demonstrated strong knowledge.";
        }

        if (percentage >= 60) {
            return "Good performance! You have a solid understanding with some areas to improve.";
        }

        if (percentage >= 40) {
            return "Fair performance. Focus on strengthening your fundamentals.";
        }

        return "Keep practicing. Review the concepts and try another interview.";
    };

    return (
        <div className="bg-light min-vh-100 py-5">
            <div className="container">
                <div className="text-center mb-4">
                    <h1 className="fw-bold">AI Interview Assistant</h1>
                    <p className="text-muted">
                        Practice technical interviews with Gemini AI
                    </p>
                </div>

                {!interviewStarted && (
                    <div className="card shadow-sm border-0 rounded-4 mx-auto" style={{ maxWidth: "900px" }}>
                        <div className="card-body p-4">
                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    Select Technology
                                </label>

                                <select
                                    className="form-select form-select-lg"
                                    value={technology}
                                    onChange={(e) => setTechnology(e.target.value)}
                                    title="Choose the technology for the interview"
                                >
                                    <option>JavaScript</option>
                                    <option>React</option>
                                    <option>HTML</option>
                                    <option>CSS</option>
                                    <option>Bootstrap</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    Select Difficulty
                                </label>

                                <select
                                    className="form-select form-select-lg"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    title="Choose the interview difficulty"
                                >
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>

                            <button
                                className="btn btn-primary btn-lg w-100"
                                onClick={startInterview}
                            >
                                Start AI Interview
                            </button>
                        </div>
                    </div>
                )}

                {interviewStarted && !interviewFinished && (
                    <div className="card shadow-sm border-0 rounded-4 mx-auto" style={{ maxWidth: "900px" }}>
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="badge bg-primary fs-6">
                                    Question {questionNumber + 1} / {totalQuestions}
                                </span>

                                <span className="badge bg-dark fs-6">
                                    Score: {score} / {maxScore}
                                </span>
                            </div>

                            {generatingQuestion && (
                                <div className="text-center py-5">
                                    <div
                                        className="spinner-border text-primary"
                                        role="status"
                                    ></div>

                                    <p className="mt-3 mb-0 text-muted">
                                        Gemini is generating your interview question...
                                    </p>
                                </div>
                            )}

                            {!generatingQuestion && generatedQuestion && (
                                <>
                                    <div className="alert alert-primary">
                                        <h5 className="fw-bold">
                                            Interview Question
                                        </h5>

                                        <p className="mb-0">
                                            {generatedQuestion}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            Your Answer
                                        </label>

                                        <textarea
                                            className="form-control"
                                            rows="6"
                                            maxLength="500"
                                            value={userAnswer}
                                            onChange={(e) => {
                                                setUserAnswer(e.target.value);
                                                setAiFeedback("");
                                                setModelAnswer("");
                                                setImprovement("");
                                                setAnswerEvaluated(false);
                                            }}
                                            placeholder="Type your answer here..."
                                            disabled={answerEvaluated}
                                        ></textarea>

                                        <div className="text-end text-muted mt-1">
                                            {userAnswer.length} / 500
                                        </div>
                                    </div>

                                    {!answerEvaluated && (
                                        <button
                                            className="btn btn-success btn-lg w-100 mb-3"
                                            onClick={evaluateAnswer}
                                            disabled={evaluatingAnswer}
                                        >
                                            {evaluatingAnswer ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    ></span>
                                                    Gemini is evaluating...
                                                </>
                                            ) : (
                                                "Submit Answer"
                                            )}
                                        </button>
                                    )}

                                    {answerEvaluated && (
                                        <>
                                            <div className="alert alert-info">
                                                <h5 className="fw-bold">
                                                    AI Feedback
                                                </h5>

                                                <p className="mb-0">
                                                    {aiFeedback}
                                                </p>
                                            </div>

                                            <div className="alert alert-success">
                                                <h5 className="fw-bold">
                                                    Model Answer
                                                </h5>

                                                <p className="mb-0">
                                                    {modelAnswer}
                                                </p>
                                            </div>

                                            <div className="alert alert-warning">
                                                <h5 className="fw-bold">
                                                    Improvement Suggestion
                                                </h5>

                                                <p className="mb-0">
                                                    {improvement}
                                                </p>
                                            </div>

                                            <div className="d-flex gap-2">
                                                {questionNumber + 1 < totalQuestions ? (
                                                    <button
                                                        className="btn btn-primary btn-lg flex-grow-1"
                                                        onClick={nextQuestion}
                                                    >
                                                        Next Question
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-danger btn-lg flex-grow-1"
                                                        onClick={finishInterview}
                                                    >
                                                        Finish Interview
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {error && (
                                <div className="alert alert-danger mt-3">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {interviewFinished && (
                    <div className="mx-auto" style={{ maxWidth: "900px" }}>
                        <div className="card shadow-sm border-0 rounded-4 mb-4">
                            <div className="card-body p-4 text-center">
                                <h2 className="fw-bold mb-4">
                                    Interview Complete
                                </h2>

                                <div className="display-4 fw-bold text-primary mb-2">
                                    {score} / {maxScore}
                                </div>

                                <h4 className="fw-bold mb-4">
                                    {percentage}%
                                </h4>

                                <p className="lead">
                                    {getPerformanceMessage()}
                                </p>
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="card shadow-sm border-0 rounded-4 h-100">
                                    <div className="card-body text-center">
                                        <h6 className="text-success fw-bold">
                                            Correct
                                        </h6>
                                        <h2 className="fw-bold">
                                            {correctAnswers}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card shadow-sm border-0 rounded-4 h-100">
                                    <div className="card-body text-center">
                                        <h6 className="text-warning fw-bold">
                                            Partial
                                        </h6>
                                        <h2 className="fw-bold">
                                            {partialAnswers}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card shadow-sm border-0 rounded-4 h-100">
                                    <div className="card-body text-center">
                                        <h6 className="text-danger fw-bold">
                                            Incorrect
                                        </h6>
                                        <h2 className="fw-bold">
                                            {incorrectAnswers}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card shadow-sm border-0 rounded-4 mb-4">
                            <div className="card-body p-4">
                                <h3 className="fw-bold mb-4">
                                    Question Review
                                </h3>

                                {questionResults.map((item, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-3 p-3 mb-3"
                                    >
                                        <h5 className="fw-bold">
                                            Question {index + 1}
                                        </h5>

                                        <p>
                                            <strong>Question:</strong>{" "}
                                            {item.question}
                                        </p>

                                        <p>
                                            <strong>Your Answer:</strong>{" "}
                                            {item.answer}
                                        </p>

                                        <p>
                                            <strong>Result:</strong>{" "}
                                            <span
                                                className={
                                                    item.result === "correct"
                                                        ? "text-success fw-bold"
                                                        : item.result === "partial"
                                                        ? "text-warning fw-bold"
                                                        : "text-danger fw-bold"
                                                }
                                            >
                                                {item.result.toUpperCase()}
                                            </span>
                                        </p>

                                        <p>
                                            <strong>Score:</strong>{" "}
                                            {item.points} / 2
                                        </p>

                                        <p>
                                            <strong>Feedback:</strong>{" "}
                                            {item.feedback}
                                        </p>

                                        <p>
                                            <strong>Model Answer:</strong>{" "}
                                            {item.modelAnswer}
                                        </p>

                                        <p className="mb-0">
                                            <strong>Improvement:</strong>{" "}
                                            {item.improvement}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary btn-lg w-100"
                            onClick={restartInterview}
                        >
                            Start New Interview
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;