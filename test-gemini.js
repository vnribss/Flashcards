const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = 'AIzaSyCffAzIiAE6O0pPgjvBXSAnwvgzlRx5nZY';

  console.log('🔑 API Key presente:', !!apiKey);
  console.log('🤖 Inicializando GoogleGenerativeAI...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log('📝 Criando modelo...');
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    console.log('📝 Testando geração de texto simples...');
    const textResult = await model.generateContent('Diga apenas "teste ok" em português.');
    console.log('✅ Resposta texto:', textResult.response.text());

    console.log('🖼️ Testando com imagem (base64 mínima)...');
    // Imagem base64 mínima de um pixel vermelho para teste
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    const imageResult = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/png',
          data: testImageBase64,
        },
      },
      'Descreva esta imagem em uma palavra.',
    ]);

    console.log('✅ Resposta imagem:', imageResult.response.text());
    console.log('🎉 Gemini está funcionando!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testGemini();