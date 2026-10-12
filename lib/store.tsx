"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSeedState } from "./seed";
import { parseDate, place, slugify, uid } from "./format";
import type {
  AppState,
  ApplicationStatus,
  Availability,
  Company,
  Credential,
  JobType,
  Plan,
  PortfolioItem,
  Professional,
  Role,
  Trade,
  User,
} from "./types";

const KEY = "tv-workspace-v1";

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
  city: string;
  region: string;
  trade?: Trade;
  title?: string;
  company?: string;
  plan?: Plan;
};

export type JobInput = {
  title: string;
  trade: Trade;
  city: string;
  region: string;
  type: JobType;
  pay: string;
  description: string;
  requirements: string[];
};

export type ProfileInput = {
  title: string;
  city: string;
  region: string;
  about: string;
  skills: string[];
  years: number;
  rate: string;
  availability: Availability;
  licensed: boolean;
  insured: boolean;
  backgroundChecked: boolean;
  osha: boolean;
};

export type CredentialInput = {
  name: string;
  detail: string;
  issuer: string;
  issued: string;
  expires: string;
  reference: string;
};

export type ReviewInput = {
  professionalId: string;
  rating: number;
  body: string;
  proof: string;
  tags: string[];
};

type StoreValue = {
  ready: boolean;
  state: AppState;
  toast: string | null;
  currentUser: User | null;
  currentProfessional: Professional | null;
  currentCompany: Company | null;
  dismissToast: () => void;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  signup: (input: SignupInput) => string | null;
  toggleSavedPro: (professionalId: string) => string | null;
  toggleSavedJob: (jobId: string) => string | null;
  isProSaved: (professionalId: string) => boolean;
  isJobSaved: (jobId: string) => boolean;
  applyToJob: (jobId: string, note: string) => string | null;
  setApplicationStatus: (applicationId: string, status: ApplicationStatus) => string | null;
  withdrawApplication: (applicationId: string) => string | null;
  postJob: (input: JobInput) => string | null;
  deleteJob: (jobId: string) => string | null;
  sendMessage: (toUserId: string, body: string) => string | null;
  markThreadRead: (threadId: string) => void;
  markNotificationsRead: () => void;
  addReview: (input: ReviewInput) => string | null;
  updateProfile: (input: ProfileInput) => string | null;
  addPortfolio: (item: Omit<PortfolioItem, "id">) => string | null;
  removePortfolio: (id: string) => void;
  addCredential: (input: CredentialInput) => string | null;
  checkCredential: (id: string) => string | null;
  updateCompany: (patch: Pick<Company, "name" | "location" | "about" | "website" | "focus">) => string | null;
  setPlan: (plan: Plan) => string | null;
  toggleMembership: (groupId: string) => string | null;
  postToGroup: (groupId: string, body: string) => string | null;
  submitLead: (input: { name: string; email: string; company: string; message: string }) => string | null;
  recordProView: (professionalId: string) => void;
  recordCompanyView: (companyId: string) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.users) || !Array.isArray(parsed.professionals)) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(createSeedState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef(state);
  const toastTimer = useRef<number | null>(null);
  stateRef.current = state;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  const update = useCallback((fn: (current: AppState) => AppState) => {
    setState((current) => fn(current));
  }, []);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setToast("This browser is out of room for saved photos. Remove a project and try again.");
    }
  }, [state, ready]);

  const requireUser = () => {
    const current = stateRef.current.sessionUserId;
    if (!current) return null;
    return stateRef.current.users.find((user) => user.id === current) ?? null;
  };

  const api = useMemo<StoreValue>(() => {
    const currentUser = state.users.find((user) => user.id === state.sessionUserId) ?? null;
    const currentProfessional = currentUser?.professionalId
      ? state.professionals.find((pro) => pro.id === currentUser.professionalId) ?? null
      : null;
    const currentCompany = currentUser?.companyId
      ? state.companies.find((company) => company.id === currentUser.companyId) ?? null
      : null;

    return {
      ready,
      state,
      toast,
      currentUser,
      currentProfessional,
      currentCompany,
      dismissToast: () => setToast(null),
      login: (email, password) => {
        const match = stateRef.current.users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
        if (!match || match.password !== password) {
          return "Email or password does not match. Sample accounts use demo1234.";
        }
        update((current) => ({ ...current, sessionUserId: match.id }));
        showToast(`Welcome back, ${match.name.split(" ")[0]}.`);
        return null;
      },
      logout: () => {
        update((current) => ({ ...current, sessionUserId: null }));
        showToast("Signed out.");
      },
      signup: (input) => {
        const email = input.email.trim().toLowerCase();
        const name = input.name.trim();
        if (name.length < 2) return "Enter the name customers should see.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";
        if (input.password.length < 8) return "Use at least 8 characters.";
        if (!input.city.trim() || !input.region.trim()) return "City and state or province are required.";
        if (stateRef.current.users.some((user) => user.email.toLowerCase() === email)) {
          return "An account with that email already exists.";
        }
        if (input.role === "worker" && !input.trade) return "Choose your trade.";
        if (input.role === "employer" && !input.company?.trim()) return "Enter the company name.";

        const userId = uid("u");
        const plan: Plan = input.role === "employer" ? "employer" : input.plan === "pro" ? "pro" : "free";
        const nextUser: User = {
          id: userId,
          email,
          password: input.password,
          name,
          role: input.role,
          plan,
          createdAt: new Date().toISOString(),
        };

        if (input.role === "worker") {
          const professionalId = uid("p");
          const base = slugify(name);
          let slug = base;
          let n = 2;
          while (stateRef.current.professionals.some((pro) => pro.slug === slug)) slug = `${base}-${n++}`;
          const pro: Professional = {
            id: professionalId,
            userId,
            slug,
            name,
            trade: input.trade!,
            title: input.title?.trim() || input.trade!,
            city: input.city.trim(),
            region: input.region.trim().toUpperCase(),
            about: "",
            skills: [],
            years: 1,
            rate: "",
            availability: "Available now",
            licensed: false,
            insured: false,
            backgroundChecked: false,
            osha: false,
            featured: plan === "pro",
            views: 0,
            credentials: [],
            portfolio: [],
            reviews: [],
          };
          nextUser.professionalId = professionalId;
          update((current) => ({
            ...current,
            users: [...current.users, nextUser],
            professionals: [...current.professionals, pro],
            sessionUserId: userId,
          }));
        } else {
          const companyId = uid("c");
          const base = slugify(input.company!.trim());
          let slug = base;
          let n = 2;
          while (stateRef.current.companies.some((company) => company.slug === slug)) slug = `${base}-${n++}`;
          const company: Company = {
            id: companyId,
            ownerId: userId,
            slug,
            name: input.company!.trim(),
            location: place({ city: input.city.trim(), region: input.region.trim().toUpperCase() }),
            about: "",
            website: "",
            focus: "Construction",
            views: 0,
          };
          nextUser.companyId = companyId;
          update((current) => ({
            ...current,
            users: [...current.users, nextUser],
            companies: [...current.companies, company],
            sessionUserId: userId,
          }));
        }
        showToast("Account created. Your workspace is saved in this browser.");
        return null;
      },
      toggleSavedPro: (professionalId) => {
        const user = requireUser();
        if (!user) return "Sign in to save a tradesperson.";
        update((current) => {
          const list = current.savedPros[user.id] ?? [];
          const next = list.includes(professionalId)
            ? list.filter((id) => id !== professionalId)
            : [...list, professionalId];
          return { ...current, savedPros: { ...current.savedPros, [user.id]: next } };
        });
        return null;
      },
      toggleSavedJob: (jobId) => {
        const user = requireUser();
        if (!user) return "Sign in to save a job.";
        update((current) => {
          const list = current.savedJobs[user.id] ?? [];
          const next = list.includes(jobId) ? list.filter((id) => id !== jobId) : [...list, jobId];
          return { ...current, savedJobs: { ...current.savedJobs, [user.id]: next } };
        });
        return null;
      },
      isProSaved: (professionalId) => {
        if (!currentUser) return false;
        return (state.savedPros[currentUser.id] ?? []).includes(professionalId);
      },
      isJobSaved: (jobId) => {
        if (!currentUser) return false;
        return (state.savedJobs[currentUser.id] ?? []).includes(jobId);
      },
      applyToJob: (jobId, note) => {
        const user = requireUser();
        if (!user) return "Sign in as a tradesperson to apply.";
        if (user.role !== "worker" || !user.professionalId) return "Employer accounts hire. Switch to a tradesperson account to apply.";
        const trimmed = note.trim();
        if (trimmed.length < 12) return "Write a short note, at least a sentence, so the shop knows why you fit.";
        const existing = stateRef.current.applications.find(
          (application) => application.jobId === jobId && application.professionalId === user.professionalId && application.status !== "Withdrawn",
        );
        if (existing) return "You already applied to this job.";
        const job = stateRef.current.jobs.find((item) => item.id === jobId);
        if (!job) return "That job is no longer posted.";
        const company = stateRef.current.companies.find((item) => item.id === job.companyId);
        const applicationId = uid("a");
        update((current) => ({
          ...current,
          applications: [
            {
              id: applicationId,
              jobId,
              professionalId: user.professionalId!,
              note: trimmed,
              status: "New",
              createdAt: new Date().toISOString(),
            },
            ...current.applications,
          ],
          notifications: company
            ? [
                {
                  id: uid("n"),
                  userId: company.ownerId,
                  title: "New application",
                  body: `${user.name} applied to ${job.title}.`,
                  href: `/jobs/${job.id}`,
                  createdAt: new Date().toISOString(),
                  read: false,
                },
                ...current.notifications,
              ]
            : current.notifications,
        }));
        showToast("Application sent.");
        return null;
      },
      setApplicationStatus: (applicationId, status) => {
        const user = requireUser();
        if (!user) return "Sign in to update applications.";
        const application = stateRef.current.applications.find((item) => item.id === applicationId);
        const job = application && stateRef.current.jobs.find((item) => item.id === application.jobId);
        const company = job && stateRef.current.companies.find((item) => item.id === job.companyId);
        if (!application || !job || !company || company.ownerId !== user.id) return "Only the hiring company can change this status.";
        const pro = stateRef.current.professionals.find((item) => item.id === application.professionalId);
        update((current) => ({
          ...current,
          applications: current.applications.map((item) => (item.id === applicationId ? { ...item, status } : item)),
          notifications: pro
            ? [
                {
                  id: uid("n"),
                  userId: pro.userId,
                  title: "Application update",
                  body: `${company.name} marked your ${job.title} application ${status}.`,
                  href: "/dashboard",
                  createdAt: new Date().toISOString(),
                  read: false,
                },
                ...current.notifications,
              ]
            : current.notifications,
        }));
        showToast(`Marked ${status}.`);
        return null;
      },
      withdrawApplication: (applicationId) => {
        const user = requireUser();
        if (!user?.professionalId) return "Sign in to withdraw.";
        const application = stateRef.current.applications.find((item) => item.id === applicationId);
        if (!application || application.professionalId !== user.professionalId) return "That application is not yours.";
        update((current) => ({
          ...current,
          applications: current.applications.map((item) =>
            item.id === applicationId ? { ...item, status: "Withdrawn" } : item,
          ),
        }));
        showToast("Application withdrawn.");
        return null;
      },
      postJob: (input) => {
        const user = requireUser();
        if (!user?.companyId || user.role !== "employer") return "Post jobs from an employer account.";
        if (!input.title.trim() || !input.description.trim()) return "Add a title and a description.";
        if (!input.city.trim() || !input.region.trim() || !input.pay.trim()) return "City, region, and pay are required.";
        const requirements = input.requirements.map((item) => item.trim()).filter(Boolean);
        if (!requirements.length) return "Add at least one requirement.";
        const id = uid("j");
        update((current) => ({
          ...current,
          jobs: [
            {
              id,
              companyId: user.companyId!,
              title: input.title.trim(),
              trade: input.trade,
              city: input.city.trim(),
              region: input.region.trim().toUpperCase(),
              type: input.type,
              pay: input.pay.trim(),
              description: input.description.trim(),
              requirements,
              createdAt: new Date().toISOString(),
            },
            ...current.jobs,
          ],
        }));
        showToast("Job posted.");
        return null;
      },
      deleteJob: (jobId) => {
        const user = requireUser();
        const job = stateRef.current.jobs.find((item) => item.id === jobId);
        const company = job && stateRef.current.companies.find((item) => item.id === job.companyId);
        if (!user || !job || !company || company.ownerId !== user.id) return "You can only remove your own jobs.";
        update((current) => ({
          ...current,
          jobs: current.jobs.filter((item) => item.id !== jobId),
          applications: current.applications.filter((item) => item.jobId !== jobId),
        }));
        showToast("Job removed.");
        return null;
      },
      sendMessage: (toUserId, body) => {
        const user = requireUser();
        if (!user) return "Sign in to send a message.";
        if (user.id === toUserId) return "You cannot message yourself.";
        const text = body.trim();
        if (!text) return "Write a message first.";
        const recipient = stateRef.current.users.find((item) => item.id === toUserId);
        if (!recipient) return "That person is not on TradeVerified.";
        update((current) => {
          const existing = current.threads.find(
            (thread) => thread.participantIds.includes(user.id) && thread.participantIds.includes(toUserId),
          );
          const threadId = existing?.id ?? uid("t");
          const now = new Date().toISOString();
          return {
            ...current,
            threads: existing
              ? current.threads.map((thread) => (thread.id === threadId ? { ...thread, updatedAt: now } : thread))
              : [{ id: threadId, participantIds: [user.id, toUserId], updatedAt: now }, ...current.threads],
            messages: [
              ...current.messages,
              { id: uid("m"), threadId, senderId: user.id, body: text, createdAt: now, read: false },
            ],
            notifications: [
              {
                id: uid("n"),
                userId: toUserId,
                title: "New message",
                body: `${user.name} sent you a message.`,
                href: `/messages?with=${user.id}`,
                createdAt: now,
                read: false,
              },
              ...current.notifications,
            ],
          };
        });
        showToast("Message sent.");
        return null;
      },
      markThreadRead: (threadId) => {
        const user = requireUser();
        if (!user) return;
        update((current) => ({
          ...current,
          messages: current.messages.map((message) =>
            message.threadId === threadId && message.senderId !== user.id ? { ...message, read: true } : message,
          ),
        }));
      },
      markNotificationsRead: () => {
        const user = requireUser();
        if (!user) return;
        update((current) => ({
          ...current,
          notifications: current.notifications.map((item) => (item.userId === user.id ? { ...item, read: true } : item)),
        }));
      },
      addReview: (input) => {
        const user = requireUser();
        if (!user) return "Sign in to leave a review.";
        const pro = stateRef.current.professionals.find((item) => item.id === input.professionalId);
        if (!pro) return "Profile not found.";
        if (pro.userId === user.id) return "You cannot review your own profile.";
        if (input.rating < 1 || input.rating > 5) return "Choose a rating from 1 to 5.";
        if (input.body.trim().length < 12) return "Say what happened on the job.";
        if (input.proof.trim().length < 3) return "Add a proof reference, such as an invoice or job number.";
        if (pro.reviews.some((review) => review.authorUserId === user.id)) return "You already reviewed this profile.";
        const company = stateRef.current.companies.find((item) => item.ownerId === user.id);
        update((current) => ({
          ...current,
          professionals: current.professionals.map((item) =>
            item.id === pro.id
              ? {
                  ...item,
                  reviews: [
                    {
                      id: uid("r"),
                      author: company?.name ?? user.name,
                      authorUserId: user.id,
                      location: company?.location ?? "",
                      rating: input.rating,
                      body: input.body.trim(),
                      createdAt: new Date().toISOString(),
                      tags: input.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 3),
                      proof: input.proof.trim(),
                    },
                    ...item.reviews,
                  ],
                }
              : item,
          ),
          notifications: [
            {
              id: uid("n"),
              userId: pro.userId,
              title: "New review",
              body: `${company?.name ?? user.name} left a ${input.rating}.0 review.`,
              href: `/professionals/${pro.slug}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...current.notifications,
          ],
        }));
        showToast("Review posted.");
        return null;
      },
      updateProfile: (input) => {
        const user = requireUser();
        if (!user?.professionalId) return "Create a tradesperson profile first.";
        if (!input.title.trim() || !input.city.trim() || !input.region.trim()) return "Title, city, and region are required.";
        if (input.years < 0 || input.years > 60) return "Years of experience looks off.";
        update((current) => ({
          ...current,
          professionals: current.professionals.map((pro) =>
            pro.id === user.professionalId
              ? {
                  ...pro,
                  title: input.title.trim(),
                  city: input.city.trim(),
                  region: input.region.trim().toUpperCase(),
                  about: input.about.trim(),
                  skills: input.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 12),
                  years: input.years,
                  rate: input.rate.trim(),
                  availability: input.availability,
                  licensed: input.licensed,
                  insured: input.insured,
                  backgroundChecked: input.backgroundChecked,
                  osha: input.osha,
                }
              : pro,
          ),
          users: current.users.map((item) => (item.id === user.id ? { ...item, name: proName(current, user.id) } : item)),
        }));
        showToast("Profile saved.");
        return null;
      },
      addPortfolio: (item) => {
        const user = requireUser();
        const pro = user?.professionalId
          ? stateRef.current.professionals.find((entry) => entry.id === user.professionalId)
          : null;
        if (!user || !pro) return "Only tradesperson profiles can add work.";
        if (!item.title.trim() || !item.summary.trim()) return "Name the job and say what you did.";
        if (user.plan === "free" && pro.portfolio.length >= 3) {
          return "Free profiles show 3 projects. Pro removes the cap.";
        }
        update((current) => ({
          ...current,
          professionals: current.professionals.map((entry) =>
            entry.id === pro.id
              ? {
                  ...entry,
                  portfolio: [
                    ...entry.portfolio,
                    {
                      id: uid("w"),
                      title: item.title.trim(),
                      location: item.location.trim() || place(pro),
                      summary: item.summary.trim(),
                      image: item.image,
                    },
                  ],
                }
              : entry,
          ),
        }));
        showToast("Project added.");
        return null;
      },
      removePortfolio: (id) => {
        const user = requireUser();
        if (!user?.professionalId) return;
        update((current) => ({
          ...current,
          professionals: current.professionals.map((pro) =>
            pro.id === user.professionalId ? { ...pro, portfolio: pro.portfolio.filter((item) => item.id !== id) } : pro,
          ),
        }));
      },
      addCredential: (input) => {
        const user = requireUser();
        if (!user?.professionalId) return "Only tradesperson profiles can add credentials.";
        if (!input.name.trim() || !input.reference.trim() || !input.issuer.trim()) {
          return "Name, issuer, and reference number are required.";
        }
        if (!input.issued || !input.expires) return "Issued and expiration dates are required.";
        const credential: Credential = {
          id: uid("c"),
          name: input.name.trim(),
          detail: input.detail.trim(),
          issuer: input.issuer.trim(),
          issued: input.issued,
          expires: input.expires,
          reference: input.reference.trim(),
          status: "pending",
          source: "Submitted · not checked yet",
        };
        update((current) => ({
          ...current,
          professionals: current.professionals.map((pro) =>
            pro.id === user.professionalId ? { ...pro, credentials: [...pro.credentials, credential] } : pro,
          ),
        }));
        showToast("Credential saved as pending.");
        return null;
      },
      checkCredential: (id) => {
        const user = requireUser();
        const pro = user?.professionalId
          ? stateRef.current.professionals.find((entry) => entry.id === user.professionalId)
          : null;
        const credential = pro?.credentials.find((item) => item.id === id);
        if (!pro || !credential) return "Credential not found.";
        const hasDigit = /\d/.test(credential.reference);
        const longEnough = credential.reference.trim().length >= 5;
        const stillValid = parseDate(credential.expires).getTime() > Date.now();
        if (!hasDigit || !longEnough || !stillValid) {
          update((stateNow) => ({
            ...stateNow,
            professionals: stateNow.professionals.map((entry) =>
              entry.id === pro.id
                ? {
                    ...entry,
                    credentials: entry.credentials.map((item) =>
                      item.id === id
                        ? { ...item, status: "pending", source: "Check failed · confirm the number and a future expiration" }
                        : item,
                    ),
                  }
                : entry,
            ),
          }));
          return "The number needs at least 5 characters and a digit, and the expiration has to be in the future. This check does not call a license board.";
        }
        update((stateNow) => ({
          ...stateNow,
          professionals: stateNow.professionals.map((entry) =>
            entry.id === pro.id
              ? {
                  ...entry,
                  credentials: entry.credentials.map((item) =>
                    item.id === id
                      ? { ...item, status: "verified", source: "Workspace check · number format and expiration date" }
                      : item,
                  ),
                }
              : entry,
          ),
        }));
        showToast("Credential checked. The badge shows exactly what was verified.");
        return null;
      },
      updateCompany: (patch) => {
        const user = requireUser();
        if (!user?.companyId) return "Employer accounts have a company page.";
        if (!patch.name.trim() || !patch.location.trim()) return "Company name and location are required.";
        update((current) => ({
          ...current,
          companies: current.companies.map((company) =>
            company.id === user.companyId
              ? {
                  ...company,
                  name: patch.name.trim(),
                  location: patch.location.trim(),
                  about: patch.about.trim(),
                  website: patch.website.trim(),
                  focus: patch.focus.trim() || company.focus,
                }
              : company,
          ),
        }));
        showToast("Company page saved.");
        return null;
      },
      setPlan: (plan) => {
        const user = requireUser();
        if (!user) return "Sign in before choosing a plan.";
        if (user.role === "worker" && plan === "employer") return "Employer is for hiring accounts.";
        if (user.role === "employer" && plan !== "employer") return "Hiring accounts stay on the employer plan in this workspace.";
        update((current) => ({
          ...current,
          users: current.users.map((item) => (item.id === user.id ? { ...item, plan } : item)),
          professionals: current.professionals.map((pro) =>
            pro.id === user.professionalId ? { ...pro, featured: plan === "pro" } : pro,
          ),
        }));
        showToast(plan === "pro" ? "Pro is active on this account." : "Plan updated.");
        return null;
      },
      toggleMembership: (groupId) => {
        const user = requireUser();
        if (!user) return "Sign in to join a group.";
        update((current) => {
          const list = current.memberships[user.id] ?? [];
          const next = list.includes(groupId) ? list.filter((id) => id !== groupId) : [...list, groupId];
          return { ...current, memberships: { ...current.memberships, [user.id]: next } };
        });
        return null;
      },
      postToGroup: (groupId, body) => {
        const user = requireUser();
        if (!user) return "Sign in to post.";
        const text = body.trim();
        if (text.length < 8) return "Write something the crew can use.";
        const member = (stateRef.current.memberships[user.id] ?? []).includes(groupId);
        if (!member) return "Join the group before posting.";
        update((current) => ({
          ...current,
          groupPosts: [
            { id: uid("gp"), groupId, authorId: user.id, body: text, createdAt: new Date().toISOString() },
            ...current.groupPosts,
          ],
        }));
        showToast("Posted to the group.");
        return null;
      },
      submitLead: (input) => {
        if (input.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
          return "Name and a real email are required.";
        }
        if (input.message.trim().length < 12) return "Tell us what you need.";
        update((current) => ({
          ...current,
          leads: [
            {
              id: uid("lead"),
              name: input.name.trim(),
              email: input.email.trim(),
              company: input.company.trim(),
              message: input.message.trim(),
              createdAt: new Date().toISOString(),
            },
            ...current.leads,
          ],
        }));
        showToast("Request saved. A production app would email the team from here.");
        return null;
      },
      recordProView: (professionalId) => {
        const viewer = stateRef.current.sessionUserId;
        const pro = stateRef.current.professionals.find((item) => item.id === professionalId);
        if (!pro || pro.userId === viewer) return;
        const key = `tv-view-pro-${professionalId}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        update((current) => ({
          ...current,
          professionals: current.professionals.map((item) =>
            item.id === professionalId ? { ...item, views: item.views + 1 } : item,
          ),
        }));
      },
      recordCompanyView: (companyId) => {
        const viewer = stateRef.current.sessionUserId;
        const company = stateRef.current.companies.find((item) => item.id === companyId);
        if (!company || company.ownerId === viewer) return;
        const key = `tv-view-co-${companyId}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        update((current) => ({
          ...current,
          companies: current.companies.map((item) => (item.id === companyId ? { ...item, views: item.views + 1 } : item)),
        }));
      },
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setState(createSeedState());
        showToast("Workspace reset to the sample marketplace.");
      },
    };
  }, [ready, showToast, state, toast, update]);

  return (
    <StoreContext.Provider value={api}>
      {ready ? children : <BootScreen />}
      {toast ? (
        <div className="fixed bottom-4 right-4 z-[70] max-w-sm rounded-2xl bg-navy px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </StoreContext.Provider>
  );
}

function proName(state: AppState, userId: string) {
  return state.users.find((user) => user.id === userId)?.name ?? "";
}

function BootScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas text-ink">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </span>
        <span className="text-lg font-semibold">TradeVerified</span>
      </div>
    </div>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}
