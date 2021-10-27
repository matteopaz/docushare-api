import { AuthorizedRequest } from "./global";
import jose from "node-jose";
const keystore = jose.JWK.createKeyStore();
keystore.add({ JWT_SECRET_KEY: process.env.JWT_SECRET_KEY });
keystore.add({ JWT_SECRET_REFRESH_KEY: process.env.JWT_SECRET_REFRESH_KEY });

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
  const req: Request | null = await request.json();
  if(!req) return new Response("Bad Request", {status: 400});
  const authHeader = req.headers.get("authorization");
  if(!authHeader) return new Response("No Authorization Header", {status: 400});
  const token = authHeader.split(" ")[1];
  // jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
  //   if(err) return new Response("Not Authorized", {status: 403});
  //   request.auth = true;
  //   request.user = (decoded ? decoded.user : null);
  // });
  jose.JWS.createVerify(keystore.get("JWT_SECRET_KEY"))
    .verify(token)
    .then(result => {
      if(!result) return new Response("Not Authorized", {status: 403});
      request.auth = true;
      // decode request.payload as a Buffer to an object
      request.user = result.payload.toString("utf8");
    })
    .catch(err => {
      console.error(err);
      return new Response("Authorization Error: " + err.message, {status: 403});
    });
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
