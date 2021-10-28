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

interface Request extends itty_request { 
  headers: Headers,
  cf: IncomingRequestCfProperties
}
/* eslint-enable */

export const JWT_SECRET_KEY = "bc955884459d4b0d5d48bcf4029a8870b25145a69f39787a6e7f5056e4b4acc0761cf115b31a69bff8cee86997cd11c8d71981fa4beb3ebcb3cada5c8027537c";
export const JWT_SECRET_REFRESH_KEY = "b31187c73507fc281793f9a8ce3a9450103fd0340704c6dd402f54f80436fde853324fa3d0a8b464e8847d6207c2ed4a057479ace211e5db3b8f5edec27fae36";
