import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, getApiBaseUrl } from "../services/api";
import { setSession } from "../services/storage";

export default function LoginScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onLogin = async () => {
    if (!loginData.email || !loginData.password) {
      Alert.alert("Campos obrigatorios", "Informe email e senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/Users/login", loginData);

      if (!response.data?.token) {
        throw new Error("Token nao retornado.");
      }

      await setSession({
        authToken: response.data.token,
        refreshToken: response.data.refreshToken,
        userId: response.data.id,
        userName: response.data.user,
      });

      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || "Nao foi possivel entrar.";

      Alert.alert(
        "Erro no login",
        `${message}\n\nstatus: ${status || "sem status"}\napi: ${getApiBaseUrl() || "(vazia)"}`,
      );

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("[login-error]", {
          apiBase: getApiBaseUrl(),
          status,
          data: error?.response?.data,
          code: error?.code,
          message: error?.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      Alert.alert("Campos obrigatorios", "Preencha nome, email e senha.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/Users/user", registerData);
      Alert.alert("Conta criada", "Agora voce pode entrar.");
      setActiveTab("login");
    } catch (error) {
      Alert.alert(
        "Erro no cadastro",
        error.response?.data?.message || error.message || "Nao foi possivel cadastrar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Tutor App</Text>
        <Text style={styles.subtitle}>Aprendizado para concursos e tecnologia</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "login" && styles.activeTab]}
            onPress={() => setActiveTab("login")}
          >
            <Text style={styles.tabText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "register" && styles.activeTab]}
            onPress={() => setActiveTab("register")}
          >
            <Text style={styles.tabText}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "login" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8292ad"
              autoCapitalize="none"
              keyboardType="email-address"
              value={loginData.email}
              onChangeText={(email) => setLoginData((s) => ({ ...s, email }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#8292ad"
              secureTextEntry
              value={loginData.password}
              onChangeText={(password) =>
                setLoginData((s) => ({ ...s, password }))
              }
            />
            <TouchableOpacity style={styles.mainButton} onPress={onLogin}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#8292ad"
              value={registerData.name}
              onChangeText={(name) => setRegisterData((s) => ({ ...s, name }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8292ad"
              autoCapitalize="none"
              keyboardType="email-address"
              value={registerData.email}
              onChangeText={(email) =>
                setRegisterData((s) => ({ ...s, email }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#8292ad"
              secureTextEntry
              value={registerData.password}
              onChangeText={(password) =>
                setRegisterData((s) => ({ ...s, password }))
              }
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={onRegister}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1326",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#111d37",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#97a7c3",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#182644",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#263a63",
  },
  tabText: {
    color: "#d5dded",
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#263a63",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    marginBottom: 12,
  },
  mainButton: {
    backgroundColor: "#4353ff",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: "#0ea56c",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  mainButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});
