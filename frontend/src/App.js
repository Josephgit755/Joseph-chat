import {
  useEffect,
  useState,
} from "react";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import ChatList from "./pages/ChatList";
import Contacts from "./pages/Contacts";
import PrivateChat from "./pages/PrivateChat";
import DisappearingMessage from "./pages/DisappearingMessage";
import Settings from "./pages/Settings";
import Account from "./pages/Account";

import Tools from "./pages/Tools";
import ZenvaBreath from "./pages/ZenvaBreath";
import Translator from "./pages/Translator";
import StudentMode from "./pages/StudentMode";
import SmartFiles from "./pages/SmartFiles";
import ZenvaAI from "./pages/ZenvaAI";
import MarketingStatus from "./pages/MarketingStatus";

import {
  CallProvider,
  useCall,
} from "./CallManager";

import "./styles/auth.css";
import "./styles/globalTheme.css";


// =========================================================
// ZENVazAPP
// =========================================================
//
// GLOBAL CALLING ARCHITECTURE
//
// App
//   ↓
// CallProvider
//   ↓
// CallManager
//   ↓
// WebRTC
//   ↓
// CallScreen / IncomingCall
//
// Contacts and PrivateChat only request calls.
// They do NOT manage WebRTC themselves.
//
// GLOBAL THEME ARCHITECTURE
//
// App
//   ↓
// Theme State
//   ↓
// document.body
//   ↓
// Entire ZenvaZapp application
//
// PROFILE ARCHITECTURE
//
// Login + OTP
//   ↓
// Authenticated User
//   ↓
// Check profileCompleted
//   ↓
// Incomplete → ProfileSetup
// Complete   → ChatList
//
// =========================================================


