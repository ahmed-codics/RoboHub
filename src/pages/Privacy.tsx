import AppShell from "@/components/layout/AppShell";

const Privacy = () => (
  <AppShell>
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-slate-500">Last updated: July 8, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly, such as your name, email, profile details, skills,
          portfolio, and imported CV data. We also collect information generated through your use of the
          Platform, including jobs, bids, messages, and payment records.
        </p>

        <h2>2. How We Use Information</h2>
        <p>
          We use your information to operate the marketplace, match clients and freelancers, process payments
          and escrow, provide notifications, prevent fraud, and improve the Platform.
        </p>

        <h2>3. Sharing of Information</h2>
        <p>
          Your public profile (name, headline, skills, portfolio, reviews) is visible to other users. We share
          data with service providers such as our hosting and payment processors solely to operate the
          Platform. We do not sell your personal information.
        </p>

        <h2>4. Payment Data</h2>
        <p>
          Payment card details are handled by our payment provider and are not stored on our servers. We retain
          transaction records necessary for accounting, tax, and dispute resolution.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your information for as long as your account is active or as needed to provide services and
          comply with legal obligations. You may request deletion of your account and associated data.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, export, or delete your
          personal data. To exercise these rights, contact us at the address below.
        </p>

        <h2>7. Security</h2>
        <p>
          We use industry-standard measures, including row-level security and encrypted connections, to protect
          your data. No method of transmission or storage is completely secure.
        </p>

        <h2>8. Contact</h2>
        <p>Privacy questions can be sent to privacy@remoterobotics.example.</p>
      </div>
    </div>
  </AppShell>
);

export default Privacy;
