import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "./api/api";
import { configureInterceptors } from "./api/api";
import { useRouter } from "next/router";

export default function Profile() {
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pontos, setPontos] = useState(0);
  const router = useRouter();
  useEffect(() => {
    configureInterceptors(router);
  }, []);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const id = sessionStorage.getItem("userId");
    setCurrentUserId(Number(id));
  }, []);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const response = await api.get("/Score/ranking");
        setRankingData(response.data);
      } catch (err) {
        console.error("Erro ao buscar ranking:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRanking();
  }, []);
  async function buscarScoreAtual() {
    try {
      const response = await api.get("/Score/my", {
        params: { id: sessionStorage.getItem("userId") },
      });

      setPontos(response.data.score ?? 0);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar score atual:", error);
    }
  }
  const ranking = useMemo(() => {
    return [...rankingData]
      .sort((a, b) => b.score - a.score)
      .map((u, idx) => ({
        ...u,
        rank: idx + 1,
      }));
  }, [rankingData]);

  useEffect(() => {
    document.body.style.margin = "0";
    buscarScoreAtual();
  }, []);

  return (
    <div className="page">
      <div className="card">
        <header className="header">
          <div className="brand">
            <div className="logo">🏆</div>
            <h1>Perfil & Ranking</h1>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/home" className="back">
              ← Voltar
            </Link>
          </div>
        </header>

        <main className="content">
          <section className="profile">
            <div className="avatar">🙂</div>
            <div className="userInfo">
              <div className="userName">Você</div>
              <div className="userMeta">
                Seu score está sendo carregado da API
              </div>
            </div>
            <div className="userPoints">⭐ {Number(pontos) || 0}</div>
          </section>

          <section className="ranking">
            <h2>Ranking</h2>

            {loading ? (
              <div>Carregando ranking...</div>
            ) : (
              <div className="list">
                {ranking.map((u) => {
                  const isCurrent = u.userId === currentUserId;

                  return (
                    <div
                      key={u.userId}
                      className={`item ${isCurrent ? "me" : ""}`}
                    >
                      <div className="rank">{u.rank}</div>

                      <div className="meta">
                        <div className="name">{u.name}</div>
                      </div>

                      <div className="pts">⭐ {Number(u.score) || 0}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <footer className="footer">Ranking conectado à API real ✔️</footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
              1200px 600px at 10% 10%,
              rgba(99, 102, 241, 0.12),
              transparent
            ),
            linear-gradient(180deg, #051025 0%, #081426 100%);
          box-sizing: border-box;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto,
            "Helvetica Neue", Arial;
          color: #e6eef8;
          margin: 0; /* garante tela cheia sem bordas */
          padding: 0; /* remove borda branca */
        }

        .card {
          width: 100vh;
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
          backdrop-filter: blur(6px) saturate(120%);
        }
        /* DESKTOP */
        .list {
          max-height: 55vh; /* altura confortável no desktop */
          overflow-y: auto; /* scroll vertical */
          padding-right: 6px; /* espaço para não cortar a borda com o scroll */
          margin-bottom: 12px;
        }

        @media (max-width: 600px) {
          .card {
            width: 37vh;
            padding: 16px;
          }

          /* Ajuste da lista no mobile */
          .list {
            max-height: 45vh; /* altura máxima controlada */
            overflow-y: auto; /* scroll vertical */
            padding-right: 6px; /* evita o corte quando aparecer o scroll */
            margin-bottom: 12px; /* margem no final da lista */
          }
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
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
        }

        .back {
          color: #93c5fd;
          text-decoration: none;
          font-weight: 600;
        }

        .content {
          margin-top: 8px;
        }

        .profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .avatar {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }

        .userInfo {
          flex: 1;
        }

        .userName {
          font-weight: 700;
          font-size: 16px;
        }

        .userMeta {
          color: rgba(230, 238, 248, 0.6);
          font-size: 13px;
        }

        .userPoints {
          background: linear-gradient(90deg, #22c55e, #06b6d4);
          color: #021012;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 600;
        }

        .ranking h2 {
          margin: 0 0 10px 0;
        }

        .list {
          display: grid;
          gap: 8px;
        }

        .item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.01),
            rgba(255, 255, 255, 0.005)
          );
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .item.me {
          box-shadow: 0 6px 20px rgba(6, 182, 212, 0.08);
          background: linear-gradient(
            90deg,
            rgba(6, 182, 212, 0.06),
            rgba(99, 102, 241, 0.03)
          );
          border: 1px solid rgba(6, 182, 212, 0.12);
        }

        .rank {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
        }

        .meta .name {
          font-weight: 600;
        }

        .meta .sub {
          font-size: 12px;
          color: rgba(230, 238, 248, 0.6);
        }

        .pts {
          margin-left: auto;
          font-weight: 700;
        }

        .footer {
          margin-top: 18px;
          color: rgba(230, 238, 248, 0.6);
          font-size: 13px;
        }

        @media (min-width: 720px) {
          .list {
            gap: 10px;
          }
        }
        .list::-webkit-scrollbar {
          width: 6px;
        }

        .list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
