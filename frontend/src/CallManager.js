import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import CallScreen from "./callScreen";

const CallContext = createContext(null);

// =========================================================
// ZENVazAPP CALL MANAGER
// =========================================================
//
// Responsibilities:
//
// 1. Maintain ONE global Socket.IO call connection.
// 2. Register the logged-in user.
// 3. Send and receive WebRTC signaling.
// 4. Manage microphone/camera.
// 5. Manage peer connections.
// 6. Display outgoing CallScreen.
// 7. Display incoming call UI.
// 8. Manage remote audio/video.
// 9. Manage incoming ringtone.
// =========================================================

export function CallProvider({ user, children }) {

  // =======================================================
  // SOCKET URL
  // =======================================================

  const SOCKET_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  // =======================================================
  // USER INFORMATION
  // =======================================================

  const currentUserId =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.username ||
    "";

  const currentUserName =
    user?.displayName ||
    user?.fullName ||
    user?.username ||
    user?.name ||
    "ZenvaZapp User";

  const currentUserAvatar =
    user?.profilePhoto ||
    user?.avatar ||
    currentUserName
      .charAt(0)
      .toUpperCase();

  // =======================================================
  // RECENT CALL
  // =======================================================

  const markCallAsRecent = useCallback(
    async (contactUserId) => {
      if (
        !currentUserId ||
        !contactUserId ||
        String(currentUserId) ===
          String(contactUserId)
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${SOCKET_URL}/api/contacts/recently-contacted`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  currentUserId,

                contactUserId:
                  contactUserId,
              }),
            }
          );

        if (!response.ok) {
          console.warn(
            "Unable to mark call as recent:",
            response.status
          );
        }
      } catch (error) {
        console.warn(
          "Call recent update failed:",
          error
        );
      }
    },
    [SOCKET_URL, currentUserId]
  );

  // =======================================================
  // SOCKET
  // =======================================================

  const socketRef =
    useRef(null);

  // =======================================================
  // WEBRTC
  // =======================================================

  const peerConnectionRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const remoteStreamRef =
    useRef(null);

  const pendingIceCandidatesRef =
    useRef([]);

  // =======================================================
  // FORCE RENDER WHEN REMOTE MEDIA ARRIVES
  // =======================================================

  const [
    remoteStreamVersion,
    setRemoteStreamVersion,
  ] = useState(0);

  // =======================================================
  // VIDEO / AUDIO ELEMENTS
  // =======================================================

  const localVideoRef =
    useRef(null);

  const remoteVideoRef =
    useRef(null);

  const remoteAudioRef =
    useRef(null);

  // =======================================================
  // CALL STATE
  // =======================================================

  const [
    callState,
    setCallState,
  ] = useState("idle");

  const callStateRef =
    useRef("idle");

  const [
    callType,
    setCallType,
  ] = useState(null);

  const [
    activeCall,
    setActiveCall,
  ] = useState(null);

  const activeCallRef =
    useRef(null);

  const [
    incomingCall,
    setIncomingCall,
  ] = useState(null);

  const [
    callSeconds,
    setCallSeconds,
  ] = useState(0);

  const [
    microphoneEnabled,
    setMicrophoneEnabled,
  ] = useState(true);

  const [
    cameraEnabled,
    setCameraEnabled,
  ] = useState(true);

  const [
    speakerEnabled,
    setSpeakerEnabled,
  ] = useState(true);

  const [
    callError,
    setCallError,
  ] = useState("");

  const callTimerRef =
    useRef(null);

  // =======================================================
  // RINGTONE
  // =======================================================

  const ringtoneContextRef =
    useRef(null);

  const ringtoneOscillatorRef =
    useRef(null);

  const ringtoneGainRef =
    useRef(null);

  const ringtoneTimerRef =
    useRef(null);

  // =======================================================
  // KEEP STATE REFS SYNCHRONIZED
  // =======================================================

  useEffect(() => {
    callStateRef.current =
      callState;
  }, [callState]);

  useEffect(() => {
    activeCallRef.current =
      activeCall;
  }, [activeCall]);

  // =======================================================
  // STOP RINGTONE
  // =======================================================

  const stopRingtone =
    useCallback(() => {

      if (
        ringtoneTimerRef.current
      ) {
        clearInterval(
          ringtoneTimerRef.current
        );

        ringtoneTimerRef.current =
          null;
      }

      try {
        if (
          ringtoneOscillatorRef.current
        ) {
          ringtoneOscillatorRef.current.stop();
        }
      } catch (error) {
        // oscillator may already be stopped
      }

      ringtoneOscillatorRef.current =
        null;

      if (
        ringtoneGainRef.current
      ) {
        try {
          ringtoneGainRef.current.gain.value = 0;
        } catch (error) {
          // ignore
        }
      }

      ringtoneGainRef.current =
        null;

      if (
        ringtoneContextRef.current
      ) {
        try {
          ringtoneContextRef.current.close();
        } catch (error) {
          // ignore
        }
      }

      ringtoneContextRef.current =
        null;
    }, []);

  // =======================================================
  // START RINGTONE
  // =======================================================

  const startRingtone =
    useCallback(async () => {

      stopRingtone();

      try {
        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) {
          console.warn(
            "ZenvaZapp ringtone: Web Audio is not supported."
          );

          return;
        }

        const context =
          new AudioContext();

        ringtoneContextRef.current =
          context;

        if (
          context.state ===
          "suspended"
        ) {
          try {
            await context.resume();
          } catch (error) {
            console.warn(
              "ZenvaZapp ringtone AudioContext could not resume:",
              error
            );
          }
        }

        const playTone =
          () => {

            if (
              !ringtoneContextRef.current
            ) {
              return;
            }

            try {
              const oscillator =
                context.createOscillator();

              const gain =
                context.createGain();

              oscillator.type =
                "sine";

              oscillator.frequency.setValueAtTime(
                880,
                context.currentTime
              );

              gain.gain.setValueAtTime(
                0.0001,
                context.currentTime
              );

              gain.gain.exponentialRampToValueAtTime(
                0.18,
                context.currentTime + 0.03
              );

              gain.gain.exponentialRampToValueAtTime(
                0.0001,
                context.currentTime + 0.45
              );

              oscillator.connect(
                gain
              );

              gain.connect(
                context.destination
              );

              oscillator.start();

              oscillator.stop(
                context.currentTime +
                  0.5
              );

              ringtoneOscillatorRef.current =
                oscillator;

              ringtoneGainRef.current =
                gain;
            } catch (error) {
              console.warn(
                "ZenvaZapp ringtone tone failed:",
                error
              );
            }
          };

        playTone();

        ringtoneTimerRef.current =
          setInterval(
            playTone,
            1400
          );

      } catch (error) {
        console.warn(
          "ZenvaZapp ringtone initialization failed:",
          error
        );
      }
    }, [stopRingtone]);

  // =======================================================
  // SET VIDEO / AUDIO STREAM
  // =======================================================

  const attachLocalStream =
    useCallback(() => {

      if (
        !localVideoRef.current
      ) {
        return;
      }

      const stream =
        localStreamRef.current;

      if (!stream) {
        return;
      }

      localVideoRef.current.srcObject =
        stream;

      localVideoRef.current
        .play()
        .catch(() => {});

    }, []);

  const attachRemoteStream =
    useCallback(() => {

     const stream =
       remoteStreamRef.current;

      if (!stream) {
       console.warn(
         "ZenvaZapp cannot attach remote media: no remote stream."
        );

        return;
      }

      const audioTracks =
       stream.getAudioTracks();

      const videoTracks =
       stream.getVideoTracks();

      console.log(
       "=========================================="
      );

      console.log(
       "ZenvaZapp ATTACHING REMOTE MEDIA"
      );

      console.log(
       "Remote audio tracks:",
       audioTracks.length
      );

      console.log(
       "Remote video tracks:",
       videoTracks.length
      );

      console.log(
       "=========================================="
      );

      // =================================================
      // REMOTE VIDEO
      // =================================================

      if (
       remoteVideoRef.current &&
        videoTracks.length > 0
      ) {

        const video =
         remoteVideoRef.current;

        if (
         video.srcObject !==
         stream
        ) {
          video.srcObject =
          stream;
        }

        video.autoplay = true;
        video.playsInline = true;

        video.muted = false;

        video.volume = 1;

        const playVideo =
         () => {
           video
             .play()
             .then(() => {
               console.log(
                 "ZenvaZapp remote VIDEO playback started."
                );
              })
              .catch((error) => {
               console.warn(
                 "ZenvaZapp remote video playback waiting for browser permission:",
                 error
                );
              });
          };

        if (
         video.readyState >= 2
        ) {
         playVideo();
        } else {
         video.onloadedmetadata =
          playVideo;
        }
      }

      // =================================================
      // REMOTE AUDIO
      // =================================================

      if (
       remoteAudioRef.current &&
       audioTracks.length > 0
      ) {

       const audio =
        remoteAudioRef.current;

       if (
         audio.srcObject !==
         stream
        ) {
         audio.srcObject =
          stream;
        }

        audio.autoplay = true;

        audio.muted =
         !speakerEnabled;

        audio.volume = 1;

        const playAudio =
         () => {
           audio
            .play()
             .then(() => {
               console.log(
                 "ZenvaZapp remote AUDIO playback started."
                );
              })
              .catch((error) => {
               console.warn(
                 "ZenvaZapp remote audio playback waiting for browser permission:",
                 error
                );
              });
          };

        if (
         audio.readyState >= 2
        ) {
          playAudio();
        } else {
          audio.onloadedmetadata =
           playAudio;
        }
      }

    }, [
      speakerEnabled,
    ]);

  // =======================================================
  // REATTACH REMOTE MEDIA WHEN COMPONENT RENDERS
  // =======================================================

  useEffect(() => {

    if (
      !remoteStreamRef.current
    ) {
      return;
    }

    const frame =
      requestAnimationFrame(() => {
        attachRemoteStream();
      });

    return () => {
      cancelAnimationFrame(
        frame
      );
    };

  }, [
    attachRemoteStream,
    remoteStreamVersion,
    callState,
  ]);

  // =======================================================
  // CALL TIMER
  // =======================================================

  const stopCallTimer =
    useCallback(() => {

      if (
        callTimerRef.current
      ) {
        clearInterval(
          callTimerRef.current
        );

        callTimerRef.current =
          null;
      }

    }, []);

  const startCallTimer =
    useCallback(() => {

      stopCallTimer();

      setCallSeconds(0);

      callTimerRef.current =
        setInterval(() => {
          setCallSeconds(
            (previous) =>
              previous + 1
          );
        }, 1000);

    }, [stopCallTimer]);

  // =======================================================
  // LOCAL MEDIA
  // =======================================================

  const getLocalMedia =
    useCallback(async (type) => {

      const constraints =
        type === "video"
          ? {
              audio: {
                echoCancellation:
                  true,

                noiseSuppression:
                  true,

                autoGainControl:
                  true,
              },

              video: {
                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },

                facingMode:
                  "user",
              },
            }
          : {
              audio: {
                echoCancellation:
                  true,

                noiseSuppression:
                  true,

                autoGainControl:
                  true,
              },

              video: false,
            };

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        throw new Error(
          "Your browser does not support microphone and camera access."
        );
      }

      const stream =
        await navigator.mediaDevices
          .getUserMedia(
            constraints
          );

      localStreamRef.current =
        stream;

      const audioTracks =
        stream.getAudioTracks();

      audioTracks.forEach(
        (track) => {
          track.enabled =
            true;
        }
      );

      setMicrophoneEnabled(
        audioTracks.length > 0
      );

      const videoTracks =
        stream.getVideoTracks();

      setCameraEnabled(
        type === "video" &&
          videoTracks.length > 0
      );

      return stream;

    }, []);

  // =======================================================
  // CREATE PEER CONNECTION
  // =======================================================

  const createPeerConnection =
    useCallback(
      (targetUserId) => {

        const configuration = {
          iceServers: [
            {
              urls:
                "stun:stun.l.google.com:19302",
            },

            {
              urls:
                "stun:stun1.l.google.com:19302",
            },
          ],
        };

        const peerConnection =
          new RTCPeerConnection(
            configuration
          );

        peerConnectionRef.current =
          peerConnection;

        // ===============================================
        // ICE CANDIDATES
        // ===============================================

        peerConnection.onicecandidate =
          (event) => {

            if (
              !event.candidate
            ) {
              return;
            }

            const socket =
              socketRef.current;

            if (
              !socket?.connected ||
              !currentUserId ||
              !targetUserId
            ) {
              return;
            }

            const call =
              activeCallRef.current;

            socket.emit(
              "call-ice-candidate",
              {
                conversationId:
                  call?.conversationId ||
                  "",

                senderUserId:
                  String(
                    currentUserId
                  ),

                targetUserId:
                  String(
                    targetUserId
                  ),

                candidate:
                  event.candidate,
              }
            );
          };

       // ===============================================
       // REMOTE TRACK
       // ===============================================

        peerConnection.ontrack = (event) => {
         const track = event.track;

         if (!track) {
           console.warn(
             "ZenvaZapp WebRTC received an empty remote track."
            );

            return;
          }

          console.log(
            "=========================================="
          );

          console.log(
           "ZenvaZapp REMOTE TRACK RECEIVED"
          );

          console.log(
            "Track kind:",
           track.kind
          );

          console.log(
            "Track ID:",
           track.id
          );

          console.log(
            "Track enabled:",
           track.enabled
          );

          console.log(
            "Track readyState:",
           track.readyState
          );

          console.log(
            "=========================================="
          );

          if (!remoteStreamRef.current) {
           remoteStreamRef.current =
            new MediaStream();
          }

          const remoteStream =
           remoteStreamRef.current;

          const existingTrack =
           remoteStream
             .getTracks()
             .find(
               (existing) =>
                 existing.id === track.id
              );

          if (!existingTrack) {
           remoteStream.addTrack(track);

           console.log(
              `ZenvaZapp added remote ${track.kind} track.`
            );
          }

          track.enabled = true;

          track.onmute = () => {
            console.warn(
             `ZenvaZapp remote ${track.kind} track became muted.`
            );
          };

          track.onunmute = () => {
            console.log(
             `ZenvaZapp remote ${track.kind} track became active again.`
            );

            requestAnimationFrame(() => {
              attachRemoteStream();
            });
          };

          track.onended = () => {
           console.warn(
             `ZenvaZapp remote ${track.kind} track ended.`
            );
          };

          setRemoteStreamVersion(
           (previous) =>
              previous + 1
          );

          requestAnimationFrame(() => {
            attachRemoteStream();
          });

          const audioTracks =
           remoteStream.getAudioTracks();

          const videoTracks =
            remoteStream.getVideoTracks();

          console.log(
            "ZenvaZapp remote audio tracks:",
               audioTracks.length
          );

          console.log(
            "ZenvaZapp remote video tracks:",
           videoTracks.length
          );

          if (audioTracks.length > 0) {
            console.log(
              "ZenvaZapp remote AUDIO is available."
            );
          }

          if (videoTracks.length > 0) {
            console.log(
             "ZenvaZapp remote VIDEO is available."
            );
          }

          setSpeakerEnabled(true);
        };

        // ===============================================
        // CONNECTION STATE
        // ===============================================

        peerConnection.onconnectionstatechange =
          () => {

            const state =
              peerConnection.connectionState;

            console.log(
              "ZenvaZapp WebRTC connection:",
              state
            );

            if (
              state === "connected"
            ) {

              console.log(
                "ZenvaZapp WebRTC connection fully connected."
              );

              setCallState(
                "connected"
              );

              startCallTimer();

              requestAnimationFrame(() => {

                attachLocalStream();

                attachRemoteStream();

              });

              setTimeout(() => {

                attachLocalStream();

                attachRemoteStream();

              }, 300);

              setTimeout(() => {

                attachRemoteStream();

              }, 1000);
            }

            if (
              state === "failed"
            ) {
              setCallError(
                "The call connection failed."
              );
            }

            if (
              state ===
              "disconnected"
            ) {
              setCallError(
                "The call connection was interrupted."
              );
            }

            if (
              state === "closed"
            ) {
              setCallState(
                "idle"
              );
            }
          };

        // ===============================================
        // ICE CONNECTION STATE
        // ===============================================

        peerConnection.oniceconnectionstatechange =
          () => {

            const state =
              peerConnection
                .iceConnectionState;

            console.log(
              "ZenvaZapp ICE state:",
              state
            );

            if (
              state === "failed"
            ) {
              setCallError(
                "Unable to establish the call connection."
              );
            }
          };

        return peerConnection;
      },
      [
        attachLocalStream,
        attachRemoteStream,
        currentUserId,
        startCallTimer,
      ]
    );

  // =======================================================
  // ADD LOCAL TRACKS
  // =======================================================

  const addLocalTracks =
    useCallback(
      (peerConnection) => {

        const stream =
          localStreamRef.current;

        if (
          !stream ||
          !peerConnection
        ) {
          return;
        }

        const existingTracks =
          peerConnection
            .getSenders()
            .map(
              (sender) =>
                sender.track?.id
            )
            .filter(Boolean);

        stream
          .getTracks()
          .forEach((track) => {

            if (
              existingTracks.includes(
                track.id
              )
            ) {
              return;
            }

            peerConnection.addTrack(
              track,
              stream
            );
          });

      },
      []
    );

  // =======================================================
  // FLUSH PENDING ICE
  // =======================================================

  const flushPendingIceCandidates =
    useCallback(async () => {

      const peerConnection =
        peerConnectionRef.current;

      if (!peerConnection) {
        return;
      }

      const candidates =
        pendingIceCandidatesRef.current;

      pendingIceCandidatesRef.current =
        [];

      for (
        const candidate of candidates
      ) {
        try {

          await peerConnection.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

        } catch (error) {

          console.warn(
            "Unable to add queued ICE candidate:",
            error
          );

        }
      }

    }, []);

 // =======================================================
  // CLEANUP CALL
  // =======================================================

  const cleanupCall =
    useCallback(
      ({
        notifyRemote = true,
      } = {}) => {

        stopRingtone();

        const callToSave =
          activeCallRef.current;

        const otherUserId =
          callToSave?.otherUserId;

        if (
          otherUserId
        ) {
          void markCallAsRecent(
            otherUserId
          );
        }

        const call =
          activeCallRef.current;

        const socket =
          socketRef.current;

        // ===============================================
        // TELL REMOTE USER
        // ===============================================

        if (
          notifyRemote &&
          socket?.connected &&
          call?.otherUserId
        ) {
          socket.emit("call-ended", {
            conversationId:
              call.conversationId || "",

            senderUserId:
              String(currentUserId),

            targetUserId:
              String(call.otherUserId),

            callerId:
              String(
                call.callerId ||
                currentUserId
              ),

            receiverId:
              String(
                call.receiverId ||
                call.otherUserId
              ),
          });
        }

        // ===============================================
        // STOP TIMER
        // ===============================================

        stopCallTimer();

        // ===============================================
        // CLOSE PEER
        // ===============================================

        const peerConnection =
          peerConnectionRef.current;

        if (
          peerConnection
        ) {
          try {

            peerConnection.ontrack =
              null;

            peerConnection.onicecandidate =
              null;

            peerConnection.onconnectionstatechange =
              null;

            peerConnection.oniceconnectionstatechange =
              null;

            peerConnection.close();

          } catch (error) {

            console.warn(
              "Peer connection cleanup failed:",
              error
            );

          }
        }

        peerConnectionRef.current =
          null;

        // ===============================================
        // STOP LOCAL MEDIA
        // ===============================================

        const localStream =
          localStreamRef.current;

        if (
          localStream
        ) {
          localStream
            .getTracks()
            .forEach(
              (track) => {
                track.stop();
              }
            );
        }

        localStreamRef.current =
          null;

        // ===============================================
        // CLEAR REMOTE STREAM
        // ===============================================

        remoteStreamRef.current =
          null;

        setRemoteStreamVersion(
          (previous) =>
            previous + 1
        );

        if (
          localVideoRef.current
        ) {
          localVideoRef.current.srcObject =
            null;
        }

        if (
          remoteVideoRef.current
        ) {
          remoteVideoRef.current.srcObject =
            null;
        }

        if (
          remoteAudioRef.current
        ) {
          remoteAudioRef.current.pause();

          remoteAudioRef.current.srcObject =
            null;
        }

        // ===============================================
        // CLEAR ICE
        // ===============================================

        pendingIceCandidatesRef.current =
          [];

        // ===============================================
        // CLEAR STATE
        // ===============================================

        setIncomingCall(
          null
        );

        setActiveCall(
          null
        );

        activeCallRef.current =
          null;

        setCallType(
          null
        );

        setCallState(
          "idle"
        );

        setCallSeconds(
          0
        );

        setMicrophoneEnabled(
          true
        );

        setCameraEnabled(
          true
        );

        setSpeakerEnabled(
          true
        );

      },
      [
        currentUserId,
        markCallAsRecent,
        stopCallTimer,
        stopRingtone,
      ]
    );

  // =======================================================
  // START OUTGOING CALL
  // =======================================================

  const startCall =
    useCallback(
      async (chat, type) => {

        if (!chat) {
          return;
        }

        if (
          callStateRef.current !==
          "idle"
        ) {
          return;
        }

        const otherUserId =
          chat?._id ||
          chat?.id ||
          chat?.userId;

        if (
          !currentUserId ||
          !otherUserId
        ) {

          setCallError(
            "Unable to identify the contact. Please refresh your contacts and try again."
          );

          console.warn(
            "ZenvaZapp call blocked: missing MongoDB user ID.",
            {
              currentUserId,
              chat,
            }
          );

          return;
        }

        const socket =
          socketRef.current;

        if (
          !socket?.connected
        ) {

          setCallError(
            "ZenvaZapp calling service is not connected."
          );

          console.warn(
            "ZenvaZapp call blocked: socket is not connected."
          );

          return;
        }

        const conversationId =
          chat?.conversationId ||
          [
            currentUserId,
            otherUserId,
          ]
            .filter(Boolean)
            .sort()
            .join("_");

        const contactName =
          chat?.name ||
          chat?.fullName ||
          chat?.displayName ||
          chat?.username ||
          "ZenvaZapp User";

        const contactAvatar =
          chat?.profilePhoto ||
          chat?.avatar ||
          contactName
            .charAt(0)
            .toUpperCase();

        try {

          setCallError("");

          const call = {
            otherUserId:
              String(
                otherUserId
              ),

            conversationId,

            name:
              contactName,

            avatar:
              contactAvatar,

            profilePhoto:
              chat?.profilePhoto ||
              "",

            callType:
              type,
          };

          setActiveCall(
            call
          );

          activeCallRef.current =
            call;

          setCallType(
            type
          );

          setCallState(
            "calling"
          );

          setCallSeconds(
            0
          );

          console.log(
            "=========================================="
          );

          console.log(
            "ZenvaZapp OUTGOING CALL"
          );

          console.log(
            "Caller:",
            currentUserId
          );

          console.log(
            "Receiver:",
            otherUserId
          );

          console.log(
            "Type:",
            type
          );

          console.log(
            "Socket:",
            socket.id
          );

          console.log(
            "Socket connected:",
            socket.connected
          );

          console.log(
            "=========================================="
          );

          // =============================================
          // GET MEDIA
          // =============================================

          const stream =
            await getLocalMedia(
              type
            );

          // =============================================
          // CREATE PEER
          // =============================================

          const peerConnection =
            createPeerConnection(
              String(
                otherUserId
              )
            );

          addLocalTracks(
            peerConnection
          );

          // =============================================
          // CREATE OFFER
          // =============================================

          const offer =
            await peerConnection.createOffer();

          await peerConnection.setLocalDescription(
            offer
          );

          // =============================================
          // SEND OFFER
          // =============================================

          console.log(
            "ZenvaZapp sending call-offer:",
            {
              callerId:
                currentUserId,

              receiverId:
                otherUserId,

              callType:
                type,
            }
          );

          socket.emit(
            "call-offer",
            {
              callerId:
                String(
                  currentUserId
                ),

              receiverId:
                String(
                  otherUserId
                ),

              conversationId,

              callType:
                type,

              offer:
                peerConnection.localDescription,

              callerName:
                currentUserName,

              callerAvatar:
                currentUserAvatar,
            }
          );

          requestAnimationFrame(
            () => {
              attachLocalStream();
            }
          );

          void stream;

        } catch (error) {

          console.error(
            "ZenvaZapp start call error:",
            error
          );

          setCallError(
            error?.message ||
              "Unable to start the call."
          );

          cleanupCall({
            notifyRemote:
              false,
          });
        }

      },
      [
        addLocalTracks,
        attachLocalStream,
        cleanupCall,
        createPeerConnection,
        currentUserAvatar,
        currentUserId,
        currentUserName,
        getLocalMedia,
      ]
    );

  // =======================================================
  // ACCEPT INCOMING CALL
  // =======================================================

  const acceptCall =
    useCallback(
      async () => {

        const incoming =
          incomingCall;

        if (!incoming) {
          return;
        }

        stopRingtone();

        const {
          callerId,
          offer,
          callType:
            incomingType,
          conversationId,
          callerName,
          callerAvatar,
        } = incoming;

        if (
          !callerId ||
          !offer
        ) {
          return;
        }

        try {

          setCallError("");

          const type =
            incomingType ||
            "audio";

          const call = {
            otherUserId:
              String(
                callerId
              ),

            conversationId:
              conversationId ||
              "",

            name:
              callerName ||
              "ZenvaZapp User",

            avatar:
              callerAvatar ||
              (
                callerName ||
                "Z"
              )
                .charAt(0)
                .toUpperCase(),

            profilePhoto:
              callerAvatar &&
              String(
                callerAvatar
              ).startsWith(
                "http"
              )
                ? callerAvatar
                : "",

            callType:
              type,
          };

          setActiveCall(
            call
          );

          activeCallRef.current =
            call;

          setCallType(
            type
          );

          setCallState(
            "connecting"
          );

          setCallSeconds(
            0
          );

          console.log(
            "ZenvaZapp accepting incoming call from:",
            callerId
          );

          // =============================================
          // GET MEDIA
          // =============================================

          const stream =
            await getLocalMedia(
              type
            );

          // =============================================
          // CREATE PEER
          // =============================================

          const peerConnection =
            createPeerConnection(
              String(
                callerId
              )
            );

          addLocalTracks(
            peerConnection
          );

          // =============================================
          // APPLY OFFER
          // =============================================

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
              offer
            )
          );

          // =============================================
          // APPLY QUEUED ICE
          // =============================================

          await flushPendingIceCandidates();

          // =============================================
          // CREATE ANSWER
          // =============================================

          const answer =
            await peerConnection.createAnswer();

          await peerConnection.setLocalDescription(
            answer
          );

          // =============================================
          // SEND ANSWER
          // =============================================

          const socket =
            socketRef.current;

          if (
            socket?.connected
          ) {

            socket.emit(
              "call-answer",
              {
                callerId:
                  String(
                    callerId
                  ),

                receiverId:
                  String(
                    currentUserId
                  ),

                conversationId:
                  conversationId ||
                  "",

                answer:
                  peerConnection.localDescription,
              }
            );
          }

          setIncomingCall(
            null
          );

          requestAnimationFrame(
            () => {
              attachLocalStream();
              attachRemoteStream();
            }
          );

          void stream;

        } catch (error) {

          console.error(
            "ZenvaZapp accept call error:",
            error
          );

          setCallError(
            error?.message ||
              "Unable to accept the call."
          );

          cleanupCall({
            notifyRemote:
              true,
          });
        }

      },
      [
        addLocalTracks,
        attachLocalStream,
        attachRemoteStream,
        cleanupCall,
        createPeerConnection,
        currentUserId,
        flushPendingIceCandidates,
        getLocalMedia,
        incomingCall,
        stopRingtone,
      ]
    );

  // =======================================================
  // REJECT INCOMING CALL
  // =======================================================

  const rejectCall =
    useCallback(() => {

      const incoming =
        incomingCall;

      if (!incoming) {
        return;
      }

      stopRingtone();

      const socket =
        socketRef.current;

      if (
        socket?.connected &&
        incoming.callerId
      ) {

        socket.emit(
          "call-rejected",
          {
            callerId:
              String(
                incoming.callerId
              ),

            receiverId:
              String(
                currentUserId
              ),

            conversationId:
              incoming.conversationId ||
              "",

            reason:
              "Call declined.",
          }
        );
      }

      setIncomingCall(
        null
      );

      setCallState(
        "idle"
      );

      setCallType(
        null
      );

      setCallSeconds(
        0
      );

      setCallError("");

    }, [
      currentUserId,
      incomingCall,
      stopRingtone,
    ]);

  // =======================================================
  // MICROPHONE
  // =======================================================

  const toggleMicrophone =
    useCallback(() => {

      const stream =
        localStreamRef.current;

      if (!stream) {
        return;
      }

      const audioTracks =
        stream.getAudioTracks();

      if (
        audioTracks.length === 0
      ) {
        return;
      }

      const nextState =
        !microphoneEnabled;

      audioTracks.forEach(
        (track) => {
          track.enabled =
            nextState;
        }
      );

      setMicrophoneEnabled(
        nextState
      );

    }, [microphoneEnabled]);

  // =======================================================
  // CAMERA
  // =======================================================

  const toggleCamera =
    useCallback(() => {

      const stream =
        localStreamRef.current;

      if (!stream) {
        return;
      }

      const videoTracks =
        stream.getVideoTracks();

      if (
        videoTracks.length === 0
      ) {
        return;
      }

      const nextState =
        !cameraEnabled;

      videoTracks.forEach(
        (track) => {
          track.enabled =
            nextState;
        }
      );

      setCameraEnabled(
        nextState
      );

    }, [cameraEnabled]);

  // =======================================================
  // SPEAKER
  // =======================================================

  const toggleSpeaker =
    useCallback(() => {

      const nextState =
        !speakerEnabled;

      if (
        remoteAudioRef.current
      ) {

        remoteAudioRef.current.muted =
          !nextState;

        if (
          nextState &&
          remoteAudioRef.current
            .srcObject
        ) {

          remoteAudioRef.current
            .play()
            .catch(() => {});

        }
      }

      if (
        remoteVideoRef.current
      ) {

        remoteVideoRef.current.muted =
          !nextState;

        if (
          nextState &&
          remoteVideoRef.current
            .srcObject
        ) {

          remoteVideoRef.current
            .play()
            .catch(() => {});

        }
      }

      setSpeakerEnabled(
        nextState
      );

    }, [speakerEnabled]);

  // =======================================================
  // SCREEN SHARING
  // =======================================================

  const shareScreen =
    useCallback(async () => {

      const peerConnection =
        peerConnectionRef.current;

      if (
        !peerConnection ||
        !navigator.mediaDevices
          ?.getDisplayMedia
      ) {
        return false;
      }

      try {

        const displayStream =
          await navigator.mediaDevices.getDisplayMedia(
            {
              video: true,
              audio: false,
            }
          );

        const screenTrack =
          displayStream
            .getVideoTracks()?.[0];

        if (!screenTrack) {
          return false;
        }

        const videoSender =
          peerConnection
            .getSenders()
            .find(
              (sender) =>
                sender.track?.kind ===
                "video"
            );

        if (videoSender) {

          await videoSender.replaceTrack(
            screenTrack
          );

        } else {

          peerConnection.addTrack(
            screenTrack,
            displayStream
          );
        }

        if (
          localVideoRef.current
        ) {

          localVideoRef.current.srcObject =
            displayStream;

          localVideoRef.current
            .play()
            .catch(() => {});
        }

        screenTrack.onended =
          async () => {

            const originalTrack =
              localStreamRef.current
                ?.getVideoTracks()?.[0];

            if (
              originalTrack &&
              videoSender
            ) {

              try {

                await videoSender.replaceTrack(
                  originalTrack
                );

              } catch (error) {

                console.warn(
                  "Unable to restore camera track:",
                  error
                );

              }
            }

            if (
              localVideoRef.current
            ) {

              localVideoRef.current.srcObject =
                localStreamRef.current;

              localVideoRef.current
                .play()
                .catch(() => {});
            }
          };

        return true;

      } catch (error) {

        if (
          error?.name !==
          "NotAllowedError"
        ) {

          console.error(
            "Screen sharing error:",
            error
          );
        }

        return false;
      }

    }, []);

  // =======================================================
  // CALL ANSWER
  // =======================================================

  const handleCallAnswer =
    useCallback(
      async (data) => {

        if (!data?.answer) {
          return;
        }

        if (
          String(
            data.callerId
          ) !==
          String(
            currentUserId
          )
        ) {
          return;
        }

        const peerConnection =
          peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        try {

          console.log(
            "ZenvaZapp received call-answer."
          );

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
              data.answer
            )
          );

          await flushPendingIceCandidates();

          setCallState(
            "connecting"
          );

          requestAnimationFrame(
            () => {
              attachLocalStream();
              attachRemoteStream();
            }
          );

        } catch (error) {

          console.error(
            "ZenvaZapp call answer error:",
            error
          );

          setCallError(
            "Unable to establish the call."
          );
        }
      },
      [
        attachLocalStream,
        attachRemoteStream,
        currentUserId,
        flushPendingIceCandidates,
      ]
    );

  // =======================================================
  // CALL ICE CANDIDATE
  // =======================================================
  //
  // IMPORTANT:
  //
  // ICE candidates can arrive BEFORE the receiver presses
  // Accept. In that situation there is intentionally no
  // RTCPeerConnection yet.
  //
  // NEVER discard the candidate.
  //
  // Queue it first, then flush it after:
  // 1. The receiver accepts the call.
  // 2. The peer connection is created.
  // 3. The remote offer has been applied.
  //
  // This is especially important on real phones/networks.
  // =======================================================
  const handleCallIceCandidate =
    useCallback(
      async (data) => {

        if (!data?.candidate) {
          return;
        }

        const senderId =
          data.senderUserId ||
          data.callerId ||
          data.receiverId;

        const targetId =
          data.targetUserId ||
          data.receiverId ||
          data.callerId;

        // ---------------------------------------------------
        // THIS ICE PACKET MUST BE FOR THIS USER
        // ---------------------------------------------------

        if (
          targetId &&
          String(targetId) !==
            String(currentUserId)
        ) {
          return;
        }

        // ---------------------------------------------------
        // NEVER ACCEPT OUR OWN ICE CANDIDATE
        // ---------------------------------------------------

        if (
          senderId &&
          String(senderId) ===
            String(currentUserId)
        ) {
          return;
        }

        console.log(
          "ZenvaZapp received ICE candidate:",
          {
            senderId,
            targetId,
            hasPeerConnection:
              Boolean(
                peerConnectionRef.current
              ),
            hasRemoteDescription:
              Boolean(
                peerConnectionRef.current
                  ?.remoteDescription
              ),
          }
        );

        const peerConnection =
          peerConnectionRef.current;

        // ---------------------------------------------------
        // PEER DOES NOT EXIST YET
        // ---------------------------------------------------
        //
        // This is normal while the incoming-call screen is
        // waiting for the user to press Accept.
        //
        // QUEUE THE CANDIDATE.
        // ---------------------------------------------------

        if (!peerConnection) {

          console.log(
            "ZenvaZapp queueing ICE candidate: peer connection not created yet."
          );

          pendingIceCandidatesRef.current.push(
            data.candidate
          );

          return;
        }

        // ---------------------------------------------------
        // PEER EXISTS BUT REMOTE OFFER HAS NOT BEEN APPLIED
        // ---------------------------------------------------
        //
        // addIceCandidate() must wait until the remote
        // description exists.
        // ---------------------------------------------------

        if (
          !peerConnection.remoteDescription
        ) {

          console.log(
            "ZenvaZapp queueing ICE candidate: remote description not ready."
          );

          pendingIceCandidatesRef.current.push(
            data.candidate
          );

          return;
        }

        // ---------------------------------------------------
        // PEER + REMOTE DESCRIPTION READY
        // ---------------------------------------------------

        try {

          await peerConnection.addIceCandidate(
            new RTCIceCandidate(
              data.candidate
            )
          );

          console.log(
            "ZenvaZapp ICE candidate added successfully."
          );

        } catch (error) {

          console.warn(
            "ZenvaZapp unable to add ICE candidate:",
            error
          );

          // -------------------------------------------------
          // SAFETY FALLBACK
          // -------------------------------------------------
          //
          // If the browser temporarily rejects the candidate
          // because signaling is still settling, keep it so
          // flushPendingIceCandidates() can retry it.
          // -------------------------------------------------

          pendingIceCandidatesRef.current.push(
            data.candidate
          );
        }
      },
      [currentUserId]
    );
  // =======================================================
  // CALL REJECTED
  // =======================================================

  const handleCallRejected =
    useCallback(
      (data) => {

        if (!data) {
          return;
        }

        if (
          String(
            data.callerId
          ) !==
          String(
            currentUserId
          )
        ) {
          return;
        }

        setCallError(
          data.reason ||
            "Call declined."
        );

        cleanupCall({
          notifyRemote:
            false,
        });

      },
      [
        cleanupCall,
        currentUserId,
      ]
    );

  // =======================================================
  // CALL ENDED
  // =======================================================
  // IMPORTANT:
  //
  // The global CallManager must only terminate the call when
  // the incoming event belongs to the exact active call.
  //
  // We verify:
  // 1. The event is from the other participant.
  // 2. The event targets the current user.
  // 3. The conversation matches the active call when available.
  // 4. The active call is actually in progress.
  //
  // The remote side cleans up locally with
  // notifyRemote: false so we do NOT create an endless
  // call-ended loop.
  // =======================================================
  const handleCallEnded = useCallback(
    (data) => {
      if (!data) {
        return;
      }

      const activeCallNow =
        activeCallRef.current;

      const activeState =
        callStateRef.current;

      const senderId =
        data.senderUserId ||
        data.callerId;

      const targetId =
        data.targetUserId ||
        data.receiverId;

      const eventConversationId =
        data.conversationId || "";

      const activeConversationId =
        activeCallNow?.conversationId || "";

      const activeOtherUserId =
        activeCallNow?.otherUserId || "";

      // ---------------------------------------------------
      // BASIC VALIDATION
      // ---------------------------------------------------

      if (
        !senderId ||
        !targetId
      ) {
        console.warn(
          "ZenvaZapp ignored call-ended event: missing participant IDs.",
          data
        );

        return;
      }

      // ---------------------------------------------------
      // EVENT MUST TARGET THIS USER
      // ---------------------------------------------------

      if (
        String(targetId) !==
        String(currentUserId)
      ) {
        return;
      }

      // ---------------------------------------------------
      // EVENT MUST COME FROM THE OTHER USER
      // ---------------------------------------------------

      if (
        String(senderId) ===
        String(currentUserId)
      ) {
        return;
      }

      // ---------------------------------------------------
      // THERE MUST BE AN ACTIVE CALL
      // ---------------------------------------------------

      const hasActiveCall =
        activeState !== "idle" &&
        Boolean(
          activeCallNow ||
          incomingCall
        );

      if (!hasActiveCall) {
        console.log(
          "ZenvaZapp ignored call-ended event: no active call."
        );

        return;
      }

      // ---------------------------------------------------
      // VERIFY THE REMOTE PARTICIPANT
      // ---------------------------------------------------

      if (
        activeOtherUserId &&
        String(activeOtherUserId) !==
          String(senderId)
      ) {
        console.warn(
          "ZenvaZapp ignored call-ended event: wrong remote participant.",
          {
            activeOtherUserId,
            senderId,
          }
        );

        return;
      }

      // ---------------------------------------------------
      // VERIFY CONVERSATION WHEN BOTH SIDES HAVE IT
      // ---------------------------------------------------

      if (
        activeConversationId &&
        eventConversationId &&
        String(activeConversationId) !==
          String(eventConversationId)
      ) {
        console.warn(
          "ZenvaZapp ignored call-ended event: conversation mismatch.",
          {
            activeConversationId,
            eventConversationId,
          }
        );

        return;
      }

      console.log(
        "=========================================="
      );

      console.log(
        "ZenvaZapp REMOTE CALL ENDED"
      );

      console.log(
        "Remote user:",
        senderId
      );

      console.log(
        "Current user:",
        currentUserId
      );

      console.log(
        "Conversation:",
        eventConversationId ||
          activeConversationId ||
          "unknown"
      );

      console.log(
        "=========================================="
      );

      // ---------------------------------------------------
      // IMPORTANT:
      //
      // Do NOT notify the remote user again.
      //
      // The remote user already ended the call.
      // ---------------------------------------------------

      cleanupCall({
        notifyRemote: false,
      });
    },
    [
      cleanupCall,
      currentUserId,
      incomingCall,
    ]
  );

  // =======================================================
  // INCOMING CALL
  // =======================================================

  const handleCallOffer =
    useCallback(
      (data) => {

        console.log(
          "ZenvaZapp received call-offer:",
          data
        );

        if (!data) {
          return;
        }

        if (
          String(
            data.receiverId
          ) !==
          String(
            currentUserId
          )
        ) {
          return;
        }

        if (
          String(
            data.callerId
          ) ===
          String(
            currentUserId
          )
        ) {
          return;
        }

        if (!data.offer) {

          console.warn(
            "ZenvaZapp call-offer has no WebRTC offer."
          );

          return;
        }

        if (
          callStateRef.current !==
          "idle"
        ) {

          console.warn(
            "ZenvaZapp ignored incoming call because another call is active."
          );

          return;
        }

        console.log(
          "=========================================="
        );

        console.log(
          "ZenvaZapp INCOMING CALL"
        );

        console.log(
          "Caller:",
          data.callerId
        );

        console.log(
          "Receiver:",
          data.receiverId
        );

        console.log(
          "Type:",
          data.callType
        );

        console.log(
          "=========================================="
        );

        setIncomingCall(
          data
        );

        setCallType(
          data.callType ||
            "audio"
        );

        setCallState(
          "ringing"
        );

        setCallSeconds(
          0
        );

        setCallError("");

        void startRingtone();

      },
      [
        currentUserId,
        startRingtone,
      ]
    );

  // =======================================================
  // SOCKET HANDLER REFS
  // =======================================================

  const handleCallOfferRef =
    useRef(handleCallOffer);

  const handleCallAnswerRef =
    useRef(handleCallAnswer);

  const handleCallIceCandidateRef =
    useRef(
      handleCallIceCandidate
    );

  const handleCallRejectedRef =
    useRef(handleCallRejected);

  const handleCallEndedRef =
    useRef(handleCallEnded);

  useEffect(() => {
    handleCallOfferRef.current =
      handleCallOffer;
  }, [handleCallOffer]);

  useEffect(() => {
    handleCallAnswerRef.current =
      handleCallAnswer;
  }, [handleCallAnswer]);

  useEffect(() => {
    handleCallIceCandidateRef.current =
      handleCallIceCandidate;
  }, [
    handleCallIceCandidate,
  ]);

  useEffect(() => {
    handleCallRejectedRef.current =
      handleCallRejected;
  }, [
    handleCallRejected,
  ]);

  useEffect(() => {
    handleCallEndedRef.current =
      handleCallEnded;
  }, [handleCallEnded]);

  // =======================================================
  // GLOBAL SOCKET INITIALIZATION
  // =======================================================

  useEffect(() => {

    if (!currentUserId) {

      console.warn(
        "ZenvaZapp call socket waiting for user ID."
      );

      return undefined;
    }

    console.log(
      "=========================================="
    );

    console.log(
      "ZenvaZapp initializing GLOBAL call socket"
    );

    console.log(
      "User:",
      currentUserId
    );

    console.log(
      "Server:",
      SOCKET_URL
    );

    console.log(
      "=========================================="
    );

    const socket =
      io(SOCKET_URL, {
        transports: [
          "websocket",
          "polling",
        ],

        upgrade: true,

        reconnection: true,

        reconnectionAttempts:
          Infinity,

        reconnectionDelay:
          1000,

        reconnectionDelayMax:
          5000,
      });

    socketRef.current =
      socket;

    // ===================================================
    // CONNECT
    // ===================================================

    socket.on(
      "connect",
      () => {

        console.log(
          "=========================================="
        );

        console.log(
          "ZenvaZapp CALL SOCKET CONNECTED"
        );

        console.log(
          "Socket ID:",
          socket.id
        );

        console.log(
          "User ID:",
          currentUserId
        );

        console.log(
          "=========================================="
        );

        socket.emit(
          "register-user",
          String(
            currentUserId
          )
        );
      }
    );

    // ===================================================
    // RECONNECT
    // ===================================================

    socket.on(
      "reconnect",
      (attempt) => {

        console.log(
          "ZenvaZapp call socket reconnected:",
          attempt
        );

        socket.emit(
          "register-user",
          String(
            currentUserId
          )
        );
      }
    );

    // ===================================================
    // CALL OFFER
    // ===================================================

    socket.on(
      "call-offer",
      (data) => {
        handleCallOfferRef.current?.(
          data
        );
      }
    );

    // ===================================================
    // CALL ANSWER
    // ===================================================

    socket.on(
      "call-answer",
      (data) => {
        handleCallAnswerRef.current?.(
          data
        );
      }
    );

    // ===================================================
    // ICE
    // ===================================================

    socket.on(
      "call-ice-candidate",
      (data) => {
        handleCallIceCandidateRef.current?.(
          data
        );
      }
    );

    // ===================================================
    // REJECTED
    // ===================================================

    socket.on(
      "call-rejected",
      (data) => {
        handleCallRejectedRef.current?.(
          data
        );
      }
    );

    // ===================================================
    // ENDED
    // ===================================================

    socket.on(
      "call-ended",
      (data) => {
        handleCallEndedRef.current?.(
          data
        );
      }
    );

    // ===================================================
    // SOCKET ERROR
    // ===================================================

    socket.on(
      "connect_error",
      (error) => {

        console.warn(
          "ZenvaZapp global call socket error:",
          error?.message ||
            error
        );
      }
    );

    // ===================================================
    // DISCONNECT
    // ===================================================

    socket.on(
      "disconnect",
      (reason) => {

        console.warn(
          "ZenvaZapp call socket disconnected:",
          reason
        );
      }
    );

    // ===================================================
    // CLEANUP
    // ===================================================

    return () => {

      console.log(
        "ZenvaZapp destroying global call socket."
      );

      stopRingtone();

      socket.off(
        "call-offer"
      );

      socket.off(
        "call-answer"
      );

      socket.off(
        "call-ice-candidate"
      );

      socket.off(
        "call-rejected"
      );

      socket.off(
        "call-ended"
      );

      socket.off(
        "connect"
      );

      socket.off(
        "reconnect"
      );

      socket.off(
        "connect_error"
      );

      socket.off(
        "disconnect"
      );

      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }

    };

  }, [
    SOCKET_URL,
    currentUserId,
    stopRingtone,
  ]);

  // =======================================================
  // PROVIDER UNMOUNT CLEANUP
  // =======================================================

  const cleanupCallRef =
    useRef(null);

  useEffect(() => {
    cleanupCallRef.current =
      cleanupCall;
  }, [cleanupCall]);

  useEffect(() => {

    return () => {

      stopRingtone();

      if (
        cleanupCallRef.current
      ) {

        cleanupCallRef.current({
          notifyRemote:
            true,
        });

      }

    };

  }, [stopRingtone]);

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value =
    useMemo(
      () => ({
        callState,

        callType,

        activeCall,

        incomingCall,

        callSeconds,

        callError,

        microphoneEnabled,

        cameraEnabled,

        speakerEnabled,

        startCall,

        acceptCall,

        rejectCall,

        endCall: () =>
          cleanupCall({
            notifyRemote:
              true,
          }),

        toggleMicrophone,

        toggleCamera,

        toggleSpeaker,

        shareScreen,

        clearCallError: () =>
          setCallError(""),
      }),
      [
        acceptCall,
        activeCall,
        callError,
        callSeconds,
        callState,
        callType,
        cameraEnabled,
        cleanupCall,
        incomingCall,
        microphoneEnabled,
        rejectCall,
        shareScreen,
        speakerEnabled,
        startCall,
        toggleCamera,
        toggleMicrophone,
        toggleSpeaker,
      ]
    );

  // =======================================================
  // OUTGOING CALL SCREEN
  // =======================================================

  const callScreen =
    callState !== "idle" &&
    !incomingCall &&
    activeCall ? (

      <CallScreen
        callState={callState}

        callType={
          callType ||
          activeCall.callType ||
          "audio"
        }

        contactName={
          activeCall.name
        }

        contactAvatar={
          activeCall.avatar
        }

        contactPhoto={
          activeCall.profilePhoto
        }

        localVideoRef={
          localVideoRef
        }

        remoteVideoRef={
          remoteVideoRef
        }

        remoteAudioRef={
          remoteAudioRef
        }

        remoteStream={
          remoteStreamRef.current
        }

        callSeconds={
          callSeconds
        }

        microphoneEnabled={
          microphoneEnabled
        }

        cameraEnabled={
          cameraEnabled
        }

        speakerEnabled={
          speakerEnabled
        }

        onToggleMicrophone={
          toggleMicrophone
        }

        onToggleCamera={
          toggleCamera
        }

        onToggleSpeaker={
          toggleSpeaker
        }

        onShareScreen={
          shareScreen
        }

        onEndCall={() =>
          cleanupCall({
            notifyRemote:
              true,
          })
        }
      />

    ) : null;

  // =======================================================
  // PROFESSIONAL GLOBAL INCOMING CALL SCREEN
  // =======================================================

  const incomingScreen =
    incomingCall ? (

      <div
        className="zenvazapp-incoming-call"
        role="dialog"
        aria-modal="true"
        aria-label="Incoming call"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 2147483647,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
          background:
            "rgba(5, 10, 20, 0.78)",
          backdropFilter:
            "blur(14px)",
          WebkitBackdropFilter:
            "blur(14px)",
        }}
      >

        <div
          className="zenvazapp-incoming-call-card"
          style={{
            width:
              "min(420px, 100%)",

            maxWidth:
              "420px",

            boxSizing:
              "border-box",

            padding:
              "36px 28px 30px",

            borderRadius:
              "28px",

            background:
              "rgba(255, 255, 255, 0.98)",

            boxShadow:
              "0 30px 90px rgba(0, 0, 0, 0.35)",

            textAlign:
              "center",

            position:
              "relative",

            overflow:
              "hidden",
          }}
        >

          <div
            style={{
              position:
                "absolute",

              top: 0,

              left: 0,

              right: 0,

              height:
                "5px",

              background:
                "linear-gradient(90deg, #5b21b6, #7c3aed, #8b5cf6)",
            }}
          />

          <div
            className="zenvazapp-incoming-avatar"
            style={{
              width:
                "112px",

              height:
                "112px",

              margin:
                "0 auto 20px",

              borderRadius:
                "50%",

              overflow:
                "hidden",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontSize:
                "42px",

              fontWeight:
                "700",

              background:
                "linear-gradient(135deg, #7c3aed, #4f46e5)",

              color:
                "#ffffff",

              boxShadow:
                "0 12px 35px rgba(79, 70, 229, 0.30)",
            }}
          >

            {incomingCall.callerAvatar &&
            String(
              incomingCall.callerAvatar
            ).startsWith(
              "http"
            ) ? (

              <img
                src={
                  incomingCall.callerAvatar
                }

                alt={
                  incomingCall.callerName ||
                  "Caller"
                }

                style={{
                  width:
                    "100%",

                  height:
                    "100%",

                  objectFit:
                    "cover",

                  display:
                    "block",
                }}
              />

            ) : (

              incomingCall.callerAvatar ||
              (
                incomingCall.callerName ||
                "Z"
              )
                .charAt(0)
                .toUpperCase()

            )}

          </div>

          <p
            style={{
              margin:
                "0 0 8px",

              fontSize:
                "14px",

              fontWeight:
                "600",

              letterSpacing:
                "0.04em",

              textTransform:
                "uppercase",

              color:
                "#7c3aed",
            }}
          >
            Incoming{" "}
            {incomingCall.callType ===
            "video"
              ? "video"
              : "voice"}{" "}
            call
          </p>

          <h2
            style={{
              margin:
                "0",

              fontSize:
                "28px",

              lineHeight:
                "1.2",

              fontWeight:
                "700",

              color:
                "#111827",
            }}
          >
            {incomingCall.callerName ||
              "ZenvaZapp User"}
          </h2>

          <p
            style={{
              margin:
                "10px 0 28px",

              fontSize:
                "14px",

              color:
                "#6b7280",
            }}
          >
            {incomingCall.callType ===
            "video"
              ? "Video call"
              : "Voice call"}{" "}
            is waiting for you
          </p>

          <div
            className="zenvazapp-incoming-actions"
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap:
                "18px",
            }}
          >

            <button
              type="button"
              className="zenvazapp-incoming-reject"
              onClick={
                rejectCall
              }
              aria-label="Decline call"
              style={{
                width:
                  "110px",

                minHeight:
                  "58px",

                border:
                  "none",

                borderRadius:
                  "18px",

                background:
                  "#fee2e2",

                color:
                  "#dc2626",

                fontSize:
                  "15px",

                fontWeight:
                  "700",

                cursor:
                  "pointer",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "3px",
              }}
            >

              <span
                style={{
                  fontSize:
                    "24px",

                  lineHeight:
                    1,
                }}
              >
                ✕
              </span>

              <span>
                Decline
              </span>

            </button>

            <button
              type="button"
              className="zenvazapp-incoming-accept"
              onClick={
                acceptCall
              }
              aria-label="Accept call"
              style={{
                width:
                  "110px",

                minHeight:
                  "58px",

                border:
                  "none",

                borderRadius:
                  "18px",

                background:
                  "#dcfce7",

                color:
                  "#16a34a",

                fontSize:
                  "15px",

                fontWeight:
                  "700",

                cursor:
                  "pointer",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "3px",
              }}
            >

              <span
                style={{
                  fontSize:
                    "24px",

                  lineHeight:
                    1,
                }}
              >
                ✓
              </span>

              <span>
                Accept
              </span>

            </button>

          </div>

        </div>

      </div>

    ) : null;

  // =======================================================
  // RENDER
  // =======================================================

  return (

    <CallContext.Provider
      value={value}
    >

      {children}

      {callScreen}

      {incomingScreen}

      {callError &&
        callState !==
          "idle" && (

          <div
            className="zenvazapp-call-error"
          >

            <span>
              {callError}
            </span>

            <button
              type="button"
              onClick={() =>
                setCallError("")
              }
              aria-label="Dismiss call error"
            >
              ×
            </button>

          </div>

        )}

    </CallContext.Provider>

  );
}

// =========================================================
// HOOK
// =========================================================

export function useCall() {

  const context =
    useContext(
      CallContext
    );

  if (!context) {
    throw new Error(
      "useCall must be used inside CallProvider."
    );
  }

  return context;
}

export default CallProvider;