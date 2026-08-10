import { useState } from "react";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";

import "./styles/auth.css";

function App() {
  const [currentScreen, setCurrentScreen] =
    useState("login");

  const [user, setUser] = useState(null);

  // ==========================================
  // AFTER LOGIN + OTP
  // ==========================================

  const handleAuthenticated = (
    authenticatedUser
  ) => {
    setUser(authenticatedUser);

    // For now, go to Profile Setup.
    // Chat List will be added later.

    setCurrentScreen("profile");
  };

  // ==========================================
  // LOGIN
  // ==========================================

  if (currentScreen === "login") {
    return (
      <Login
        onAuthenticated={
          handleAuthenticated
        }
      />
    );
  }

  // ==========================================
  // PROFILE SETUP
  // ==========================================

  if (currentScreen === "profile") {
    return (
      <ProfileSetup
        user={user}
        onComplete={(updatedUser) => {
          setUser(updatedUser);

          // Chat List will be connected here later.
          console.log(
            "Profile completed:",
            updatedUser
          );
        }}
      />
    );
  }

  return null;
}

export default App;