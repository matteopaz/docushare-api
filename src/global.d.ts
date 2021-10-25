/* eslint-disable no-alert, no-console */
import { Request } from "itty-router";

interface LooseObject {
  [key: string]: any;
}

interface AuthorizedRequest extends Request {
  auth: boolean;
}

interface User {
  password: string,
  documents: {
    [key: string]: string
  }
}

/* eslint-disable */
declare global {
  const USERS: KVNamespace;
}
/* eslint-enable */
