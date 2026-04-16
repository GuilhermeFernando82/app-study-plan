import React from "react";
import {
  Eye,
  HelpCircle,
  CheckCircle,
  BarChart2,
  RefreshCw,
  ArrowUpDown,
  FileText,
} from "lucide-react";

export default function CalcPage() {
  return (
    <div className="container">
      <header className="header">
        <div className="profile-icon">👤</div>
        <div className="header-icons">
          <Eye size={24} />
          <HelpCircle size={24} />
          <CheckCircle size={24} />
        </div>
      </header>

      <main className="main">
        <div className="balanceCard">
          <div className="balance-info">
            <h2 className="title">Investimentos</h2>
            <p className="amount">R$ 101.533,30</p>
            <p className="yield">↑ R$ 10.220,43 em 12 meses</p>
          </div>
          <button className="investButton">Investir</button>
        </div>

        <section className="actionsSection">
          <div className="action-item">
            <div className="actionCircle">
              <BarChart2 size={24} />
            </div>
            <span className="action-label">Análises</span>
          </div>
          <div className="action-item">
            <div className="actionCircle">
              <RefreshCw size={24} />
            </div>
            <span className="action-label">Otimizar</span>
          </div>
          <div className="action-item">
            <div className="actionCircle">
              <ArrowUpDown size={24} />
            </div>
            <span className="action-label">Histórico</span>
          </div>
          <div className="action-item">
            <div className="actionCircle">
              <FileText size={24} />
            </div>
            <span className="action-label">Relatórios</span>
          </div>
        </section>

        <section className="cardScroll">
          <div className="purpleCard">
            <p className="card-text">
              Minha
              <br />
              carteira
            </p>
            <button className="card-button">Começar</button>
          </div>

          <div className="darkCard">
            <div className="card-image rocket"></div>
            <div className="card-info">
              <p className="card-title">Caixinha Turbo</p>
              <p className="card-sub">R$ 0,00</p>
            </div>
          </div>

          <div className="darkCard">
            <div className="card-image money"></div>
            <div className="card-info">
              <p className="card-title">Reserva de Emergência</p>
              <p className="card-amount">R$ 102.114,30 ▲</p>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          margin: -18px;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
            Arial, sans-serif;
        }

        .header {
          background-color: #820ad1;
          padding: 16px 16px 60px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .profile-icon {
          width: 40px;
          height: 40px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .header-icons {
          display: flex;
          gap: 16px;
        }

        .main {
          padding: 0 16px;
          margin-top: -30px;
        }

        .balanceCard {
          background: #121212;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .title {
          font-size: 16px;
          color: #a1a1a1;
          font-weight: 500;
          margin: 0;
        }

        .investButton {
          background-color: #820ad1;
          color: white;
          padding: 10px 24px;
          border-radius: 999px;
          font-weight: bold;
          border: none;
          cursor: pointer;
        }

        .amount {
          font-size: 26px;
          font-weight: bold;
          margin: 8px 0 4px 0;
          color: white;
        }

        .yield {
          color: #1ed760;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }

        .actionsSection {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 24px 0;
          scrollbar-width: none;
        }

        .action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 80px;
        }

        .actionCircle {
          width: 60px;
          height: 60px;
          background-color: #1c1c1e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }

        .action-label {
          font-size: 12px;
          font-weight: 600;
          color: #f5f5f5;
        }

        .cardScroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 0 32px 0;
          scrollbar-width: none;
        }

        .purpleCard {
          min-width: 170px;
          height: 190px;
          background-color: #820ad1;
          border-radius: 16px;
          padding: 20px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-text {
          font-weight: bold;
          font-size: 18px;
          line-height: 1.2;
          margin: 0;
        }

        .card-button {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 13px;
          font-weight: bold;
          padding: 8px 20px;
          border-radius: 999px;
          border: none;
          width: fit-content;
        }

        .darkCard {
          min-width: 170px;
          height: 190px;
          background: #1c1c1e;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-image {
          height: 110px;
          background-color: #2c2c2e;
          background-size: cover;
          background-position: center;
        }

        .rocket {
          background-image: url("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400");
          opacity: 0.8;
        }
        .money {
          background-image: url("https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400");
          opacity: 0.8;
        }

        .card-info {
          padding: 14px;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          color: #ffffff;
        }

        .card-sub {
          font-size: 12px;
          color: #8e8e93;
          margin: 4px 0 0 0;
        }

        .card-amount {
          font-size: 13px;
          color: #1ed760;
          font-weight: bold;
          margin: 4px 0 0 0;
        }
      `}</style>
    </div>
  );
}
