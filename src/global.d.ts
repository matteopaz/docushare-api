/* eslint-disable no-alert, no-console */
import { Request as itty_request } from "itty-router";

interface LooseObject {
  [key: string]: any;
}

interface Request extends itty_request  {
  headers: Headers;
  cf: IncomingRequestCfProperties;
}

interface AuthorizedRequest extends Request {
  auth: boolean;
  user?: string;
}

declare global {
  const USERS: KVNamespace;
  const DOCS: KVNamespace;
  const JWT_SECRET_KEY: string; // Encrypted secret, defined during runtime by the CF server
  const ENV: "staging" | "dev" | "prod";
}

export const FRONTEND_PROD_ORIGIN = "https://docushare.matteopaz.me"; // Production URL Origin
export const FRONTEND_STAGING_ORIGIN = "https://docushare-lite.matteodev.workers.dev"; // Staging URL Origin
export const API_PROD_ORIGIN = "https://docushare-api.matteopaz.me"; // Production URL Origin
export const API_STAGING_ORIGIN = "https://docushare-api-staging.matteodev.workers.dev"; // Staging URL Origin

