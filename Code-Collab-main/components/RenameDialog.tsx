"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRecoilState } from "recoil";
import { userState } from "@/app/states/userState";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";

interface RenameDialogProps {
  collabId: string;
  currentName: string;
  onSuccess: (newName: string) => void;
}

export function RenameDialog({
  collabId,
  currentName,
  onSuccess,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentUser] = useRecoilState(userState);

  console.log("RenameDialog rendered with:", { collabId, currentName });

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleRename = async () => {
    console.log("Attempting to rename to:", name);
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending rename request for:", collabId);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URI}/collab/renameSpace/${collabId}`,
        { name }
      );

      console.log("Rename response:", response.data);

      toast({
        title: "Success",
        description: "Collaboration space renamed successfully",
      });

      onSuccess(name);
      setIsOpen(false);
    } catch (error) {
      console.error("Rename error:", error);

      // Use axios.isAxiosError to properly type-check
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status === 404
      ) {
        try {
          // Try to create the space first - use currentUser.id instead of localStorage
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URI}/collab/saveSpace`,
            {
              collabId,
              name,
              code: "",
              language: { name: "javascript", val: "js" },
              userId: currentUser.id, // Use the user ID from Recoil state
            }
          );

          // Then try renaming again
          const response = await axios.put(
            `${process.env.NEXT_PUBLIC_API_URI}/collab/renameSpace/${collabId}`,
            { name }
          );

          toast({
            title: "Success",
            description: "Collaboration space renamed successfully",
          });

          onSuccess(name);
          setIsOpen(false);
          return;
        } catch (saveError) {
          console.error("Failed to create and rename space:", saveError);
        }
      }

      toast({
        title: "Error",
        description: "Failed to rename the collaboration space",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-2">Rename</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Collab Space</DialogTitle>
          <DialogDescription>
            Enter a new name for your collaboration space.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleRename} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
