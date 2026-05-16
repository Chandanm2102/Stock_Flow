import { Package, BarChart3, Bell, ShoppingCart, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Add, edit, and track products with cost and selling prices",
  },
  {
    icon: ShoppingCart,
    title: "Sales Recording",
    description: "Record sales instantly and auto-update stock levels",
  },
  {
    icon: Bell,
    title: "Low Stock Alerts",
    description: "Get notified when products fall below threshold",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "View daily, weekly, and monthly sales reports",
  },
];

const benefits = [
  "Simple and easy to use",
  "Mobile-friendly design",
  "Real-time stock tracking",
  "No technical expertise needed",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">StockFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" data-testid="button-login">Log In</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
              Digital Inventory Management for Small Stores
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple and powerful inventory system to track stock, record sales, get
              low-stock alerts, and generate reports. No technical expertise required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" data-testid="button-get-started-hero">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Everything You Need to Manage Inventory
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Streamline Your Store?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join shopkeepers who save time and reduce errors with digital inventory
              management.
            </p>
            <Link href="/register">
              <Button size="lg" data-testid="button-start-now">
                Start Managing Inventory
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>StockFlow - Digital Inventory Management for Small Stores</p>
        </div>
      </footer>
    </div>
  );
}
