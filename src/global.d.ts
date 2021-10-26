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

interface __Document {
  title: string,
  owned: string,
  editors: Array[string],
  created: Date,
  lastOpened: Date,
  viewedBy: Array[string],
  content: Blob
}

/* eslint-disable */
declare global {
  const USERS: KVNamespace;
}
/* eslint-enable */
