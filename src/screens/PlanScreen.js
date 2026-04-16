import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { studyApi } from "../services/api";
import { getStudyPlan } from "../services/storage";

function parseSections(planText) {
  if (!planText) return [];

  const grouped = [];
  let current = null;

  planText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith("📘")) {
        current = { title: line.replace("📘", "").trim(), topics: [] };
        grouped.push(current);
      } else if (line.startsWith("- ") && current) {
        current.topics.push(line.replace("- ", "").trim());
      }
    });

  return grouped;
}

export default function PlanScreen() {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);

  React.useEffect(() => {
    const load = async () => {
      const value = await getStudyPlan();
      setPlan(value || "");
      setLoading(false);
    };

    load();
  }, []);

  const sections = useMemo(() => parseSections(plan), [plan]);

  const explainTopic = async (topic) => {
    if (loadingTopic) return;

    if (expandedTopic === topic) {
      setExpandedTopic("");
      setExplanation("");
      return;
    }

    setExpandedTopic(topic);
    setLoadingTopic(true);

    try {
      let explanationText = "";
      const attempts = [
        () => studyApi.post("/api/explain-topic", { topic }),
        () => studyApi.post("/api/Tutor/explain-topic", { topic }),
        () => studyApi.post("/Tutor/explain-topic", { topic }),
      ];

      for (const run of attempts) {
        try {
          const response = await run();
          explanationText =
            response.data?.explanation || response.data?.summary || "";
          if (explanationText) break;
        } catch {
          // tenta proximo endpoint
        }
      }

      if (!explanationText) {
        explanationText = `Resumo rapido de ${topic}:\n- Revise conceitos principais\n- Resolva 3 exercicios praticos\n- Anote duvidas e pontos de melhoria`;
      }

      setExplanation(explanationText);
    } catch {
      setExplanation("Falha ao buscar explicacao deste topico.");
    } finally {
      setLoadingTopic(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Seu plano de estudos</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.text}>Carregando plano...</Text>
          </View>
        ) : sections.length === 0 ? (
          <Text style={styles.text}>Nenhum plano salvo ainda. Gere pelo menu da Home.</Text>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {section.topics.map((topic) => {
                const isOpen = expandedTopic === topic;
                return (
                  <View key={topic}>
                    <TouchableOpacity style={styles.topic} onPress={() => explainTopic(topic)}>
                      <Text style={styles.topicText}>{isOpen ? "▼" : "▶"} {topic}</Text>
                    </TouchableOpacity>

                    {isOpen ? (
                      <View style={styles.explanationBox}>
                        {loadingTopic ? (
                          <Text style={styles.text}>Carregando explicacao...</Text>
                        ) : (
                          <Text style={styles.text}>{explanation}</Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a1224" },
  content: { padding: 16, gap: 12 },
  title: { color: "#fff", fontWeight: "700", fontSize: 22 },
  loadingWrap: { alignItems: "center", gap: 8, marginTop: 30 },
  text: { color: "#c7d5ef", lineHeight: 21 },
  sectionCard: {
    backgroundColor: "#12203d",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  sectionTitle: { color: "#8bb6ff", fontSize: 18, fontWeight: "700" },
  topic: {
    backgroundColor: "#1a2e57",
    borderRadius: 10,
    padding: 10,
  },
  topicText: { color: "#fff", fontWeight: "600" },
  explanationBox: {
    backgroundColor: "#0d1a33",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 4,
  },
});
