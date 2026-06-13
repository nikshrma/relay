import { expect, Page } from "@playwright/test";
export function uniqueNumber() {
  return `9${Date.now()}${Math.floor(Math.random() * 10000)}`;
}
export async function sendMessage(page: Page, user: string, message: string) {
  await page.locator(".flex-1.overflow-y-auto").getByText(user).click();
  await page.getByPlaceholder("Type a message...").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(message)).toBeVisible();
}
