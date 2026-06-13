import { expect, Page } from "@playwright/test";

export async function signup(
  page: Page,
  name: string,
  number: string,
  password = "12345678",
) {
  await page.goto("/signup");

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Number").fill(number);
  await page.getByLabel("Password").fill(password);

  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page).toHaveURL("/chats");
}
