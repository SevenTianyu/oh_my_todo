import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyBoard } from "./CompanyBoard";
import { sampleCompanies } from "../lib/sampleData";

const companyCardMock = vi.fn();

vi.mock("./CompanyCard", () => ({
  CompanyCard: (props: Record<string, unknown>) => {
    companyCardMock(props);
    return <div data-testid={`company-card-${String(props.company && (props.company as { id: string }).id)}`} />;
  }
}));

describe("CompanyBoard", () => {
  beforeEach(() => {
    companyCardMock.mockClear();
  });

  it("renders each group as a dossier lane with a padded count", () => {
    const { container } = render(
      <CompanyBoard
        groups={[
          {
            key: "active",
            label: "进行中",
            companies: [sampleCompanies[1]]
          }
        ]}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
        negotiationSuggestionProcessIds={{ nova: "nova-product" }}
        onStartNegotiation={() => {}}
        onSaveNegotiationSnapshot={() => {}}
        onFinishNegotiation={() => {}}
      />
    );

    expect(container.querySelector(".group-panel__meta")).not.toBeNull();
    expect(container).toHaveTextContent("01");
  });

  it("passes the negotiation callbacks into CompanyCard", () => {
    render(
      <CompanyBoard
        groups={[
          {
            key: "active",
            label: "进行中",
            companies: [sampleCompanies[1]]
          }
        ]}
        onSaveSummary={() => {}}
        onUpdateProcess={() => {}}
        onAddRound={() => {}}
        onArchiveProcess={() => {}}
        onUpdateRound={() => {}}
        negotiationSuggestionProcessIds={{ nova: "nova-product" }}
        onStartNegotiation={() => {}}
        onSaveNegotiationSnapshot={() => {}}
        onFinishNegotiation={() => {}}
      />
    );

    expect(companyCardMock.mock.calls.at(-1)).toBeDefined();
    const passedProps = companyCardMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(passedProps).toMatchObject({
      company: sampleCompanies[1],
      negotiationSuggestionProcessId: "nova-product",
      onStartNegotiation: expect.any(Function),
      onSaveNegotiationSnapshot: expect.any(Function),
      onFinishNegotiation: expect.any(Function)
    });
  });
});
