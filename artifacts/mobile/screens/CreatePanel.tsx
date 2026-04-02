import { Camera, CheckCircle2, Plus, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleGenerativeAI } from "@google/generative-ai";

import Colors from "@/constants/colors";
import { useFlashcards } from "@/context/FlashcardsContext";

type Props = {
  onDone: () => void;
};

type ScannedCard = {
  question: string;
  answer: string;
  selected: boolean;
};

const API_KEY = Constants.expoConfig?.extra?.AI_INTEGRATIONS_GEMINI_API_KEY;

console.log("🔑 API_KEY carregada:", API_KEY ? "Sim" : "Não");
console.log("📱 Plataforma:", Platform.OS);
console.log("🌐 É web:", Platform.OS === "web");

async function scanImageWithGemini(imageBase64: string, mimeType: string) {
  console.log("🔑 API_KEY presente:", !!API_KEY);
  console.log("📷 Iniciando scan - tamanho da imagem:", imageBase64.length, "mimeType:", mimeType);
  console.log("🌐 Plataforma:", Platform.OS);

  if (Platform.OS === "web") {
    throw new Error("Scan de imagens não está disponível no navegador web. Use o Expo Go no celular ou gere um APK.");
  }

  if (!API_KEY) {
    throw new Error("API key não configurada");
  }

  try {
    console.log("🤖 Inicializando GoogleGenerativeAI...");
    const genAI = new GoogleGenerativeAI(API_KEY);

    console.log("📝 Criando modelo...");
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    console.log("🚀 Enviando para Gemini API...");
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType ?? "image/jpeg",
          data: imageBase64,
        },
      },
      {
        text: `Analise esta imagem e extraia pares de perguntas e respostas para flashcards de estudo.

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato:
{
  "cards": [
    {"question": "pergunta aqui", "answer": "resposta aqui"}
  ]
}

Regras:
- Extraia todas as perguntas e respostas visíveis
- Se for uma lista de conteúdo, crie perguntas relevantes a partir dele
- Seja objetivo e direto
- Mínimo 1 card, máximo 20 cards
- NÃO adicione texto extra, apenas o JSON`,
      },
    ]);

    console.log("✅ Resposta recebida do Gemini");
    const text = result.response.text() ?? "{}";
    console.log("📄 Texto bruto da resposta:", text.substring(0, 200) + "...");

    // Tentar extrair JSON da resposta (pode ter texto extra)
    let data: { cards: { question: string; answer: string }[] };
    
    try {
      // Primeiro tentar parse direto
      data = JSON.parse(text);
    } catch {
      // Se falhar, tentar encontrar JSON dentro do texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch {
          console.warn("⚠️ Não conseguiu fazer parse do JSON encontrado");
          data = { cards: [] };
        }
      } else {
        console.warn("⚠️ Nenhum JSON encontrado na resposta");
        data = { cards: [] };
      }
    }

    console.log("🎯 Cards extraídos:", data.cards?.length || 0);

    return data.cards ?? [];
  } catch (error) {
    console.error("💥 Erro em scanImageWithGemini:", error);
    throw error;
  }
}

