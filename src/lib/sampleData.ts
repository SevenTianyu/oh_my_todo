import type { CompanyRecord } from "../types/interview";

function createDefaultNegotiation() {
  return {
    status: "inactive" as const,
    sourceProcessId: null,
    startedAt: null,
    endedAt: null,
    latestSnapshotId: null,
    snapshots: []
  };
}

export const sampleCompanies: CompanyRecord[] = [
  {
    id: "acme",
    name: "ACME",
    companyType: "startup",
    overallImpression: "团队强，方向贴合，但节奏偏快。",
    negotiation: createDefaultNegotiation(),
    processes: [
      {
        id: "acme-pm",
        roleName: "Senior PM",
        nextStep: "一面",
        status: "active",
        rounds: [
          {
            id: "acme-round-1",
            name: "一面",
            scheduledAt: "2026-04-17T14:00:00-07:00",
            status: "scheduled",
            notes: "关注 owner 意识"
          },
          {
            id: "acme-round-0",
            name: "简历沟通",
            scheduledAt: "2026-04-15T10:00:00-07:00",
            status: "completed",
            notes: "招聘经理反馈积极"
          }
        ]
      }
    ]
  },
  {
    id: "nova",
    name: "Nova AI",
    companyType: "startup",
    overallImpression: "赛道感兴趣，但需要继续判断现金流情况。",
    negotiation: createDefaultNegotiation(),
    processes: [
      {
        id: "nova-product",
        roleName: "Product Lead",
        nextStep: "待约面",
        status: "active",
        rounds: [
          {
            id: "nova-round-1",
            name: "初筛沟通",
            scheduledAt: null,
            status: "pending",
            notes: "等待 recruiter 确认时间"
          }
        ]
      }
    ]
  },
  {
    id: "bytedance",
    name: "字节跳动",
    companyType: "big-tech",
    overallImpression: "流程规范，但岗位细节还不够清晰。",
    negotiation: createDefaultNegotiation(),
    processes: [
      {
        id: "byte-growth",
        roleName: "Growth PM",
        nextStep: "HR 面",
        status: "active",
        rounds: [
          {
            id: "byte-round-1",
            name: "HR 面",
            scheduledAt: "2026-04-18T10:30:00-07:00",
            status: "scheduled",
            notes: "需要确认汇报关系"
          }
        ]
      }
    ]
  },
  {
    id: "airtable",
    name: "Airtable",
    companyType: "startup",
    overallImpression: "团队成熟，已经进入谈薪与 offer 对比阶段。",
    negotiation: {
      status: "active",
      sourceProcessId: "airtable-staff-pm",
      startedAt: "2026-04-18T18:00:00-07:00",
      endedAt: null,
      latestSnapshotId: "negotiation-airtable-1",
      snapshots: [
        {
          id: "negotiation-airtable-1",
          version: 1,
          createdAt: "2026-04-18T18:00:00-07:00",
          title: "Staff PM",
          level: "P5",
          city: "San Francisco",
          workMode: "Hybrid",
          baseMonthlySalary: 52000,
          salaryMonths: 15,
          annualBonusCash: 150000,
          signOnBonus: 80000,
          relocationBonus: 0,
          equityShares: 3500,
          equityStrikePrice: 25,
          equityReferencePrice: 55,
          equityVestingYears: 4,
          deadline: "2026-04-25",
          hrSignal: "首轮口头 offer",
          notes: "还可以继续谈 base"
        }
      ]
    },
    processes: [
      {
        id: "airtable-staff-pm",
        roleName: "Staff PM",
        nextStep: "等待书面 offer",
        status: "archived",
        rounds: [
          {
            id: "airtable-round-1",
            name: "终面",
            scheduledAt: "2026-04-18T16:00:00-07:00",
            status: "completed",
            notes: "面试通过，进入谈薪"
          }
        ]
      }
    ]
  },
  {
    id: "google",
    name: "Google",
    companyType: "big-tech",
    overallImpression: "品牌吸引力强，但业务匹配度一般。",
    negotiation: {
      status: "accepted",
      sourceProcessId: "google-ads",
      startedAt: "2026-04-05T09:30:00.000Z",
      endedAt: "2026-04-14T09:00:00.000Z",
      latestSnapshotId: "negotiation-google-1",
      snapshots: [
        {
          id: "negotiation-google-1",
          version: 1,
          createdAt: "2026-04-05T09:30:00.000Z",
          title: "PM",
          level: "L4",
          city: "Mountain View",
          workMode: "Hybrid",
          baseMonthlySalary: 42000,
          salaryMonths: 15,
          annualBonusCash: 100000,
          signOnBonus: 30000,
          relocationBonus: 20000,
          equityShares: 2500,
          equityStrikePrice: 50,
          equityReferencePrice: 90,
          equityVestingYears: 4,
          deadline: "2026-04-12",
          hrSignal: "已确认",
          notes: "最终包已接受"
        }
      ]
    },
    processes: [
      {
        id: "google-ads",
        roleName: "PM",
        nextStep: "流程结束",
        status: "archived",
        rounds: [
          {
            id: "google-round-1",
            name: "终面",
            scheduledAt: "2026-04-05T09:00:00-07:00",
            status: "closed",
            notes: "流程已结束"
          }
        ]
      }
    ]
  }
];
