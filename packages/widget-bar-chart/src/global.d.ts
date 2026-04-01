export {};

declare global {
  interface Window {
    openai?: {
      callTool?: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<unknown>;
      toolOutput?: unknown;
    };
  }
}
