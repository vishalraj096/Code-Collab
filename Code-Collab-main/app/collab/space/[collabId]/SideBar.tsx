"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RenameDialog } from "@/components/RenameDialog";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Code2,
  Play,
  UserRoundCog,
  LogOut,
  PanelRight,
  Save,
  Download,
  User2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { useRecoilState } from "recoil";
import { codeLang } from "@/app/states/codeLang";
import { CodeResult, codeResultStatus } from "@/app/states/codeResult";
import { CodeContent } from "@/app/states/codeContent";
import useCodeRun from "./codeRun";
import { useToast } from "@/hooks/use-toast";

import { SidePanel } from "@/components/sidepanel";

export const langArray = [
  { name: "javaScript", val: "js", icon: "🟨" },
  { name: "python", val: "py", icon: "🐍" },
  { name: "c", val: "c", icon: "🔧" },
  { name: "rust", val: "rs", icon: "🦀" },
  { name: "java", val: "java", icon: "☕" },
];

export const langVersions = {
  js: "18.15.0",
  py: "3.10.0",
  c: "10.2.0",
  rs: "1.68.2",
  java: "15.0.2",
};

export default function SideBar({
  members,
  langChange,
  onSave,
  collabId,
  spaceName,
  setSpaceName,
  className = "",
}: {
  members: string[];
  langChange: () => void;
  onSave: (customName?: string) => void; // Updated signature
  collabId: string;
  spaceName: string;
  setSpaceName: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}) {
  const [lang, setLang] = useRecoilState(codeLang);
  const { handleCodeRun } = useCodeRun();
  const [isRunning, setRunning] = useRecoilState(codeResultStatus);
  const [codeText] = useRecoilState(CodeContent);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const { toast } = useToast();
  const [isNameLoaded, setIsNameLoaded] = useState(false);

  useEffect(() => {
    setIsNameLoaded(true);
  }, [spaceName]);

  // const [spaceName, setSpaceName] = useState("Untitled Space");

  useEffect(() => {
    const fetchSpaceName = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URI}/collab/getSpace/${collabId}`
        );
        if (response.data && response.data.name) {
          setSpaceName(response.data.name);
        }
      } catch (error) {
        // handle error
      }
    };
    fetchSpaceName();
  }, [collabId]);

  useEffect(() => {
    const fetchSpaceName = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URI}/collab/getSpace/${collabId}`
        );
        if (response.data && response.data.name) {
          setSpaceName(response.data.name);
        }
        setIsNameLoaded(true); // Mark as loaded regardless of result
      } catch (error) {
        console.error("Error fetching space name:", error);
        setIsNameLoaded(true); // Mark as loaded even on error
      }
    };

    if (collabId) {
      fetchSpaceName();
    }
  }, [collabId]);

  const handleSave = () => {
    // Implement save functionality here
    console.log("Save button clicked");
    onSave();
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([codeText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);

    const safeFileName = spaceName
      ? spaceName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "untitled_code";

    element.download = `${safeFileName}.${lang.val}`;

    document.body.appendChild(element);
    element.click();
    toast({
      title: `Downloading ${safeFileName}.${lang.val}`,
    });
  };

  const renderToggleButton = (handleToggle: () => void) => (
    <TooltipProvider>
      <div className="flex w-full">
        <div className="w-4/5 flex justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleToggle}>
                <PanelRight className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPanelOpen ? "Close Sidebar" : "Open Sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="w-1/5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCodeRun}
                disabled={isRunning}
              >
                <Play className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRunning ? "Running..." : "Run Code"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <>
      <SidePanel
        panelOpen={isPanelOpen}
        handlePanelOpen={() => setIsPanelOpen(!isPanelOpen)}
        renderButton={renderToggleButton}
        className={`w-72 max-w-sm shadow-lg border-l ${className}`}
      >
        {isPanelOpen && (
          <div className="flex flex-col h-full">
            {isNameLoaded ? (
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{spaceName}</h2>
                <RenameDialog
                  collabId={collabId}
                  currentName={spaceName}
                  onSuccess={(newName) => setSpaceName(newName)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Loading...</h2>
              </div>
            )}
            <div className="mb-6 flex items-center justify-between px-4">
              <TooltipProvider>
                <Tooltip>
                  {/* <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserRoundCog className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger> */}
                  <TooltipContent>Workspace Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="mb-6 space-y-2 px-4">
              <div className="flex items-center space-x-2">
                <Code2 className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-semibold">Selection</h2>
              </div>
              <Select
                value={lang.name}
                onValueChange={(selectedLang) => {
                  const selectedLangObj = langArray.find(
                    (l) => l.name === selectedLang
                  );
                  if (selectedLangObj) {
                    langChange();
                    setLang(selectedLangObj);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Language">
                    <div className="flex items-center">
                      <span className="mr-2">
                        {langArray.find((l) => l.name === lang.name)?.icon ||
                          "🟨"}
                      </span>
                      {lang.name}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {langArray.map((elem) => (
                    <SelectItem key={elem.val} value={elem.name}>
                      <div className="flex items-center">
                        <span className="mr-2">{elem.icon}</span>
                        {elem.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-2" />

            <div className="flex-grow overflow-auto px-4 space-y-4">
              <div className="flex items-center space-x-2 my-2">
                <User2 className="w-6 h-6 text-primary" />
                <h2 className="text-base text-muted-foreground">
                  Active Members (
                  {Array.isArray(members) ? members.filter((m) => m).length : 0}
                  )
                </h2>
              </div>

              <div className="space-y-4">
                {Array.isArray(members) ? (
                  members.map((member) =>
                    member ? (
                      <div key={member} className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              member || "Guest"
                            )}&background=random`}
                          />
                          <AvatarFallback>
                            {member && member.length > 0
                              ? member[0].toUpperCase()
                              : "G"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {member || "Guest User"}
                        </span>
                      </div>
                    ) : null
                  )
                ) : (
                  <div>No active members</div>
                )}
              </div>
            </div>

            <div className="mt-auto p-4 space-y-2">
              <Button variant="ghost" className="w-full" onClick={handleSave}>
                <Save className="mr-2 w-4 h-4" />
                Save
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleDownload}
              >
                <Download className="mr-2 w-4 h-4" />
                Download
              </Button>
              <Link href="/dashboard" className="w-full block mt-4">
                <Button variant="destructive" className="w-full">
                  <LogOut className="mr-2 w-4 h-4" />
                  Leave CollabSpace
                </Button>
              </Link>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
}
