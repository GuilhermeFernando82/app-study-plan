// Updated PlanPage component with mobile-only styles for maxWidth and width
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, vw } from "framer-motion";
import rehypeHighlight from "rehype-highlight";

export default function PlanPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const pageStyle = {
    minHeight: "100vh",
    width: isMobile ? "144vw" : "102%",
    maxWidth: isMobile ? "144vw" : "102%",
    margin: isMobile ? "-19px" : "-16px",
    padding: "0",
    overflowX: "hidden",
    background: "linear-gradient(to bottom, #0f172a, #1e293b)",
    color: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
  };

  const cardStyle = {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "30px",
    border: "1px solid #334155",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    margin: isMobile ? "25px" : "9px",
    fontSize: isMobile ? "21px" : "15px",
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#60a5fa",
    marginBottom: "30px",
  };

  const sectionTitle = {
    fontSize: "22px",
    fontWeight: "600",
    color: "#93c5fd",
    marginBottom: "20px",
    paddingBottom: "8px",
    borderBottom: "1px solid #334155",
  };

  const topicBox = {
    background: "#0f172a",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #1e3a5f",
    cursor: "pointer",
    transition: "all 0.25s ease",
    marginBottom: "10px",
  };

  const topicBoxHover = {
    background: "#1e3a5f",
    transform: "scale(1.02)",
  };

  const explanationBox = {
    background: "#0a0f1c",
    border: "1px solid #3b82f6",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "10px",
    marginBottom: "9px",
  };

  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [topicExplanation, setTopicExplanation] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [hoveredTopic, setHoveredTopic] = useState(null);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    const saved = localStorage.getItem("generatedStudyPlan");
    if (saved) setPlan(saved);
    setLoading(false);
  }, []);

  async function handleTopicClick(topic) {
    if (loadingTopic) return;

    if (expandedTopic === topic) {
      setExpandedTopic(null);
      return;
    }

    setExpandedTopic(topic);
    setLoadingTopic(true);

    try {
      const res = await fetch("/api/explain-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      setTopicExplanation(data.explanation);
    } catch (err) {
      setTopicExplanation("Erro ao carregar explicação.");
    }

    setLoadingTopic(false);
  }

  const groupedSections = [];
  let currentSection = null;

  plan
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .forEach((line) => {
      const isTitle = line.startsWith("📘");
      if (isTitle) {
        currentSection = { title: line.replace("📘", "📚 "), topics: [] };
        groupedSections.push(currentSection);
      } else if (currentSection) {
        currentSection.topics.push(line);
      }
    });

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>📘 Seu Plano de Estudos</h1>

      {loading ? (
        <p style={{ textAlign: "center", fontSize: "18px" }}>Carregando...</p>
      ) : (
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {groupedSections.map((section, i) => (
            <div key={i} style={cardStyle}>
              <h2 style={sectionTitle}>{section.title}</h2>

              {section.topics.map((topic, j) => {
                const isExpanded = expandedTopic === topic;
                const isHovered = hoveredTopic === topic;

                return (
                  <React.Fragment key={j}>
                    <div
                      onClick={() => handleTopicClick(topic)}
                      onMouseEnter={() => setHoveredTopic(topic)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      style={{
                        ...topicBox,
                        ...(isHovered && !isExpanded ? topicBoxHover : {}),
                        ...(isExpanded
                          ? {
                              background: "#3b82f6",
                              color: "#0f172a",
                              fontWeight: "bold",
                            }
                          : {}),
                      }}
                    >
                      {isExpanded ? "▼ " : "▶ "} {topic}
                    </div>

                    {isExpanded && (
                      <div style={explanationBox}>
                        {loadingTopic ? (
                          <p style={{ color: "#60a5fa" }}>
                            Carregando explicação...
                          </p>
                        ) : (
                          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                              {topicExplanation}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button
          style={{
            padding: "12px 22px",
            background: "#2563eb",
            border: "none",
            borderRadius: "12px",
            color: "white",
            cursor: "pointer",
            fontSize: "18px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            transition: "0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
          onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
          onClick={() => (window.location.href = "/")}
        >
          ⬅ Voltar
        </button>
      </div>
    </div>
  );
}
