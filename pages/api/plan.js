import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// função para extrair JSON final, você esqueceu ela no arquivo
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
    const systemMessage = `Você é um gerador de planos de estudo individualizados.
Regras obrigatórias:
- A resposta DEVE ser SOMENTE um JSON válido.
- O JSON deve ter exatamente este formato:
{
  "plano": {
    "TÍTULO 1": ["item 1", "item 2", "..."],
    "TÍTULO 2": ["item 1", "item 2", "..."]
  }
}
- Não use listas numeradas, não use markdown, não use traços.
- Apenas JSON puro e bem formatado.`;

    const userMessage = `Gere um plano de estudos personalizado para um iniciante absoluto em programação.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";

    let planJSON = null;

    try {
      planJSON = JSON.parse(raw);
    } catch (e) {
      planJSON = extractLastJSON(raw);
    }

    if (!planJSON || !planJSON.plano) {
      return res.status(200).json({
        plan: "Plano de estudos não pôde ser gerado.",
      });
    }

    return res.status(200).json({ plan: planJSON.plano });
  } catch (err) {
    console.error("Erro ao gerar plano de estudos:", err);
    return res.status(500).json({ plan: "Erro ao gerar plano de estudos." });
  }
}
