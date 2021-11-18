import handleRequest from "./handler";
import { PROD_ORIGIN, STAGING_ORIGIN } from "./global.d";
import { request } from "http";

function handleOptions(request: Request) {
  const CORS_HEADERS: { [key: string]: string } = {
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  if (ENV === "prod") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = PROD_ORIGIN;
    CORS_HEADERS["Access-Control-Allow-Headers"] = "Authorization";
  } else if (ENV === "staging") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = STAGING_ORIGIN;
    CORS_HEADERS["Access-Control-Allow-Headers"] = "Authorization";
  } else if (ENV === "dev") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = "*";
    CORS_HEADERS["Access-Control-Allow-Headers"] = "*";
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
