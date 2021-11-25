import { AuthorizedRequest, LooseObject } from "./global";
import { User, Document, CORSResponse } from "./Declarations";
import jwt from "@tsndr/cloudflare-worker-jwt";

function parseCookies(req: Request | AuthorizedRequest) {
  // Parse req.headers.cookie into an object
  let cookies: LooseObject = {};
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      cookies[parts[0].trim()] = (parts[1] || "").trim();
    });
  }
  return cookies;
}

async function checkAuth(
  request: AuthorizedRequest
): Promise<void | CORSResponse> {
  // Checks if the user is authorized
  // Passes on a boolean and the user if authorized
  request.auth = false; // set to false by default
  const cookies = parseCookies(request);
  if (!cookies) {
    return new CORSResponse(request, "No Cookies Present", { status: 400 });
  }
  const auth = cookies["Authentication"];
  if (!auth) {
    return new CORSResponse(request, "No Authentication Cookie", {
      status: 400,
    });
  }
  const token = auth.split(" ")[1];
  let isValid = false;
  try {
    if (!token) throw new Error("No token");
    isValid = await jwt.verify(token, JWT_SECRET_KEY);
  } catch (err) {
    isValid = false;
    return new CORSResponse(request, "Missing or bad token", { status: 400 });
  }
  if (isValid) {
    const decoded: LooseObject | null = await jwt.decode(token);
    request.user = decoded!.user;
    const fetched_user = await USERS.get(request.user!);
    if (fetched_user) {
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
