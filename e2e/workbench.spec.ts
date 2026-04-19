import { expect, test } from "@playwright/test";

test("user can switch grouping, edit a company note, and keep the change after reload", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "未来 7 天面试" })).toBeVisible();

  await page.getByRole("button", { name: "按流程阶段分组" }).click();
  await expect(page.getByRole("heading", { name: "面试中" })).toBeVisible();

  await page.getByRole("button", { name: "展开公司判断" }).first().click();
  await page.getByLabel("公司整体印象").fill("团队很强，但需要继续确认稳定性。");
  await page.getByRole("button", { name: "保存公司判断" }).click();

  await page.reload();
  await page.getByRole("button", { name: "展开公司判断" }).first().click();
  await expect(page.getByLabel("公司整体印象")).toHaveValue(
    "团队很强，但需要继续确认稳定性。"
  );
});
