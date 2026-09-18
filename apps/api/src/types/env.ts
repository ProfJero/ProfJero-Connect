export interface Env {
  ENVIRONMENT: 'development' | 'staging' | 'production';
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
}

export interface AuthVariables {
  admin: import('@profjero/shared').Admin;
  requestId: string;
}