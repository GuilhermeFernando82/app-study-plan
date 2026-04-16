import React, { useEffect, useMemo, useState } from "react";
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
import { api, studyApi } from "../services/api";
import {
  clearSession,
  getSession,
  saveStudyPlan,
} from "../services/storage";

function formatPlanText(plan) {
  if (!plan) return "";

  if (typeof plan === "string") {
    try {
      const parsed = JSON.parse(plan);
      return formatPlanText(parsed);
    } catch {
      return plan;
    }
  }

  return Object.entries(plan)
    .map(([title, items]) => {
      const rows = (items || []).map((item) => `- ${item}`).join("\n");
      return `📘 ${title}\n${rows}`;
    })
    .join("\n\n");
}

function buildDefaultPlan() {
  return [
    "📘 Fundamentos",
    "- Logica de programacao",
    "- Variaveis e tipos",
    "- Condicionais e repeticao",
    "",
    "📘 JavaScript",
    "- Funcoes e arrays",
    "- Objetos e metodos",
    "- Manipulacao de JSON",
    "",
    "📘 API e Backend",
    "- HTTP e REST",
    "- Autenticacao com token",
    "- Tratamento de erros",
  ].join("\n");
}

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [theme, setTheme] = useState("");
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [points, setPoints] = useState(0);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const isCorrect = useMemo(() => feedback.startsWith("Correto"), [feedback]);

  useEffect(() => {
    const bootstrap = async () => {
      const session = await getSession();
      if (!session.authToken) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setUserName(session.userName || "Usuario");
      setUserId(session.userId || "");
      if (session.userId) {
        fetchScore(session.userId);
      }
      fetchQuestion();
    };

    bootstrap();
  }, [navigation]);

  const fetchScore = async (id) => {
    try {
      const response = await api.get("/Score/my", { params: { id } });
      setPoints(response.data?.score ?? 0);
    } catch {
      setPoints(0);
    }
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setFeedback("");
    setShowSummary(false);

    try {
      const { data } = await api.get("/api/Tutor/question");
      setTheme(data?.tema || "");
      setSummary(data?.resumo || "");
      setQuestion(data?.pergunta || "Pergunta nao encontrada.");

      const mapped = Object.entries(data?.alternativas || {}).map(([key, text]) => ({
        key,
        text,
      }));

      setAlternatives(mapped);
    } catch {
      setQuestion("Nao foi possivel carregar a pergunta.");
      setAlternatives([]);
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (value) => {
    let resolvedUserId = Number(userId);
    if (!resolvedUserId) {
      const session = await getSession();
      resolvedUserId = Number(session.userId || 0);
    }
    if (!resolvedUserId) return;

    try {
      await api.post("/Score/update", {
        userId: resolvedUserId,
        UserId: resolvedUserId,
        score: value,
        Score: value,
      });
      await fetchScore(resolvedUserId);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("[score-update-error]", {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
      }
    }
  };

  const answerQuestion = async (key) => {
    try {
      const { data } = await api.post("/api/Tutor/answer", { alternative: key });
      let nextScore = 0;
      setPoints((prev) => {
        nextScore = data?.isCorrect ? prev + 10 : Math.max(0, prev - 5);
        return nextScore;
      });

      setFeedback(
        data?.isCorrect
          ? "Correto! +10 pontos"
          : `Incorreto. Resposta correta: ${data?.correctAnswer || "-"}`,
      );

      await updateScore(nextScore);

      setTimeout(fetchQuestion, 1200);
    } catch {
      setFeedback("Erro ao validar resposta.");
    }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      let formatted = "";
      const attempts = [
        () => studyApi.get("/api/plan"),
        () => api.get("/api/Tutor/plan"),
        () => api.get("/Tutor/plan"),
      ];

      for (const run of attempts) {
        try {
          const response = await run();
          const candidate = formatPlanText(response.data?.plan || response.data);
          if (candidate) {
            formatted = candidate;
            break;
          }
        } catch {
          // tenta proximo endpoint
        }
      }

      if (!formatted) formatted = buildDefaultPlan();
      await saveStudyPlan(formatted);
      navigation.navigate("Plan");
    } catch {
      Alert.alert(
        "Plano",
        "Falha ao gerar plano remoto. Abrindo com plano padrao local.",
      );
      await saveStudyPlan(buildDefaultPlan());
      navigation.navigate("Plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const onLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Tutor de Programacao</Text>
          <Text style={styles.subtitle}>Ola, {userName}</Text>
        </View>
        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>⭐ {points}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuRow}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate("Profile")}>
            <Text style={styles.menuButtonText}>Ranking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate("Agenda")}>
            <Text style={styles.menuButtonText}>Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuButton, generatingPlan && styles.disabled]}
            onPress={handleGeneratePlan}
            disabled={generatingPlan}
          >
            <Text style={styles.menuButtonText}>
              {generatingPlan ? "Gerando..." : "Plano"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.menuButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#7d8eff" />
              <Text style={styles.text}>Carregando pergunta...</Text>
            </View>
          ) : (
            <>
              {theme ? <Text style={styles.theme}>Tema: {theme}</Text> : null}
              <Text style={styles.question}>{question}</Text>

              {alternatives.map((alt) => (
                <TouchableOpacity
                  key={String(alt.key)}
                  style={styles.option}
                  onPress={() => answerQuestion(alt.key)}
                >
                  <Text style={styles.optionText}>{`${alt.key}) ${alt.text}`}</Text>
                </TouchableOpacity>
              ))}

              {feedback ? (
                <Text style={[styles.feedback, isCorrect ? styles.ok : styles.bad]}>{feedback}</Text>
              ) : null}

              {summary ? (
                <TouchableOpacity
                  style={styles.summaryButton}
                  onPress={() => setShowSummary((s) => !s)}
                >
                  <Text style={styles.summaryButtonText}>
                    {showSummary ? "Ocultar explicacao" : "Ver explicacao"}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {showSummary && summary ? <Text style={styles.summary}>{summary}</Text> : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#081426",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
  },
  subtitle: {
    color: "#9cb0d5",
    marginTop: 4,
  },
  pointsPill: {
    backgroundColor: "#1a3cff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pointsText: {
    color: "#fff",
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  menuRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  menuButton: {
    backgroundColor: "#122243",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logoutButton: {
    backgroundColor: "#5f1b33",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#0d1d3b",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  loadingWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  text: {
    color: "#d8e3f8",
  },
  theme: {
    color: "#8bb6ff",
    fontWeight: "600",
  },
  question: {
    color: "#e8f1ff",
    fontSize: 16,
    lineHeight: 24,
  },
  option: {
    backgroundColor: "#122a54",
    borderRadius: 10,
    padding: 12,
  },
  optionText: {
    color: "#fff",
  },
  feedback: {
    marginTop: 6,
    fontWeight: "700",
  },
  ok: {
    color: "#4ade80",
  },
  bad: {
    color: "#f87171",
  },
  summaryButton: {
    backgroundColor: "#1a3cff",
    borderRadius: 10,
    padding: 12,
  },
  summaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  summary: {
    color: "#d8e3f8",
    lineHeight: 22,
  },
  disabled: {
    opacity: 0.5,
  },
});
