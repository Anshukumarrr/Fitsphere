import { type ReactNode } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupIcon from "@mui/icons-material/Group";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SecurityIcon from "@mui/icons-material/Security";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

export interface Plan {
  name: string;
  price: string;
  members: string;
  branches: string;
  features: string[];
  highlighted: boolean;
}

export const features: Feature[] = [
  {
    icon: <PeopleAltIcon sx={{ fontSize: 40 }} />,
    title: "Member Management",
    desc: "Onboard, track, and manage members with profiles, health notes, attendance history, and membership status — all in one place.",
  },
  {
    icon: <StorefrontIcon sx={{ fontSize: 40 }} />,
    title: "Multi-Branch Ops",
    desc: "Run multiple gym locations under one organization. Each branch gets its own staff, members, and reporting while you stay in control.",
  },
  {
    icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />,
    title: "QR Check-In",
    desc: "Members check in by scanning a QR code at the entrance. Under 2 seconds. No queues, no paper registers, no fuss.",
  },
  {
    icon: <GroupIcon sx={{ fontSize: 40 }} />,
    title: "Trainer Management",
    desc: "Assign trainers to members, track PT sessions, monitor performance ratings, and manage specializations across branches.",
  },
  {
    icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
    title: "Payments & Invoicing",
    desc: "Record membership and PT package payments. Auto-generated invoice numbers, payment history filterable by date, branch, and method.",
  },
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
    title: "PT Session Scheduling",
    desc: "Members book sessions with trainers. Double-booking prevention, session tracking (completed/missed/cancelled), and progress notes.",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    title: "Analytics Dashboard",
    desc: "Real-time insights: active members, revenue trends, attendance patterns, renewal rates, and branch-wise performance comparisons.",
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: "Role-Based Access",
    desc: "Five distinct roles (Super Admin, Gym Owner, Receptionist, Trainer, Member) with strict permissions. Data isolated per tenant.",
  },
];

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹2,999",
    members: "Up to 100",
    branches: "1 Branch",
    features: ["Core modules", "Member management", "QR check-in", "Basic reports"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₹7,999",
    members: "Up to 1,000",
    branches: "Multiple Branches",
    features: [
      "Everything in Starter",
      "Advanced reporting",
      "Trainer performance",
      "PT session scheduling",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "₹24,999",
    members: "Unlimited",
    branches: "Unlimited",
    features: [
      "Everything in Professional",
      "Unlimited branches & members",
      "Priority support",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% uptime SLA",
      "White-label option",
    ],
    highlighted: false,
  },
];
