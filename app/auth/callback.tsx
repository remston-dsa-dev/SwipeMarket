import { Redirect } from "expo-router";

/** OAuth redirect target; session is completed in-app via `WebBrowser.openAuthSessionAsync`. */
export default function AuthCallbackScreen() {
  return <Redirect href="/" />;
}
