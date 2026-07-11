import AppShell from "@/components/layout/AppShell";

const Terms = () => (
  <AppShell>
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-slate-500">Last updated: July 8, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none">
        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using RemoteRobotics ("the Platform"), you agree to be bound by these Terms of
          Service. If you do not agree, you may not use the Platform. RemoteRobotics is a marketplace that
          connects clients with robotics engineers and freelancers.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You must provide accurate information when creating an account and are responsible for maintaining
          the security of your credentials. You may hold both client and freelancer roles. You are responsible
          for all activity that occurs under your account.
        </p>

        <h2>3. Jobs, Bids, and Contracts</h2>
        <p>
          Clients may post jobs and accept bids from freelancers. Once a bid is accepted, a contract is formed
          between the client and the freelancer. RemoteRobotics is not a party to that contract and does not
          guarantee the quality, safety, or legality of work delivered.
        </p>

        <h2>4. Payments and Escrow</h2>
        <p>
          Payments are processed through our payment provider. Funds for accepted jobs are held in escrow and
          released to the freelancer upon client approval. RemoteRobotics charges a 5% platform fee on
          completed jobs. Premium subscriptions are billed as described at checkout.
        </p>

        <h2>5. Prohibited Conduct</h2>
        <p>
          You may not use the Platform for unlawful purposes, circumvent fees, post fraudulent listings,
          harass other users, or attempt to disrupt the Platform's operation.
        </p>

        <h2>6. Disputes</h2>
        <p>
          Clients and freelancers are encouraged to resolve disputes directly. Where escrow funds are involved,
          RemoteRobotics may, at its discretion, assist in mediation, including releasing or refunding held funds.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          The Platform is provided "as is" without warranties of any kind. To the maximum extent permitted by
          law, RemoteRobotics shall not be liable for indirect, incidental, or consequential damages arising
          from your use of the Platform.
        </p>

        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Platform after changes take effect
          constitutes acceptance of the revised Terms.
        </p>

        <h2>9. Contact</h2>
        <p>Questions about these Terms can be sent to legal@remoterobotics.example.</p>
      </div>
    </div>
  </AppShell>
);

export default Terms;
