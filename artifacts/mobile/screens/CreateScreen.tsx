import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Plus } from "lucide-react-native";

import Colors from "@/constants/colors";
import TopGradient from "@/components/TopGradient";
import NavBar from "@/components/NavBar";
import { useFlashcards } from "@/context/FlashcardsContext";

type Props = {
  onHome: () => void;
  onCreate: () => void;
};

export default function CreateScreen({ onHome, onCreate }: Props) {
  const { decks, selectedDeckId, setSelectedDeckId, addCard } = useFlashcards();
  const [newDeckName, setNewDeckName] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) return;
    addCard(question, answer, selectedDeckId, newDeckName || undefined);
    setQuestion("");
    setAnswer("");
    setNewDeckName("");
    onHome();
  };

  return (
    <View style={styles.container}>
      <TopGradient
        title="Novo Card"
        subtitle="Criação rápida"
        rightIcon={
          <View style={styles.plusIcon}>
            <Plus size={14} color={Colors.primary} />
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>NOVA MATÉRIA (OPCIONAL)</Text>
          <TextInput
            value={newDeckName}
            onChangeText={setNewDeckName}
            placeholder="Ex: Química"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>OU ESCOLHA UMA MATÉRIA</Text>
          <View style={styles.selectContainer}>
            {decks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                onPress={() => setSelectedDeckId(deck.id)}
                style={[
                  styles.selectOption,
                  selectedDeckId === deck.id && styles.selectOptionActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    selectedDeckId === deck.id && styles.selectOptionTextActive,
                  ]}
                >
                  {deck.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
            placeholder="Ex: Processo em que a planta produz seu próprio alimento usando luz solar, água e gás carbônico."
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.textareaLarge]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.btnsRow}>
          <TouchableOpacity onPress={onHome} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>VOLTAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>SALVAR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NavBar onHome={onHome} onCreate={onCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textDark,
  },
  textarea: {
    minHeight: 88,
    paddingTop: 12,
  },
  textareaLarge: {
    minHeight: 110,
    paddingTop: 12,
  },
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectOption: {
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectOptionActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.primary,
  },
  selectOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textDark,
  },
  selectOptionTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  btnsRow: {
    flexDirection: "row",
    gap: 12,
  },
  backBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 3,
  },
  backBtnText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#8c5fe8",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  plusIcon: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
});
