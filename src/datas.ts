export class ValidationResult {
  private success: boolean;
  private message: string;
  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
