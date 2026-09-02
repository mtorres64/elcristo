export type GetnetEnvironment = "sandbox" | "production";

export interface GetnetEnvCredentials {
  seller_id: string | null;
  client_id: string | null;
  // No hay masking con sentido para un client_secret: sólo se informa si hay
  // uno guardado, el backend nunca lo devuelve.
  client_secret_set: boolean;
  last_verified_at: string | null;
  last_verified_ok: boolean | null;
  last_verified_message: string | null;
}

export interface GetnetIntegration {
  enabled: boolean;
  active_environment: GetnetEnvironment;
  sandbox: GetnetEnvCredentials;
  production: GetnetEnvCredentials;
  updated_at: string | null;
}

export interface GetnetEnvCredentialsInput {
  seller_id: string;
  client_id: string;
  // undefined = mantener el client_secret ya guardado de ESE ambiente.
  client_secret?: string;
}

export interface GetnetIntegrationInput {
  enabled: boolean;
  active_environment: GetnetEnvironment;
  sandbox: GetnetEnvCredentialsInput;
  production: GetnetEnvCredentialsInput;
}

export interface GetnetTestConnectionResult {
  ok: boolean;
  message: string;
}

export interface GetnetPublicConfig {
  enabled: boolean;
  environment: GetnetEnvironment;
  seller_id: string | null;
}

export interface IntegrationTestResult {
  ok: boolean;
  message: string;
}

export interface EmailIntegration {
  enabled: boolean;
  host: string | null;
  port: number;
  username: string | null;
  from_email: string | null;
  use_tls: boolean;
  // El backend nunca devuelve la contraseña: sólo informa si hay una guardada.
  password_set: boolean;
  last_verified_at: string | null;
  last_verified_ok: boolean | null;
  last_verified_message: string | null;
  updated_at: string | null;
}

export interface EmailIntegrationInput {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  from_email: string;
  use_tls: boolean;
  // undefined = mantener la contraseña ya guardada.
  password?: string;
}