function App() {

  // =======================================================
  // GLOBAL ZENVazAPP APPEARANCE
  // =======================================================

  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem(
        "zenvazapp-theme"
      ) || "zenvazapp"
    );
  });

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem(
        "zenvazapp-dark-mode"
      ) === "true"
    );
  });


  // =======================================================
  // APPLY GLOBAL THEME
  // =======================================================

  useEffect(() => {

    document.body.setAttribute(
      "data-zenvazapp-theme",
      theme
    );

    localStorage.setItem(
      "zenvazapp-theme",
      theme
    );

  }, [theme]);


  // =======================================================
  // APPLY GLOBAL DARK MODE
  // =======================================================

  useEffect(() => {

    document.body.classList.toggle(
      "zenvazapp-dark-mode",
      darkMode
    );

    localStorage.setItem(
      "zenvazapp-dark-mode",
      darkMode
    );

  }, [darkMode]);


  // =======================================================
  // SCREEN
  // =======================================================

  const [
    currentScreen,
    setCurrentScreen,
  ] = useState("splash");


  // =======================================================
  // USER
  // =======================================================

  const [
    user,
    setUser,
  ] = useState(null);


  // =======================================================
  // SELECTED CHAT
  // =======================================================

  const [
    selectedChat,
    setSelectedChat,
  ] = useState(null);


  // =======================================================
  // API
  // =======================================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";


  // =======================================================
  // LOAD STORED USER
  // =======================================================
  //
  // This allows a previously authenticated user with a
  // completed profile to continue into ZenvaZapp.
  //
  // The token is also checked so we don't restore a stale
  // local user without an authentication session.
  //
  // =======================================================

  useEffect(() => {

    const storedToken =
      localStorage.getItem(
        "zenvazapp_token"
      );

    const storedUser =
      localStorage.getItem(
        "zenvazapp_user"
      );

    if (!storedToken || !storedUser) {
      return;
    }

    try {

      const parsedUser =
        JSON.parse(
          storedUser
        );

      if (!parsedUser) {
        return;
      }

      setUser(
        parsedUser
      );

    } catch (error) {

      console.error(
        "Unable to restore ZenvaZapp user:",
        error
      );

    }

  }, []);


  // =======================================================
  // AFTER SPLASH
  // =======================================================
  //
  // Existing authenticated users with a completed profile
  // can go directly to ChatList.
  //
  // New users or users whose profile is incomplete go to
  // Login.
  //
  // =======================================================

  const handleSplashFinished =
    () => {

      const storedToken =
        localStorage.getItem(
          "zenvazapp_token"
        );

      const storedUser =
        localStorage.getItem(
          "zenvazapp_user"
        );

      if (
        storedToken &&
        storedUser
      ) {

        try {

          const parsedUser =
            JSON.parse(
              storedUser
            );

          if (
            parsedUser &&
            parsedUser.profileCompleted
          ) {

            setUser(
              parsedUser
            );

            setCurrentScreen(
              "chatlist"
            );

            return;
          }

        } catch (error) {

          console.error(
            "Unable to restore stored session:",
            error
          );

        }

      }

      setCurrentScreen(
        "login"
      );

    };


  // =======================================================
  // AFTER LOGIN + OTP VERIFICATION
  // =======================================================

  const handleAuthenticated =
    (authenticatedUser) => {

      if (!authenticatedUser) {
        return;
      }

      setUser(
        authenticatedUser
      );

      // Save the authenticated user locally.
      try {

        localStorage.setItem(
          "zenvazapp_user",
          JSON.stringify(
            authenticatedUser
          )
        );

      } catch (error) {

        console.error(
          "Unable to save authenticated user locally:",
          error
        );

      }

      // ---------------------------------------------------
      // IMPORTANT
      // ---------------------------------------------------
      //
      // If the user has already completed their profile,
      // don't force them through ProfileSetup again.
      //
      // ---------------------------------------------------

      if (
        authenticatedUser.profileCompleted
      ) {

        setCurrentScreen(
          "chatlist"
        );

      } else {

        setCurrentScreen(
          "profile"
        );

      }

    };


  // =======================================================
  // AFTER PROFILE IS COMPLETED
  // =======================================================

  const handleProfileCompleted =
    (updatedUser) => {

      console.log(
        "Profile completed successfully:",
        updatedUser
      );

      setUser(
        updatedUser
      );

      try {

        localStorage.setItem(
          "zenvazapp_user",
          JSON.stringify(
            updatedUser
          )
        );

      } catch (error) {

        console.error(
          "Unable to save user locally:",
          error
        );

      }

      setCurrentScreen(
        "chatlist"
      );

    };


  // =======================================================
  // MARK CONTACT AS RECENTLY CONTACTED
  // =======================================================

  const handleContactOpened =
    async (chat) => {

      const currentUserId =
        user?._id ||
        user?.id ||
        user?.userId;

      const contactUserId =
        chat?._id ||
        chat?.id ||
        chat?.userId;

      if (
        !currentUserId ||
        !contactUserId
      ) {

        return;

      }

      try {

        const token =
          localStorage.getItem(
            "zenvazapp_token"
          );

        const headers = {
          "Content-Type":
            "application/json",
        };

        if (token) {

          headers.Authorization =
            `Bearer ${token}`;

        }

        const response =
          await fetch(
            `${API_URL}/api/contacts/recently-contacted`,
            {
              method:
                "PATCH",

              headers,

              body:
                JSON.stringify({
                  userId:
                    currentUserId,

                  contactUserId:
                    contactUserId,
                }),
            }
          );


        if (!response.ok) {

          console.warn(
            "Recently contacted sync returned:",
            response.status
          );

        }

      } catch (error) {

        console.warn(
          "Unable to update recently contacted status:",
          error
        );

      }

    };


  // =======================================================
  // OPEN PRIVATE CHAT
  // =======================================================

  const handleOpenChat =
    (chat) => {

      if (!chat) {
        return;
      }

      const navigationSource =
        currentScreen === "contacts"
          ? "contacts"
          : "chatlist";

      const chatWithNavigation = {

        ...chat,

        navigationSource,

      };

      setSelectedChat(
        chatWithNavigation
      );

      setCurrentScreen(
        "private-chat"
      );

    };


  // =======================================================
  // OPEN DISAPPEARING MESSAGE SETTINGS
  // =======================================================

  const handleOpenDisappearingSettings =
    (
      chat,
      settings
    ) => {

      console.log(
        "Opening disappearing message settings:",
        chat,
        settings
      );

      setSelectedChat(
        chat
      );

      setCurrentScreen(
        "disappearing-message"
      );

    };


  // =======================================================
  // CLOSE DISAPPEARING MESSAGE SETTINGS
  // =======================================================

  const handleCloseDisappearingSettings =
    () => {

      setCurrentScreen(
        "private-chat"
      );

    };


  // =======================================================
  // NAVIGATION
  // =======================================================

  const handleNavigate =
    (section) => {

      switch (section) {

        // -----------------------------------------------
        // CHATS
        // -----------------------------------------------

        case "chats":
        case "chatlist": {

          setCurrentScreen(
            "chatlist"
          );

          break;
        }


        // -----------------------------------------------
        // CONTACTS
        // -----------------------------------------------

        case "contacts": {

          setCurrentScreen(
            "contacts"
          );

          break;
        }


        // -----------------------------------------------
        // TOOLS
        // -----------------------------------------------

        case "tools": {

          setCurrentScreen(
            "tools"
          );

          break;
        }


        // -----------------------------------------------
        // ZENVA BREATH
        // -----------------------------------------------

        case "breath": {

          setCurrentScreen(
            "breath"
          );

          break;
        }


        // -----------------------------------------------
        // TRANSLATOR
        // -----------------------------------------------

        case "translator": {

          setCurrentScreen(
            "translator"
          );

          break;
        }


        // -----------------------------------------------
        // STUDENT MODE
        // -----------------------------------------------

        case "student": {

          setCurrentScreen(
            "student"
          );

          break;
        }


        // -----------------------------------------------
        // SMART FILES
        // -----------------------------------------------

        case "files": {

          setCurrentScreen(
            "files"
          );

          break;
        }


        // -----------------------------------------------
        // MARKETING STATUS
        // -----------------------------------------------

        case "marketing": {

          setCurrentScreen(
            "marketing"
          );

          break;
        }


        // -----------------------------------------------
        // ZENVA AI
        // -----------------------------------------------

        case "ai": {

          setCurrentScreen(
            "ai"
          );

          break;
        }


        // -----------------------------------------------
        // PROFILE
        // -----------------------------------------------

        case "profile": {

          setCurrentScreen(
            "profile"
          );

          break;
        }


        // -----------------------------------------------
        // SETTINGS
        // -----------------------------------------------

        case "settings": {

          setCurrentScreen(
            "settings"
          );

          break;
        }


        // -----------------------------------------------
        // ACCOUNT
        // -----------------------------------------------

        case "settings-account": {

          setCurrentScreen(
            "account"
          );

          break;
        }


        // -----------------------------------------------
        // NEW CHAT
        // -----------------------------------------------

        case "new-chat": {

          setCurrentScreen(
            "contacts"
          );

          break;
        }


        // -----------------------------------------------
        // NEW GROUP
        // -----------------------------------------------

        case "new-group": {

          console.log(
            "New Group page is not implemented yet."
          );

          break;
        }


        // -----------------------------------------------
        // NEW CONTACT
        // -----------------------------------------------

        case "new-contact": {

          setCurrentScreen(
            "contacts"
          );

          break;
        }


        // -----------------------------------------------
        // COMMUNITY
        // -----------------------------------------------

        case "community": {

          console.log(
            "Community page is not implemented yet."
          );

          break;
        }


        // -----------------------------------------------
        // DEFAULT
        // -----------------------------------------------

        default: {

          console.log(
            "Navigation selected:",
            section
          );

        }

      }

    };


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <CallProvider
      user={user}
    >

      <AppContent

        currentScreen={
          currentScreen
        }

        setCurrentScreen={
          setCurrentScreen
        }

        theme={
          theme
        }

        setTheme={
          setTheme
        }

        darkMode={
          darkMode
        }

        setDarkMode={
          setDarkMode
        }

        user={
          user
        }

        selectedChat={
          selectedChat
        }

        setSelectedChat={
          setSelectedChat
        }

        handleAuthenticated={
          handleAuthenticated
        }

        handleProfileCompleted={
          handleProfileCompleted
        }

        handleContactOpened={
          handleContactOpened
        }

        handleOpenChat={
          handleOpenChat
        }

        handleOpenDisappearingSettings={
          handleOpenDisappearingSettings
        }

        handleCloseDisappearingSettings={
          handleCloseDisappearingSettings
        }

        handleNavigate={
          handleNavigate
        }

        handleSplashFinished={
          handleSplashFinished
        }

      />

    </CallProvider>

  );

}


