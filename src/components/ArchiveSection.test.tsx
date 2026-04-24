import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleCompanies } from "../lib/sampleData";
import { ArchiveSection } from "./ArchiveSection";

describe("ArchiveSection", () => {
  it("shows the archive note in the collapsed summary", () => {
    render(<ArchiveSection companies={[sampleCompanies[4]]} />);

    const archiveCard = screen.getByText("Google").closest("details");
    expect(archiveCard).not.toBeNull();
    expect(archiveCard).not.toHaveAttribute("open");
    expect(screen.getByText("已接受结果，流程收口归档。")).toBeInTheDocument();
  });

  it("expands an archived company card to reveal full historical details", async () => {
    const user = userEvent.setup();
    render(<ArchiveSection companies={[sampleCompanies[4]]} />);

    await user.click(screen.getByText("Google"));

    const archiveCard = screen.getByText("Google").closest("details");
    expect(archiveCard).not.toBeNull();
    expect(archiveCard).toHaveAttribute("open");
    expect(within(archiveCard!).getByText("公司判断")).toBeInTheDocument();
    expect(within(archiveCard!).getByText("历史流程")).toBeInTheDocument();
    expect(within(archiveCard!).getByRole("heading", { name: "PM" })).toBeInTheDocument();
    expect(within(archiveCard!).getByText("终面")).toBeInTheDocument();
    expect(within(archiveCard!).getByText("流程已结束")).toBeInTheDocument();
    expect(within(archiveCard!).getByRole("heading", { name: "谈薪结果" })).toBeInTheDocument();
  });
});
