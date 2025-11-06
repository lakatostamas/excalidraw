import type {
  ChatMessage as ChatMessageType,
  ChatHistory,
  ChatHistorySnapshot,
} from "./types";

type AddMessageFn = (message: Omit<ChatMessageType, "id" | "timestamp">) => void;

export const useChatAgent = () => {
  const addUserAndPendingAssistant = (
    content: string,
    addMessage: AddMessageFn,
  ) => {
    // add user message
    addMessage({
      type: "user",
      content,
    });

    // add assistant placeholder while generating
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
    chatHistory: ChatHistory,
    ttdGeneration: { generatedResponse: string | null } | null,
    setUndoStack: (updater: (prev: ChatHistorySnapshot[]) => ChatHistorySnapshot[]) => void,
    setRedoStack: (updater: (prev: ChatHistorySnapshot[]) => ChatHistorySnapshot[]) => void,
  ) => {
    const snapshot: ChatHistorySnapshot = {
      messages: [...chatHistory.messages],
      currentPrompt: chatHistory.currentPrompt,
      generatedResponse: ttdGeneration?.generatedResponse || null,
      timestamp: new Date(),
    };

    setUndoStack((prev) => [...prev, snapshot]);
    // Clear redo stack for new action
    setRedoStack(() => []);
  };

  return {
    addUserAndPendingAssistant,
    setAssistantError,
    setAssistantContent,
    saveSnapshot,
  };
};


