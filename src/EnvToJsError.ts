export class EnvToJsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvToJsError';
    Object.setPrototypeOf(this, EnvToJsError.prototype);
  }
}
