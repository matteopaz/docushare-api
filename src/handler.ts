import { Request, Router } from "itty-router";
import { AuthorizedRequest, User, __Document } from "./global";
import { checkAuth, gotoLogin, validateEmail } from "./utils";

const router = Router({ base: "/" });
const authRouter = Router({ base: "/auth/" });

class Document implements __Document {
  constructor(title: string, creator: string, content?: string | Blob) {
    this.title = title;
    this.created = new Date();
    this.editors = [creator];
    this.viewedBy = [creator];
    this.lastOpened = this.created;
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
  if(!validateEmail(email)) {
    return new Response(`Email Invalid or Dangerous`, {
      status: 406,
    });
  }
  const get_user = async (): Promise<User | null> => {
    const fetched: string | null = await USERS.get(email);
    if(fetched) {
      const user: User = JSON.parse(fetched);
      return user;
    } else {
      return null;
    }
  }
  const user = await get_user();
  if(user) {
    if(user.password === password) {
      // Sign a JWT and hand it to the user
    } else {
      return new Response(`Incorrect Password`, { status: 409 });
    }
  } else {
    return new Response(`User Does Not Exist`, { status: 409 })
  }
});

router.get("view/:hash", (request) => {
  const { hash } = request.params ?? { hash: null };
  return new Response(`Viewing Hash #:${hash}`);
});

router.post("edit/:hash", checkAuth, (request: AuthorizedRequest) => {
  if (!request.auth) return gotoLogin(request.url);
  // Sends document, opens a websocket for quicksaving
});

router.post("new-doc", checkAuth, (request: AuthorizedRequest) => {
  if(!request.auth) return gotoLogin(request.url);
  
})

router.post("user-docs", checkAuth, async (request: AuthorizedRequest) => {
  if (!request.auth) {
    return new Response(
      "Sorry, you need to be logged in to see recent documents"
    );
  }
  const req = await request.json();
  const user: string | null = (await USERS.get(req.user));
});

router.all("auth/*", authRouter.handle)

router.all("*", async (request) => {
  return new Response(`400 Bad Request`, { status: 400 });
});

export default {
  fetch: router.handle,
};
