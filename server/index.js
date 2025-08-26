import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ------------------------
// Fetch AI Questions
// ------------------------
app.post("/api/questions", async (req, res) => {
  try {
    const { track } = req.body;

    const prompt = `Generate the first interview question for a ${track} role. 
    Only give one question as plain text, no JSON, no extra formatting.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const firstQuestion = data.choices[0].message.content.trim();

    res.json({ question: firstQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ------------------------
// AI Conversation Endpoint
// ------------------------
app.post("/api/conversation", async (req, res) => {
  try {
    const { question, answer, track } = req.body;

    // Detect if user is asking a general question
    const userInput = answer.toLowerCase();
    const questionKeywords = ["what", "how", "why","explain", "tell me", "define", "difference"];

    let prompt;
    if (questionKeywords.some((kw) => userInput.includes(kw))) {
      // Provide an informative answer directly
      prompt = `You are an AI tutor. The user asked: "${answer}". 
                Explain clearly and concisely and don't respond much longer.`;
    } else {
      // Continue interview-style conversation
      prompt = `You are acting as an interviewer for a ${track} role. 
                The last question you asked was: "${question}". 
                Candidate answered: "${answer}". 
                Now, respond like an interviewer would (short feedback, maybe follow-up question).
                Do NOT give scores. Just keep the conversation flowing naturally.`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversation failed" });
  }
})

app.post("/api/end", async (req, res) => {
  try {
    // You could make this more dynamic with AI if you want
    const track = req.body.track || "Candidate";
    const message = `🎉 Thank you ${track} for completing the mock interview! Best of luck!`;
    res.json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end interview" });
  }
});

// app.post("/api/feedback", async (req, res) => {
//   try {
//     const { track, conversation } = req.body;

    // const prompt = `You are an expert interview coach. 
    // The candidate just finished a mock interview for a ${track} role. 
    // Here is the full conversation:\n\n${JSON.stringify(conversation, null, 2)}\n\n
    // Please provide:
    // - Strengths of the candidate
    // - Weaknesses or areas of improvement
    // - Practical tips for future interviews
    // Keep it clear and structured and use bullet points not too long.`;

//     const prompt = `You are an expert interview coach. 
//     The candidate just finished a mock interview for a ${track} role. 
//     Here is the full conversation:\n\n${JSON.stringify(conversation, null, 2)}\n\n
//     Provide a short, natural feedback in plain sentences and provide the strengths and weakness os the candidate. 
//     Do NOT use bullet points, headings, or formatting. 
//     Keep it under 4 sentences, encouraging but honest.`;

//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "gpt-4o-mini",
//         messages: [{ role: "user", content: prompt }],
//       }),
//     });

//     const data = await response.json();
//     const feedback = data.choices[0].message.content.trim();

//     res.json({ feedback });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Feedback generation failed" });
//   }
// });

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
