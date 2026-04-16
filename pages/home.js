import React, { useEffect, useState } from "react";
import axios from "axios";
import api, { configureInterceptors } from "./api/api";
import { useRouter } from "next/router";

const apiQuestion = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ADRESS,
});

const QUESTION_API_URL = "/api/question";
const STUDY_PLAN_API_URL = "/api/plan";

export default function App() {
  const [pergunta, setPergunta] = useState("");
  const [alternativas, setAlternativas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pontos, setPontos] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [debugPayload, setDebugPayload] = useState(null);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [tema, setTema] = useState("");
  const [resumo, setResumo] = useState("");
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const router = useRouter();
  useEffect(() => {
    configureInterceptors(router);
  }, []);
  useEffect(() => {
    if (!userId) return;
    buscarScoreAtual();
  }, [userId]);

  function parseAlternativas(text) {
    if (!text) return [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const startIndex = lines.findIndex((l) => /^[A-Ea-e]\s*[\)\.\-:]/.test(l));
    if (startIndex !== -1) {
      const alts = [];
      for (let i = startIndex; i < lines.length; i++) {
        const m = lines[i].match(/^([A-Ea-e])\s*[\)\.\-:]\s*(.*)/);
        if (m) {
          alts.push({ key: m[1].toUpperCase(), text: m[2].trim() });
        } else {
          if (alts.length) alts[alts.length - 1].text += " " + lines[i];
        }
      }
      return alts;
    }

    const tail = lines.slice(-5);
    return tail.map((l, i) => ({ key: String.fromCharCode(65 + i), text: l }));
  }

  const carregarPergunta = async () => {
    setLoading(true);
    setFeedback("");
    setMostrarResumo(false);

    try {
      const { data } = await apiQuestion.get("/api/Tutor/question");

      if (!data?.pergunta || !data?.alternativas) {
        console.error("Formato inválido:", data);
        return;
      }

      setTema(data.tema || "");
      setResumo(data.resumo || "");
      setPergunta(data.pergunta);

      const alts = Object.entries(data.alternativas).map(([key, text]) => ({
        key,
        text,
      }));

      setAlternativas(alts);
    } catch (err) {
      console.error("Erro ao carregar pergunta:", err);
    } finally {
      setLoading(false);
    }
  };

  function formatStudyPlan(parsed) {
    return Object.entries(parsed)
      .map(([titulo, itens]) => {
        return `
        <div class="plan-section">
          <h2 class="plan-title">📘 ${titulo}</h2>
          <ul class="plan-list">
            ${itens
              .map(
                (item) =>
                  `<li>
                    <a href="#" class="plan-link" data-topic="${item}">
                      🔗 ${item}
                    </a>
                  </li>`,
              )
              .join("")}
          </ul>
        </div>
      `;
      })
      .join("");
  }
  async function salvarPontosNoServidor(pontosAtuais, userId) {
    try {
      const response = await api.post("/Score/update", {
        userId,
        score: pontosAtuais,
      });

      console.log("Pontos salvos no servidor:", response.data);
      return response.data;
    } catch (err) {
      console.error("Erro ao salvar pontos:", err);
    }
  }
  async function buscarScoreAtual() {
    try {
      const response = await api.get("/Score/my", {
        params: { id: userId },
      });

      setPontos(response.data.score ?? 0);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar score atual:", error);
    }
  }

  const gerarPlano = async () => {
    setGeneratingPlan(true);
    setStudyPlan(null);

    try {
      const res = await fetch(STUDY_PLAN_API_URL);
      const data = await res.json();
      let plano = data.plan;

      if (typeof plano === "object") {
        plano = Object.entries(plano)
          .map(
            ([titulo, itens]) =>
              `📘 ${titulo}\n${itens.map((i) => `- ${i}`).join("\n")}`,
          )
          .join("\n\n");
      }

      try {
        const parsed = JSON.parse(plano);
        plano = Object.entries(parsed)
          .map(
            ([titulo, itens]) =>
              `📘 ${titulo}\n${itens.map((i) => `- ${i}`).join("\n")}`,
          )
          .join("\n\n");
      } catch {}

      console.log("Plano formatado:", plano);
      localStorage.setItem("generatedStudyPlan", plano);
      setStudyPlan(plano);

      return plano;
    } catch {
      return null;
    } finally {
      setGeneratingPlan(false);
    }
  };
  useEffect(() => {
    const id = sessionStorage.getItem("userId");
    setUserName(sessionStorage.getItem("userName") || "");
    setUserId(id || "");
  }, []);
  const responder = async (altKey) => {
    try {
      const { data } = await apiQuestion.post("/api/Tutor/answer", {
        alternative: altKey,
      });

      setPontos((prev) => {
        let novoScore = prev;

        if (data.isCorrect) {
          setFeedback("✅ Você acertou!");
          novoScore = prev + 10;
        } else {
          setFeedback(`❌ Você errou! Resposta correta: ${data.correctAnswer}`);
          novoScore = Math.max(0, prev - 5);
        }

        salvarPontosNoServidor(novoScore, userId);
        return novoScore;
      });

      setTimeout(() => {
        carregarPergunta();
      }, 1500);
    } catch (err) {
      console.error("Erro ao enviar resposta:", err);
      setFeedback("⚠️ Erro ao validar resposta.");
    }
  };
  function formatarResumo(texto) {
    if (!texto) return "";

    return texto
      .split(/\n\s*\n/) // quebra por parágrafos
      .map((paragrafo) => `<p class="resumo-paragrafo">${paragrafo.trim()}</p>`)
      .join("");
  }

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
      router.push("/");
    }
  }, []);
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#081426";
    carregarPergunta();
  }, []);

  return (
    <div className="page">
      <div className="leftMenu">
        <button
          aria-haspopup="true"
          aria-expanded={menuOpen}
          className={`menuButton ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((s) => !s)}
          title="Menu"
        >
          <span className="hamburger">☰</span>
          <span className="userMini">
            <span className="avatar">
              {userName?.charAt(0).toUpperCase() || ""}
            </span>
            <span className="chev">▾</span>
          </span>
        </button>

        {menuOpen && (
          <div
            className="menuDropdown"
            role="menu"
            onMouseLeave={() => window.innerWidth > 720 && setMenuOpen(false)}
          >
            <div className="profilePreview" role="none">
              <div className="avatarLarge">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="profileInfo">
                <div className="profileName">{userName || "Usuário"}</div>
                <div className="profileStatus">Online</div>
              </div>
            </div>

            <nav className="menuList">
              <a
                href="/profile"
                className="menuItem"
                onClick={() => setMenuOpen(false)}
              >
                <span className="menuIcon">🏆</span> Rank de Usuários
              </a>

              <a
                href="/agenda"
                className="menuItem"
                onClick={() => setMenuOpen(false)}
              >
                <span className="menuIcon">📅</span> Agenda de Estudos
              </a>

              <button
                className="menuItem planButton"
                disabled={generatingPlan}
                onClick={async () => {
                  const plano = await gerarPlano();
                  if (plano) {
                    localStorage.setItem(
                      "generatedStudyPlan",
                      typeof plano === "string" ? plano : JSON.stringify(plano),
                    );
                    window.location.href = "/plan";
                  }
                }}
              >
                <span className="menuIcon">{generatingPlan ? "⏳" : "📚"}</span>
                {generatingPlan ? "Gerando plano..." : "Gerar Plano de Estudos"}
              </button>

              <div className="menuDivider" />

              <button
                className="menuItem logoutItem"
                onClick={() => {
                  sessionStorage.clear();
                  router.push("/");
                }}
              >
                <span className="menuIcon">🚪</span> Sair
              </button>
            </nav>
          </div>
        )}
      </div>

      <div className="card">
        <header className="header">
          <div className="brand">
            <div className="logo">💡</div>
            <h1>Tutor de Programação</h1>
          </div>

          <div className="points">⭐ {pontos}</div>
        </header>

        <main className="content">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <div>Carregando...</div>
            </div>
          ) : (
            <>
              {/* TEMA */}
              {tema && (
                <div className="theme">
                  📌 <strong>Tema:</strong> {tema}
                </div>
              )}

              {/* PERGUNTA */}
              <div
                className="question"
                dangerouslySetInnerHTML={{
                  __html: (pergunta || "").replace(/\n/g, "<br/>"),
                }}
              />

              {/* SEM ALTERNATIVAS */}
              {!loading && alternativas.length === 0 && pergunta && (
                <div className="no-alts">
                  <div>Nenhuma alternativa encontrada.</div>
                  <div className="mini">
                    Confira o payload da API ou clique em Recarregar.
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="retry" onClick={carregarPergunta}>
                      Recarregar
                    </button>
                  </div>
                </div>
              )}

              {/* ALTERNATIVAS */}
              <div className="options">
                {alternativas.length > 0 ? (
                  alternativas.map((alt, idx) => (
                    <button
                      key={idx}
                      className="option"
                      onClick={() => responder(alt.key)}
                      dangerouslySetInnerHTML={{
                        __html: `${alt.key}) ${alt.text}`,
                      }}
                    />
                  ))
                ) : (
                  <div className="waiting">
                    {loading ? "" : "Aguardando pergunta com alternativas..."}
                  </div>
                )}
              </div>

              {/* FEEDBACK */}
              {feedback && (
                <div
                  className={`feedback ${
                    feedback.startsWith("✅") ? "correct" : "wrong"
                  }`}
                >
                  {feedback}
                </div>
              )}

              {/* BOTÃO EXPLICAÇÃO */}
              {resumo && (
                <button
                  className="studyToggle"
                  onClick={() => setMostrarResumo((s) => !s)}
                >
                  {mostrarResumo
                    ? "📕 Ocultar explicação"
                    : "📘 Ver explicação do tema"}
                </button>
              )}

              {/* RESUMO / CONTEÚDO DE ESTUDO */}
              {mostrarResumo && resumo && (
                <div
                  className="resumo-container"
                  dangerouslySetInnerHTML={{
                    __html: formatarResumo(resumo),
                  }}
                />
              )}
            </>
          )}
        </main>

        <footer className="footer">
          Dica: leia a questão com calma e escolha a melhor alternativa.
        </footer>
      </div>

      <style jsx>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          animation: spin 0.6s linear infinite;
        }
        .theme {
          background: #0e1f3d;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 12px;
          color: #8ab4ff;
          font-size: 14px;
        }
        .resumo-container {
          color: #e6ecff;
          font-size: 16px;
          line-height: 1.7;
          text-align: justify;
        }

        .resumo-paragrafo {
          margin-bottom: 16px;
        }
        .studyToggle {
          margin-top: 16px;
          padding: 10px;
          width: 100%;
          border-radius: 8px;
          background: #1a3cff;
          color: #fff;
          border: none;
          cursor: pointer;
        }

        .studyBox {
          margin-top: 16px;
          padding: 16px;
          background: #0b1d33;
          border-radius: 10px;
          line-height: 1.6;
          font-size: 14px;
        }

        .studyBox pre {
          background: #000;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .studyPlanBox {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
          color: #dbeafe;
          margin-top: 16px;
        }
        .studyPlanBox pre {
          white-space: pre-wrap;
          font-size: 14px;
        }
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background:
            radial-gradient(
              1200px 600px at 10% 10%,
              rgba(99, 102, 241, 0.12),
              transparent
            ),
            linear-gradient(180deg, #051025 0%, #081426 100%);
          font-family:
            Inter,
            system-ui,
            -apple-system,
            "Segoe UI",
            Roboto,
            Arial;
          box-sizing: border-box;
        }
        .card {
          width: 100%;
          max-width: 760px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.03),
            rgba(255, 255, 255, 0.02)
          );
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 10px 30px rgba(3, 7, 18, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: #e6eef8;
        }
        .header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          height: 56px;
        }

        /* MENU FIXO FORA DO CARD (posicionamento global) */
        .leftMenu {
          position: fixed; /* Fixo na janela do navegador */
          top: 32px;
          left: 32px;
          z-index: 100;
          height: auto;
          display: flex;
          align-items: center;
        }

        /* Dropdown do menu */
        .menuDropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          z-index: 110;
          background: linear-gradient(
            180deg,
            rgba(2, 6, 23, 0.95),
            rgba(2, 6, 23, 0.9)
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 18px 40px rgba(2, 6, 23, 0.8);
          width: 250px;
          backdrop-filter: blur(8px);
          transition:
            opacity 0.3s ease,
            transform 0.3s ease;
          transform-origin: top left;
        }

        /* Estilo dos Botões de Ação no Dropdown */
        .profileActions {
          display: flex;
          gap: 8px;
          justify-content: flex-start;
          align-items: center;
        }

        .profileButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(90deg, #06b6d4, #6366f1);
          color: #021012;
          padding: 8px 10px;
          border-radius: 10px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
          /* Garante que o botão preencha o espaço sem quebrar */
          flex-grow: 1;
          text-align: center;
        }

        .logoutButton {
          min-width: 60px;
          white-space: nowrap;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e6eef8;
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.15s ease;
        }

        /* Pontos: Parte do Flexbox no Header */
        .points {
          background: linear-gradient(90deg, #22c55e, #06b6d4);
          color: #021012;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 600;
          box-shadow: 0 6px 14px rgba(6, 182, 212, 0.08);
          position: relative;
          z-index: 50;
        }

        .menuButton {
          display: flex;
          gap: 8px;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: #e6eef8;
          padding: 8px 10px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 6px 14px rgba(2, 6, 23, 0.45);
          transition: all 0.2s ease;
        }
        .menuButton:hover {
          transform: translateY(-2px);
          background: linear-gradient(
            90deg,
            rgba(99, 102, 241, 0.06),
            rgba(6, 182, 212, 0.03)
          );
        }
        .avatar {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          color: #021012;
          font-weight: 700;
          font-size: 13px;
        }

        .profilePreview {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          margin-bottom: 10px;
        }
        .avatarLarge {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          color: #021012;
          font-weight: 800;
          font-size: 20px;
        }
        .profileName {
          font-weight: 700;
          color: #e6eef8;
          font-size: 14px;
        }
        .profileEmail {
          font-size: 12px;
          color: rgba(230, 238, 248, 0.6);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 auto;
        }
        .logo {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.15);
        }
        h1 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.2px;
        }
        .content {
          margin-top: 8px;
        }
        /* ESTILOS RESTAURADOS PARA OPÇÕES */
        .options {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }
        .option {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: #e6eef8;
          padding: 14px 16px;
          border-radius: 10px;
          text-align: left;
          font-size: 15px;
          cursor: pointer;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
          box-shadow: 0 6px 18px rgba(2, 6, 23, 0.45);
        }
        .option:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(2, 6, 23, 0.6);
          background: linear-gradient(
            90deg,
            rgba(99, 102, 241, 0.08),
            rgba(6, 182, 212, 0.04)
          );
        }

        .question {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 16px;
          border-radius: 12px;
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.6;
          white-space: pre-wrap;
          margin-bottom: 16px;
        }

        .feedback {
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 10px;
          text-align: center;
          font-weight: 600;
          display: inline-block;
        }
        .feedback.correct {
          background: rgba(34, 197, 94, 0.12);
          color: #bbf7d0;
          border: 1px solid rgba(34, 197, 94, 0.18);
        }
        .feedback.wrong {
          background: rgba(239, 68, 68, 0.08);
          color: #ffd7d7;
          border: 1px solid rgba(239, 68, 68, 0.12);
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #93c5fd;
        }
        .spinner {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.06);
          border-top-color: rgba(99, 102, 241, 0.9);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .footer {
          margin-top: 18px;
          color: rgba(230, 238, 248, 0.6);
          font-size: 13px;
        }
        .no-alts {
          background: rgba(255, 255, 255, 0.02);
          padding: 10px;
          border-radius: 10px;
          color: #ffd7d7;
          margin-bottom: 12px;
        }
        .mini {
          font-size: 13px;
          opacity: 0.85;
          margin-top: 6px;
        }
        .retry {
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          background: #06b6d4;
          color: #021012;
          border: none;
          font-weight: 700;
        }
        .debug {
          margin-top: 12px;
          color: #93c5fd;
        }
        pre {
          background: rgba(0, 0, 0, 0.25);
          padding: 8px;
          border-radius: 8px;
          overflow: auto;
          max-height: 200px;
        }

        /* AJUSTES RESPONSIVOS */
        @media (max-width: 719px) {
          .leftMenu {
            top: 10px;
            left: 10px;
          }
          .menuDropdown {
            left: 0;
            transform: none;
            max-width: 90vw;
          }
          .card {
            margin-top: 50px; /* Margem para compensar o menu fixo no mobile */
          }
          .header {
            justify-content: center; /* Centraliza o brand no mobile */
          }
        }

        @media (min-width: 720px) {
          .options {
            grid-template-columns: 1fr 1fr;
          }
        }
        .feedback {
          margin-top: 14px;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          font-weight: 700;
          font-size: 16px;
          animation: fadeIn 0.3s ease;
        }

        .feedback.correct {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .feedback.wrong {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Container do Dropdown */
        .menuDropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          z-index: 110;
          background: rgba(10, 20, 40, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          width: 260px;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Header do Menu */
        .profilePreview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 16px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .avatarLarge {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .profileName {
          font-weight: 700;
          color: #fff;
          font-size: 15px;
        }

        .profileStatus {
          font-size: 11px;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        /* Lista de Itens */
        .menuList {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .menuItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          color: #dbeafe;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .menuItem:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          transform: translateX(4px);
          width: 90%;
        }

        .menuItem.active {
        }

        .menuIcon {
          font-size: 18px;
          width: 24px;
        }

        /* Destaque para o botão de Plano */
        .planButton {
          background: linear-gradient(
            90deg,
            rgba(6, 182, 212, 0.1),
            rgba(99, 102, 241, 0.1)
          );
          border: 1px solid rgba(99, 102, 241, 0.2);
          margin-top: 4px;
          color: #818cf8;
        }

        .planButton:hover {
          background: linear-gradient(90deg, #06b6d4, #6366f1);
          color: #fff;
        }

        .menuDivider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 8px 0;
        }

        .logoutItem {
          color: #f87171;
        }

        .logoutItem:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }
      `}</style>
    </div>
  );
}
