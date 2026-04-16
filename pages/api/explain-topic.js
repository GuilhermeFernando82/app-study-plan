// /pages/api/explain-topic.ts

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic é obrigatório" });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Explique o tópico solicitado de forma clara, didática, com exemplos práticos e estruturada em seções.",
      },
      {
        role: "user",
        content: `Explique completamente o tópico: ${topic}`,
      },
    ],
  });

  const explanation = completion.choices[0].message.content;

  return res.status(200).json({ explanation });
}
