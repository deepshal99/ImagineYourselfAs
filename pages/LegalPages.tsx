import React from 'react';
import Navigation from '../components/Navigation';
import MetaHead from '../components/MetaHead';

const LegalLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
    <MetaHead title={`${title} | PosterMe`} description={`Read our ${title}.`} />
    <Navigation title="PosterMe" showBack={true} />
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
      <h1 className="text-3xl font-bold mb-8 text-white">{title}</h1>
      <div className="prose prose-invert prose-zinc max-w-none">
        {children}
      </div>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <LegalLayout title="Terms & Conditions">
    <div className="space-y-6 text-zinc-300">
      <section>
        <h2 className="text-xl font-bold text-white mb-2">1. Introduction</h2>
        <p>Welcome to PosterMe. By accessing or using our website and AI generation services, you agree to be bound by these Terms and Conditions.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">2. Service Description</h2>
        <p>PosterMe provides AI-powered image generation services ("Services"). Users can upload photos and generate stylized "personas" or posters using artificial intelligence credits.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">3. Pricing & Credits</h2>
        <p>Services are purchased using "Credits". The standard pricing is <strong>₹99 for 5 Credits</strong>. Promotional discounts may be applied at checkout. Prices are in Indian Rupees (INR) and are subject to change without notice.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">4. User Content</h2>
        <p>You retain ownership of the photos you upload. By uploading, you grant us a temporary license to process the image solely for the purpose of generating your requested content. We do not sell your personal photos.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">5. Prohibited Use</h2>
        <p>You agree not to upload illegal, offensive, or infringing content. We reserve the right to ban users who violate this policy.</p>
      </section>
    </div>
  </LegalLayout>
);

export const RefundPage: React.FC = () => (
  <LegalLayout title="Refund & Cancellation Policy">
    <div className="space-y-6 text-zinc-300">
      <section>
        <h2 className="text-xl font-bold text-white mb-2">1. Digital Goods</h2>
        <p>PosterMe offers digital AI generation credits. Due to the nature of digital goods and immediate consumption of computing resources, all sales are generally final.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">2. Refund Eligibility</h2>
        <p>Refunds may be considered under the following specific circumstances:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Technical Failure:</strong> If you purchased credits but they were not added to your account due to a system error.</li>
          <li><strong>Service Unavailability:</strong> If the AI service is permanently down or unusable for more than 48 hours after your purchase.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">3. Cancellation</h2>
        <p>Since this is a one-time purchase model (not a subscription), there is no subscription to cancel. You are not billed automatically.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">4. Requesting a Refund</h2>
        <p>To request a refund, please contact us at support@posterme.app with your Order ID and issue details. We will review your request within 3-5 business days.</p>
      </section>
    </div>
  </LegalLayout>
);

export const ContactPage: React.FC = () => (
  <LegalLayout title="Contact Us">
    <div className="space-y-6 text-zinc-300">
      <p className="text-lg">We'd love to hear from you. Whether you have a question about features, pricing, or need technical support, our team is ready to answer all your questions.</p>

      <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Get in Touch</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Email Support</p>
            <a href="mailto:support@posterme.app" className="text-blue-400 hover:underline text-lg">support@posterme.app</a>
          </div>

          <div>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Operating Address</p>
            <p className="text-white mt-1">
              PosterMe Digital Services<br />
              Bangalore, Karnataka, India<br />
              560001
            </p>
          </div>
        </div>
      </div>
    </div>
  </LegalLayout>
);

export const PrivacyPage: React.FC = () => (
  <LegalLayout title="Privacy Policy">
    <div className="space-y-6 text-zinc-300">
      <section>
        <h2 className="text-xl font-bold text-white mb-2">1. Data Collection</h2>
        <p>We collect only the minimum data necessary: your email address (for account identification) and the images you upload for processing.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">2. Image Processing</h2>
        <p>Images uploaded to PosterMe are processed by our AI providers. We do not use your photos to train public AI models. Images are stored securely to allow you to view your history.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-2">3. Third Parties</h2>
        <p>We use secure third-party payment gateways (Razorpay) for processing payments. We do not store your credit card information on our servers.</p>
      </section>
    </div>
  </LegalLayout>
);