export default function CreatePanel({ onDone }: Props) {
  const { decks, selectedDeckId, setSelectedDeckId, addCard } = useFlashcards();
  const [newDeckName, setNewDeckName] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanError, setScanError] = useState("");

  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleSave() {
    if (!question.trim() || !answer.trim()) return;
    addCard(question, answer, selectedDeckId, newDeckName || undefined);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setQuestion("");
      setAnswer("");
      setNewDeckName("");
    }, 1200);
  }

  function handleSaveAndExit() {
    if (!question.trim() || !answer.trim()) return;
    addCard(question, answer, selectedDeckId, newDeckName || undefined);
    onDone();
  }

  async function handleScan() {
    console.log("📸 Iniciando handleScan...");
    setScanError("");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setScanError("Permissão para acessar a galeria é necessária.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]?.base64) {
      console.log("❌ Scan cancelado ou sem imagem");
      return;
    }

    setScanning(true);
    try {
      console.log("🔍 Processando imagem...");
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? "image/jpeg";

      const cards = await scanImageWithGemini(asset.base64!, mimeType);

      if (cards.length === 0) {
        setScanError("Não encontrei perguntas e respostas nessa imagem. Tente outra foto.");
        setScanning(false);
        return;
      }

      setScannedCards(cards.map((c: { question: string; answer: string }) => ({ ...c, selected: true })));
      setShowScanModal(true);
    } catch (err) {
      console.error("💥 Erro no handleScan:", err);
      const errorMsg = err instanceof Error && err.message.includes("Failed to fetch")
        ? "Falha na conexão. Verifique sua internet e tente novamente."
        : "Erro ao processar a imagem. Tente novamente.";
      setScanError(errorMsg);
    } finally {
      setScanning(false);
    }
  }

  function handleScanCamera() {
    ImagePicker.requestCameraPermissionsAsync().then(({ status }) => {
      if (status !== "granted") {
        setScanError("Permissão para usar a câmera é necessária.");
        return;
      }
      ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
      }).then(async (result) => {
        if (result.canceled || !result.assets[0]?.base64) return;
        setScanning(true);
        setScanError("");
        try {
          const asset = result.assets[0];
          const mimeType = asset.mimeType ?? "image/jpeg";
          const cards = await scanImageWithGemini(asset.base64!, mimeType);
          if (cards.length === 0) {
            setScanError("Não encontrei perguntas e respostas nessa imagem.");
            return;
          }
          setScannedCards(cards.map((c: { question: string; answer: string }) => ({ ...c, selected: true })));
          setShowScanModal(true);
        } catch (err) {
          const errorMsg = err instanceof Error && err.message.includes("Failed to fetch")
            ? "Falha na conexão. Verifique sua internet e tente novamente."
            : "Erro ao processar. Tente novamente.";
          setScanError(errorMsg);
        } finally {
          setScanning(false);
        }
      });
    });
  }

  function toggleCard(index: number) {
    setScannedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  }

  function handleAddScanned() {
    const toAdd = scannedCards.filter((c) => c.selected);
    toAdd.forEach((c) => {
      addCard(c.question, c.answer, selectedDeckId, newDeckName || undefined);
    });
    setShowScanModal(false);
    setScannedCards([]);
    onDone();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Criar flashcard</Text>
          <Text style={styles.pageSubtitle}>Manual ou escaneando uma foto</Text>
        </View>
      </View>

      <View style={styles.scanBanner}>
        <View style={styles.scanBannerLeft}>
          <View style={styles.scanIconBox}>
            <Camera size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.scanBannerTitle}>Escanear imagem</Text>
            <Text style={styles.scanBannerSub}>A IA extrai as perguntas e respostas automaticamente</Text>
          </View>
        </View>
        <View style={styles.scanBtns}>
          {Platform.OS !== "web" ? (
            <>
              <TouchableOpacity
                onPress={handleScanCamera}
                style={styles.scanBtn}
                activeOpacity={0.8}
                disabled={scanning}
              >
                <Text style={styles.scanBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleScan}
                style={[styles.scanBtn, styles.scanBtnPrimary]}
                activeOpacity={0.8}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.scanBtnText, { color: "#fff" }]}>Galeria</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.webMessage}>
              <Text style={styles.webMessageText}>
                📱 Scan disponível apenas no app mobile.{'\n'}Use Expo Go ou instale o APK.
              </Text>
            </View>
          )}
        </View>
      </View>

      {scanError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{scanError}</Text>
        </View>
      ) : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>ou adicione manualmente</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.formLayout}>
        <View style={styles.leftCol}>
          <View style={styles.card}>
            <Text style={styles.label}>MATÉRIA</Text>
            <Text style={styles.labelHint}>Selecione uma existente</Text>
            <View style={styles.deckList}>
              {decks.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  onPress={() => { setSelectedDeckId(deck.id); setNewDeckName(""); }}
                  style={[
                    styles.deckOption,
                    selectedDeckId === deck.id && !newDeckName && styles.deckOptionActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.deckOptionText,
                      selectedDeckId === deck.id && !newDeckName && styles.deckOptionTextActive,
                    ]}
                  >
                    {deck.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou crie nova</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="Nome da nova matéria"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, newDeckName ? styles.inputActive : null]}
            />
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.card}>
            <Text style={styles.label}>PERGUNTA</Text>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ex: O que é fotossíntese?"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>RESPOSTA</Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Ex: Processo em que a planta produz alimento usando luz solar, água e CO₂."
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.textareaLarge]}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onDone} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveMoreBtn} activeOpacity={0.85}>
              {saved ? (
                <>
                  <CheckCircle2 size={16} color={Colors.success} />
                  <Text style={[styles.saveMoreBtnText, { color: Colors.success }]}>Salvo!</Text>
                </>
              ) : (
                <>
                  <Plus size={16} color={Colors.primary} />
                  <Text style={styles.saveMoreBtnText}>Salvar e criar outro</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveAndExit} style={styles.saveBtn} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showScanModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cards encontrados</Text>
                <Text style={styles.modalSub}>Selecione os que deseja salvar</Text>
              </View>
              <TouchableOpacity onPress={() => setShowScanModal(false)} style={styles.modalClose}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {scannedCards.map((card, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleCard(i)}
                  style={[styles.scannedCard, card.selected && styles.scannedCardSelected]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, card.selected && styles.checkboxSelected]}>
                    {card.selected && <CheckCircle2 size={14} color="#fff" />}
                  </View>
                  <View style={styles.scannedCardContent}>
                    <Text style={styles.scannedQ}>{card.question}</Text>
                    <Text style={styles.scannedA}>{card.answer}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowScanModal(false)} style={styles.modalCancelBtn} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddScanned}
                style={[styles.modalSaveBtn, scannedCards.filter((c) => c.selected).length === 0 && styles.modalSaveBtnDisabled]}
                activeOpacity={0.85}
                disabled={scannedCards.filter((c) => c.selected).length === 0}
              >
                <Text style={styles.modalSaveText}>
                  Salvar {scannedCards.filter((c) => c.selected).length} card{scannedCards.filter((c) => c.selected).length !== 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 32, paddingBottom: 40, gap: 24 },
  pageHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  pageTitle: { fontSize: 28, fontWeight: "700", color: Colors.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  scanBanner: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  scanBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  scanIconBox: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBannerTitle: { fontSize: 15, fontWeight: "700", color: Colors.textDark },
  scanBannerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  scanBtns: { flexDirection: "row", gap: 8 },
  scanBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  scanBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    minWidth: 70,
    alignItems: "center",
  },
  scanBtnText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  errorBanner: {
    backgroundColor: "#fce8e8",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: "500" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLabel: { fontSize: 12, color: Colors.textMuted, whiteSpace: "nowrap" } as any,
  formLayout: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  leftCol: { width: 220 },
  rightCol: { flex: 1, gap: 16 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    gap: 10,
  },
  label: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: Colors.textMuted, fontWeight: "600" },
  labelHint: { fontSize: 12, color: Colors.textMuted, marginTop: -6 },
  deckList: { gap: 6 },
  deckOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  deckOptionActive: { backgroundColor: Colors.accent, borderColor: Colors.primary },
  deckOptionText: { fontSize: 13, fontWeight: "500", color: Colors.textDark },
  deckOptionTextActive: { color: Colors.primary, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  dividerText: { fontSize: 11, color: Colors.textMuted },
  input: {
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textDark,
  },
  inputActive: { borderColor: Colors.primary, backgroundColor: Colors.accent },
  textarea: { minHeight: 100, paddingTop: 12 },
  textareaLarge: { minHeight: 130, paddingTop: 12 },
  btnRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  saveMoreBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  saveMoreBtnText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  saveBtn: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 560,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    gap: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  modalClose: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: { maxHeight: 320 },
  scannedCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
  },
  scannedCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.accent },
  checkbox: {
    height: 22,
    width: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  scannedCardContent: { flex: 1 },
  scannedQ: { fontSize: 13, fontWeight: "700", color: Colors.textDark },
  scannedA: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveBtnDisabled: { backgroundColor: Colors.textMuted, shadowOpacity: 0 },
  modalSaveText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  webMessage: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    alignItems: "center",
  },
  webMessageText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    lineHeight: 16,
  },
});
