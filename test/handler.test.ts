import handleRequest from "../src/handler";
import makeServiceWorkerEnv from "service-worker-mock";

declare var global: any;

describe("auth", () => {
  let authToken: string;

  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv());
    jest.resetModules();
  });

  test("sign up", async () => {
    const result = await handleRequest.fetch(
      new Request("/auth/signup", { 
        method: "POST",
        body: JSON.stringify({
          email: "tester@gmail.com",
          password: "passwordio1234"
        })
    })
    );
    expect(result.status).toEqual(200);
    const text = await result.text();
    expect(text).toEqual("Account Created");
    const result_two = await handleRequest.fetch(
      new Request("/", { 
        method: "POST",
        body: JSON.stringify({
          email: "tester@gmail.com",
          password: "passwordio1234"
        })
    })
    );
    expect(result_two.status).toEqual(400);
    const text_two = result_two.text();
    expect(text_two).toEqual("Account taken");
  });

  test("log in", async () => {
    const res = await handleRequest.fetch(
      new Request("/auth/login", { 
        method: "POST",
        body: JSON.stringify({
          email: "tester@gmail.com",
          password: "passwordio1234"
        })
    })
    );
    expect(res.status).toEqual(200);
    authToken = await res.text();
  });

  test("verify auth", async () => {
    const res = await handleRequest.fetch(
      new Request("/auth/check", {
        headers: {
          Authorization: authToken
        }
    }));
    expect(res.status).toEqual(200);
    const text = res.text();
    expect(text).toEqual("Authorized")
    });
});