export interface ProjectFileRef {
  fileId: number;
  filename: string;
  mimeType: string;
  contentText: string;
  dropped?: { reason: 'budget' };
}

export interface ResolveForLlmInput {
  projectId: number;
  chatId: number;
  userMessage: string;
}

export interface ProjectFileAccess {
  resolveForLlm(input: ResolveForLlmInput): Promise<ProjectFileRef[]>;
}
