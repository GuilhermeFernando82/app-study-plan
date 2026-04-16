import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { getSession } from "../services/storage";

export default function AuthGateScreen({ navigation }) {
  useEffect(() => {
    const load = async () => {
      const { authToken } = await getSession();
      navigation.reset({
        index: 0,
        routes: [{ name: authToken ? "Home" : "Login" }],
      });
    };

    load();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#fff" />
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1326",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: {
    color: "#fff",
  },
});
