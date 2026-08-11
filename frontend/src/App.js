import { useState } from "react";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import ChatList from "./pages/ChatList";
import PrivateChat from "./pages/PrivateChat";

import Calls from "./pages/Calls";
import Tools from "./pages/Tools";
import ZenvaBreath from "./pages/ZenvaBreath";
import Translator from "./pages/Translator";
import StudentMode from "./pages/StudentMode";
import SmartFiles from "./pages/SmartFiles";

import "./styles/auth.css";

function App() {
  const [currentScreen, setCurrentScreen] =
    useState("login");

  const [user, setUser] = useState(null);

  const [selectedChat, setSelectedChat] =
    useState(null);

  // ==========================================
  // AFTER LOGIN
  // ==========================================

  const handleAuthenticated = (
    authenticatedUser
  ) => {
    setUser(authenticatedUser);

    setCurrentScreen("profile");
  };

  // ==========================================
  // OPEN PRIVATE CHAT
  // ==========================================

  const handleOpenChat = (chat) => {
    setSelectedChat(chat);

    setCurrentScreen("private-chat");
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigate = (section) => {
    switch (section) {
      // --------------------------------------
      // CHATS
      // --------------------------------------

      case "chats":
      case "chatlist":
        setCurrentScreen("chatlist");
        break;

      // --------------------------------------
      // CALLS
      // --------------------------------------

      case "calls":
        setCurrentScreen("calls");
        break;

      // --------------------------------------
      // TOOLS
      // --------------------------------------

      case "tools":
        setCurrentScreen("tools");
        break;

      // --------------------------------------
      // ZENVA BREATH
      // --------------------------------------

      case "breath":
        setCurrentScreen("breath");
        break;

      // --------------------------------------
      // TRANSLATOR
      // --------------------------------------

      case "translator":
        setCurrentScreen("translator");
        break;

      // --------------------------------------
      // STUDENT MODE
      // --------------------------------------

      case "student":
        setCurrentScreen("student");
        break;

      // --------------------------------------
      // SMART FILES
      // --------------------------------------

      case "files":
        setCurrentScreen("files");
        break;

      // --------------------------------------
      // PROFILE
      // --------------------------------------

      case "profile":
        setCurrentScreen("profile");
        break;

      // --------------------------------------
      // SETTINGS
      // --------------------------------------

      case "settings":
        // Settings page has not been created yet.
        console.log(
          "Settings page is not implemented yet."
        );
        break;

      // --------------------------------------
      // NEW CHAT
      // --------------------------------------

      case "new-chat":
        console.log(
          "New Chat page is not implemented yet."
        );
        break;

      // --------------------------------------
      // NEW GROUP
      // --------------------------------------

      case "new-group":
        console.log(
          "New Group page is not implemented yet."
        );
        break;

      // --------------------------------------
      // NEW CONTACT
      // --------------------------------------

      case "new-contact":
        console.log(
          "New Contact page is not implemented yet."
        );
        break;

      // --------------------------------------
      // COMMUNITY
      // --------------------------------------

      case "community":
        console.log(
          "Community page is not implemented yet."
        );
        break;

      // --------------------------------------
      // DEFAULT
      // --------------------------------------

      default:
        console.log(
          "Navigation selected:",
          section
        );
    }
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
        onOpenChat={
          handleOpenChat
        }
        onNavigate={
          handleNavigate
        }
      />
    );
  }

  // ==========================================
  // PRIVATE CHAT
  // ==========================================

  if (currentScreen === "private-chat") {
    return (
      <PrivateChat
        user={user}
        chat={selectedChat}

        onBack={() => {
          setSelectedChat(null);

          setCurrentScreen("chatlist");
        }}

        onCall={(chat) => {
          console.log(
            "Starting voice call:",
            chat
          );

          setCurrentScreen("calls");
        }}

        onVideoCall={(chat) => {
          console.log(
            "Starting video call:",
            chat
          );

          setCurrentScreen("calls");
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
        onNavigate={
          handleNavigate
        }
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
        onNavigate={
          handleNavigate
        }
      />
    );
  }

  // ==========================================
  // ZENVA BREATH
  // ==========================================

  if (currentScreen === "breath") {
    return (
      <ZenvaBreath
        onBack={() =>
          setCurrentScreen("tools")
        }
      />
    );
  }

  // ==========================================
  // TRANSLATOR
  // ==========================================

  if (currentScreen === "translator") {
    return (
      <Translator
        onBack={() =>
          setCurrentScreen("tools")
        }
      />
    );
  }

  // ==========================================
  // STUDENT MODE
  // ==========================================

  if (currentScreen === "student") {
    return (
      <StudentMode
        user={user}
        onBack={() =>
          setCurrentScreen("tools")
        }
        onNavigate={
          handleNavigate
        }
      />
    );
  }

  // ==========================================
  // SMART FILES
  // ==========================================

  if (currentScreen === "files") {
    return (
      <SmartFiles
        user={user}
        onBack={() =>
          setCurrentScreen("tools")
        }
        onNavigate={
          handleNavigate
        }
      />
    );
  }

  // ==========================================
  // FALLBACK
  // ==========================================

  return null;
}

export default App;