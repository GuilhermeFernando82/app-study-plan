import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  User,
  Lock,
  Mail,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("login"); // 'login' ou 'register'
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_ADRESS + "/Users";

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleRegisterChange = (e) =>
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(`${api}/login`, loginData);
      if (response.data.token) {
        sessionStorage.setItem("authToken", response.data.token);
        sessionStorage.setItem("userId", response.data.id);
        sessionStorage.setItem("refreshToken", response.data.refreshToken);
        sessionStorage.setItem("userName", response.data.user);
        router.push("/home");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Erro ao conectar com o servidor."
      );
      setIsError(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(`${api}/user`, registerData);
      setMessage("Conta criada! Agora você pode entrar.");
      setIsError(false);
      setActiveTab("login");
    } catch (error) {
      setMessage(error.response?.data?.message || "Erro ao cadastrar.");
      setIsError(true);
    }
  };

  return (
    <div className="authContainer">
      <Head>
        <title>For Competitions | Login</title>
      </Head>

      <div className="backgroundVisual">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glassCard"
      >
        <header className="header">
          <div className="logo">FC</div>
          <h1>For Competitions</h1>
          <p>A plataforma definitiva para desenvolvedores competitivos</p>
        </header>

        <div className="tabNav">
          <button
            className={activeTab === "login" ? "active" : ""}
            onClick={() => {
              setActiveTab("login");
              setMessage("");
            }}
          >
            Entrar
          </button>
          <button
            className={activeTab === "register" ? "active" : ""}
            onClick={() => {
              setActiveTab("register");
              setMessage("");
            }}
          >
            Criar Conta
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "login" ? (
            <motion.form
              key="login"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              onSubmit={handleLogin}
              className="form"
            >
              <div className="inputGroup">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Seu email"
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="inputGroup">
                <Lock size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="Sua senha"
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <button type="submit" className="submitBtn main">
                Acessar Plataforma <ArrowRight size={18} />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onSubmit={handleRegister}
              className="form"
            >
              <div className="inputGroup">
                <User size={18} />
                <input
                  type="text"
                  name="name"
                  placeholder="Nome completo"
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="inputGroup">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Melhor email"
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="inputGroup">
                <Lock size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="Crie uma senha"
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <button type="submit" className="submitBtn secondary">
                Criar Minha Conta <CheckCircle size={18} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`alert ${isError ? "error" : "success"}`}
          >
            {isError ? <XCircle size={18} /> : <CheckCircle size={18} />}
            <span>{message}</span>
          </motion.div>
        )}
      </motion.div>

      <style jsx global>{`
        :root {
          --primary: #6366f1;
          --secondary: #10b981;
          --bg: #0b0e14;
          --card-bg: rgba(23, 27, 38, 0.8);
          --border: rgba(255, 255, 255, 0.08);
          --text-main: #ffffff;
          --text-dim: #94a3b8;
        }

        .authContainer {
          min-height: 100vh;
          background-color: var(--bg);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          font-family: "Inter", system-ui, sans-serif;
          margin: -16px;
        }

        /* Efeitos de fundo */
        .backgroundVisual {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .blob {
          position: absolute;
          width: 400px;
          height: 400px;
          filter: blur(80px);
          opacity: 0.15;
          border-radius: 50%;
        }

        .blob-1 {
          background: var(--primary);
          top: -100px;
          right: -100px;
        }
        .blob-2 {
          background: var(--secondary);
          bottom: -100px;
          left: -100px;
        }

        .glassCard {
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          margin-left: 15px;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary), #8b5cf6);
          margin: 0 auto 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
          font-size: 20px;
        }

        .header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 8px;
        }
        .header p {
          color: var(--text-dim);
          font-size: 14px;
          line-height: 1.5;
        }

        .tabNav {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 28px;
        }

        .tabNav button {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--text-dim);
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: 0.3s;
          border-radius: 8px;
        }

        .tabNav button.active {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .inputGroup {
          position: relative;
          display: flex;
          align-items: center;
        }

        .inputGroup svg {
          position: absolute;
          left: 14px;
          color: var(--text-dim);
        }

        .inputGroup input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: white;
          font-size: 15px;
          transition: 0.2s;
        }

        .inputGroup input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .submitBtn {
          margin-top: 8px;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.3s;
        }

        .submitBtn.main {
          background: var(--primary);
          color: white;
        }
        .submitBtn.secondary {
          background: var(--secondary);
          color: white;
        }
        .submitBtn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .alert {
          margin-top: 24px;
          padding: 14px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .success {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
