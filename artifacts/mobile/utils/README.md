# Flashcard Generator

Este módulo fornece uma função para gerar flashcards automaticamente a partir de texto extraído por OCR, utilizando IA quando necessário.

## Como Usar

### 1. Configuração da API Key

Adicione sua chave da OpenRouter no `app.json`:

```json
{
  "expo": {
    "extra": {
      "OPENROUTER_KEY": "sk-or-v1-your-api-key-here"
    }
  }
}
```

### 2. Importação

```typescript
import { generateFlashcards } from '@/utils/flashcardGenerator';
```

### 3. Uso Básico

```typescript
const text = "A fotossíntese é um processo...";
const flashcards = await generateFlashcards(text);
```

### 4. Com Controle de Loading

```typescript
const flashcards = await generateFlashcards(text, {
  onLoading: (loading) => setIsLoading(loading)
});
```

## Funcionalidades

- **Detecção Automática**: Identifica se o texto já contém perguntas/respostas
- **IA Inteligente**: Usa OpenRouter com modelo Mistral para gerar flashcards
- **Limpeza de Texto**: Remove quebras de linha e espaços excessivos
- **Tratamento de Erros**: Parse seguro de JSON e fallbacks
- **Limitação de Tamanho**: Máximo 2500 caracteres para evitar custos excessivos

## Estrutura dos Dados

```typescript
interface Flashcard {
  pergunta: string;
  resposta: string;
}
```

## Exemplos

### Texto Estruturado (sem IA)
```
Pergunta: O que é fotossíntese?
Resposta: Processo que produz alimento usando luz solar.
```

### Texto Comum (com IA)
```
A fotossíntese é um processo biológico realizado pelas plantas...
```
→ Gera automaticamente 3-8 flashcards relevantes.

## Logs de Debug

A função inclui logs detalhados para facilitar o desenvolvimento:
- Detecção de padrão QA
- Chamadas da API
- Parse de respostas
- Tratamento de erros