import { AuthorizedRequest, LooseObject, JWT_SECRET_REFRESH_KEY, JWT_SECRET_KEY } from "./global";
import jwt from "@tsndr/cloudflare-worker-jwt";

function gotoLogin(previousPage: URL) {
  const login = new URL(`https://www.google.com/`); // Placeholder for login page
  const res = new Response(
    `{ 
    goTo: ${login},
    returnTo: ${previousPage}
   }`,
    {
      statusText: "Not Authorized!",
      status: 401,
    }
  );
  return res;
}

async function checkAuth(request: AuthorizedRequest): Promise<void | Response> { // Checks if the user is authorized
  // Checks if the user is authorized
  // Passes on a boolean and the user if authorized
  request.auth = false;
  if (!request.json) return;
  try {
  const req: Request | null = await request.json();
  if(!req) return new Response("Bad Request", {status: 400});
  console.log(req, "good");
  } catch(e) {
    console.log(request)
  }
  const authHeader = request.headers.get("Authorization");
  if(!authHeader) return new Response("No Authorization Header", {status: 400});
  const token = authHeader.split(" ")[1];
  const isValid = await jwt.verify(token, JWT_SECRET_KEY);
  if(isValid){
    const decoded: LooseObject | null = await jwt.decode(token);
    request.auth = true;
    request.user = (decoded ? decoded.user : null);
  } else {
    return new Response("Not Authorized", {status: 403});
  }
}

function validateEmail(email: string): boolean {
  const filter = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  if (!filter.test(email.toLowerCase())) {
    return false;
  } else {
    return true;
  }
}

function generateUniqueHash() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let uuid = "";
  for (let i = 0; i < 15; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uuid;
}

export { gotoLogin, checkAuth, validateEmail, generateUniqueHash };
