// Teste rápido do Tesseract.js
import { createWorker } from 'tesseract.js';

async function testOCR() {
  try {
    console.log('🧪 Testando Tesseract.js...');

    // Criar worker com inglês
    const worker = await createWorker('eng');
    console.log('✅ Worker criado com sucesso');

    // Teste com uma imagem simples (base64 de um texto pequeno)
    // Esta é uma imagem base64 mínima para teste
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    console.log('🔍 Testando reconhecimento...');
    const result = await worker.recognize(testImage);
    console.log('📊 Resultado:', result.data);

    await worker.terminate();
    console.log('✅ Teste concluído');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testOCR();