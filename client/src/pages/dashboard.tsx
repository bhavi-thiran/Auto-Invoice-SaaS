import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Company, Document } from "@shared/schema";
import { planLimits } from "@shared/schema";

interface DashboardStats {
  totalDocuments: number;
  invoices: number;
  quotations: number;
  receipts: number;
  recentDocuments: Document[];
  company: Company | null;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const documentsUsed = stats?.company?.documentsUsedThisMonth || 0;
  const plan = (stats?.company?.subscriptionPlan || "starter") as keyof typeof planLimits;
  const limit = planLimits[plan];
  const remaining = limit === Infinity ? "Unlimited" : Math.max(0, limit - documentsUsed);
  const usagePercentage = limit === Infinity ? 0 : (documentsUsed / limit) * 100;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your invoicing overview.
          </p>
        </div>
        <Link href="/documents?create=true">
          <Button data-testid="button-create-document">
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-documents">
              {stats?.totalDocuments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-invoices-count">
              {stats?.invoices || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-quotations-count">
              {stats?.quotations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-receipts-count">
              {stats?.receipts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents this month</p>
                  <p className="text-2xl font-bold" data-testid="text-monthly-usage">
                    {documentsUsed} / {limit === Infinity ? "∞" : limit}
                  </p>
                </div>
                <Badge variant={usagePercentage > 80 ? "destructive" : "secondary"}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                </Badge>
              </div>

              {limit !== Infinity && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {remaining} documents remaining this month
                  </p>
                </div>
              )}

              {usagePercentage > 80 && limit !== Infinity && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>You're running low on documents. Consider upgrading.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-accent" />
              WhatsApp Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.company?.whatsappNumberId ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm">Connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send messages to your assigned number to create documents automatically.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Not configured</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set up your WhatsApp integration in Settings to start receiving documents via WhatsApp.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      Configure WhatsApp
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">Recent Documents</CardTitle>
          <Link href="/documents">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  data-testid={`card-document-${doc.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.documentNumber}</p>
                      <p className="text-xs text-muted-foreground">{doc.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {doc.documentType}
                    </Badge>
                    <span className="text-sm font-medium">
                      RM {(doc.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No documents yet</p>
              <Link href="/documents?create=true">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Document
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
