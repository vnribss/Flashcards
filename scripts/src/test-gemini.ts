import { GoogleGenerativeAI } from "@google/generative-ai";

// Teste básico do Gemini para verificar se consegue processar texto e imagens
async function testGemini() {
  const apiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];

  if (!apiKey) {
    console.error("❌ API key não configurada. Defina AI_INTEGRATIONS_GEMINI_API_KEY");
    return;
  }

  console.log("🔄 Inicializando Gemini...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: "v1" });
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // Teste 1: Texto simples
    console.log("📝 Testando geração de texto...");
    const textResult = await model.generateContent("Diga 'Olá, mundo!' em português.");
    console.log("✅ Texto gerado:", textResult.response.text());

    // Teste 2: Imagem (usando uma imagem base64 simples de teste)
    console.log("🖼️ Testando processamento de imagem...");
    // Imagem base64 mínima de um pixel vermelho (para teste)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const imageResult = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/png",
          data: testImageBase64,
        },
      },
      "Descreva esta imagem em uma palavra.",
    ]);
    console.log("✅ Imagem processada:", imageResult.response.text());

    console.log("🎉 Todos os testes passaram! Gemini está funcionando.");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testGemini();