/**
 * A domain-level error that carries the HTTP status code the caller should
 * return. Services throw this instead of HTTPException so they stay free of
 * HTTP-specific concerns; routers map it at the edge.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}