import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";

const router = Router();

router.post("/scan-cards", async (req, res) => {
  const startTime = Date.now();
  const requestId = req.id || `unknown-${Date.now()}`;
  
  try {
    logger.info({ requestId, imageSize: req.body?.imageBase64?.length }, "📸 scan-cards request iniciada");
    
    const { imageBase64, mimeType } = req.body as {
      imageBase64: string;
      mimeType: string;
    };

    if (!imageBase64) {
      logger.warn({ requestId }, "❌ imageBase64 não fornecido");
      return res.status(400).json({ error: "imageBase64 é obrigatório" });
    }

    const apiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];
    
    if (!apiKey) {
      logger.error({ requestId }, "❌ GEMINI API KEY não configurada - verifique env: AI_INTEGRATIONS_GEMINI_API_KEY");
      return res.status(503).json({ error: "Serviço de IA indisponível. Tente novamente mais tarde." });
    }

    logger.info({ requestId }, "🔑 API Key configurada, inicializando GenAI...");
    
    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    logger.info({ requestId, mimeType: mimeType ?? "image/jpeg" }, "⏳ Enviando request para Gemini API...");
    const geminiStartTime = Date.now();

    const response = await model.generateContent([
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
    ]);

    const geminiDuration = Date.now() - geminiStartTime;
    logger.info({ requestId, geminiDurationMs: geminiDuration }, "✅ Resposta recebida do Gemini");

    const text = response.response.text() ?? "{}";
    let data: { cards: { question: string; answer: string }[] };

    try {
      data = JSON.parse(text);
      logger.info({ requestId, cardCount: data.cards?.length ?? 0 }, "✨ JSON parseado com sucesso");
    } catch (parseErr) {
      logger.warn({ requestId, parseError: parseErr instanceof Error ? parseErr.message : String(parseErr), rawText: text?.substring(0, 200) }, "⚠️ Erro ao fazer parse do JSON, retornando cards vazios");
      data = { cards: [] };
    }

    const totalDuration = Date.now() - startTime;
    logger.info({ requestId, totalDurationMs: totalDuration, cardsReturned: data.cards?.length ?? 0 }, "🎉 scan-cards finalizado com sucesso");
    
    return res.json(data);
  } catch (err) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    logger.error(
      { 
        requestId, 
        totalDurationMs: totalDuration,
        errorMessage,
        errorStack,
        errorName: err instanceof Error ? err.constructor.name : typeof err,
      }, 
      "💥 Error em scan-cards"
    );
    
    // Detectar tipo de erro
    if (err instanceof Error) {
      if (err.message.includes("API_KEY") || err.message.includes("401") || err.message.includes("Unauthorized")) {
        logger.error({ requestId }, "🔐 Erro de autenticação com Gemini API");
        return res.status(503).json({ error: "Serviço de IA indisponível. Tente novamente mais tarde." });
      }
      if (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND") || err.message.includes("timeout")) {
        logger.error({ requestId }, "🌐 Erro de conexão com Gemini API");
        return res.status(503).json({ error: "Falha na conexão. Verifique sua internet e tente novamente." });
      }
    }
    
    return res.status(500).json({ error: "Erro ao processar imagem. Tente novamente." });
  }
});

export default router;
