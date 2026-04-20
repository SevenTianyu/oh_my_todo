import { expect, test } from "@playwright/test";

const SEEDED_WORKBENCH = {
  version: 2,
  grouping: "companyType",
  companies: [
    {
      id: "anthropic",
      name: "Anthropic",
      companyType: "startup",
      overallImpression: "",
      processes: [
        {
          id: "anthropic-pm",
          roleName: "Product Manager",
          nextStep: "一面",
          status: "active",
          rounds: [
            {
              id: "anthropic-round-1",
              name: "一面",
              scheduledAt: "2026-04-20T10:00:00-07:00",
              status: "scheduled",
              notes: ""
            }
          ]
        }
      ]
    }
  ]
} as const;

test("user can switch grouping, edit a company note, and keep the change after reload", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate((snapshot) => {
    window.localStorage.setItem("interview-workbench:v1", JSON.stringify(snapshot));
  }, SEEDED_WORKBENCH);
  await page.reload();

  await expect(page.getByRole("heading", { name: "未来 7 天面试" })).toBeVisible();

  await page.getByRole("button", { name: "按流程阶段分组" }).click();
  await expect(page.getByRole("heading", { name: "面试中" })).toBeVisible();

  await page.getByRole("button", { name: "展开公司判断" }).first().click();
  await page.getByLabel("公司整体印象").fill("团队很强，但需要继续确认稳定性。");
  await page.getByRole("button", { name: "保存公司判断" }).click();
  await expect
    .poll(async () =>
      page.evaluate(() => window.localStorage.getItem("interview-workbench:v1") ?? "")
    )
    .toContain("团队很强，但需要继续确认稳定性。");

  await page.reload();
  await page.getByRole("button", { name: "展开公司判断" }).first().click();
  await expect(page.getByLabel("公司整体印象")).toHaveValue(
    "团队很强，但需要继续确认稳定性。"
  );
});
