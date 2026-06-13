import test, { expect } from "@playwright/test";
import { signup } from "./helpers/auth";
import { sendMessage, uniqueNumber } from "./helpers/utils";
import { clearDatabase } from "./setup";

test.beforeAll(async () => {
  await clearDatabase();
});
test("checks read receipts", async ({ browser }) => {
  const userA = await browser.newContext();
  const userB = await browser.newContext();

  const pageA = await userA.newPage();
  const pageB = await userB.newPage();

  await signup(pageA, "UserA", uniqueNumber());
  await signup(pageB, "UserB", uniqueNumber());

  await pageB.close();
  await pageA.reload();

  await sendMessage(pageA, "UserB", "Checking receipts");
  //TODO: maybe add something more durable here to locate the message box like a test ID or something
  const messageBubble = pageA
    .locator("div.border")
    .filter({ hasText: "Checking receipts" });
  const ticks = messageBubble.locator("svg");
  await expect(ticks.locator("polyline")).toHaveCount(1);

  const pageB2 = await userB.newPage();
  await pageB2.goto("/chats");
  await expect(
    pageB2.locator(".flex-1.overflow-y-auto").getByText("UserA"),
  ).toBeVisible();

  await expect(ticks.locator("polyline")).toHaveCount(2);
  await expect(ticks).toHaveClass(/text-gray-500/);

  await pageB2.locator(".flex-1.overflow-y-auto").getByText("UserA").click();
  await expect(
    pageB2.locator(".flex-1.overflow-y-auto").getByText("Checking receipts"),
  ).toBeVisible();

  await expect(ticks.locator("polyline")).toHaveCount(2);
  await expect(ticks).toHaveClass(/text-blue-500/);
});
