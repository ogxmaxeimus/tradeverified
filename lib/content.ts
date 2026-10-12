import type { Article, Group, GroupPost } from "./types";

export const GROUPS: Group[] = [
  {
    id: "g-hvac",
    name: "HVAC Techs",
    trade: "HVAC",
    about: "Install, service, and commissioning notes for residential and light commercial HVAC.",
    baselineMembers: 1840,
  },
  {
    id: "g-electrical",
    name: "Electrical Workers",
    trade: "Electrical",
    about: "Code questions, job-site photos, and license renewal reminders for electricians.",
    baselineMembers: 2210,
  },
  {
    id: "g-plumbing",
    name: "Plumbing Pros",
    trade: "Plumbing",
    about: "Service plumbing, medical gas, and repipe crews comparing how they quote and document work.",
    baselineMembers: 1664,
  },
  {
    id: "g-welding",
    name: "Welders Bench",
    trade: "Welding",
    about: "Procedure specs, booth setup, and travel jobs for certified welders.",
    baselineMembers: 980,
  },
];

export const ARTICLES: Article[] = [
  {
    slug: "how-verification-works",
    title: "How a verification badge earns its keep",
    summary: "What a TradeVerified badge is claiming, and what it is not.",
    minutes: 4,
    body: [
      "A license number typed into a profile is a claim. A badge is that claim plus a record of how it was checked: the issuing body, the reference, the date, and whether the credential is still inside its expiration window.",
      "In this workspace, sample profiles ship with verification records so you can see the product. When you add your own credential, it stays pending until you run a workspace check. That check confirms the reference has a usable shape and that the expiration date is still in the future. It does not call a state board. A production deployment would attach the real lookup, and the badge would still show the source.",
      "Employers should read the line under the badge before they hire. “State license board record” and “Workspace check” are different kinds of proof. Expired credentials stay on the profile on purpose, with an expired state, because hiding them is how fake histories get built.",
    ],
  },
  {
    slug: "portfolio-that-wins-work",
    title: "Portfolio photos that actually win work",
    summary: "Shoot the job the way a foreman would explain it.",
    minutes: 5,
    body: [
      "Homeowners and general contractors are not hiring a camera. They are hiring proof that you have done this exact kind of job. Pair a before and an after, name the city, and write one sentence about the constraint: a 1940s crawlspace, a tenant who stayed in the unit, a shutdown window of four hours.",
      "Skip the truck selfie as the only image. Include the equipment tag, the finished trim, and the thing that was hard. Three strong jobs beat thirty blurry ones. Free profiles on TradeVerified can show three projects. That is enough if each one is specific.",
      "Customers leave better reviews when the portfolio already told the truth. The review then confirms the job instead of introducing it.",
    ],
  },
  {
    slug: "reading-a-candidate",
    title: "How to read a trades profile before you call",
    summary: "A short hiring pass for shop owners and GCs.",
    minutes: 4,
    body: [
      "Start with the trade and the city, then the credentials that the job actually requires. A residential service call does not need the same ticket as a boiler install. Open the source line on each badge and notice expirations.",
      "Read two reviews and look for the proof reference, not just the stars. A review tied to an invoice or a job number is harder to fake than a paragraph of praise. Then open the portfolio and ask whether the work looks like the work you are about to post.",
      "Save the people you would interview and message them from the profile. The note can be short: the job, the city, the start window, and the license you need on site.",
    ],
  },
  {
    slug: "keep-a-license-current",
    title: "Keep the license current before the season hits",
    summary: "A practical reminder list. Your state board is the authority.",
    minutes: 3,
    body: [
      "Renewal rules are local. The board that issued the license is the only source that can tell you the fee, the continuing-education hours, and the grace period. TradeVerified can show the date you entered. It cannot extend it.",
      "Put the expiration in your profile as soon as you have the card, not the week it lapses. Crews lose bids because a badge flipped to expired in the middle of a shortlist.",
      "If you hold more than one ticket, list each one separately: the state mechanical license, the EPA 608 card, the manufacturer cert. Employers filter on the specific requirement, not on a vague “certified” line.",
    ],
  },
];

export const SEED_POSTS: GroupPost[] = [
  {
    id: "gp1",
    groupId: "g-hvac",
    authorId: "u_marcus",
    body: "If you are still quoting condenser swaps without a line-set photo, you are buying the second trip. I started requiring a nameplate and a lineset shot before I schedule.",
    createdAt: "2026-10-09T15:00:00.000Z",
  },
  {
    id: "gp2",
    groupId: "g-hvac",
    authorId: "u_luis",
    body: "NATE renewal window snuck up on two techs in our shop. Put the expiration on your profile even if the badge already says verified.",
    createdAt: "2026-10-08T18:20:00.000Z",
  },
  {
    id: "gp3",
    groupId: "g-electrical",
    authorId: "u_derek",
    body: "Panel change in a 1960s San Diego bungalow today. The permit card is in the portfolio. Happy to compare how you document a service upgrade.",
    createdAt: "2026-10-10T22:10:00.000Z",
  },
  {
    id: "gp4",
    groupId: "g-plumbing",
    authorId: "u_liam",
    body: "Bluewater is hiring a licensed plumber in Vancouver. If your Red Seal is current, apply with the ticket number in the note.",
    createdAt: "2026-10-11T16:40:00.000Z",
  },
  {
    id: "gp5",
    groupId: "g-welding",
    authorId: "u_brandon",
    body: "D1.1 test next week. Looking for booth time recommendations around National City after shift.",
    createdAt: "2026-10-07T13:05:00.000Z",
  },
];
