import { atom, useAtom } from "jotai";
import type {
  ChatMessage as ChatMessageType,
  ChatHistory,
  ChatHistorySnapshot,
} from "./types";

type AddMessageFn = (
  message: Omit<ChatMessageType, "id" | "timestamp">,
) => void;

const chatHistoryAtom = atom<ChatHistory>({
  messages: [],
  currentPrompt: "",
});

const chatHistoryUndoStackAtom = atom<ChatHistorySnapshot[]>([]);
const chatHistoryRedoStackAtom = atom<ChatHistorySnapshot[]>([]);

export const useChatAgent = () => {
  const [undoStack, setUndoStack] = useAtom(chatHistoryUndoStackAtom);
  const [redoStack, setRedoStack] = useAtom(chatHistoryRedoStackAtom);
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom);

  const addUserAndPendingAssistant = (
    content: string,
    addMessage: AddMessageFn,
  ) => {
    addMessage({
      type: "user",
      content,
    });

    addMessage({
      type: "assistant",
      content: "",
      isGenerating: true,
    });
  };

  const setAssistantError = (
    updateLastMessage: (updates: Partial<ChatMessageType>) => void,
    setError: (error: Error) => void,
    errorMessage: string,
  ) => {
    updateLastMessage({
      isGenerating: false,
      error: errorMessage,
    });
    setError(new Error(errorMessage));
  };

  const setAssistantContent = (
    updateLastMessage: (updates: Partial<ChatMessageType>) => void,
    content: string,
  ) => {
    updateLastMessage({
      isGenerating: false,
      content,
    });
  };

  const saveSnapshot = (
    ttdGeneration: { generatedResponse: string | null } | null,
  ) => {
    const snapshot: ChatHistorySnapshot = {
      messages: [...chatHistory.messages],
      currentPrompt: chatHistory.currentPrompt,
      generatedResponse: ttdGeneration?.generatedResponse || null,
      timestamp: new Date(),
    };

    setUndoStack((prev) => [...prev, snapshot]);
    setRedoStack(() => []);
  };

  const handleUndo = (
    ttdGeneration: { generatedResponse: string | null } | null,
  ) => {
    if (undoStack.length === 0) return;

    const currentSnapshot: ChatHistorySnapshot = {
      messages: [...chatHistory.messages],
      currentPrompt: chatHistory.currentPrompt,
      generatedResponse: ttdGeneration?.generatedResponse || null,
      timestamp: new Date(),
    };
    setRedoStack((prev) => [...prev, currentSnapshot]);

    const snapshotToRestore = undoStack[undoStack.length - 1];
    setChatHistory({
      messages: snapshotToRestore.messages,
      currentPrompt: snapshotToRestore.currentPrompt,
    });

    setUndoStack((prev) => prev.slice(0, -1));

    return snapshotToRestore;
  };

  const handleRedo = (
    ttdGeneration: { generatedResponse: string | null } | null,
  ) => {
    if (redoStack.length === 0) return;

    const currentSnapshot: ChatHistorySnapshot = {
      messages: [...chatHistory.messages],
      currentPrompt: chatHistory.currentPrompt,
      generatedResponse: ttdGeneration?.generatedResponse || null,
      timestamp: new Date(),
    };
    setUndoStack((prev) => [...prev, currentSnapshot]);

    const snapshotToRestore = redoStack[redoStack.length - 1];
    setChatHistory({
      messages: snapshotToRestore.messages,
      currentPrompt: snapshotToRestore.currentPrompt,
    });

    setRedoStack((prev) => prev.slice(0, -1));

    return snapshotToRestore;
  };

  return {
    addUserAndPendingAssistant,
    setAssistantError,
    setAssistantContent,
    saveSnapshot,
    chatHistory,
    handleUndo,
    handleRedo,
    canUndo:
      undoStack.length > 0 &&
      undoStack.some((snapshot) =>
        snapshot.messages.some(
          (msg) => msg.type === "assistant" && msg.content,
        ),
      ),
    canRedo:
      redoStack.length > 0 &&
      redoStack.some((snapshot) =>
        snapshot.messages.some(
          (msg) => msg.type === "assistant" && msg.content,
        ),
      ),
    setChatHistory,
  };
};
