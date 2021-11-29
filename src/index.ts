import handleRequest from "./handler";
import { CORSResponse } from "./Declarations";
import { FRONTEND_PROD_ORIGIN, FRONTEND_STAGING_ORIGIN } from "./global.d";

function handleOptions(request: Request) {
  const CORS_HEADERS: { [key: string]: string } = {
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS, DELETE",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
  if (ENV === "prod") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = FRONTEND_PROD_ORIGIN;
    CORS_HEADERS["Access-Control-Allow-Headers"] =
      "content-type, Authentication";
  } else if (ENV === "staging") {
    CORS_HEADERS["Access-Control-Allow-Origin"] = FRONTEND_STAGING_ORIGIN;
    CORS_HEADERS["Access-Control-Allow-Headers"] =
      "content-type, Authentication";
  } else if (ENV === "dev") {
    const origin = request.headers.get("Origin");
    CORS_HEADERS["Access-Control-Allow-Origin"] = origin ?? "*";
    CORS_HEADERS["Access-Control-Allow-Headers"] =
      "content-type, Authentication";
  }
  const res = new Response();
  for (let header in CORS_HEADERS) {
    res.headers.set(header, CORS_HEADERS[header]);
  }
  return res;
}

addEventListener("fetch", async (event) => {
  if (event.request.method === "OPTIONS") {
    event.respondWith(handleOptions(event.request));
  } else {
    event.respondWith(
      handleRequest.fetch(event.request).catch((err: Error) => {
        throw err;
        return new CORSResponse(event.request, "Server Error", { status: 500 });
      })
    );
  }
});
