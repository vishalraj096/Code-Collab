"use client";
import { userState } from "@/app/states/userState";
import { useRecoilState } from "recoil";
import CodeEditor from "./Editor";
import SimpleEditor from "./SimpleEditor";
import SideBar from "./SideBar";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { CodeContent } from "@/app/states/codeContent";
import { codeLang } from "@/app/states/codeLang";
import { CodeResult } from "@/app/states/codeResult";
import OutputTerminal from "./Output";

export default function Page({ params }: { params: { collabId: string } }) {
  const [currentUser, setCurrentUser] = useRecoilState(userState);
  const [socket, setSocket] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any>([]);
  const [codeText, setCodeText] = useRecoilState(CodeContent);
  const [isLocalLangChange, setIsLocalLangChange] = useState(false);
  const [output, setOutput] = useRecoilState(CodeResult);
  const [lang, setLang] = useRecoilState(codeLang);
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);

  const [spaceName, setSpaceName] = useState<string>("Untitled Space");

  // Add this to your useEffect block where you load saved data
  const loadSavedData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URI}/collab/getSpace/${params.collabId}`
      );

      if (response.data) {
        // Set the code and language from saved data
        setCodeText(response.data.code);
        setLang(response.data.language);
        setSpaceName(response.data.name); // Store the space name
      }
    } catch (error) {
      console.log("No saved data found or error loading:", error);
    }
  };

  useEffect(() => {
    if (socket && isLocalLangChange) {
      socket.emit("lang-change", lang, currentUser);
      setIsLocalLangChange(false);
    }
  }, [lang]);

  useEffect(() => {
    const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

    // Don't auto-save if no changes or no socket
    if (!socket || !codeText) return;

    const currentTime = Date.now();
    // Only save if it's been at least AUTO_SAVE_INTERVAL since last save
    if (currentTime - lastSaveTime < AUTO_SAVE_INTERVAL) return;

    // Auto-save the current code
    const saveCode = async () => {
      console.log("Auto-saving current code state...");
      socket.emit("save-collab-space", {
        collabId: params.collabId,
        name: spaceName,
        code: codeText,
        language: lang,
        userId: currentUser.id,
      });
      setLastSaveTime(currentTime);
    };

    saveCode();
  }, [codeText, socket]);

  async function getActiveUsers() {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URI}/collab/getActiveUsers?id=${params.collabId}`,
        {}
      );

      if (!resp.ok) {
        console.error("Failed to fetch active users:", resp.statusText);
        return;
      }

      const respJson = await resp.json();

      // Filter out any null or empty values
      const validUsers = Array.isArray(respJson)
        ? respJson.filter(
            (user) => user && typeof user === "string" && user.trim() !== ""
          )
        : [];

      console.log("Valid active users:", validUsers);
      setActiveUsers(validUsers);
    } catch (e) {
      console.error("Error fetching active users:", e);
    }
  }

  function emitCodeChange(e: any) {
    socket.emit("send-code-change", { code: e, user: currentUser });
  }

  const handleLangChange = (newLang?: any) => {
    // If a specific language is provided, use it directly
    if (newLang) {
      // Set the language locally
      setLang(newLang);

      // Emit the change to other users if socket exists
      if (socket) {
        console.log(`Emitting language change to ${newLang.name}`);
        socket.emit("lang-change", newLang, currentUser.name);
      }
    } else {
      // Original behavior - just flag for change
      setIsLocalLangChange(true);
    }
  };

  const { toast } = useToast();

  // Add this inside your component
  const handleSaveSpace = async (customName?: string) => {
    if (!socket) return;

    // Use the provided custom name, or fall back to the current space name
    const nameToSave = customName || spaceName;

    socket.emit("save-collab-space", {
      collabId: params.collabId,
      name: nameToSave,
      code: codeText,
      language: lang,
      userId: currentUser.id,
    });

    toast({
      title: "Saving...",
      description: "Your collaboration space is being saved.",
    });

    socket.on(
      "collab-space-saved",
      (result: { success: boolean; error?: string }) => {
        if (result.success) {
          toast({
            title: "Success",
            description: "Your collaboration space has been saved.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to save your collaboration space.",
            variant: "destructive",
          });
        }
      }
    );
  };

  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_WS_URI}/`);
    setSocket(newSocket);
    window.socket = newSocket;

    // First, try to load any existing data for this space
    const loadSavedData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URI}/collab/getSpace/${params.collabId}`
        );

        if (response.data) {
          // Set the code and language from saved data
          setCodeText(response.data.code);
          setLang(response.data.language);
        }
      } catch (error) {
        console.log("No saved data found or error loading:", error);
        // Continue with a new session if no data found
      }
    };

    newSocket.on("space-renamed", (data) => {
      // Update the space name in state
      setSpaceName(data.newName);

      // Show a toast notification about the rename
      toast({
        title: `Space Renamed`,
        description: `${data.renamedBy} renamed the space to "${data.newName}"`,
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    });

    newSocket.on("initial-code-state", (data) => {
      console.log("Received initial code state:", {
        codeLength: data.code ? data.code.length : 0,
        language: data.language,
        name: data.name,
      });

      // Update code in editor - make sure to check if it's different first
      if (data.code !== undefined) {
        console.log(`Setting code text (${data.code.length} characters)`);
        setCodeText(data.code);
      }

      // Update language if provided
      if (data.language) {
        console.log("Setting language to:", data.language);
        setLang(data.language);
      }

      // Update space name if provided
      if (data.name) {
        console.log("Setting space name to:", data.name);
        setSpaceName(data.name);
      }

      toast({
        title: "Code Loaded",
        description: "You're now seeing the current state of the collaboration",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    });

    loadSavedData();

    newSocket.emit("join-room", {
      collabId: params.collabId,
      user: currentUser.name,
      userId: currentUser.id,
    });

    setTimeout(getActiveUsers, 3000);

    newSocket.on("user-joined", (message) => {
      toast({
        title: `${message} Joined Collab-Space`,
        description: `${message} has joined the Collab-Space Now`,
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });

      setTimeout(getActiveUsers, 2000);
    });

    newSocket.on("receive-code-change", (message) => {
      setCodeText(message.code);
    });

    newSocket.on("receive-left-room", (userLeft) => {
      toast({
        title: `${userLeft} Left Collab-Space`,
        description: `${userLeft} has left the Collab-Space now`,
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });

      setTimeout(getActiveUsers);
    });

    newSocket.on("lang-change", (changedLang, changedByUser) => {
      console.log(
        `Received language change to ${changedLang.name} from ${changedByUser}`
      );

      // Always update the language (remove conditional check)
      setLang(changedLang);

      toast({
        title: `Language Changed`,
        description: `${changedByUser} changed language to ${changedLang.name}`,
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    });

    return () => {
      newSocket.emit(
        "send-left-room",
        currentUser.name,
        codeText,
        lang,
        currentUser.id
      );
      newSocket.disconnect();
    };
  }, []);

  return (
    <>
      <div className="w-screen h-screen flex">
        {/* Sidebar container with fixed width and independent scrolling */}
        <div className="w-1/5 h-screen flex-shrink-0 border-r">
          <SideBar
            members={Array.isArray(activeUsers) ? activeUsers : []}
            langChange={handleLangChange}
            onSave={handleSaveSpace}
            spaceName={spaceName}
            setSpaceName={setSpaceName}
            collabId={params.collabId}
            className="h-full"
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 h-screen flex flex-col">
          {/* Code editor takes most of the space */}
          <div className="flex-1 overflow-hidden relative">
            {/* Floating toggle button - top right corner */}
            <button
              onClick={() => setUseSimpleEditor(!useSimpleEditor)}
              className="absolute top-4 right-4 z-50 px-3 py-1 bg-gray-700/90 hover:bg-gray-600/90 text-white rounded-md text-xs font-medium shadow-lg backdrop-blur-sm border border-gray-600/50 transition-all duration-200 hover:scale-105"
              title={useSimpleEditor ? "Switch to Monaco Editor" : "Switch to Simple Editor"}
            >
              {useSimpleEditor ? "Monaco" : "Simple"}
            </button>
            
            {useSimpleEditor ? (
              <SimpleEditor
                value={codeText}
                lang={lang.name}
                onChange={(e: string) => {
                  setCodeText(e);
                  emitCodeChange(e);
                }}
              />
            ) : (
              <CodeEditor
                value={codeText}
                lang={lang.name}
                onChange={(e: any) => {
                  setCodeText(e);
                  emitCodeChange(e);
                }}
              />
            )}
          </div>

          {/* Output terminal at the bottom with fixed height */}
          <div className="h-1/4 p-4 overflow-auto border-t">
            <OutputTerminal output={output} />
          </div>
        </div>
      </div>
    </>
  );
}
