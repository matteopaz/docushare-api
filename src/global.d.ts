/* eslint-disable no-alert, no-console */
import { Request } from "itty-router";

interface LooseObject {
  [key: string]: any;
}

interface AuthorizedRequest extends Request {
  auth: boolean;
}

interface User {
  password: string;
  documents: string[]; // Hashes of owned docs, most recently created at the top
  opened_documents: string[]; // Hashes of viewed docs, most recently viewed at the top
}

// interface __Document {
//   title: string,
//   owned: string,
//   editors: Array<string>,
//   created: Date,
//   lastOpened: Date,
//   viewedBy: Array<string>,
//   content: Blob,
//   constructor(): void
// }

/* eslint-disable */
declare global {
  const USERS: KVNamespace;
  const DOCS: KVNamespace;
}
/* eslint-enable */
