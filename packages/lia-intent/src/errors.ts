export class LiaIntentError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'LiaIntentError'
  }
}
export function requireCondition(value: unknown, code: string): asserts value {
  if (!value) throw new LiaIntentError(code)
}
