import { AuthorizedRequest } from "./global";

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

async function checkAuth(request: AuthorizedRequest): Promise<void | Response> {
  if (!request.json) return;
  const { jwt } = await request.json();
  request.auth = true;
  // Checks if the user is authorized to access this route
  // If not, returns a 304 to the login page
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
