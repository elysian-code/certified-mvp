import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, Users, Award, ArrowRight, Star, TrendingUp, Zap, Globe } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Certified</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              How it Works
            </Link>
            <Link href="#verify" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Verify
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm font-medium text-gray-700">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-20 pb-24 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-100/50 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 text-sm font-medium">
            ✦ Professional Certification Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Certify Your Team,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Elevate Your Standards
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform for organizations to create, manage, and verify professional learning programs — from enrollment to certified achievement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="px-8 py-3 text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#verify">
              <Button size="lg" variant="outline" className="px-8 py-3 text-base border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl">
                Verify a Certificate
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2" aria-hidden="true">
                {["I", "A", "M", "K"].map((l) => (
                  <div key={l} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">{l}</div>
                ))}
              </div>
              <span>Trusted by 500+ professionals</span>
            </div>
            <div className="flex items-center gap-1.5" aria-label="Rating: 4.9 out of 5 stars">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />)}
              <span className="font-medium text-gray-700">4.9</span>
              <span>rating</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>SOC 2 compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-14 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Certificates Issued" },
            { value: "500+", label: "Organizations" },
            { value: "98%", label: "Completion Rate" },
            { value: "< 2min", label: "Verification Time" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-indigo-600 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-50 text-indigo-700 border-indigo-200">Features</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything you need to run a world-class certification program
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From program creation to verified certificates, Certified handles every step of the professional development journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                title: "Organization Management",
                desc: "Create and manage certification programs, track employee progress, and issue certificates all in one place.",
              },
              {
                icon: Zap,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                title: "AI-Powered CBT Tests",
                desc: "Generate intelligent computer-based tests automatically with AI — choose difficulty, question type, and count.",
              },
              {
                icon: Shield,
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
                title: "Tamper-Proof Verification",
                desc: "Every certificate gets a unique verification code. Anyone can verify authenticity in seconds — no login needed.",
              },
              {
                icon: Award,
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
                title: "Branded Certificates",
                desc: "Choose from professional certificate templates. Learners can download high-quality PDF certificates instantly.",
              },
              {
                icon: TrendingUp,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-600",
                title: "Real-time Analytics",
                desc: "Track completion rates, test scores, and learner progress with beautiful, actionable dashboards.",
              },
              {
                icon: Globe,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-600",
                title: "Flexible Enrollment",
                desc: "Employees join via invitation links or regular sign-up. Accept invitations and get enrolled automatically.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-50 text-indigo-700 border-indigo-200">How it Works</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Up and running in three steps
            </h2>
            <p className="text-lg text-gray-500">Simple enough for anyone, powerful enough for enterprise.</p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                color: "from-indigo-500 to-violet-600",
                bg: "bg-indigo-50",
                title: "Set up your program",
                desc: "Create a certification program with custom requirements, duration, CBT questions, report method, and your preferred certificate template.",
              },
              {
                step: "02",
                color: "from-emerald-500 to-teal-600",
                bg: "bg-emerald-50",
                title: "Invite & enroll learners",
                desc: "Send personalized email invitations. Learners sign up through your invite link and are automatically enrolled in their program.",
              },
              {
                step: "03",
                color: "from-violet-500 to-purple-600",
                bg: "bg-violet-50",
                title: "Test, grade & certify",
                desc: "Learners complete their one-time CBT test. Results are auto-graded (Excellent / Good / Pass / Fair / Fail) and certificates are instantly downloadable.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-6">
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Verification */}
      <section id="verify" className="py-24 px-4 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <Badge className="mb-4 bg-green-50 text-green-700 border-green-200">Free Verification</Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Verify a Certificate</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Enter the unique verification code printed on any Certified certificate to confirm its authenticity — instantly, for free, no login required.
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex gap-3">
              <label htmlFor="verify-code" className="sr-only">Certificate verification code</label>
              <input
                id="verify-code"
                type="text"
                placeholder="Enter verification code (e.g. ABC123XYZ789)"
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-lg">
                Verify
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              The verification code can be found at the bottom of any Certified certificate.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
            Ready to transform how you certify talent?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join forward-thinking organizations who use Certified to build trust through verified, professional credentials.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 px-10 py-3 text-base font-semibold rounded-xl shadow-xl">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Certified</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional certification management that builds trust and drives organizational excellence.
              </p>
            </div>
            {[
              {
                heading: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "How it Works", href: "#how-it-works" },
                  { label: "Verify Certificate", href: "#verify" },
                ],
              },
              {
                heading: "Company",
                links: [
                  { label: "About", href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Privacy Policy", href: "#" },
                ],
              },
              {
                heading: "Support",
                links: [
                  { label: "Help Center", href: "#" },
                  { label: "Documentation", href: "#" },
                  { label: "Status", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{col.heading}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Certified. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-gray-400">SOC 2 Compliant · SSL Secured</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
