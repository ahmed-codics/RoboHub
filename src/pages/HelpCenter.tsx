import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Mail, Search as SearchIcon } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  category: string;
  items: FaqItem[];
};

const FAQ: FaqCategory[] = [
  {
    category: "Getting Started",
    items: [
      {
        question: "How do I sign up for RemoteRobotics?",
        answer:
          "Click Sign Up from the top navigation and register with your email and a password. You'll receive a confirmation email to verify your account. Once verified, you can complete your profile and start browsing jobs or posting work.",
      },
      {
        question: "What's the difference between a freelancer and a client?",
        answer:
          "Freelancers are robotics engineers and specialists who bid on jobs, offer service listings, and get paid for delivered work. Clients post jobs, review bids, and hire talent. Your account can hold both roles, so you can switch between hiring and offering services at any time.",
      },
      {
        question: "How do I complete my profile?",
        answer:
          "Open Settings and fill in your headline, bio, skills (such as ROS, motion planning, or embedded firmware), hourly rate, and portfolio links. A complete profile with clear robotics specialties ranks higher in search and earns more trust from clients.",
      },
      {
        question: "Can I import my CV or a PDF resume?",
        answer:
          "Yes. On your profile you can import a CV or PDF resume, and we'll pre-fill your experience, skills, and summary so you can review and edit them instead of typing everything from scratch. You can always adjust the extracted details before publishing.",
      },
    ],
  },
  {
    category: "For Freelancers",
    items: [
      {
        question: "How do I place a bid on a job?",
        answer:
          "Open a job from the Jobs page, review the requirements, then submit a bid with your proposed price, delivery timeline, and a message explaining your relevant robotics experience. Tailored bids that reference the client's specific problem win far more often than generic ones.",
      },
      {
        question: "How does the bid quota and premium work?",
        answer:
          "Free accounts get a limited number of bids per period so proposals stay high-quality. A premium subscription raises or removes your bid quota and unlocks additional visibility. You can upgrade any time from the premium checkout page.",
      },
      {
        question: "How do I create a service listing?",
        answer:
          "Go to Services and create a listing that packages what you offer, for example \"ROS 2 navigation stack setup\" or \"custom gripper firmware.\" Set a fixed price and scope so clients can order directly without posting a job first.",
      },
      {
        question: "How do I get paid through escrow?",
        answer:
          "When a client hires you, the agreed amount is funded into escrow before you start. Once you deliver the work and the client approves it, the funds are released to you minus the 5% platform fee. This protects both sides: you know the money is secured before you begin.",
      },
    ],
  },
  {
    category: "For Clients",
    items: [
      {
        question: "How do I post a job?",
        answer:
          "Click Post a Job, describe your robotics project, list required skills and deliverables, and set a budget and timeline. Clear scopes with hardware details, environment, and success criteria attract stronger bids from qualified engineers.",
      },
      {
        question: "How do I review and compare bids?",
        answer:
          "Each job shows all incoming bids with the freelancer's price, timeline, proposal message, profile, and reviews. Compare relevant experience and ratings, message candidates with follow-up questions, then accept the bid that best fits your project.",
      },
      {
        question: "What is the platform fee?",
        answer:
          "RemoteRobotics charges a 5% platform fee on completed jobs. The fee is deducted from the escrow amount when funds are released to the freelancer, so pricing stays transparent for both parties.",
      },
      {
        question: "How do I release escrow funds?",
        answer:
          "After the freelancer delivers the work, review it from the job page. When you're satisfied, approve the delivery to release the escrowed funds. If something is wrong, you can request revisions or open a dispute before releasing payment.",
      },
    ],
  },
  {
    category: "Payments & Escrow",
    items: [
      {
        question: "How does escrow work?",
        answer:
          "Escrow holds the client's payment securely from the moment a job is funded until the work is approved. The freelancer can start with confidence that the money exists, and the client keeps control until they accept the delivery.",
      },
      {
        question: "When are funds released?",
        answer:
          "Funds are released when the client approves the delivered work. At that point the freelancer receives the amount minus the 5% platform fee. Until approval, the funds remain safely held in escrow.",
      },
      {
        question: "Can I get a refund?",
        answer:
          "If work isn't delivered as agreed, the client can request revisions or open a dispute. Where escrow funds are involved, RemoteRobotics may assist in mediation and, at its discretion, release or refund the held funds based on the outcome.",
      },
      {
        question: "How are premium subscriptions billed?",
        answer:
          "Premium subscriptions are processed securely through our payment provider, Paymob, at the premium checkout page. Your plan details, price, and renewal terms are shown before you confirm the payment.",
      },
    ],
  },
  {
    category: "Trust & Safety",
    items: [
      {
        question: "How do reviews work?",
        answer:
          "After a job is completed, clients and freelancers can leave reviews and ratings for each other. Honest, specific feedback builds reputation on the Platform and helps everyone choose reliable partners for future robotics work.",
      },
      {
        question: "What happens if there's a dispute?",
        answer:
          "We encourage clients and freelancers to resolve issues directly first. If that fails and escrow funds are involved, you can open a dispute, and RemoteRobotics may step in to mediate, including deciding whether to release or refund held funds.",
      },
      {
        question: "How is verification handled?",
        answer:
          "Accounts are verified by email, and you can strengthen your profile with portfolio links, past work, and reviews. Verified, well-documented profiles earn more trust and tend to win more jobs and orders.",
      },
      {
        question: "How do I report a problem or a user?",
        answer:
          "If you encounter fraudulent listings, harassment, or anything that violates our terms, report it from the relevant job, message, or profile, or email our support team. We review reports and take action to keep the marketplace safe.",
      },
    ],
  },
];

const HelpCenter = () => {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return FAQ;
    return FAQ.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.question.toLowerCase().includes(normalized) ||
          item.answer.toLowerCase().includes(normalized),
      ),
    })).filter((group) => group.items.length > 0);
  }, [normalized]);

  const hasResults = filtered.length > 0;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Help Center</h1>
          <p className="mt-3 text-slate-500">
            Answers for freelancers and clients on the RemoteRobotics marketplace, from getting started to
            payments, escrow, and safety.
          </p>
          <div className="relative mx-auto mt-6 max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="pl-10"
              aria-label="Search help articles"
            />
          </div>
        </div>

        <div className="mt-12 space-y-10">
          {hasResults ? (
            filtered.map((group) => (
              <section key={group.category}>
                <h2 className="text-2xl font-bold text-slate-900">{group.category}</h2>
                <Accordion type="single" collapsible className="mt-3">
                  {group.items.map((item, index) => (
                    <AccordionItem key={item.question} value={`${group.category}-${index}`}>
                      <AccordionTrigger className="text-left text-slate-900">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))
          ) : (
            <p className="text-center text-slate-500">
              No results found for "{query}". Try a different search term or browse the categories above.
            </p>
          )}
        </div>

        <Card className="mt-12 p-8 text-center">
          <LifeBuoy className="mx-auto h-10 w-10 text-teal-600" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Still need help?</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Can't find what you're looking for? Our support team is happy to help with anything about jobs,
            bids, payments, or your account.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <a href="mailto:support@remoterobotics.example">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </a>
            </Button>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link to="/terms" className="text-teal-600 hover:underline">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-teal-600 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default HelpCenter;
