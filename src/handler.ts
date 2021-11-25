import { Router } from "itty-router";
import {
  Request,
  AuthorizedRequest,
  PROD_ORIGIN,
  STAGING_ORIGIN,
} from "./global.d";
import { Document, CORSResponse, User } from "./Declarations";
import { checkAuth, validateEmail, generateUniqueHash } from "./utils";
import jwt from "@tsndr/cloudflare-worker-jwt";
const router = Router({ base: "/" });
const authRouter = Router({ base: "/auth/" });

// AUTH ROUTER BEGIN ---------
authRouter.post("signup", async (request: Request) => {
  // Validating the request
  const { email, password }: { email: string; password: string } =
    await (request.json
      ? request.json()
      : Promise.resolve({ email: null, password: null }));
  if (!email || !password) {
    return new CORSResponse(
      request,
      "Please include a valid JSON body with email and password.",
      { status: 400 }
    );
  }
  if (!validateEmail(email)) {
    return new CORSResponse(request, `Email Invalid or Dangerous`, {
      status: 406,
    });
  }
  if (await USERS.get(email)) {
    return new CORSResponse(request, `Username Taken`, { status: 400 });
  }
  await USERS.put(email, JSON.stringify(new User(email, password))); // Await fixes creation issue
  return new CORSResponse(request, "Account Created", { status: 200 });
});

authRouter.post("login", async (request: Request) => {
  let { email, password }: { email: string; password: string } =
    await (request.json ? request.json() : Promise.resolve(null));
  if (!validateEmail(email)) {
    return new CORSResponse(request, `Email Invalid or Dangerous`, {
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
      let domain = "";
      if (ENV === "dev") {
        let dev_origin = request.headers.get("origin");
        if (dev_origin) {
          dev_origin = dev_origin.replace(/^https?:\/\//, "");
          const split = dev_origin.split(":");
          dev_origin = split[0];
        }
        domain = "Domain=" + dev_origin + ";";
      } else {
        domain =
          ENV === "prod"
            ? `Domain=${PROD_ORIGIN};`
            : ENV === "staging"
            ? `Domain=${STAGING_ORIGIN};`
            : ""; // Should never happen, just in case
      }
      return new CORSResponse(request, "Success", {
        headers: {
          "Set-Cookie": `Authentication=Bearer ${accessToken};Max-Age=86400;${domain}Path=/;HttpOnly`,
        },
      });
    } else {
      return new CORSResponse(request, `Incorrect Password`, { status: 409 });
    }
  } else {
    return new CORSResponse(request, `User Does Not Exist`, { status: 409 });
  }
});

authRouter.get("check", checkAuth, (request: AuthorizedRequest) => {
  if (request.auth) {
    return new CORSResponse(request, "Authorized");
  } else {
    return new CORSResponse(request, "Not Authorized", { status: 401 });
  }
});

// AUTH ROUTER END ---------

// ROUTER BEGIN ---------

router.get("view/:hash", async (request: Request) => {
  const hash = request.params!.hash;
  const fetched_doc = await DOCS.get(hash);
  if (!fetched_doc)
    return new CORSResponse(request, "Document Does Not Exist!", {
      status: 404,
    });
  const doc: Document = JSON.parse(fetched_doc);
  doc.viewed++;
  await DOCS.put(hash, JSON.stringify(doc));
  const content: string = doc.content;
  const title = doc.title;
  const created = doc.created;
  return new CORSResponse(request, JSON.stringify({ title, content, created }));
});

router.get("edit/:hash", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth)
    return new CORSResponse(request, "Not Authorized", { status: 401 });
  const hash = request.params ? request.params.hash : "Null Placeholder";
  if (!request.user) request.user = "Null Placeholder";
  const [fetched_user, fetched_doc] = await Promise.all([
    USERS.get(request.user),
    DOCS.get(hash),
  ]);
  if (!fetched_doc) {
    return new CORSResponse(request, "Document Does Not Exist!", {
      status: 404,
    });
  }
  const user: User = JSON.parse(fetched_user ?? "null");
  const doc: Document = JSON.parse(fetched_doc);
  user.opened_documents.forEach((doc_hash, index) => {
    if (doc_hash === hash) {
      user.opened_documents.splice(index, 1);
    }
  });
  user.opened_documents = [hash, ...user.opened_documents];
  if (user.opened_documents.length > 50) {
    user.opened_documents.pop();
  }
  await USERS.put(request.user, JSON.stringify(user));
  if (!doc.editors.find((str) => str === request.user)) {
    return new CORSResponse(
      request,
      "You are not an editor of this document!",
      {
        status: 401,
      }
    );
  }
  return new CORSResponse(request, fetched_doc);
});

