/* eslint-disable no-alert, no-console */
import { Request as itty_request } from "itty-router";

interface LooseObject {
  [key: string]: any;
}

interface AuthorizedRequest extends Request {
  auth: boolean;
  user?: string;
}

interface User {
  password: string;
  documents: string[]; // Hashes of owned docs, most recently created at the top
  opened_documents: string[]; // Hashes of viewed docs, most recently viewed at the top
}

declare global {
  const USERS: KVNamespace;
  const DOCS: KVNamespace;
  const JWT_SECRET_KEY: string; // Encrypted secret, defined during runtime by the CF server
  const ENV: "staging" | "dev" | "prod";
}

interface Request extends itty_request {
  headers: Headers;
  cf: IncomingRequestCfProperties;
}

export const PROD_ORIGIN = "asdf.jet"; // Production URL Origin
export const STAGING_ORIGIN = ""; // Staging URL Origin

