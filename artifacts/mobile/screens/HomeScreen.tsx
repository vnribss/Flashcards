import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Sparkles, Plus, User, MoreHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useUpdateCheck } from "@/hooks/useUpdateCheck";

import Colors from "@/constants/colors";
import TopGradient from "@/components/TopGradient";
import NavBar from "@/components/NavBar";
import { useFlashcards } from "@/context/FlashcardsContext";

type Props = {
  onOpenReview: (deckId: number) => void;
  onCreate: () => void;
};

export default function HomeScreen({ onOpenReview, onCreate }: Props) {
  const { decks, cards, selectedDeckId } = useFlashcards();
  const { isChecking, checkForUpdates } = useUpdateCheck();

  return (
    <View style={styles.container}>
      <TopGradient
        title="Cards"
        subtitle="Hi, Dominique"
        leftIcon={<MoreHorizontal size={22} color="rgba(255,255,255,0.9)" />}
        rightIcon={
          <View style={styles.avatarIcon}>
            <User size={14} color={Colors.primary} />
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.labelSmall}>RESUMO</Text>
            <Text style={styles.summaryText}>{cards.length} flashcards salvos</Text>
          </View>
          <View style={styles.sparkleIcon}>
            <Sparkles size={18} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.halfCard]}>
            <Text style={styles.labelSmall}>DECKS</Text>
            <Text style={styles.statNumber}>{decks.length}</Text>
          </View>
          <View style={[styles.statCard, styles.halfCard]}>
            <Text style={styles.labelSmall}>CARDS</Text>
            <Text style={styles.statNumber}>{cards.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={checkForUpdates}
          disabled={isChecking}
          style={[styles.updateBtn, isChecking && styles.updateBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={styles.updateBtnText}>
            {isChecking ? "Verificando atualizações..." : "Buscar atualização"}
          </Text>
        </TouchableOpacity>

        <View style={styles.deckCard}>
          <View style={styles.deckHeader}>
            <Text style={styles.labelSmall}>MATÉRIAS</Text>
            <TouchableOpacity onPress={onCreate} style={styles.addBtn}>
              <Plus size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {decks.map((deck) => {
            const total = cards.filter((c) => c.deckId === deck.id).length;
            return (
              <TouchableOpacity
                key={deck.id}
                onPress={() => onOpenReview(deck.id)}
                style={styles.deckItem}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.deckName}>{deck.name}</Text>
                  <Text style={styles.deckCount}>{total} cards</Text>
                </View>
                <View style={styles.deckRight}>
                  <Text style={styles.deckStudy}>Estudar</Text>
                  <Text style={styles.deckOpen}>abrir deck</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => onOpenReview(selectedDeckId)}
          style={styles.startBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>COMEÇAR REVISÃO</Text>
        </TouchableOpacity>
      </ScrollView>

      <NavBar onHome={() => {}} onCreate={onCreate} />
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
    paddingTop: 0,
    paddingBottom: 100,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 4,
  },
  labelSmall: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  summaryText: {
    fontSize: 14,
    color: "#4f4465",
    marginTop: 4,
  },
  sparkleIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 3,
  },
  halfCard: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textHeader,
    marginTop: 8,
  },
  deckCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#735aaa",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 3,
  },
  deckHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  deckItem: {
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  deckName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5d5077",
  },
  deckCount: {
    fontSize: 11,
    color: "#b1a7c6",
    marginTop: 2,
  },
  deckRight: {
    alignItems: "flex-end",
  },
  deckStudy: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  deckOpen: {
    fontSize: 10,
    color: "#b1a7c6",
    marginTop: 2,
  },
  updateBtn: {
    borderRadius: 12,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  startBtn: {
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
  startBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  avatarIcon: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
});
