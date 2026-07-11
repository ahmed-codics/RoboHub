import AppShell from "@/components/layout/AppShell";

const Cookies = () => (
  <AppShell>
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Cookie Policy</h1>
      <p className="mt-2 text-slate-500">Last updated: July 8, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none">
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that a website stores on your device when you visit. They are widely
          used to make websites work, or work more efficiently, as well as to remember your preferences and
          keep you signed in. This policy explains how RemoteRobotics ("the Platform") uses cookies and similar
          technologies such as local storage.
        </p>

        <h2>2. How We Use Cookies</h2>
        <p>We use cookies for the following purposes:</p>
        <ul>
          <li>
            <strong>Essential and authentication cookies.</strong> These keep you signed in and secure your
            session. We use Supabase for authentication, which stores your session token so you can move between
            pages, place bids, and manage jobs without logging in again. The Platform cannot function without
            these cookies.
          </li>
          <li>
            <strong>Preference cookies.</strong> These remember choices you make, such as your role view
            (client or freelancer), language, and interface settings, so your experience is consistent across
            visits.
          </li>
          <li>
            <strong>Analytics cookies.</strong> These help us understand how freelancers and clients use the
            Platform, which pages are popular, and where we can improve, using aggregated and anonymized usage
            data.
          </li>
        </ul>

        <h2>3. Managing Cookies</h2>
        <p>
          Most web browsers let you control cookies through their settings. You can usually block or delete
          cookies, or set your browser to alert you when a cookie is being set. Please note that blocking
          essential or authentication cookies will prevent you from signing in and using core features of the
          Platform, such as posting jobs, placing bids, and accessing escrow. Instructions for managing cookies
          can be found in the help section of your browser (for example, Chrome, Firefox, Safari, or Edge).
        </p>

        <h2>4. Third-Party Cookies</h2>
        <p>
          Some cookies are set by third parties that provide services on the Platform. In particular, our
          payment provider (Paymob) may set cookies during checkout to process payments securely, prevent
          fraud, and complete premium subscriptions. These cookies are governed by the privacy and cookie
          policies of the respective providers.
        </p>

        <h2>5. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology, law, or our
          practices. When we make material changes, we will update the "Last updated" date above. Continued use
          of the Platform after changes take effect constitutes acceptance of the revised policy.
        </p>

        <h2>6. Contact</h2>
        <p>Questions about our use of cookies can be sent to privacy@remoterobotics.example.</p>
      </div>
    </div>
  </AppShell>
);

export default Cookies;
