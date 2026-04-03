// Teste simples do Tesseract.js
import { createWorker } from 'tesseract.js';

async function testTesseract() {
  try {
    console.log('Testando Tesseract.js...');
    const worker = await createWorker('eng');
    console.log('Worker criado com sucesso');

    // Teste com uma imagem base64 simples (pode ser um placeholder)
    const result = await worker.recognize('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    console.log('OCR result:', result.data.text);

    await worker.terminate();
    console.log('Teste concluído com sucesso');
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testTesseract();