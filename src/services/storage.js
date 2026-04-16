import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  authToken: "authToken",
  refreshToken: "refreshToken",
  userId: "userId",
  userName: "userName",
  generatedStudyPlan: "generatedStudyPlan",
};

export async function setSession(data) {
  const entries = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [KEYS[key], String(value)]);

  if (entries.length > 0) {
    await AsyncStorage.multiSet(entries);
  }
}

export async function getSession() {
  const values = await AsyncStorage.multiGet([
    KEYS.authToken,
    KEYS.refreshToken,
    KEYS.userId,
    KEYS.userName,
  ]);

  const map = Object.fromEntries(values);

  return {
    authToken: map[KEYS.authToken] || "",
    refreshToken: map[KEYS.refreshToken] || "",
    userId: map[KEYS.userId] || "",
    userName: map[KEYS.userName] || "",
  };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([
    KEYS.authToken,
    KEYS.refreshToken,
    KEYS.userId,
    KEYS.userName,
  ]);
}

export async function saveStudyPlan(value) {
  await AsyncStorage.setItem(KEYS.generatedStudyPlan, value);
}

export async function getStudyPlan() {
  return AsyncStorage.getItem(KEYS.generatedStudyPlan);
}
