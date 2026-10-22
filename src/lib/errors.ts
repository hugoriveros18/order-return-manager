export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
    public retryAfterSeconds?: number,
  ) {
    super(message);
  }
}
export const missing = () =>
  new DomainError('RESOURCE_NOT_FOUND', 'This resource is not available.', 404);
