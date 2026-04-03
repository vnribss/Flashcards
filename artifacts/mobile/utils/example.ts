// Exemplo de uso da função generateFlashcards

import { generateFlashcards } from './flashcardGenerator';

// Exemplo 1: Texto que já contém perguntas e respostas
const textWithQA = `
Pergunta: O que é fotossíntese?
Resposta: Processo pelo qual as plantas produzem alimento usando luz solar.

Q: Quem foi o primeiro presidente do Brasil?
A: Deodoro da Fonseca.
`;

// Exemplo 2: Texto comum para gerar flashcards com IA
const regularText = `
A fotossíntese é um processo biológico realizado pelas plantas e outros organismos fotossintéticos.
Durante a fotossíntese, a energia luminosa é convertida em energia química, produzindo glicose e oxigênio.
Este processo ocorre nos cloroplastos das células vegetais.
`;

// Como usar:
async function example() {
  try {
    // Para texto com QA
    const flashcards1 = await generateFlashcards(textWithQA);
    console.log('Flashcards de texto estruturado:', flashcards1);

    // Para texto comum (requer API key configurada)
    const flashcards2 = await generateFlashcards(regularText, {
      onLoading: (loading: boolean) => console.log('Loading:', loading)
    });
    console.log('Flashcards gerados por IA:', flashcards2);

  } catch (error) {
    console.error('Erro:', error);
  }
}

export { example };