import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7181",
});

export default function Dashboard() {
  const [agenda, setAgenda] = useState([]);
  const [pomodoros, setPomodoros] = useState([]);
  const [estatisticas, setEstatisticas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [tempoRestante, setTempoRestante] = useState(25 * 60);
  const [rodando, setRodando] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tituloAgenda, setTituloAgenda] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [pomodoroTitulo, setPomodoroTitulo] = useState("");
  const [lembreteTitulo, setLembreteTitulo] = useState("");
  const [lembreteMensagem, setLembreteMensagem] = useState("");
  const [userId, setUserId] = useState(null);

  const [estatDisciplina, setEstatDisciplina] = useState("");
  const [estatTempo, setEstatTempo] = useState("");
  const [editingEstatId, setEditingEstatId] = useState(null);

  useEffect(() => {
    const id = sessionStorage.getItem("userId");
    if (id) {
      setUserId(id);
      carregarDados(id);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (rodando && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
      }, 1000);
    }
    if (tempoRestante === 0) {
      setRodando(false);
      alert("Pomodoro finalizado!");
    }
    return () => clearInterval(timer);
  }, [rodando, tempoRestante]);

  function iniciarCronometro() {
    setRodando(true);
  }
  function formatarTempo() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    return `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
  }

  async function carregarDados(id) {
    setLoading(true);
    try {
      const [agendaRes, pomodoroRes, estatRes, lembreteRes] = await Promise.all(
        [
          api.get(`/api/agenda?userId=${id}`),
          api.get(`/api/pomodoro?userId=${id}`),
          api.get(`/api/estatistica?userId=${id}`),
          api.get(`/api/lembrete?userId=${id}`),
        ],
      );
      setAgenda(agendaRes.data);
      setPomodoros(pomodoroRes.data);
      setEstatisticas(estatRes.data);
      setLembretes(lembreteRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function deletarAgenda(id) {
    try {
      await api.delete(`/api/Agenda/${id}?userId=${userId}`);
      carregarDados(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function criarAgenda() {
    try {
      await api.post("/api/agenda", {
        userId,
        titulo: tituloAgenda,
        disciplina,
        dataEntrega: new Date(),
        tipo: "Trabalho",
        descricao: "Dashboard",
      });
      setTituloAgenda("");
      setDisciplina("");
      carregarDados(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function iniciarPomodoro() {
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 25 * 60000);
    try {
      await api.post("/api/pomodoro", {
        userId,
        titulo: pomodoroTitulo,
        duracaoMinutos: 25,
        dataInicio: inicio,
        dataFim: fim,
        status: "Iniciado",
      });
      setPomodoroTitulo("");
      carregarDados(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function criarLembrete() {
    try {
      await api.post("/api/lembrete", {
        userId,
        titulo: lembreteTitulo,
        mensagem: lembreteMensagem,
        dataLembrete: new Date(),
        ativo: true,
      });
      setLembreteTitulo("");
      setLembreteMensagem("");
      carregarDados(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function salvarEstatistica() {
    if (!estatDisciplina || !estatTempo) return;
    const payload = {
      userId: parseInt(userId),
      disciplina: estatDisciplina,
      tempoEstudoMinutos: parseInt(estatTempo),
      dataRegistro: new Date(),
    };
    try {
      if (editingEstatId)
        await api.put(`/api/estatistica/${editingEstatId}`, payload);
      else await api.post("/api/estatistica", payload);
      setEstatDisciplina("");
      setEstatTempo("");
      setEditingEstatId(null);
      carregarDados(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function deletarEstatistica(id) {
    try {
      await api.delete(`/api/estatistica/${id}?userId=${userId}`);
      carregarDados(userId);
    } catch (err) {
      console.error(err);
    }
  }

  function prepararEdicao(estat) {
    setEstatDisciplina(estat.disciplina);
    setEstatTempo(estat.tempoEstudoMinutos);
    setEditingEstatId(estat.id);
  }

  return (
    <div className="dashboard-wrapper">
      <a href="/home" className="btn-back-container">
        <div className="btn-back-content">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Voltar ao Início</span>
        </div>
      </a>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          background: linear-gradient(120deg, #081426 0%, #1a3cff 100%);
          font-family: "Poppins", "Inter", Arial, sans-serif;
          overflow-x: hidden;
        }
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap");
      `}</style>

      <header className="main-header">
        <h1>
          📚 Study<span>Dashboard</span>
        </h1>
        {loading && <div className="loader">Sincronizando...</div>}
      </header>

      <div className="dashboard-grid">
        {/* TIMER */}
        <section className="glass-card">
          <h2>🍅 Pomodoro</h2>
          <div className="display-timer">{formatarTempo()}</div>
          <div className="form-column">
            <input
              placeholder="O que vamos estudar?"
              value={pomodoroTitulo}
              onChange={(e) => setPomodoroTitulo(e.target.value)}
            />
            <button
              className="btn-main"
              onClick={() => {
                iniciarCronometro();
                iniciarPomodoro();
              }}
            >
              Iniciar Sessão
            </button>
          </div>
        </section>

        {/* AGENDA - CORRIGIDO O INPUT QUEBRANDO */}
        <section className="glass-card">
          <h2>📅 Agenda</h2>
          <div className="form-flex-row">
            <input
              className="flex-2"
              placeholder="Título"
              value={tituloAgenda}
              onChange={(e) => setTituloAgenda(e.target.value)}
            />
            <input
              className="flex-1"
              placeholder="Matéria"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
            />
            <button className="btn-add" onClick={criarAgenda}>
              +
            </button>
          </div>
          <div className="scroll-list">
            {agenda.map((item) => (
              <div key={item.id} className="list-item">
                <div>
                  <strong>{item.titulo}</strong>
                  <p>{item.disciplina}</p>
                </div>
                <button
                  className="btn-del"
                  onClick={() => deletarAgenda(item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ESTATÍSTICAS - CORRIGIDO O INPUT QUEBRANDO */}
        <section className="glass-card">
          <div className="card-header">
            <h2>📊 Estatísticas</h2>
            {editingEstatId && (
              <button
                className="btn-cancel"
                onClick={() => {
                  setEditingEstatId(null);
                  setEstatDisciplina("");
                  setEstatTempo("");
                }}
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="form-column">
            <div className="form-flex-row">
              <input
                className="flex-2"
                placeholder="Disciplina"
                value={estatDisciplina}
                onChange={(e) => setEstatDisciplina(e.target.value)}
              />
              <input
                className="flex-small"
                type="number"
                placeholder="Min"
                value={estatTempo}
                onChange={(e) => setEstatTempo(e.target.value)}
              />
            </div>
            <button
              className={`btn-save ${editingEstatId ? "edit-mode" : ""}`}
              onClick={salvarEstatistica}
            >
              {editingEstatId ? "Atualizar" : "Registrar Tempo"}
            </button>
          </div>
          <div className="stats-list">
            {estatisticas.map((e) => (
              <div
                key={e.id}
                className="stat-item"
                onClick={() => prepararEdicao(e)}
              >
                <div className="stat-info">
                  <span className="stat-value">{e.tempoEstudoMinutos}m</span>
                  <span className="stat-name">{e.disciplina}</span>
                </div>
                <button
                  className="btn-del-small"
                  onClick={(e_ev) => {
                    e_ev.stopPropagation();
                    deletarEstatistica(e.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* LEMBRETES */}
        <section className="glass-card">
          <h2>🔔 Lembretes</h2>
          <div className="form-column">
            <input
              placeholder="Título"
              value={lembreteTitulo}
              onChange={(e) => setLembreteTitulo(e.target.value)}
            />
            <textarea
              placeholder="Mensagem..."
              value={lembreteMensagem}
              onChange={(e) => setLembreteMensagem(e.target.value)}
            />
            <button className="btn-sec" onClick={criarLembrete}>
              Salvar Nota
            </button>
          </div>
          <div className="scroll-list">
            {lembretes.map((l) => (
              <div key={l.id} className="note-box">
                <strong>{l.titulo}</strong>
                <p>{l.mensagem}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard-wrapper {
          min-height: 100vh;
          padding: 32px 12px 32px 12px;
          color: #f3f6fa;
          width: 100%;
          background: none;
        }
        .main-header {
          max-width: 1200px;
          margin: 0 auto 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .main-header h1 {
          font-size: 2.5rem;
          font-weight: 600;
          letter-spacing: -1px;
          background: linear-gradient(90deg, #1a3cff 30%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .main-header h1 span {
          color: #10b981;
          -webkit-text-fill-color: #10b981;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .glass-card {
          background: rgba(14, 31, 61, 0.92);
          border: 1.5px solid #1a3cff33;
          border-radius: 18px;
          padding: 28px 22px 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow:
            0 8px 32px 0 rgba(26, 60, 255, 0.1),
            0 1.5px 8px 0 #0002;
          transition: box-shadow 0.2s;
        }
        .glass-card:hover {
          box-shadow:
            0 12px 36px 0 rgba(26, 60, 255, 0.18),
            0 2px 12px 0 #0003;
        }

        /* FORMULÁRIOS FLEXÍVEIS */
        .form-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .form-flex-row {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        .flex-1 {
          flex: 1;
          min-width: 0;
        }
        .flex-2 {
          flex: 2;
          min-width: 0;
        }
        .flex-small {
          width: 80px;
          flex-shrink: 0;
        }

        input,
        textarea {
          background: #081426;
          border: 1px solid #1a2b4d;
          padding: 12px;
          color: white;
          border-radius: 8px;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
        }
        input:focus {
          border-color: #1a3cff;
        }

        .display-timer {
          font-size: 3.2rem;
          text-align: center;
          font-weight: 700;
          color: #1a3cff;
          margin-bottom: 12px;
          letter-spacing: 2px;
          text-shadow: 0 2px 12px #1a3cff44;
        }

        /* BOTÕES */
        button {
          cursor: pointer;
          border: none;
          border-radius: 10px;
          transition: 0.18s;
          font-weight: 600;
          font-family: inherit;
        }
        .btn-main {
          background: linear-gradient(90deg, #1a3cff 60%, #10b981 100%);
          color: white;
          padding: 13px 0;
          font-size: 1.08rem;
          box-shadow: 0 2px 8px #1a3cff22;
        }
        .btn-add {
          background: #1a3cff;
          color: white;
          width: 45px;
          font-size: 1.3rem;
          flex-shrink: 0;
          box-shadow: 0 2px 8px #1a3cff22;
        }
        .btn-save {
          background: #1a3cff;
          color: white;
          padding: 13px 0;
        }
        .btn-save.edit-mode {
          background: #f59e0b;
        }
        .btn-sec {
          background: #1a2b4d;
          color: white;
          padding: 11px 0;
        }
        .btn-del {
          background: transparent;
          color: #ef4444;
          font-size: 1.2rem;
        }
        .btn-del-small {
          background: transparent;
          color: #ef4444;
          font-size: 0.95rem;
        }
        button:hover {
          opacity: 0.92;
          filter: brightness(1.08);
          box-shadow: 0 4px 16px #1a3cff33;
        }

        /* LISTAS */
        .scroll-list {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .list-item {
          background: linear-gradient(90deg, #081426 80%, #1a3cff22 100%);
          padding: 12px 10px 12px 16px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 4px #1a3cff11;
        }
        .list-item strong {
          font-size: 1.08rem;
          color: #f3f6fa;
        }
        .list-item p {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .stats-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .stat-item {
          background: linear-gradient(90deg, #081426 80%, #10b98122 100%);
          padding: 12px 10px 12px 16px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 1px 4px #10b98111;
          transition: background 0.18s;
        }
        .stat-item:hover {
          background: linear-gradient(90deg, #1a3cff33 60%, #10b98133 100%);
        }
        .stat-value {
          display: block;
          font-size: 1.13rem;
          font-weight: bold;
          color: #10b981;
        }
        .stat-name {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .note-box {
          background: #1a2b4d;
          padding: 12px 14px;
          border-radius: 10px;
          border-left: 4px solid #1a3cff;
          box-shadow: 0 1px 4px #1a3cff11;
        }
        .note-box strong {
          font-size: 1.05rem;
          color: #f3f6fa;
        }
        .note-box p {
          font-size: 0.9rem;
          margin-top: 4px;
          color: #b6c3e0;
        }

        @media (max-width: 480px) {
          .form-flex-row {
            flex-direction: column;
          }
          .flex-small {
            width: 100%;
          }
          .btn-add {
            width: 100%;
            height: 45px;
          }
          .stats-list {
            grid-template-columns: 1fr;
          }
          .glass-card {
            padding: 18px 6px 14px 6px;
          }
        }
        .btn-back-container {
          position: fixed; /* Fixa no topo mesmo com scroll */
          top: 20px;
          left: 20px;
          z-index: 9999;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-back-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(26, 60, 255, 0.1); /* Azul sutil do seu tema */
          border: 1px solid rgba(26, 60, 255, 0.3);
          border-radius: 10px;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .btn-back-container:hover .btn-back-content {
          background: #1a3cff; /* O azul sólido do seu StudyDashboard */
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 60, 255, 0.4);
        }
        .btn-back-container:active {
          transform: scale(0.95);
        }
        @media (max-width: 768px) {
          .main-header {
            margin-top: 60px; /* Dá espaço para o botão no mobile */
          }
        }
      `}</style>
    </div>
  );
}
