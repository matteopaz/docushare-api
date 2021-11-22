import { AuthorizedRequest, LooseObject } from "./global";
import jwt from "@tsndr/cloudflare-worker-jwt";

// function gotoLogin(previousPage: URL) {
//   const login = new URL(`https://www.google.com`); // Placeholder for login page
//   const res = new Response(
//     JSON.stringify({ 
//     goTo: login,
//     returnTo: previousPage
//    }),
//     {
//       statusText: "Not Authorized!",
//       status: 401,
//     }
//   );
//   return res;
// }

async function checkAuth(request: AuthorizedRequest): Promise<void | Response> {
  // Checks if the user is authorized
  // Passes on a boolean and the user if authorized
  request.auth = false; // set to false by default
  const authHeader = request.headers.get("Authorization");
  if (!authHeader)
    return new Response("No Authorization Header", { status: 400 });
  const token = authHeader.split(" ")[1];
  let isValid = false;
  try {
    if(!token) throw new Error("No token");
    isValid = await jwt.verify(token, JWT_SECRET_KEY)
  } catch (err) {
    return new Response("Bad Token", { status: 400 });
  };
  if (isValid) {
    const decoded: LooseObject | null = await jwt.decode(token);
    request.user = decoded!.user;
    const fetched_user = await USERS.get(request.user!);
    if(fetched_user) {
      request.auth = true;
    }
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
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let uuid = "";
  for (let i = 0; i < 15; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uuid;
}

export { checkAuth, validateEmail, generateUniqueHash };
