import test from "@playwright/test";
import { clearDatabase } from "./setup";
import { signup } from "./helpers/auth";
import { uniqueNumber } from "./helpers/utils";
test.beforeAll(async () => {
  await clearDatabase();
});

test("checks signup", async ({ page }) => {
  await signup(page, "Nikhil", uniqueNumber());
});
