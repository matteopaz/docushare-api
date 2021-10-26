import { Request, Router } from "itty-router";
import { AuthorizedRequest, User } from "./global";
import { checkAuth, gotoLogin, validateEmail, generateUniqueHash } from "./utils";
const jose = require("node-jose");
const router = Router({ base: "/" });
const authRouter = Router({ base: "/auth/" });
const keystore = jose.JWK.createKeyStore();
keystore.add({ JWT_SECRET_KEY: process.env.JWT_SECRET_KEY });
keystore.add({ JWT_SECRET_REFRESH_KEY: process.env.JWT_SECRET_REFRESH_KEY });

class Document {
  __hash: Readonly<string>;
  title: string;
  owned: Readonly<string>;
  editors: Array<string>;
  created: Readonly<Date> = new Date();
  lastOpened = this.created;
  viewedBy: Array<string>;
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
    this.viewedBy = [creator];
    this.owned = creator;
    this.content = content;
  }
}

authRouter.post("signup", async (request) => {
  // Validating the request
  const { email, password }: { email: string; password: string } =
    await (request.json ? request.json() : Promise.resolve(null));
  if (!validateEmail(email)) {
    return new Response(`Email Invalid or Dangerous`, {
      status: 406,
    });
  }
  if (await USERS.get(email)) {
    return new Response(`Account Taken`, { status: 409 });
  }
  // Creating User
  const userInit = {
    password,
    documents: {},
  };
  USERS.put(email, JSON.stringify(userInit));
  return new Response("Account Created", { status: 201 });
});

authRouter.post("login", async (request) => {
  let { email, password }: { email: string; password: string } =
    await (request.json ? request.json() : Promise.resolve(null));
  if (!validateEmail(email)) {
    return new Response(`Email Invalid or Dangerous`, {
      status: 406,
    });
  }
  const get_user = async (): Promise<User | null> => {
    const fetched: string | null = await USERS.get(email);
    if (fetched) {
      const user: User = JSON.parse(fetched);
      return user;
    } else {
      return null;
    }
  };
  const user = await get_user();
  if (user) {
    if (user.password === password) {
      // Sign a JWT and hand it to the user
      const payload = {
        user: email
      }
      // @ts-ignore for secret
      const key = new Uint8Array(process.env.JWT_SECRET_KEY)
      const accessToken = new SignJWT(payload)
      .setExpirationTime('1d')
      .sign(key);
      if(!accessToken) throw new Error("Could not sign JWT");
      return new Response(JSON.stringify({ accessToken }));
    } else {
      return new Response(`Incorrect Password`, { status: 409 });
    }
  } else {
    return new Response(`User Does Not Exist`, { status: 409 });
  }
});

router.get("view/:hash", async (request) => {
  const hash = request.params ? request.params.user : null;
  if(!hash) return new Response("How", { status: 400 });
  const fetched_doc = await DOCS.get(hash);
  if(!fetched_doc) return new Response('Document Does Not Exist!', { status: 404 });
  const doc: Document = JSON.parse(fetched_doc);
  const content: string = doc.content;
  return new Response(content);
});

router.post("edit/:hash", checkAuth, (request: AuthorizedRequest) => {
  if (!request.auth) return gotoLogin(new URL(request.url));
  // Sends document, opens a websocket for quicksaving
});

router.post("new-doc", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth) return gotoLogin(new URL(request.url));
  const req = request.json ? await request.json() : null;
  const hash = generateUniqueHash();
  const document = new Document("Untitled Document", req.user, hash, "");
  DOCS.put(hash, JSON.stringify(document));
  return new Response(JSON.stringify(document));
});

router.post(
  "user-docs/:user",
  checkAuth,
  async (request: AuthorizedRequest) => {
    if (!request.auth) {
      return new Response(
        "Sorry, you need to be logged in to see recent documents",
      {
        status: 406
      }
      );
    }
    const user_hash = request.params ? request.params.user : null;
    const userGetter = async function (): Promise<User | null> {
      let kv: string | null = null;
      if (user_hash) {
        const kv = await USERS.get(user_hash);
      }
      if (kv) {
        return JSON.parse(kv);
      } else {
        return null;
      }
    }
    const user = await userGetter();
    if (user === null)
      return new Response("User Does Not Exist", { status: 400 });
    let user_documents = user.opened_documents;
    user_documents = user_documents.slice(0, 7);
    let ordered_documents: Array<Document | null> = [];
    for(let i = 0; i < user_documents.length; i++) {
      const fetched_doc = await DOCS.get(user_documents[i]);
      if(fetched_doc) { 
        const doc: Document = JSON.parse(fetched_doc);
        ordered_documents.push(doc);
      } else {
        console.log("null document");
        ordered_documents.push(null)
      }
    }
    return new Response(JSON.stringify(ordered_documents));
  }
);

router.all("auth/*", authRouter.handle);

router.all("*", async (request) => {
  return new Response(`400 Bad Request`, { status: 400 });
});

export default {
  fetch: router.handle,
};
