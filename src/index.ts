import handleRequest from "./handler";
// Zero idea why esbuild doesnt like this in global.d.ts so it goes here ok
export const JWT_SECRET_KEY =
  "bc955884459d4b0d5d48bcf4029a8870b25145a69f39787a6e7f5056e4b4acc0761cf115b31a69bff8cee86997cd11c8d71981fa4beb3ebcb3cada5c8027537c";
export const JWT_SECRET_REFRESH_KEY =
  "b31187c73507fc281793f9a8ce3a9450103fd0340704c6dd402f54f80436fde853324fa3d0a8b464e8847d6207c2ed4a057479ace211e5db3b8f5edec27fae36";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest.fetch(event.request));
});
