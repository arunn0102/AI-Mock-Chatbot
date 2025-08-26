import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [track, setTrack] = useState("");
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState("landing"); // start | ready | interview | end
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false); // new: AI typing indicator
  const [feedback, setFeedback] = useState(""); // ✅ Add this

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Start Interview
  function startInterview() {
    if (!track) {
      alert("Please select a track first!");
      return;
    }
    setPhase("ready");
    setMessages([{ sender: "ai", text: "✅ Are you ready for your interview?", type: "feedback" }]);
  }

  // Handle Enter key
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  }

  // Submit answer / user input
  async function submitAnswer() {
    if (!userInput.trim()) return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMessage]);

    // READY PHASE
    if (phase === "ready") {
      if (userInput.toLowerCase().includes("yes")) {
        setUserInput("");
        await loadNextQuestion();
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Okay, take your time. Type 'yes' when ready.", type: "feedback" },
        ]);
      }
      setUserInput("");
      return;
    }

    // INTERVIEW PHASE
    if (phase === "interview" && currentQuestion) {
      setIsTyping(true);
      setUserInput("");

      try {
        const res = await fetch("http://localhost:5000/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentQuestion.text,
            answer: userInput,
            track,
          }),
        });
        const data = await res.json();

        const isAnswer = !data.reply.startsWith("Candidate") && !data.reply.includes("follow-up");
        // Delay to simulate typing
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: data.reply, type: isAnswer ? "answer" : "feedback" },
          ]);
          setIsTyping(false);
        }, 1200); // AI types for 1.2 sec
      } catch (err) {
        console.error(err);
        setIsTyping(false);
        alert("❌ Failed to get AI response.");
      }
    }
  }

  // Load next question dynamically
  async function loadNextQuestion() {
    setIsTyping(true);
    try {
      const res = await fetch("http://localhost:5000/api/questions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ track }),
});

      const data = await res.json();
      const nextQ = { id: Date.now().toString(), text: data.question };
      setCurrentQuestion(nextQ);
      setPhase("interview");

      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: "ai", text: nextQ.text, type: "feedback" }]);
        setIsTyping(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      alert("❌ Failed to fetch next question.");
    }
  }

  // // End Interview
  // async function endInterview() {
  //   setIsTyping(true);
  //   setTimeout(() => {
  //     setMessages((prev) => [
  //       ...prev,
  //       { sender: "ai", text: "🎉 Thanks for completing the interview!", type: "answer" },
  //     ]);
  //     setIsTyping(false);

  //     setTimeout(() => setPhase("end"), 1500);
  //   }, 1200);
  // }

   // ✅ End Interview with Feedback
  async function endInterview() {
    setIsTyping(true);
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          conversation: messages,
        }),
      });

      const data = await res.json();
      setFeedback(data.feedback || "⚠️ Could not generate feedback.");
    } catch (err) {
      console.error(err);
      setFeedback("❌ Failed to fetch feedback.");
    } finally {
      setIsTyping(false);
      setPhase("end");
    }
  }


  // Restart Interview
  function restartInterview() {
    setPhase("start");
    setTrack("");
    setMessages([]);
    setCurrentQuestion(null);
    setUserInput("");
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex flex-col items-center justify-center p-4 sm:p-6">
  {phase !== "landing" && (
        <motion.h1
          className="text-3xl sm:text-4xl font-extrabold mb-6 text-indigo-700 drop-shadow-lg text-center"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          🤖 Your AI Mock Interview
        </motion.h1>
      )}


  {/* LANDING PHASE */}
{phase === "landing" && (
  <motion.div
    className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {/* Title */}
    <motion.h1
      className="text-3xl sm:text-5xl font-extrabold text-indigo-800 drop-shadow-md"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      Welcome to AI Mock Interview
    </motion.h1>


    {/* Subtitle */}
    <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-xl">
      Practice coding and interview questions with our AI-powered chatbot.  
      Get real-time feedback and improve your skills.
    </p>

    <motion.div
      initial={{ y: -20 }}
      animate={{ y: 20 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 2,
      }}
      className="text-7xl sm:text-9xl mb-6"
    >
      🤖
    </motion.div>

    {/* CTA Button */}
    <motion.button
      className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-transform hover:scale-105"
      onClick={() => setPhase("start")}
      whileTap={{ scale: 0.95 }}
    >
      🚀 Start Now
    </motion.button>
  </motion.div>
)}

  {/* START PHASE */}
  {phase === "start" && (
<>  
    <motion.div
      className="bg-white/80 backdrop-blur-lg mt-5 p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-2xl border border-indigo-200"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <label className="block mb-3 text-xl sm:text-2xl font-semibold text-indigo-700">
        Choose your track:
      </label>
      <select
        className="w-full rounded-xl p-3 text-gray-700 outline-none mb-6 focus:ring-2 focus:ring-indigo-400 border shadow-sm"
        value={track}
        onChange={(e) => setTrack(e.target.value)}
      >
        <option value="">Select your topic</option>
        <option value="Frontend Developer">Frontend Developer</option>
        <option value="Backend Developer">Backend Developer</option>
        <option value="Full Stack Developer">Full Stack Developer</option>
        <option value="Data Structures & Algorithms">DSA</option>
      </select>

      <div className="flex justify-center">
        <button
          className="bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-transform transform hover:scale-105"
          onClick={startInterview}
        >
          🚀 Start Interview
        </button>
      </div>
    </motion.div>

    </>
  )}

  {/* CHAT PHASE */}
  {(phase === "ready" || phase === "interview") && (
    <motion.div
      className="bg-white/90 backdrop-blur-lg p-5 sm:p-8 mt-5 rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-2xl border border-green-300 flex flex-col"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 h-80 sm:h-96 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-transparent pr-2">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: msg.sender === "ai" ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-2 p-3 sm:p-4 rounded-2xl max-w-[85%] shadow-md ${
              msg.sender === "ai"
                ? msg.type === "answer"
                  ? "bg-yellow-100 text-yellow-900 self-start"
                  : "bg-indigo-100 text-indigo-900 self-start"
                : "bg-green-100 text-green-900 self-end ml-auto"
            }`}
          >
            <span className="text-sm sm:text-base">{msg.text}</span>
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-2xl max-w-[60%] shadow bg-indigo-100 self-start animate-pulse">
            <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-indigo-500" />
            <span className="text-sm sm:text-base">AI is typing...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="flex gap-2 mt-3 sm:mt-5">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          className="flex-1 border rounded-2xl p-3 text-sm sm:text-base focus:ring-2 focus:ring-green-400 resize-none shadow-sm"
          rows={1}
        />
        <button
          onClick={submitAnswer}
          className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 rounded-full font-semibold shadow-md transition-transform hover:scale-105"
        >
          Send
        </button>
      </div>

      {/* Actions */}
      {phase === "interview" && (
        <div className="flex justify-end gap-2 mt-4 flex-wrap">
          <button
            className="bg-indigo-500 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 rounded-full font-semibold shadow-md"
            onClick={loadNextQuestion}
          >
            ➡️ Next Question
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-full font-semibold shadow-md"
            onClick={endInterview}
          >
            🛑 End Interview
          </button>
        </div>
      )}
    </motion.div>
  )}

  {/* END PHASE */}
  {phase === "end" && (
    <motion.div
      className="bg-white/90 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-blue-200"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-700">
        🎯 Interview Completed
      </h2>
       {/* <p className="text-gray-700 mb-4 text-sm sm:text-base">
            {feedback || "Fetching feedback..."}
          </p> */}
      <p className="text-gray-700 mb-4 text-sm sm:text-base">
        Thank you for taking the AI mock interview. Keep practicing and improving your skills!
      </p>
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-6 py-2 rounded-full font-semibold shadow-md"
        onClick={restartInterview}
      >
        🔁 Restart
      </button>
    </motion.div>
  )}
</div>

  );
}
