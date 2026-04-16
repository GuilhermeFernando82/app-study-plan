import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../services/api";
import { getSession } from "../services/storage";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [rankingData, setRankingData] = useState([]);
  const [myPoints, setMyPoints] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const session = await getSession();
        const userId = Number(session.userId || 0);
        setCurrentUserId(userId);

        const [rankingRes, scoreRes] = await Promise.all([
          api.get("/Score/ranking"),
          api.get("/Score/my", { params: { id: userId } }),
        ]);

        setRankingData(rankingRes.data || []);
        setMyPoints(scoreRes.data?.score ?? 0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const ranking = useMemo(() => {
    return [...rankingData]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [rankingData]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Perfil e Ranking</Text>
      <View style={styles.meCard}>
        <Text style={styles.meLabel}>Seu score</Text>
        <Text style={styles.mePoints}>⭐ {myPoints}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
        </View>
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={(item, index) =>
            String(item.userId ?? item.id ?? `${item.name || "user"}-${index}`)
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isCurrent = Number(item.userId) === currentUserId;
            return (
              <View style={[styles.row, isCurrent && styles.myRow]}>
                <Text style={styles.rank}>#{item.rank}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.score}>⭐ {Number(item.score) || 0}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#081426",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  meCard: {
    backgroundColor: "#112140",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meLabel: {
    color: "#cfdaef",
  },
  mePoints: {
    color: "#fff",
    fontWeight: "700",
  },
  loadingWrap: {
    alignItems: "center",
    marginTop: 30,
    gap: 8,
  },
  loadingText: {
    color: "#cfdaef",
  },
  listContent: {
    paddingBottom: 20,
    gap: 8,
  },
  row: {
    backgroundColor: "#102042",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  myRow: {
    borderWidth: 1,
    borderColor: "#2cc7d8",
  },
  rank: {
    color: "#9db1d2",
    width: 42,
    fontWeight: "700",
  },
  name: {
    color: "#fff",
    flex: 1,
  },
  score: {
    color: "#9fe3b5",
    fontWeight: "700",
  },
});
