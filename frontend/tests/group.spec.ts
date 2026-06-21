import test, { expect } from "@playwright/test";
import { clearDatabase } from "./setup";
import { uniqueNumber } from "./helpers/utils";
import { signup } from "./helpers/auth";

test.beforeAll(async () => {
  await clearDatabase();
});

test("group messaging works", async ({ browser }) => {
  const userAContext = await browser.newContext();
  const userBContext = await browser.newContext();
  const userCContext = await browser.newContext();

  const pageA = await userAContext.newPage();
  const pageB = await userBContext.newPage();
  const pageC = await userCContext.newPage();

  const numberA = uniqueNumber();
  const numberB = uniqueNumber();
  const numberC = uniqueNumber();

  const nameA = `UserA-${numberA}`;
  const nameB = `UserB-${numberB}`;
  const nameC = `UserC-${numberC}`;

  await signup(pageA, nameA, numberA);
  await signup(pageB, nameB, numberB);
  await signup(pageC, nameC, numberC);

  // User A creates a group with B and C
  await pageA.getByRole('button', { name: 'Groups' }).click();
  await pageA.getByRole('button', { name: '+' }).click(); // The create group button
  
  await pageA.getByPlaceholder("Group Name").fill("College Friends");
  await pageA.getByText(nameB).click();
  await pageA.getByText(nameC).click();
  await pageA.getByRole('button', { name: 'Create', exact: true }).click();

  // Verify group appears for all users
  await expect(pageA.locator(".flex-1.overflow-y-auto").getByText("College Friends")).toBeVisible();
  
  await pageB.getByRole('button', { name: 'Groups' }).click();
  await expect(pageB.locator(".flex-1.overflow-y-auto").getByText("College Friends")).toBeVisible();
  
  await pageC.getByRole('button', { name: 'Groups' }).click();
  await expect(pageC.locator(".flex-1.overflow-y-auto").getByText("College Friends")).toBeVisible();

  // A sends a message
  await pageA.locator(".flex-1.overflow-y-auto").getByText("College Friends").click();
  await pageA.getByPlaceholder("Type a message...").fill("Hello guys!");
  await pageA.getByRole("button", { name: "Send" }).click();

  // B and C receive message
  await pageB.locator(".flex-1.overflow-y-auto").getByText("College Friends").click();
  await expect(pageB.getByText("Hello guys!")).toBeVisible();

  await pageC.locator(".flex-1.overflow-y-auto").getByText("College Friends").click();
  await expect(pageC.getByText("Hello guys!")).toBeVisible();

  // Refresh persists history
  await pageB.reload();
  await pageB.getByRole('button', { name: 'Groups' }).click();
  await pageB.locator(".flex-1.overflow-y-auto").getByText("College Friends").click();
  await expect(pageB.getByText("Hello guys!")).toBeVisible();

  // Reconnecting (closing and opening tab)
  const newPageC = await userCContext.newPage();
  await pageC.close();
  await newPageC.goto("/chats");
  await newPageC.getByRole('button', { name: 'Groups' }).click();
  await newPageC.locator(".flex-1.overflow-y-auto").getByText("College Friends").click();
  await expect(newPageC.getByText("Hello guys!")).toBeVisible();
});