router.post("save/:hash", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth)
    return new CORSResponse(request, "Not Authorized", { status: 401 });
  const hash = request.params!.hash;
  const [body, fetched_doc] = await Promise.all([
    request.json ? request.json() : Promise.resolve(null),
    DOCS.get(hash),
  ]);
  if (!fetched_doc) {
    return new CORSResponse(request, "Document Does Not Exist!", {
      status: 404,
    });
  }
  let new_doc: Document = JSON.parse(fetched_doc);
  if (!new_doc.editors.find((str) => str === request.user)) {
    return new CORSResponse(
      request,
      "You are not an editor of this document!",
      {
        status: 401,
      }
    );
  }
  if (body.content) {
    new_doc.content = body.content;
  }
  if (body.title) {
    new_doc.title = body.title;
  }
  if (body.editors) {
    new_doc.editors = body.editors;
  }
  await DOCS.put(hash, JSON.stringify(new_doc)); // Await fixes saving issue
  return new CORSResponse(request, "Saved");
});

router.post("new-doc", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth)
    return new CORSResponse(request, "Not Authorized", { status: 401 });
  const fetched_user = await USERS.get(request.user ?? "Null Placeholder");
  const user: User = JSON.parse(fetched_user ?? "null");
  if (user.documents.length >= 50) {
    return new CORSResponse(
      request,
      "You have reached the maximum number of documents!",
      { status: 405 }
    );
  }
  const req = request.json ? await request.json() : null;
  const hash = generateUniqueHash();
  let content = "";
  if (req.content) content = req.content;
  if (!request.user)
    return (
      new CORSResponse(request, "User not identifiable from token"),
      { status: 401 }
    );
  const document = new Document(
    "Untitled Document",
    request.user,
    hash,
    content
  );
  await DOCS.put(hash, JSON.stringify(document)); // Await fixes creation issue
  return new CORSResponse(request, JSON.stringify(document));
});

router.get("user-docs/:num", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth)
    return new CORSResponse(request, "Not Authorized", { status: 401 });
  let user_hash = request.user;
  const limit = request.params ? Number(request.params.num) : 10;
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
    return new CORSResponse(request, "User Does Not Exist", { status: 400 });
  let user_documents = user.opened_documents;
  user_documents = user_documents.slice(0, limit);
  let ordered_documents: Array<{
    title: string;
    hash: string;
    created: Date;
  } | null> = [];
  for (let i = 0; i < user_documents.length; i++) {
    const fetched_doc = await DOCS.get(user_documents[i]);
    if (fetched_doc) {
      const doc: Document = JSON.parse(fetched_doc);
      const relevant_information = {
        title: doc.title,
        hash: doc.__hash,
        created: doc.created,
        owned: doc.owned,
      };
      ordered_documents.push(relevant_information);
    } else {
      ordered_documents.push(null);
    }
  }
  return new CORSResponse(request, JSON.stringify(ordered_documents));
});

// ROUTER END ---------

// Server management

router.all("auth/*", authRouter.handle); // Redirects all auth requests to authRouter from parent

router.all("*", async (request: Request) => {
  return new CORSResponse(request, `400 Bad Request`, { status: 400 }); // Catches all other requests
});

export default {
  fetch: router.handle, // export the router as a fetch function for use in index.ts
};
