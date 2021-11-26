import handleRequest from "./handler";
import { PROD_ORIGIN, STAGING_ORIGIN } from "./global.d";

function handleOptions(request: Request) {
  const CORS_HEADERS: { [key: string]: string } = {
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS, DELETE",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true"
  };
  if (ENV === "prod") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = PROD_ORIGIN;
    CORS_HEADERS["Access-Control-Allow-Headers"] = "content-type, cookie, credentials";
  } else if (ENV === "staging") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = STAGING_ORIGIN;
    CORS_HEADERS["Access-Control-Allow-Headers"] = "content-type, cookie, credentials";
  } else if (ENV === "dev") {
    const origin = request.headers.get("Origin");
    CORS_HEADERS["Access-Control-Allow-Origin"] = (origin ?? "*");
    CORS_HEADERS["Access-Control-Allow-Headers"] = "content-type, cookie, credentials";
  }
  const res = new Response();
  for(let header in CORS_HEADERS) {
    res.headers.set(header, CORS_HEADERS[header]);
  }
  return res;
}

addEventListener("fetch", async (event) => {
  if (event.request.method === "OPTIONS") {
    event.respondWith(handleOptions(event.request));
  } else {
    event.respondWith(handleRequest.fetch(event.request));
  }
});
