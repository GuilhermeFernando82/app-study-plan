import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import { getApiBaseUrl } from "../services/api";
import { getSession } from "../services/storage";

const agendaApi = axios.create({
  baseURL: getApiBaseUrl(),
});

export default function AgendaScreen() {
  const [userId, setUserId] = useState("");
  const [agenda, setAgenda] = useState([]);
  const [pomodoros, setPomodoros] = useState([]);
  const [stats, setStats] = useState([]);
  const [notes, setNotes] = useState([]);

  const [tempoRestante, setTempoRestante] = useState(25 * 60);
  const [rodando, setRodando] = useState(false);
  const [pomodoroTitulo, setPomodoroTitulo] = useState("");
  const [tituloAgenda, setTituloAgenda] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [estatDisciplina, setEstatDisciplina] = useState("");
  const [estatTempo, setEstatTempo] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteMessage, setNoteMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const session = await getSession();
      if (session.userId) {
        setUserId(session.userId);
        fetchAll(session.userId);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let timer;
    if (rodando && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
      }, 1000);
    }

    if (tempoRestante === 0 && rodando) {
      setRodando(false);
      Alert.alert("Pomodoro", "Sessao finalizada.");
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [rodando, tempoRestante]);

  const fetchAll = async (uid) => {
    try {
      const [agendaRes, pomodoroRes, statsRes, notesRes] = await Promise.all([
        agendaApi.get(`/api/agenda?userId=${uid}`),
        agendaApi.get(`/api/pomodoro?userId=${uid}`),
        agendaApi.get(`/api/estatistica?userId=${uid}`),
        agendaApi.get(`/api/lembrete?userId=${uid}`),
      ]);
      setAgenda(agendaRes.data || []);
      setPomodoros(pomodoroRes.data || []);
      setStats(statsRes.data || []);
      setNotes(notesRes.data || []);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar a agenda.");
    }
  };

  const formatarTempo = () => {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    return `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
  };

  const iniciarPomodoro = async () => {
    if (!pomodoroTitulo) {
      Alert.alert("Pomodoro", "Informe um titulo para a sessao.");
      return;
    }

    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 25 * 60000);

    await agendaApi.post("/api/pomodoro", {
      userId,
      titulo: pomodoroTitulo,
      duracaoMinutos: 25,
      dataInicio: inicio,
      dataFim: fim,
      status: "Iniciado",
    });

    setTempoRestante(25 * 60);
    setRodando(true);
    setPomodoroTitulo("");
    fetchAll(userId);
  };

  const pausarPomodoro = () => {
    setRodando(false);
  };

  const retomarPomodoro = () => {
    if (tempoRestante > 0) {
      setRodando(true);
    }
  };

  const resetarPomodoro = () => {
    setRodando(false);
    setTempoRestante(25 * 60);
  };

  const createAgenda = async () => {
    if (!tituloAgenda || !disciplina) return;
    await agendaApi.post("/api/agenda", {
      userId,
      titulo: tituloAgenda,
      disciplina,
      dataEntrega: new Date(),
      tipo: "Trabalho",
      descricao: "App mobile",
    });
    setTituloAgenda("");
    setDisciplina("");
    fetchAll(userId);
  };

  const deleteAgenda = async (id) => {
    await agendaApi.delete(`/api/Agenda/${id}?userId=${userId}`);
    fetchAll(userId);
  };

  const saveStat = async () => {
    if (!estatDisciplina || !estatTempo) return;
    await agendaApi.post("/api/estatistica", {
      userId: Number(userId),
      disciplina: estatDisciplina,
      tempoEstudoMinutos: Number(estatTempo),
      dataRegistro: new Date(),
    });
    setEstatDisciplina("");
    setEstatTempo("");
    fetchAll(userId);
  };

  const createNote = async () => {
    if (!noteTitle || !noteMessage) return;
    await agendaApi.post("/api/lembrete", {
      userId,
      titulo: noteTitle,
      mensagem: noteMessage,
      dataLembrete: new Date(),
      ativo: true,
    });
    setNoteTitle("");
    setNoteMessage("");
    fetchAll(userId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Agenda de Estudos</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pomodoro</Text>
          <Text style={styles.timer}>{formatarTempo()}</Text>
          <TextInput
            style={styles.input}
            placeholder="O que vamos estudar?"
            placeholderTextColor="#8ea0be"
            value={pomodoroTitulo}
            onChangeText={setPomodoroTitulo}
          />
          <TouchableOpacity style={styles.button} onPress={iniciarPomodoro}>
            <Text style={styles.buttonText}>
              {rodando ? "Rodando..." : "Iniciar sessao"}
            </Text>
          </TouchableOpacity>
          <View style={styles.timerActions}>
            <TouchableOpacity
              style={[styles.timerButton, styles.pauseButton]}
              onPress={pausarPomodoro}
              disabled={!rodando}
            >
              <Text style={styles.timerButtonText}>Pausar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timerButton, styles.resumeButton]}
              onPress={retomarPomodoro}
              disabled={rodando || tempoRestante === 0}
            >
              <Text style={styles.timerButtonText}>Retomar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timerButton, styles.resetButton]}
              onPress={resetarPomodoro}
            >
              <Text style={styles.timerButtonText}>Resetar</Text>
            </TouchableOpacity>
          </View>

          {pomodoros.map((item) => (
            <View key={item.id} style={styles.listRow}>
              <View>
                <Text style={styles.itemTitle}>{item.titulo}</Text>
                <Text style={styles.itemMeta}>
                  {item.duracaoMinutos || 25} min - {item.status || "Iniciado"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nova atividade</Text>
          <TextInput
            style={styles.input}
            placeholder="Titulo"
            placeholderTextColor="#8ea0be"
            value={tituloAgenda}
            onChangeText={setTituloAgenda}
          />
          <TextInput
            style={styles.input}
            placeholder="Disciplina"
            placeholderTextColor="#8ea0be"
            value={disciplina}
            onChangeText={setDisciplina}
          />
          <TouchableOpacity style={styles.button} onPress={createAgenda}>
            <Text style={styles.buttonText}>Adicionar na agenda</Text>
          </TouchableOpacity>

          <FlatList
            data={agenda}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.listRow}>
                <View>
                  <Text style={styles.itemTitle}>{item.titulo}</Text>
                  <Text style={styles.itemMeta}>{item.disciplina}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteAgenda(item.id)}>
                  <Text style={styles.remove}>Remover</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estatisticas</Text>
          <TextInput
            style={styles.input}
            placeholder="Disciplina"
            placeholderTextColor="#8ea0be"
            value={estatDisciplina}
            onChangeText={setEstatDisciplina}
          />
          <TextInput
            style={styles.input}
            placeholder="Minutos"
            placeholderTextColor="#8ea0be"
            keyboardType="numeric"
            value={estatTempo}
            onChangeText={setEstatTempo}
          />
          <TouchableOpacity style={styles.button} onPress={saveStat}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>

          {stats.map((stat) => (
            <View key={stat.id} style={styles.listRow}>
              <Text style={styles.itemTitle}>{stat.disciplina}</Text>
              <Text style={styles.itemMeta}>{stat.tempoEstudoMinutos} min</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lembretes</Text>
          <TextInput
            style={styles.input}
            placeholder="Titulo"
            placeholderTextColor="#8ea0be"
            value={noteTitle}
            onChangeText={setNoteTitle}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Mensagem"
            placeholderTextColor="#8ea0be"
            value={noteMessage}
            onChangeText={setNoteMessage}
            multiline
          />
          <TouchableOpacity style={styles.button} onPress={createNote}>
            <Text style={styles.buttonText}>Salvar lembrete</Text>
          </TouchableOpacity>

          {notes.map((note) => (
            <View key={note.id} style={styles.noteBox}>
              <Text style={styles.itemTitle}>{note.titulo}</Text>
              <Text style={styles.itemMeta}>{note.mensagem}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#081426" },
  content: { padding: 16, gap: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  card: { backgroundColor: "#102042", borderRadius: 12, padding: 12, gap: 8 },
  cardTitle: { color: "#d8e5ff", fontWeight: "700", fontSize: 16 },
  timer: {
    color: "#73a2ff",
    fontWeight: "700",
    fontSize: 28,
    textAlign: "center",
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2a3f66",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#fff",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  button: {
    backgroundColor: "#1a3cff",
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 2,
  },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  timerActions: {
    flexDirection: "row",
    gap: 8,
  },
  timerButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  pauseButton: {
    backgroundColor: "#304566",
  },
  resumeButton: {
    backgroundColor: "#2f5e46",
  },
  resetButton: {
    backgroundColor: "#5c3943",
  },
  timerButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  listRow: {
    backgroundColor: "#13284f",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: { color: "#fff", fontWeight: "600" },
  itemMeta: { color: "#9fb3d6", marginTop: 2 },
  remove: { color: "#ff8a8a", fontWeight: "700" },
  noteBox: {
    backgroundColor: "#13284f",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
});
