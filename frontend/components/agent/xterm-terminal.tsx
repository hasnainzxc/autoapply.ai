"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export interface XtermTerminalHandle {
  write: (data: string) => void;
  clear: () => void;
  scrollToBottom: () => void;
}

interface XtermTerminalProps {
  className?: string;
}

export const XtermTerminal = forwardRef<XtermTerminalHandle, XtermTerminalProps>(
  function XtermTerminal({ className = "" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        terminalRef.current?.write(data);
      },
      clear: () => {
        terminalRef.current?.clear();
      },
      scrollToBottom: () => {
        terminalRef.current?.scrollToBottom();
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;

      const terminal = new Terminal({
        theme: {
          background: "#0A0A0A",
          foreground: "#E4E2DD",
          cursor: "#FACC15",
          selectionBackground: "rgba(250, 204, 21, 0.3)",
          black: "#000000",
          red: "#E06C75",
          green: "#98C379",
          yellow: "#FACC15",
          blue: "#61AFEF",
          magenta: "#C678DD",
          cyan: "#56B6C2",
          white: "#ABB2BF",
          brightBlack: "#5C6370",
          brightRed: "#E06C75",
          brightGreen: "#98C379",
          brightYellow: "#FACC15",
          brightBlue: "#61AFEF",
          brightMagenta: "#C678DD",
          brightCyan: "#56B6C2",
          brightWhite: "#FFFFFF",
        },
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: "bar",
        allowTransparency: false,
        rows: 24,
        cols: 80,
      });

      terminal.loadAddon(fitAddon);
      terminal.open(containerRef.current);

      terminal.write("OpenCode Career-Ops Agent Terminal\x1b[0m\r\n");
      terminal.write("\x1b[2mWaiting for command...\x1b[0m\r\n");

      terminalRef.current = terminal;

      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
        } catch {
          // container may be hidden
        }
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
        terminal.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
      };
    }, []);

    useEffect(() => {
      const handler = () => {
        try {
          fitAddonRef.current?.fit();
        } catch {
          // noop
        }
      };
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);

    return (
      <div
        ref={containerRef}
        className={`w-full h-full min-h-[300px] bg-[#0A0A0A] rounded-lg overflow-hidden ${className}`}
      />
    );
  }
);
