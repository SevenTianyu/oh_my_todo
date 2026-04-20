import type { CompanyRecord } from "../types/interview";

export const sampleCompanies: CompanyRecord[] = [
  {
    id: "acme",
    name: "ACME",
    companyType: "startup",
    overallImpression: "团队强，方向贴合，但节奏偏快。",
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
    id: "google",
    name: "Google",
    companyType: "big-tech",
    overallImpression: "品牌吸引力强，但业务匹配度一般。",
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
