"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          style={{
            background: "none",
            border: "1px solid var(--dark-green-highlight)",
            borderRadius: 8,
            padding: 6,
            cursor: "pointer",
            color: "var(--light-gray)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sun style={{ width: 18, height: 18 }} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon style={{ width: 18, height: 18, position: "absolute" }} className="rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        style={{ backgroundColor: "var(--dark-green)", border: "1px solid var(--dark-green-highlight)" }}
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="font-display"
          style={{ color: "var(--light-gray)", cursor: "pointer" }}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="font-display"
          style={{ color: "var(--light-gray)", cursor: "pointer" }}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="font-display"
          style={{ color: "var(--light-gray)", cursor: "pointer" }}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
