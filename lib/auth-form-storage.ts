import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SIGN_IN_EMAIL_KEY = "swipemarket_last_sign_in_email";

export async function getLastSignInEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SIGN_IN_EMAIL_KEY);
  } catch {
    return null;
  }
}

export async function setLastSignInEmail(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SIGN_IN_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}
