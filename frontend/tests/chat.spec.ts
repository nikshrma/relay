import test, { expect } from "@playwright/test";
import { clearDatabase } from "./setup";
import { sendMessage, uniqueNumber } from "./helpers/utils";
import { signup } from "./helpers/auth";
test.beforeAll(async () => {
  await clearDatabase();
});

test("chat works", async ({ browser }) => {
  const userA = await browser.newContext();
  const userB = await browser.newContext();

  const pageA = await userA.newPage();
  const pageB = await userB.newPage();

  const number1 = uniqueNumber();
  const number2 = uniqueNumber();

  await signup(pageA, "UserA", number1);
  await signup(pageB, "UserB", number2);
  await pageA.reload();

  await sendMessage(pageA, "UserB", "Hi UserB");

  await pageB.locator(".flex-1.overflow-y-auto").getByText("UserA").click();
  await expect(
    pageB.locator(".flex-1.overflow-y-auto").getByText("Hi UserB"),
  ).toBeVisible();
});
