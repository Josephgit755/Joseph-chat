import { useState } from "react";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import ChatList from "./pages/ChatList";
import Calls from "./pages/Calls";
import Tools from "./pages/Tools";
import ZenvaBreath from "./pages/ZenvaBreath";
import Translator from "./pages/Translator";
import StudentMode from "./pages/StudentMode";

import "./styles/auth.css";

function App() {
  const [currentScreen, setCurrentScreen] =
    useState("login");

  const [user, setUser] = useState(null);


  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const handleAuthenticated = (
    authenticatedUser
  ) => {
    setUser(authenticatedUser);

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
          console.log(
            "Opening chat:",
            chat
          );
        }}

        onNavigate={(section) => {
          setCurrentScreen(section);
        }}
      />
    );
  }


  // ==========================================
  // CALLS
  // ==========================================

  if (currentScreen === "calls") {
    return (
      <Calls
        user={user}

        onNavigate={(section) => {
          setCurrentScreen(section);
        }}
      />
    );
  }


  // ==========================================
  // TOOLS
  // ==========================================

  if (currentScreen === "tools") {
    return (
      <Tools
        user={user}

        onNavigate={(section) => {
          setCurrentScreen(section);
        }}
      />
    );
  }


  // ==========================================
  // ZENVA BREATH
  // ==========================================

  if (currentScreen === "breath") {
    return (
      <ZenvaBreath
        onBack={() => {
          setCurrentScreen("tools");
        }}
      />
    );
  }


  // ==========================================
  // TRANSLATOR
  // ==========================================

  if (currentScreen === "translator") {
    return (
      <Translator
        onBack={() => {
          setCurrentScreen("tools");
        }}
      />
    );
  }


  // ==========================================
  // STUDENT MODE
  // ==========================================

  if (currentScreen === "student") {
    return (
      <StudentMode
        onBack={() => {
          setCurrentScreen("tools");
        }}
      />
    );
  }


  // ==========================================
  // FALLBACK
  // ==========================================

  return null;
}

export default App;