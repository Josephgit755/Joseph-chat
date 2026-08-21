import { useState } from "react";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import ChatList from "./pages/ChatList";
import Contacts from "./pages/Contacts";
import PrivateChat from "./pages/PrivateChat";
import DisappearingMessage from "./pages/DisappearingMessage";

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


// =========================================================
// ZENVazAPP
// =========================================================
//
// GLOBAL CALLING ARCHITECTURE
//
// App
//  ↓
// CallProvider
//  ↓
// CallManager
//  ↓
// WebRTC
//  ↓
// CallScreen / IncomingCall
//
// Contacts and PrivateChat only request calls.
// They do NOT manage WebRTC themselves.
// =========================================================


function App() {

  const [currentScreen, setCurrentScreen] =
    useState("splash");

  const [user, setUser] =
    useState(null);

  const [selectedChat, setSelectedChat] =
    useState(null);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";


  // =======================================================
  // AFTER LOGIN + OTP VERIFICATION
  // =======================================================

  const handleAuthenticated =
    (authenticatedUser) => {

      setUser(
        authenticatedUser
      );

      setCurrentScreen(
        "profile"
      );
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

        const response =
          await fetch(
            `${API_URL}/api/contacts/recently-contacted`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

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

        /*
         * Recently-contacted tracking
         * must never prevent the user
         * from opening a conversation.
         */

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

      /*
       * Remember where the chat was opened from.
       *
       * Contacts -> PrivateChat -> Back
       * returns to Contacts.
       *
       * ChatList -> PrivateChat -> Back
       * returns to ChatList.
       */

      const navigationSource =
        currentScreen ===
        "contacts"
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
          // Intentional fall-through to chatlist.
          // eslint-disable-next-line no-fallthrough
        case "chatlist":

          setCurrentScreen(
            "chatlist"
          );

          break;


        // -----------------------------------------------
        // CONTACTS
        // -----------------------------------------------

        case "contacts":

          setCurrentScreen(
            "contacts"
          );

          break;


        // -----------------------------------------------
        // TOOLS
        // -----------------------------------------------

        case "tools":

          setCurrentScreen(
            "tools"
          );

          break;


        // -----------------------------------------------
        // ZENVA BREATH
        // -----------------------------------------------

        case "breath":

          setCurrentScreen(
            "breath"
          );

          break;


        // -----------------------------------------------
        // TRANSLATOR
        // -----------------------------------------------

        case "translator":

          setCurrentScreen(
            "translator"
          );

          break;


        // -----------------------------------------------
        // STUDENT MODE
        // -----------------------------------------------

        case "student":

          setCurrentScreen(
            "student"
          );

          break;


        // -----------------------------------------------
        // SMART FILES
        // -----------------------------------------------

        case "files":

          setCurrentScreen(
            "files"
          );

          break;


        // -----------------------------------------------
        // MARKETING STATUS
        // -----------------------------------------------

        case "marketing":

          setCurrentScreen(
            "marketing"
          );

          break;


        // -----------------------------------------------
        // ZENVA AI
        // -----------------------------------------------

        case "ai":

          setCurrentScreen(
            "ai"
          );

          break;


        // -----------------------------------------------
        // PROFILE
        // -----------------------------------------------

        case "profile":

          setCurrentScreen(
            "profile"
          );

          break;


        // -----------------------------------------------
        // SETTINGS
        // -----------------------------------------------

        case "settings":

          console.log(
            "Settings page is not implemented yet."
          );

          break;


        // -----------------------------------------------
        // NEW CHAT
        // -----------------------------------------------

        case "new-chat":

          setCurrentScreen(
            "contacts"
          );

          break;


        // -----------------------------------------------
        // NEW GROUP
        // -----------------------------------------------

        case "new-group":

          console.log(
            "New Group page is not implemented yet."
          );

          break;


        // -----------------------------------------------
        // NEW CONTACT
        // -----------------------------------------------

        case "new-contact":

          setCurrentScreen(
            "contacts"
          );

          break;


        // -----------------------------------------------
        // COMMUNITY
        // -----------------------------------------------

        case "community":

          console.log(
            "Community page is not implemented yet."
          );

          break;


        // -----------------------------------------------
        // DEFAULT
        // -----------------------------------------------

        default:

          console.log(
            "Navigation selected:",
            section
          );
      }
    };


  // =======================================================
  // MAIN APPLICATION CONTENT
  // =======================================================
  //
  // Calling is handled separately by CallProvider.
  //
  // This component only controls normal navigation.
  // =======================================================

  return (
    <CallProvider
      user={
        user
      }
    >

      <AppContent
        currentScreen={
          currentScreen
        }

        setCurrentScreen={
          setCurrentScreen
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
      />

    </CallProvider>
  );
}


// =========================================================
// APPLICATION CONTENT
// =========================================================
//
// This component lives INSIDE CallProvider so it can
// access the global calling system.
// =========================================================

function AppContent({
  currentScreen,
  setCurrentScreen,
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

      /*
       * THIS IS THE IMPORTANT CONNECTION.
       *
       * Previously App.js only logged the request.
       *
       * Now the request goes directly into
       * CallManager's WebRTC system.
       */

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

      /*
       * Send the contact directly to CallManager.
       *
       * CallManager handles:
       *
       * - microphone
       * - camera
       * - RTCPeerConnection
       * - offer
       * - ICE candidates
       * - answer
       * - remote stream
       * - CallScreen
       */

      startCall(
        chat,
        "video"
      );
    };
    if (currentScreen === "splash") {
      return (
        <Splash
          onFinished={() => {
           setCurrentScreen("login");
          }}
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


        // ===============================================
        // BACK
        // ===============================================

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


        // ===============================================
        // VOICE CALL
        // ===============================================

        onCall={
          handleVoiceCall
        }


        // ===============================================
        // VIDEO CALL
        // ===============================================

        onVideoCall={
          handleVideoCall
        }


        // ===============================================
        // DISAPPEARING MESSAGES
        // ===============================================

        onOpenDisappearingSettings={
          handleOpenDisappearingSettings
        }


        // ===============================================
        // RECENTLY CONTACTED
        // ===============================================

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