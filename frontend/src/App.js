import { useState } from "react";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import ChatList from "./pages/ChatList";

import "./styles/auth.css";

function App() {
  const [currentScreen, setCurrentScreen] = useState("login");

  const [user, setUser] = useState(null);

  // ==========================================
  // AFTER LOGIN + OTP
  // ==========================================

  const handleAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);

    // After login, go to Profile Setup.
    setCurrentScreen("profile");
  };

  // ==========================================
  // LOGIN
  // ==========================================

  if (currentScreen === "login") {
    return (
      <Login
        onAuthenticated={handleAuthenticated}
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

          // After completing profile,
          // go directly to Chat List.
          setCurrentScreen("chatlist");
        }}
      />
    );
  }

  // ==========================================
  // CHAT LIST
  // ==========================================

  if (currentScreen === "chatlist") {
    return (
      <ChatList
        user={user}

        onOpenChat={(chat) => {
          console.log("Opening chat:", chat);
        }}

        onNavigate={(section) => {
          console.log(
            "Navigation selected:",
            section
          );
        }}
      />
    );
  }

  return null;
}

export default App;