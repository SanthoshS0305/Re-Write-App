"use client";

import { MoreVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Story } from "@/types/dashboard";

interface StoryActionsMenuProps {
  story: Story;
}

export function StoryActionsMenu({ story }: StoryActionsMenuProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete story");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !story.pinned }),
      });
      if (!response.ok) throw new Error("Failed to update pin state");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.preventDefault()}
          aria-label="Story options"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{ color: "var(--light-gray)" }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
      >
        <DropdownMenuItem
          onClick={(e) => e.stopPropagation()}
          onSelect={() => pinMutation.mutate()}
          style={{ color: "var(--light-gray)", fontFamily: "Joan, serif", cursor: "pointer" }}
        >
          {story.pinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              onSelect={(e) => e.preventDefault()}
              style={{ color: "#f87171", fontFamily: "Joan, serif", cursor: "pointer" }}
            >
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent
            style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-[24px]" style={{ color: "var(--light-gray)" }}>
                Delete Story
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: "var(--light-gray)", opacity: 0.7 }}>
                Are you sure you want to delete &ldquo;{story.title}&rdquo;? This will also delete all
                chapters. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="font-display rounded-[20px]"
                style={{ backgroundColor: "var(--dark-green-highlight)", color: "var(--light-gray)", border: "none" }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate();
                }}
                className="font-display rounded-[20px] border-[2px] border-black"
                style={{ backgroundColor: "#c0392b", color: "white" }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
