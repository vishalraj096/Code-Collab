"use client";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { userState } from "@/app/states/userState";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { RenameDialog } from "@/components/RenameDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Code2, PlusCircle, Trash2 } from "lucide-react";

interface CollabSpace {
  _id: string;
  collabId: string;
  name: string;
  language: { name: string; val: string };
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [currentUser] = useRecoilState(userState);
  const [collabSpaces, setCollabSpaces] = useState<CollabSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser.name || !currentUser.id) {
      router.push("/auth/login");
      return;
    }

    // Fetch user's collab spaces
    const fetchCollabSpaces = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URI}/collab/getUserSpaces/${currentUser.id}`
        );
        setCollabSpaces(response.data);
      } catch (error) {
        console.error("Failed to fetch collab spaces:", error);
        toast({
          title: "Error",
          description: "Failed to load your collaboration spaces.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollabSpaces();
  }, [currentUser, router, toast]);

  const handleDelete = async (collabId: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URI}/collab/deleteSpace/${collabId}`
      );

      // Update the list after deletion
      setCollabSpaces((spaces) =>
        spaces.filter((space) => space.collabId !== collabId)
      );

      toast({
        title: "Success",
        description: "Collaboration space deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete collab space:", error);
      toast({
        title: "Error",
        description: "Failed to delete the collaboration space.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "numeric",
        year: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Collaboration Spaces</h1>
        <div className="flex gap-2">
          <Link href={`/collab/create/${currentUser.name}`}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Space
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">Loading your collaboration spaces...</div>
      ) : collabSpaces.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg mb-4">
            You don't have any collaboration spaces yet.
          </p>
          <Link href={`/collab/create/${currentUser.name}`}>
            <Button>Create Your First Space</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collabSpaces.map((space) => (
            <Card key={space.collabId} className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{space.name}</CardTitle>
                    <CardDescription>
                      Language: {space.language.name}
                    </CardDescription>
                  </div>
                  <RenameDialog
                    collabId={space.collabId}
                    currentName={space.name}
                    onSuccess={(newName) => {
                      setCollabSpaces((spaces) =>
                        spaces.map((s) =>
                          s.collabId === space.collabId
                            ? { ...s, name: newName }
                            : s
                        )
                      );
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Created: {formatDate(space.createdAt)}</span>
                  <span>Last modified: {formatDate(space.updatedAt)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleDelete(space.collabId)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Link href={`/collab/space/${space.collabId}`}>
                  <Button>
                    <Code2 className="mr-2 h-4 w-4" />
                    Open Space
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
