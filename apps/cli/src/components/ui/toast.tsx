import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { EmptyBorder } from "./border";

import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

export type ToastOptions = {
  title?: string;
  message: string;
  variant: "info" | "success" | "warning" | "error";
  duration: number;
};

type ToastInput = Omit<ToastOptions, "duration"> & { duration?: number };

interface ToastContextValue {
  show: (options: ToastInput) => void;
  error: (err: unknown) => void;
  currentToast: ToastOptions | null;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
  const [timeoutHandle, setTimeoutHandle] = useState<NodeJS.Timeout | null>(
    null,
  );

  const show = useCallback(
    (options: ToastInput) => {
      const toastOptions = { ...options, duration: options.duration ?? 5000 };
      setCurrentToast(toastOptions);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      const handle = setTimeout(() => {
        setCurrentToast(null);
      }, toastOptions.duration);
      setTimeoutHandle(handle);
    },
    [timeoutHandle],
  );

  const error = useCallback(
    (err: unknown) => {
      if (err instanceof Error) {
        show({ variant: "error", message: err.message });
      } else {
        show({ variant: "error", message: "An unknown error has occurred" });
      }
    },
    [show],
  );

  useEffect(() => {
    return () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [timeoutHandle]);

  return (
    <ToastContext.Provider value={{ show, error, currentToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return value;
}

export function Toast() {
  const toast = useToast();
  const dimensions = useTerminalDimensions();

  if (!toast.currentToast) return null;

  const current = toast.currentToast;
  const variantColor =
    current.variant === "info"
      ? theme.info
      : current.variant === "success"
        ? theme.success
        : current.variant === "warning"
          ? theme.warning
          : theme.danger;

  return (
    <box
      position="absolute"
      justifyContent="center"
      alignItems="flex-start"
      top={2}
      right={2}
      maxWidth={Math.min(60, dimensions.width - 6)}
      paddingLeft={2}
      paddingRight={2}
      paddingTop={1}
      paddingBottom={1}
      backgroundColor={theme.background.surface}
      borderColor={variantColor}
      border={["left", "right"]}
      customBorderChars={{ ...EmptyBorder, vertical: "┃" }}
    >
      {current.title && (
        <text
          attributes={TextAttributes.BOLD}
          marginBottom={1}
          fg={theme.text.primary}
        >
          {current.title}
        </text>
      )}
      <text fg={theme.text.primary} wrapMode="word" width="100%">
        {current.message}
      </text>
    </box>
  );
}
