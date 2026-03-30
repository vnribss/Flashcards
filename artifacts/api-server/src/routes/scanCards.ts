import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

router.post("/scan-cards", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body as {
      imageBase64: string;
      mimeType: string;
    };

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 é obrigatório" });
    }

    const apiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];
    
    if (!apiKey) {
      console.error("GEMINI API KEY não configurada");
      return res.status(503).json({ error: "Serviço de IA indisponível. Tente novamente mais tarde." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        baseUrl: process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"],
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType ?? "image/jpeg",
                data: imageBase64,
              },
            },
            {
              text: `Analise esta imagem e extraia pares de perguntas e respostas para flashcards de estudo.

Retorne APENAS um JSON válido com o seguinte formato, sem texto extra:
{
  "cards": [
    { "question": "pergunta aqui", "answer": "resposta aqui" }
  ]
}

Regras:
- Extraia todas as perguntas e respostas visíveis
- Se for uma lista de conteúdo, crie perguntas relevantes a partir dele
- Seja objetivo e direto
- Mínimo 1 card, máximo 20 cards`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const text = response.text ?? "{}";
    let data: { cards: { question: string; answer: string }[] };

    try {
      data = JSON.parse(text);
    } catch {
      data = { cards: [] };
    }

    return res.json(data);
  } catch (err) {
    console.error("scan-cards error:", err);
    
    // Detectar tipo de erro
    if (err instanceof Error) {
      if (err.message.includes("API_KEY") || err.message.includes("401") || err.message.includes("Unauthorized")) {
        return res.status(503).json({ error: "Serviço de IA indisponível. Tente novamente mais tarde." });
      }
      if (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND") || err.message.includes("timeout")) {
        return res.status(503).json({ error: "Falha na conexão. Verifique sua internet e tente novamente." });
      }
    }
    
    return res.status(500).json({ error: "Erro ao processar imagem. Tente novamente." });
  }
});

export default router;
