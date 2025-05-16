"use client";
import { userState } from "@/app/states/userState";
import { useRecoilState } from "recoil";
import CodeEditor from "./Editor";
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

  const handleLangChange = () => {
    setIsLocalLangChange(true);
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

    newSocket.on("lang-change", (changedLang, changedByUser: string) => {
      if (changedLang.name !== lang.name) {
        setLang(changedLang);

        toast({
          title: `${changedByUser} has changed language to ${changedLang.name}`,
          action: <ToastAction altText="Try again">Dismiss</ToastAction>,
        });
      }
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
      <div className="w-screen h-screen">
        <div className="flex-grow flex relative m-2">
          <div className="w-1/5 h-full z-50 flex flex-col justify-between">
            <SideBar
              members={Array.isArray(activeUsers) ? activeUsers : []}
              langChange={handleLangChange}
              // onSave={() => handleSaveSpace()}
              onSave={handleSaveSpace}
              spaceName={spaceName}
              setSpaceName={setSpaceName}
              collabId={params.collabId}
              className="h-screen"
            />
            <div className="m-2 w-1/6 absolute bottom-0">
              <OutputTerminal output={output} />
            </div>
          </div>
          <div className="w-4/5 h-full">
            <CodeEditor
              value={codeText}
              lang={lang.name}
              onChange={(e: any) => {
                setCodeText(e);
                emitCodeChange(e);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
