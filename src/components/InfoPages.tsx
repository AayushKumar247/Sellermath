import { useState } from 'react';
import {
  Target,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Shield,
  FileText,
  Users,
} from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

interface InfoPagesProps {
  page: 'about' | 'contact' | 'privacy' | 'terms';
  onNavigate: (page: PageId) => void;
}

export default function InfoPages({ page, onNavigate }: InfoPagesProps) {
  switch (page) {
    case 'about':
      return <AboutPage />;
    case 'contact':
      return <ContactPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'terms':
      return <TermsPage />;
    default:
      return null;
  }
}

function PageWrapper({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function AboutPage() {
  return (
    <PageWrapper icon={Users} title="About Us" subtitle="The story behind SellerMath">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Our Mission</h3>
          <p className="text-slate-600 leading-relaxed">
            SellerMath was built to help Indian e-commerce sellers calculate exact margins,
            understand complex GST logistics, and stop losing money on hidden marketplace fees.
            We believe every seller — whether a solo entrepreneur on Meesho or a growing brand
            on Amazon — deserves a clear, honest picture of what they actually earn per order.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-emerald-600" strokeWidth={2} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Exact Margins</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time profit calculation across 8+ marketplaces with live fee structures.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" strokeWidth={2} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">GST Clarity</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              CGST, SGST, IGST, TCS, and input tax credit — broken down line by line.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-amber-600" strokeWidth={2} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">No Hidden Fees</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every deduction surfaced — commission, closing, shipping, RTO, and tax.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Built for India's sellers</h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            From quick-commerce margins to GST invoice generation, SellerMath covers the full
            spectrum of tools that Indian online sellers need to run a profitable business.
            All calculations run locally in your browser — your data never leaves your device.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}

function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setMessage('');
    }, 4000);
  };

  return (
    <PageWrapper icon={Mail} title="Contact Us" subtitle="We're here to help">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Email</p>
              <p className="text-sm font-bold text-slate-900">support@sellermath.com</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Location</p>
              <p className="text-sm font-bold text-slate-900">Bengaluru, India</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Message Sent!</h3>
            <p className="text-sm text-slate-500">
              Thanks for reaching out. We'll get back to you within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Send us a message</h3>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-xl border-2 border-slate-200 px-4 py-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </form>
        )}
      </div>
    </PageWrapper>
  );
}

function PrivacyPage() {
  const sections: { title: string; body: string }[] = [
    {
      title: '1. Overview',
      body: 'SellerMath is a browser-based e-commerce profit calculation tool. We are committed to protecting your privacy and being transparent about how data is handled. This Privacy Policy explains what information is collected and how it is used when you use our website and tools.',
    },
    {
      title: '2. No Personal Financial Data Stored',
      body: 'All calculations performed on SellerMath — including selling prices, costs, GST rates, marketplace fees, and profit breakdowns — are computed entirely within your browser using client-side JavaScript. We do not transmit, store, or process your financial data on our servers. Your calculation inputs and results never leave your device unless you explicitly choose to print or export them.',
    },
    {
      title: '3. Information We Collect',
      body: 'SellerMath does not require account registration or login. We do not collect personally identifiable information through the calculator itself. If you contact us via our contact form, we collect the name, email, and message you voluntarily provide solely to respond to your inquiry.',
    },
    {
      title: '4. Cookies and Local Storage',
      body: 'SellerMath does not use tracking cookies. The application may use browser local storage to remember your last-used settings and preferences. This data is stored on your device and can be cleared at any time through your browser settings.',
    },
    {
      title: '5. Third-Party Services',
      body: 'SellerMath may display links to third-party services such as logistics providers or marketplace platforms. We are not responsible for the privacy practices of these external services. We encourage you to review their privacy policies before sharing any information with them.',
    },
    {
      title: '6. Data Security',
      body: 'Since your financial data is processed locally in your browser and not transmitted to our servers, the risk of data interception is minimal. Any contact form submissions are handled through standard web protocols. We do not sell, rent, or share your information with third parties.',
    },
    {
      title: '7. Children\'s Privacy',
      body: 'SellerMath is a business tool designed for e-commerce sellers and is not directed at children under 13. We do not knowingly collect information from children.',
    },
    {
      title: '8. Changes to This Policy',
      body: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Any updates will be posted on this page with a revised date.',
    },
    {
      title: '9. Contact Us',
      body: 'If you have questions about this Privacy Policy, you can reach us at support@sellermath.com.',
    },
  ];

  return (
    <PageWrapper icon={Shield} title="Privacy Policy" subtitle="Last updated: October 2026">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold text-slate-900 mb-2">{section.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

function TermsPage() {
  const sections: { title: string; body: string }[] = [
    {
      title: '1. Acceptance of Terms',
      body: 'By accessing and using SellerMath, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our website or tools.',
    },
    {
      title: '2. Description of Service',
      body: 'SellerMath is a free, browser-based mathematical estimation tool designed for Indian e-commerce sellers. It provides profit calculations, GST breakdowns, fee estimates, and invoice generation for marketplaces including Amazon, Flipkart, Meesho, Myntra, Blinkit, Zepto, Instamart, and Snapdeal.',
    },
    {
      title: '3. Not Official Tax or Financial Advice',
      body: 'SellerMath is a mathematical estimation tool and is NOT official tax, accounting, or financial advice. The commission rates, fee structures, GST calculations, and profit estimates provided by this tool are approximations based on publicly available information and may not reflect the exact rates applicable to your specific seller account, category, or marketplace agreement. Always consult a qualified Chartered Accountant or tax professional before making business or tax decisions based on calculations from this tool.',
    },
    {
      title: '4. Accuracy of Calculations',
      body: 'While we strive to keep marketplace fee structures and GST rates current, marketplace commission rates, closing fees, shipping charges, and tax rules change frequently. SellerMath does not guarantee that the preset rates match your actual marketplace agreement. You are encouraged to override the auto-filled rates with your actual contracted rates for accurate results.',
    },
    {
      title: '5. Intellectual Property',
      body: 'All content on SellerMath, including the calculator interface, fee matrix, FAQ content, and page designs, is the property of SellerMath and is protected by applicable intellectual property laws. You may use the tool for personal and commercial purposes but may not copy, redistribute, or reverse-engineer the application.',
    },
    {
      title: '6. Limitation of Liability',
      body: 'SellerMath is provided "as is" without warranties of any kind, express or implied. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of or reliance on calculations produced by this tool. You use SellerMath at your own risk.',
    },
    {
      title: '7. External Links',
      body: 'SellerMath may contain links to third-party websites such as logistics providers and marketplace platforms. We are not responsible for the content, policies, or practices of these external sites.',
    },
    {
      title: '8. No Warranty',
      body: 'The service is provided without warranty of any kind. We do not guarantee uninterrupted access, error-free calculations, or that the tool will meet your specific requirements. Marketplace fee data may be outdated or incomplete.',
    },
    {
      title: '9. Governing Law',
      body: 'These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising from the use of SellerMath shall be subject to the jurisdiction of courts in Bengaluru, India.',
    },
    {
      title: '10. Changes to Terms',
      body: 'We reserve the right to update or modify these Terms and Conditions at any time. Continued use of SellerMath after changes constitutes acceptance of the revised terms.',
    },
    {
      title: '11. Contact',
      body: 'For questions about these Terms and Conditions, contact us at support@sellermath.com.',
    },
  ];

  return (
    <PageWrapper icon={FileText} title="Terms & Conditions" subtitle="Last updated: October 2026">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold text-slate-900 mb-2">{section.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
