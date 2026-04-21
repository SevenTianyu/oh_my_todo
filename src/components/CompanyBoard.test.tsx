import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

    expect(companyCardMock).toHaveBeenCalledTimes(1);
    const passedProps = companyCardMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(passedProps).toMatchObject({
      company: sampleCompanies[1],
      negotiationSuggestionProcessId: "nova-product",
      onStartNegotiation: expect.any(Function),
      onSaveNegotiationSnapshot: expect.any(Function),
      onFinishNegotiation: expect.any(Function)
    });
  });
});
