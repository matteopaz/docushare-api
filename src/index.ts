import handleRequest from "./handler";

addEventListener("fetch", (event) => {
  const request = event.request;
  const res = handleRequest.fetch(request);
  if(ENV === "dev") {
    res.headers.set("Access-Control-Allow-Origin", "*")
  } else if(ENV === "staging") {
    res.headers.set("Access-Control-Allow-Origin", "*")
  } else if(ENV === "prod") {
    res.headers.set("Access-Control-Allow-Origin", "")
  }
  event.respondWith(res);
});
