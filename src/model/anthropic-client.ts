export interface ModelClient {
  completeJson<T>(prompt: { system: string; user: string }, label?: string): Promise<T>;
}

export class StubModelClient implements ModelClient {
  constructor(private readonly responder: (prompt: { system: string; user: string }) => unknown) {}

  async completeJson<T>(prompt: { system: string; user: string }, _label?: string): Promise<T> {
    return this.responder(prompt) as T;
  }
}
