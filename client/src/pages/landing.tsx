import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiWhatsapp } from "react-icons/si";
import {
  FileText,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Check,
  MessageSquare,
  Send,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <SiWhatsapp className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">AutoInvoice</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/api/login">
              <Button variant="outline" size="sm" data-testid="button-login">
                Log In
              </Button>
            </a>
            <a href="/api/login">
              <Button size="sm" data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Instant PDF Generation
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Generate Invoices via{" "}
                <span className="text-primary">WhatsApp</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Send a simple message, get a professional PDF invoice. Perfect for small businesses who need to create invoices, quotations, and receipts on the go.
              </p>

              <div className="flex flex-wrap gap-3">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-hero-cta">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg">
                    See How It Works
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background rounded-2xl p-8 border shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <SiWhatsapp className="h-5 w-5" />
                    </div>
                    <div className="bg-card rounded-2xl rounded-tl-sm p-4 shadow-sm border max-w-xs">
                      <p className="text-sm">
                        Invoice for Ahmad, 3 website maintenance RM500 each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-4 max-w-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">INV-2024-001.pdf</span>
                      </div>
                      <p className="text-sm opacity-90">
                        Here is your invoice. Thank you for using AutoInvoice!
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Send className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-card border rounded-lg p-3 shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-muted-foreground">PDF Generated in 2s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional invoicing made simple. No app downloads, no complex software. Just send a message.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Send a simple message with customer details and items. We parse and generate the document automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Professional PDFs</h3>
                <p className="text-sm text-muted-foreground">
                  Beautiful, branded PDF documents with your company logo, details, and professional formatting.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Instant Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Get your PDF invoice delivered back via WhatsApp within seconds. Share with customers instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your business data is encrypted and secure. Only you can access your documents and company information.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Web Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Full dashboard to view all your documents, download PDFs, and manage your company profile.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Multiple Document Types</h3>
                <p className="text-sm text-muted-foreground">
                  Generate invoices, quotations, and receipts. All with the same simple WhatsApp message format.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Three simple steps to professional invoicing
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Set Up Your Company Profile</h3>
                <p className="text-muted-foreground">
                  Add your company name, address, logo, and contact details. This information appears on all your documents.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Send a WhatsApp Message</h3>
                <p className="text-muted-foreground">
                  Message our WhatsApp number with details like: "Invoice for John, 2 consulting hours RM200 each"
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Receive Your PDF</h3>
                <p className="text-muted-foreground">
                  Get your professional PDF invoice delivered back to you via WhatsApp, ready to share with your customer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground">
              Start free, upgrade as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="relative">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">Free</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Perfect for trying out AutoInvoice
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    10 documents per month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    WhatsApp integration
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Company branding
                  </li>
                </ul>
                <a href="/api/login" className="block">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  For growing businesses
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    50 documents per month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Custom logo on PDFs
                  </li>
                </ul>
                <a href="/api/login" className="block">
                  <Button className="w-full">
                    Start Pro Trial
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Business</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  For high-volume businesses
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Unlimited documents
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    Dedicated support
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    API access
                  </li>
                </ul>
                <a href="/api/login" className="block">
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <SiWhatsapp className="h-4 w-4" />
            </div>
            <span className="font-semibold">AutoInvoice</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 AutoInvoice. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
