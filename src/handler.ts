import { Router } from "itty-router";
import { AuthorizedRequest, User, Request } from "./global";
import {
  checkAuth,
  validateEmail,
  generateUniqueHash,
} from "./utils";
import jwt from "@tsndr/cloudflare-worker-jwt";
const router = Router({ base: "/" });
const authRouter = Router({ base: "/auth/" });
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

authRouter.post("signup", async (request: Request) => {
  // Validating the request
  const { email, password }: { email: string; password: string } =
    await (request.json ? request.json() : Promise.resolve(null));
  if (!validateEmail(email)) {
    return new Response(`Email Invalid or Dangerous`, {
      status: 406,
    });
  }
  if (await USERS.get(email)) {
    return new Response(`Account Taken`, { status: 400 });
  }
  // Creating User
  const userInit = {
    password,
    documents: {},
  };
  await USERS.put(email, JSON.stringify(userInit)); // Await fixes creation issue
  return new Response("Account Created", { status: 200 });
});

authRouter.post("login", async (request: Request) => {
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
        user: email,
        exp: Date.now() / 1000 + 30 * 60 * 60, // 30 Hour JWT expiry
      };
      const accessToken = await jwt.sign(payload, JWT_SECRET_KEY);
      return new Response(accessToken);
    } else {
      return new Response(`Incorrect Password`, { status: 409 });
    }
  } else {
    return new Response(`User Does Not Exist`, { status: 409 });
  }
});

authRouter.get("check", checkAuth, (request: AuthorizedRequest) => {
  if(request.auth) {
    return new Response("Authorized");
  } else {
    return new Response("Not Authorized");
  }
})

router.get("view/:hash", async (request: Request) => {
  // @ts-ignore
  const hash = request.params.hash;
  const fetched_doc = await DOCS.get(hash);
  if (!fetched_doc)
    return new Response("Document Does Not Exist!", { status: 404 });
  const doc: Document = JSON.parse(fetched_doc);
  const content: string = doc.content;
  return new Response(content);
});

router.get("edit/:hash", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth) return new Response('Not Authorized', { status: 401 });
  // Check for auth, send over document
  const hash = (request.params ? request.params.hash : "Null Placeholder");
  const fetched_doc = await DOCS.get(hash);
  console.log({fetched_doc})
  if (!fetched_doc) {
    return new Response("Document Does Not Exist!", { status: 404 });
  }
  return new Response(fetched_doc);
});

router.post("save/:hash", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth) return new Response('Not Authorized', { status: 401 });
  // Check for auth, save document
  const hash = request.params!.hash;
  const [content, fetched_doc] = await Promise.all([(request.text ? request.text() : Promise.resolve(null)), DOCS.get(hash)])
  if (!fetched_doc) {
    return new Response("Document Does Not Exist!", { status: 404 });
  }
  let new_doc = JSON.parse(fetched_doc);
  new_doc.content = content;
  await DOCS.put(hash, JSON.stringify(new_doc)); // Await fixes saving issue
  return new Response('Saved');
});

router.post("new-doc", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth) return new Response('Not Authorized', { status: 401 });
  const req = request.json ? await request.json() : null;
  const hash = generateUniqueHash();
  let content = "";
  if(req.content) content = req.content;
  if(!request.user) return new Response("User not identifiable from token"), { status: 401 };
  const document = new Document("Untitled Document", request.user, hash, content);
  await DOCS.put(hash, JSON.stringify(document)); // Await fixes creation issue
  return new Response(JSON.stringify(document));
});

router.get(
  "user-docs/:user/:num",
  checkAuth,
  async (request: AuthorizedRequest) => {
    if (!request.auth) return new Response('Not Authorized', { status: 401 });
    let user_hash = (request.user ?? (request.params ? request.params.user : null))
    const limit = (request.params ? Number(request.params.limit) : 10);
    const userGetter = async function (): Promise<User | null> {
      let kv: string | null = null;
      if (user_hash) {
        kv = await USERS.get(user_hash);
      }
      if (kv) {
        return JSON.parse(kv);
      } else {
        return null;
      }
    };
    const user = await userGetter();
    if (!user)
      return new Response("User Does Not Exist", { status: 400 });
    let user_documents = user.opened_documents;
    user_documents = user_documents.slice(0, limit);
    let ordered_documents: Array<{ title: string, hash: string, created: Date } | null> = [];
    for (let i = 0; i < user_documents.length; i++) {
      const fetched_doc = await DOCS.get(user_documents[i]);
      if (fetched_doc) {
        const doc: Document = JSON.parse(fetched_doc);
        const relevant_information = {
          title: doc.title,
          hash: doc.__hash,
          created: doc.created,
        }
        ordered_documents.push(relevant_information);
      } else {
        console.log("Document not found or null");
        ordered_documents.push(null);
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