// =========================================================
// APPLICATION CONTENT
// =========================================================

function AppContent({

  currentScreen,
  setCurrentScreen,

  theme,
  setTheme,

  darkMode,
  setDarkMode,

  user,
  selectedChat,
  setSelectedChat,

  handleAuthenticated,
  handleProfileCompleted,
  handleContactOpened,
  handleOpenChat,
  handleOpenDisappearingSettings,
  handleCloseDisappearingSettings,
  handleNavigate,
  handleSplashFinished,

}) {


  // =======================================================
  // GLOBAL CALL SYSTEM
  // =======================================================

  const {
    startCall,
  } = useCall();


  // =======================================================
  // DIRECT AUDIO CALL
  // =======================================================

  const handleVoiceCall =
    (chat) => {

      if (!chat) {
        return;
      }

      console.log(
        "ZenvaZapp voice call requested:",
        chat
      );

      startCall(
        chat,
        "audio"
      );

    };


  // =======================================================
  // DIRECT VIDEO CALL
  // =======================================================

  const handleVideoCall =
    (chat) => {

      if (!chat) {
        return;
      }

      console.log(
        "ZenvaZapp video call requested:",
        chat
      );

      startCall(
        chat,
        "video"
      );

    };


  // =======================================================
  // SPLASH
  // =======================================================

  if (
    currentScreen ===
    "splash"
  ) {

    return (

      <Splash
        onFinished={
          handleSplashFinished
        }
      />

    );

  }


  // =======================================================
  // LOGIN
  // =======================================================

  if (
    currentScreen ===
    "login"
  ) {

    return (

      <Login
        onAuthenticated={
          handleAuthenticated
        }
      />

    );

  }


  // =======================================================
  // PROFILE SETUP
  // =======================================================

  if (
    currentScreen ===
    "profile"
  ) {

    return (

      <ProfileSetup
        user={
          user
        }

        onProfileCompleted={
          handleProfileCompleted
        }
      />

    );

  }


  // =======================================================
  // CHAT LIST
  // =======================================================

  if (
    currentScreen ===
    "chatlist"
  ) {

    return (

      <ChatList
        user={
          user
        }

        onOpenChat={
          handleOpenChat
        }

        onNavigate={
          handleNavigate
        }
      />

    );

  }


  // =======================================================
  // CONTACTS
  // =======================================================

  if (
    currentScreen ===
    "contacts"
  ) {

    return (

      <Contacts
        user={
          user
        }

        onOpenChat={
          handleOpenChat
        }

        onCall={
          handleVoiceCall
        }

        onVideoCall={
          handleVideoCall
        }

        onNavigate={
          handleNavigate
        }
      />

    );

  }


  // =======================================================
  // PRIVATE CHAT
  // =======================================================

  if (
    currentScreen ===
    "private-chat"
  ) {

    return (

      <PrivateChat
        user={
          user
        }

        chat={
          selectedChat
        }

        onBack={() => {

          const navigationSource =
            selectedChat?.navigationSource;

          setSelectedChat(
            null
          );

          if (
            navigationSource ===
            "contacts"
          ) {

            setCurrentScreen(
              "contacts"
            );

          } else {

            setCurrentScreen(
              "chatlist"
            );

          }

        }}

        onCall={
          handleVoiceCall
        }

        onVideoCall={
          handleVideoCall
        }

        onOpenDisappearingSettings={
          handleOpenDisappearingSettings
        }

        onContactOpened={
          handleContactOpened
        }

      />

    );

  }


  // =======================================================
  // DISAPPEARING MESSAGE SETTINGS
  // =======================================================

  if (
    currentScreen ===
    "disappearing-message"
  ) {

    return (

      <DisappearingMessage

        user={
          user
        }

        chat={
          selectedChat
        }

        onBack={
          handleCloseDisappearingSettings
        }

        onClose={
          handleCloseDisappearingSettings
        }

      />

    );

  }


  // =======================================================
  // SETTINGS
  // =======================================================

  if (
    currentScreen ===
    "settings"
  ) {

    return (

      <Settings

        user={
          user
        }

        onBack={() =>
          setCurrentScreen(
            "chatlist"
          )
        }

        onNavigate={
          handleNavigate
        }

        theme={
          theme
        }

        setTheme={
          setTheme
        }

        darkMode={
          darkMode
        }

        setDarkMode={
          setDarkMode
        }

      />

    );

  }


  // =======================================================
  // ACCOUNT
  // =======================================================

  if (
    currentScreen ===
    "account"
  ) {

    return (

      <Account

        user={
          user
        }

        onBack={() =>
          setCurrentScreen(
            "settings"
          )
        }

        onNavigate={
          handleNavigate
        }

      />

    );

  }


  // =======================================================
  // TOOLS
  // =======================================================

  if (
    currentScreen ===
    "tools"
  ) {

    return (

      <Tools
        user={
          user
        }

        onNavigate={
          handleNavigate
        }

      />

    );

  }


  // =======================================================
  // ZENVA BREATH
  // =======================================================

  if (
    currentScreen ===
    "breath"
  ) {

    return (

      <ZenvaBreath
        onBack={() =>
          setCurrentScreen(
            "tools"
          )
        }

      />

    );

  }


  // =======================================================
  // TRANSLATOR
  // =======================================================

  if (
    currentScreen ===
    "translator"
  ) {

    return (

      <Translator
        onBack={() =>
          setCurrentScreen(
            "tools"
          )
        }

      />

    );

  }


  // =======================================================
  // STUDENT MODE
  // =======================================================

  if (
    currentScreen ===
    "student"
  ) {

    return (

      <StudentMode

        user={
          user
        }

        onBack={() =>
          setCurrentScreen(
            "tools"
          )
        }

        onNavigate={
          handleNavigate
        }

      />

    );

  }


  // =======================================================
  // SMART FILES
  // =======================================================

  if (
    currentScreen ===
    "files"
  ) {

    return (

      <SmartFiles

        user={
          user
        }

        onBack={() =>
          setCurrentScreen(
            "tools"
          )
        }

        onNavigate={
          handleNavigate
        }

      />

    );

  }


  // =======================================================
  // MARKETING STATUS
  // =======================================================

  if (
    currentScreen ===
    "marketing"
  ) {

    return (

      <MarketingStatus

        user={
          user
        }

        onBack={() =>
          setCurrentScreen(
            "tools"
          )
        }

        onNavigate={
          handleNavigate
        }

      />

    );

  }


  // =======================================================
  // ZENVA AI
  // =======================================================

  if (
    currentScreen ===
    "ai"
  ) {

    return (

      <ZenvaAI

        user={
          user
        }

        onBack={() =>
          setCurrentScreen(
            "tools"
          )
        }

        onNavigate={
          handleNavigate
        }

      />

    );

  }


  // =======================================================
  // FALLBACK
  // =======================================================

  return null;

}


export default App;