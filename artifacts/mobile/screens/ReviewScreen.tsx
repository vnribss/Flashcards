import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronLeft, Trash2, XCircle, RotateCcw, CheckCircle2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import NavBar from "@/components/NavBar";
import { useFlashcards } from "@/context/FlashcardsContext";

type Props = {
  deckId: number;
  onBack: () => void;
  onHome: () => void;
  onCreate: () => void;
};

export default function ReviewScreen({ deckId, onBack, onHome, onCreate }: Props) {
  const { decks, cards, deleteCard, cardsForDeck } = useFlashcards();
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const deckCards = cardsForDeck(deckId);
  const currentCard = deckCards[reviewIndex] ?? null;
  const deckName = decks.find((d) => d.id === deckId)?.name ?? "Deck";

  const handleNext = () => {
    if (deckCards.length === 0) return;
    setFlipped(false);
    setReviewIndex((prev) => (prev + 1) % deckCards.length);
  };

  const handleDelete = () => {
    if (!currentCard) return;
    deleteCard(currentCard.id);
    setFlipped(false);
    setReviewIndex(0);
    onHome();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientMid, Colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.dotsPattern} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack}>
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Trash2 size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.deckTitle}>{deckName}</Text>
          <Text style={styles.progress}>
            {deckCards.length === 0 ? "0/0" : `${reviewIndex + 1}/${deckCards.length}`}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentCard ? (
          <>
            <MotiView
              animate={{ scale: flipped ? 0.98 : 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => setFlipped((prev) => !prev)}
                style={styles.flashcard}
              >
                <Text style={styles.cardLabel}>{flipped ? "Resposta" : "Pergunta"}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardText}>
                    {flipped ? currentCard.answer : currentCard.question}
                  </Text>
                </View>
                <Text style={styles.cardHint}>Toque no card para virar</Text>
              </TouchableOpacity>
            </MotiView>

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleNext} style={styles.actionBtn}>
                <XCircle size={18} color={Colors.error} />
                <Text style={styles.actionLabel}>Errei</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.actionBtn}>
                <RotateCcw size={18} color={Colors.primary} />
                <Text style={styles.actionLabel}>Próximo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.actionBtn}>
                <CheckCircle2 size={18} color={Colors.success} />
                <Text style={styles.actionLabel}>Acertei</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Esse deck está vazio</Text>
            <Text style={styles.emptyText}>Crie um flashcard para começar a estudar.</Text>
            <TouchableOpacity onPress={onCreate} style={styles.createBtn}>
              <Text style={styles.createBtnText}>CRIAR CARD</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    height: 145,
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  dotsPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
  },
  deckTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  progress: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  scroll: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 100,
    gap: 16,
  },
  flashcard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 20,
    minHeight: 240,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 6,
  },
  cardLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  cardBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    minHeight: 175,
  },
  cardText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 32,
  },
  cardHint: {
    fontSize: 12,
    color: "#a99fbe",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 44,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: "#9b91af",
    marginTop: 8,
    textAlign: "center",
  },
  createBtn: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
