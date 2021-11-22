import { PROD_ORIGIN, STAGING_ORIGIN } from './global.d';

class CORSResponse extends Response {
  constructor(...props: any) {
    super(...props);
    if (ENV === "prod") {
      this.headers.set("Access-Control-Allow-Origin", PROD_ORIGIN);
    } else if (ENV === "staging") {
      this.headers.set("Access-Control-Allow-Origin", STAGING_ORIGIN);
    } else if (ENV === "dev") {
      this.headers.set("Access-Control-Allow-Origin", "*");
    }
  }
}

class Document {
  __hash: Readonly<string>;
  title: string;
  owned: Readonly<string>;
  editors: Array<string>;
  created: Readonly<Date>;
  viewed: number;
  content: string;
  constructor(
    title: string,
    creator: string,
    hash: string,
    content: string = ""
  ) {
    this.__hash = hash;
    this.title = title;
    this.editors = [creator];
    this.viewed = 1;
    this.owned = creator;
    this.content = content;
    this.created = new Date();
  }
}

class User {
    email: string;
    password: string;
    documents: string[]; // Hashes of owned docs, most recently created at the top
    opened_documents: string[]; // Hashes of viewed docs, most recently viewed at the top
    constructor(email: string, password: string) {
        this.password = password;
        this.documents = [];
        this.opened_documents = [];
        this.email = email;
    }
}

export { CORSResponse, Document, User };
