import test, { expect } from "@playwright/test";
import { clearDatabase } from "./setup";
test.beforeAll(async () => {
  await clearDatabase();
});

test("checks signin", async ({ page, request }) => {
  await request.post("http://localhost:3000/signup", {
    data: {
      name: "Nikhil",
      number: "1234567890",
      password: "12345678",
    },
  });
  await page.goto("/signin");

  await page.getByLabel("Number").fill("1234567890");
  await page.getByLabel("Password").fill("12345678");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL("/chats");
});
