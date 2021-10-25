import { AuthorizedRequest } from './global';

function gotoLogin() {
  const page = `https://www.google.com/`; // Placeholder
  return Response.redirect(page);
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
    return false
  } else {
    return true;
  }
}

export { gotoLogin, checkAuth, validateEmail }
