import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generatedQuestions = new Set();

function isRepeated(q) {
  return generatedQuestions.has(q.toLowerCase().trim());
}

function registerQuestion(q) {
  generatedQuestions.add(q.toLowerCase().trim());
}

function countAlternatives(text) {
  return (text.match(/^[A-E]\)/gm) || []).length;
}
const topics = [
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Next.js",
  "C#",
  "Java",
  "Git",
  "SQL",
  "APIs REST",
  "Estruturas de dados",
];

function getRandomTopic() {
  return topics[Math.floor(Math.random() * topics.length)];
}
/* Pega SOMENTE o JSON da última linha */
function extractLastJSON(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .reverse();

  for (const line of lines) {
    if (line.startsWith("{") && line.endsWith("}")) {
      try {
        return JSON.parse(line);
      } catch (e) {}
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const systemMessage = `
Você é um gerador de perguntas técnicas.
Formato OBRIGATÓRIO:

Pergunta...
A) ...
B) ...
C) ...
D) ...
E) ...

{"resposta": "A"}

REGRAS:
- Sempre gere 5 alternativas (A–E).
- Nunca pule letras.
- O JSON deve ser a ÚLTIMA linha.
    `;

    const topic = getRandomTopic();

    const userMessage = `
Gere uma pergunta técnica de programação sobre o tema: ${topic}.
A pergunta deve ser de nível intermediário.
`;

    let questionText = "";
    let correctAnswer = "";

    for (let attempt = 0; attempt < 5; attempt++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      console.log("RAW LLM:", raw);

      // Extrai JSON da última linha
      const parsed = extractLastJSON(raw);
      if (!parsed) {
        console.warn("❌ Sem JSON. Tentando novamente...");
        continue;
      }

      // pega resposta
      const ans =
        parsed.resposta ??
        parsed.answer ??
        parsed.correctAnswer ??
        parsed.respostaCorreta ??
        "";

      correctAnswer = String(ans).trim().toUpperCase();

      // limpa para deixar só a pergunta e alternativas
      const tempQuestion = raw.replace(/\{.*\}$/s, "").trim();

      // valida quantidade A–E
      if (countAlternatives(tempQuestion) !== 5) {
        console.warn("❌ Alternativas incompletas. Tentando novamente...");
        continue;
      }

      // evita repetição
      if (!isRepeated(tempQuestion)) {
        questionText = tempQuestion;
        registerQuestion(tempQuestion);
        break;
      }
    }

    // fallback
    if (!questionText || !correctAnswer) {
      questionText =
        "Qual linguagem é executada diretamente no navegador?\n" +
        "A) Python\n" +
        "B) JavaScript\n" +
        "C) C#\n" +
        "D) Java\n" +
        "E) Ruby";
      correctAnswer = "B";
    }

    return res.status(200).json({
      question: questionText,
    });
  } catch (error) {
    console.error("Erro ao gerar pergunta:", error);

    return res.status(200).json({
      question:
        "Qual linguagem é executada diretamente no navegador?\nA) Python\nB) JavaScript\nC) C#\nD) Java\nE) Ruby",
      correctAnswer: "B",
    });
  }
}
