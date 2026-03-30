import { CheckCircle2, ChevronLeft, Edit3, RotateCcw, Trash2, XCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useFlashcards } from "@/context/FlashcardsContext";
import { CardItem } from "@/context/FlashcardsContext";

type Props = {
  deckId: number;
  onBack: () => void;
  onCreateCard: () => void;
};

type SessionResult = { cardId: number; correct: boolean };

export default function ReviewPanel({ deckId, onBack, onCreateCard }: Props) {
  const { decks, deleteCard, editCard, cardsForDeck } = useFlashcards();
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const flipAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const deckCards = cardsForDeck(deckId);
  const currentCard = deckCards[reviewIndex] ?? null;
  const deckName = decks.find((d) => d.id === deckId)?.name ?? "Deck";
  const progress = deckCards.length > 0 ? (reviewIndex + 1) / deckCards.length : 0;
  const correctCount = results.filter((r) => r.correct).length;
  const wrongCount = results.filter((r) => !r.correct).length;

  useEffect(() => {
    setReviewIndex(0);
    setFlipped(false);
    setResults([]);
    setSessionDone(false);
    flipAnim.setValue(0);
  }, [deckId]);

  function animateFlip(toFlipped: boolean) {
    const toValue = toFlipped ? 1 : 0;
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
    setFlipped(toFlipped);
  }

  function handleAnswer(correct: boolean) {
    if (!currentCard) return;
    const newResults = [...results, { cardId: currentCard.id, correct }];
    setResults(newResults);

    const nextIndex = reviewIndex + 1;
    if (nextIndex >= deckCards.length) {
      setSessionDone(true);
    } else {
      flipAnim.setValue(0);
      setFlipped(false);
      setReviewIndex(nextIndex);
    }
  }

  function handleNext() {
    if (!currentCard) return;
    const nextIndex = reviewIndex + 1;
    if (nextIndex >= deckCards.length) {
      setSessionDone(true);
    } else {
      flipAnim.setValue(0);
      setFlipped(false);
      setReviewIndex(nextIndex);
    }
  }

  function handleRestart() {
    setReviewIndex(0);
    setFlipped(false);
    setResults([]);
    setSessionDone(false);
    flipAnim.setValue(0);
  }

  function handleDeleteCard() {
    if (!currentCard) return;
    deleteCard(currentCard.id);
    flipAnim.setValue(0);
    setFlipped(false);
    if (reviewIndex >= deckCards.length - 1) {
      setReviewIndex(Math.max(0, reviewIndex - 1));
    }
  }

  function openEdit() {
    if (!currentCard) return;
    setEditingCard(currentCard);
    setEditQ(currentCard.question);
    setEditA(currentCard.answer);
  }

  function handleSaveEdit() {
    if (!editingCard || !editQ.trim() || !editA.trim()) return;
    editCard(editingCard.id, editQ, editA);
    setEditingCard(null);
  }

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "90deg", "90deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["90deg", "90deg", "0deg"],
  });

  if (sessionDone) {
    const pct = deckCards.length > 0 ? Math.round((correctCount / deckCards.length) * 100) : 0;
    return (
      <View style={[styles.container, { paddingTop: topPad + 24 }]}>
        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryHeader}
          >
            <Text style={styles.summaryEmoji}>🎉</Text>
            <Text style={styles.summaryTitle}>Revisão concluída!</Text>
            <Text style={styles.summarySubtitle}>{deckName}</Text>
          </LinearGradient>

          <View style={styles.summaryBody}>
            <View style={styles.summaryStatsRow}>
              <View style={[styles.summaryStat, { backgroundColor: "#e8f8ef" }]}>
                <Text style={[styles.summaryStatNum, { color: Colors.success }]}>{correctCount}</Text>
                <Text style={styles.summaryStatLabel}>Acertei</Text>
              </View>
              <View style={[styles.summaryStat, { backgroundColor: "#fce8e8" }]}>
                <Text style={[styles.summaryStatNum, { color: Colors.error }]}>{wrongCount}</Text>
                <Text style={styles.summaryStatLabel}>Errei</Text>
              </View>
              <View style={[styles.summaryStat, { backgroundColor: Colors.accent }]}>
                <Text style={[styles.summaryStatNum, { color: Colors.primary }]}>{pct}%</Text>
                <Text style={styles.summaryStatLabel}>Aproveitamento</Text>
              </View>
            </View>

            <View style={styles.summaryActions}>
              <TouchableOpacity onPress={handleRestart} style={styles.summaryBtn} activeOpacity={0.85}>
                <RotateCcw size={16} color={Colors.primary} />
                <Text style={styles.summaryBtnText}>Revisar novamente</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onBack} style={[styles.summaryBtn, styles.summaryBtnPrimary]} activeOpacity={0.85}>
                <Text style={styles.summaryBtnPrimaryText}>Voltar ao início</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} />
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.deckTitle}>{deckName}</Text>
          <Text style={styles.progressText}>
            {deckCards.length === 0 ? "0 / 0" : `${reviewIndex + 1} / ${deckCards.length}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {currentCard && (
            <>
              <TouchableOpacity onPress={openEdit} style={styles.iconBtn} activeOpacity={0.7}>
                <Edit3 size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteCard} style={styles.iconBtn} activeOpacity={0.7}>
                <Trash2 size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {deckCards.length > 0 && (
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]} />
        </View>
      )}

      <View style={styles.sessionScore}>
        <View style={[styles.scorePill, { backgroundColor: "#e8f8ef" }]}>
          <CheckCircle2 size={13} color={Colors.success} />
          <Text style={[styles.scorePillText, { color: Colors.success }]}>{correctCount}</Text>
        </View>
        <View style={[styles.scorePill, { backgroundColor: "#fce8e8" }]}>
          <XCircle size={13} color={Colors.error} />
          <Text style={[styles.scorePillText, { color: Colors.error }]}>{wrongCount}</Text>
        </View>
      </View>

      {currentCard ? (
        <View style={styles.reviewArea}>
          <View style={styles.cardWrapper}>
            <Animated.View
              style={[styles.cardFace, { transform: [{ rotateY: frontInterpolate }] }]}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => animateFlip(true)}
                style={styles.flashcard}
              >
                <Text style={styles.cardSideLabel}>PERGUNTA</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardText}>{currentCard.question}</Text>
                </View>
                <Text style={styles.cardHint}>Toque para ver a resposta</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.cardFace,
                styles.cardFaceBack,
                { transform: [{ rotateY: backInterpolate }] },
              ]}
            >
              <View style={styles.flashcardAnswer}>
                <Text style={[styles.cardSideLabel, { color: Colors.primary }]}>RESPOSTA</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardText}>{currentCard.answer}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => animateFlip(false)}
                  style={styles.flipBackHint}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={13} color={Colors.textMuted} />
                  <Text style={styles.cardHint}>Ver pergunta novamente</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {flipped ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => handleAnswer(false)} style={[styles.actionBtn, styles.actionBtnWrong]} activeOpacity={0.8}>
                <XCircle size={22} color={Colors.error} />
                <Text style={[styles.actionBtnText, { color: Colors.error }]}>Errei</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={[styles.actionBtn, styles.actionBtnSkip]} activeOpacity={0.8}>
                <RotateCcw size={22} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Pular</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAnswer(true)} style={[styles.actionBtn, styles.actionBtnCorrect]} activeOpacity={0.8}>
                <CheckCircle2 size={22} color={Colors.success} />
                <Text style={[styles.actionBtnText, { color: Colors.success }]}>Acertei</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tapHintRow}>
              <Text style={styles.tapHintText}>Toque no card para revelar a resposta</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyArea}>
          <View style={styles.emptyCard}>
            <BookIcon />
            <Text style={styles.emptyTitle}>Deck vazio</Text>
            <Text style={styles.emptyText}>Adicione cards para começar a estudar.</Text>
            <TouchableOpacity onPress={onCreateCard} style={styles.emptyBtn} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Criar card</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={!!editingCard} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar card</Text>
            <Text style={styles.modalLabel}>Pergunta</Text>
            <TextInput
              value={editQ}
              onChangeText={setEditQ}
              style={styles.modalInput}
              multiline
              textAlignVertical="top"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.modalLabel}>Resposta</Text>
            <TextInput
              value={editA}
              onChangeText={setEditA}
              style={[styles.modalInput, { minHeight: 90 }]}
              multiline
              textAlignVertical="top"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingCard(null)} style={styles.modalCancelBtn} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} style={styles.modalSaveBtn} activeOpacity={0.85}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BookIcon() {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ height: 56, width: 56, borderRadius: 16, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 size={28} color={Colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  deckTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sessionScore: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  reviewArea: {
    flex: 1,
    gap: 20,
  },
  cardWrapper: {
    flex: 1,
    position: "relative",
  },
  cardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: "hidden",
  },
  cardFaceBack: {
    backfaceVisibility: "hidden",
  },
  flashcard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 5,
    justifyContent: "space-between",
  },
  flashcardAnswer: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: "space-between",
  },
  cardSideLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  cardBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  cardText: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 38,
  },
  cardHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
  flipBackHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 14,
    paddingBottom: 44,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    gap: 8,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  actionBtnWrong: {
    backgroundColor: "#fce8e8",
  },
  actionBtnSkip: {
    backgroundColor: Colors.card,
  },
  actionBtnCorrect: {
    backgroundColor: "#e8f8ef",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tapHintRow: {
    alignItems: "center",
    paddingBottom: 24,
  },
  tapHintText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 48,
    alignItems: "center",
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    maxWidth: 400,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  summaryContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeader: {
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    width: "100%",
    maxWidth: 480,
    gap: 8,
  },
  summaryEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
  },
  summarySubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
  },
  summaryBody: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 480,
    gap: 24,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
    marginTop: -12,
  },
  summaryStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryStat: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  summaryStatNum: {
    fontSize: 28,
    fontWeight: "700",
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  summaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  summaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  summaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  summaryBtnPrimary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 500,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  modalInput: {
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textDark,
    minHeight: 60,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
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
  modalSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
