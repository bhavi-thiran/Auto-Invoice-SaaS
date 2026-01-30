import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  CreditCard,
  Upload,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { Company, SubscriptionPlan } from "@shared/schema";
import { planLimits, planPrices } from "@shared/schema";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsappNumberId: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      whatsappNumberId: "",
    },
    values: company ? {
      name: company.name || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      whatsappNumberId: company.whatsappNumberId || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest("PATCH", "/api/company", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Settings saved",
        description: "Your company details have been updated.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    updateMutation.mutate(data);
  };

  const currentPlan = (company?.subscriptionPlan || "starter") as SubscriptionPlan;
  const planLimit = planLimits[currentPlan];
  const planPrice = planPrices[currentPlan];

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company profile and subscription
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="company" data-testid="tab-company">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">
            <SiWhatsapp className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="subscription" data-testid="tab-subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                This information will appear on your invoices and other documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex items-center gap-6 pb-6 border-b">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={company?.logoUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {company?.name?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium mb-1">Company Logo</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your logo will appear on all generated documents.
                      </p>
                      <Button variant="outline" size="sm" type="button" disabled>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Logo upload coming soon
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} data-testid="input-company-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Email</FormLabel>
                          <FormControl>
                            <Input placeholder="hello@company.com" {...field} data-testid="input-company-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+60123456789" {...field} data-testid="input-company-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="123 Business Street, City, Country"
                            className="resize-none"
                            rows={3}
                            {...field}
                            data-testid="textarea-company-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-company"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SiWhatsapp className="h-5 w-5 text-accent" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Connect your WhatsApp Business account to receive messages and generate documents automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">How it works:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Get your WhatsApp Business Number ID from Meta Business Suite</li>
                      <li>Enter the ID below to link your account</li>
                      <li>Send messages like: "Invoice for John, 2 items RM100 each"</li>
                      <li>Receive your generated PDF automatically via WhatsApp</li>
                    </ol>
                  </div>

                  <FormField
                    control={form.control}
                    name="whatsappNumberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your WhatsApp Business Number ID"
                            {...field}
                            data-testid="input-whatsapp-id"
                          />
                        </FormControl>
                        <FormDescription>
                          Find this in your Meta Business Suite under WhatsApp settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {company?.whatsappNumberId ? (
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <Check className="h-4 w-4" />
                      <span>WhatsApp integration is configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>WhatsApp integration not configured yet</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-whatsapp"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save WhatsApp Settings"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {(["starter", "pro", "business"] as const).map((plan) => {
              const isCurrentPlan = currentPlan === plan;
              const limit = planLimits[plan];
              const price = planPrices[plan];

              return (
                <Card
                  key={plan}
                  className={isCurrentPlan ? "border-primary shadow-md" : ""}
                >
                  {isCurrentPlan && (
                    <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-medium rounded-t-lg">
                      Current Plan
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="capitalize">{plan}</CardTitle>
                    <CardDescription>
                      {plan === "starter" && "Perfect for getting started"}
                      {plan === "pro" && "For growing businesses"}
                      {plan === "business" && "For high-volume needs"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        {limit === Infinity ? "Unlimited" : limit} documents/month
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        WhatsApp integration
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent" />
                        PDF generation
                      </li>
                      {plan !== "starter" && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-accent" />
                          Priority support
                        </li>
                      )}
                      {plan === "business" && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-accent" />
                          API access
                        </li>
                      )}
                    </ul>

                    <Button
                      variant={isCurrentPlan ? "secondary" : "outline"}
                      className="w-full"
                      disabled={isCurrentPlan}
                      data-testid={`button-plan-${plan}`}
                    >
                      {isCurrentPlan ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold" data-testid="text-documents-used">
                    {company?.documentsUsedThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    documents created
                  </p>
                </div>
                <Badge variant="outline" className="text-lg">
                  {planLimit === Infinity ? "Unlimited" : `${planLimit} limit`}
                </Badge>
              </div>

              {planLimit !== Infinity && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          ((company?.documentsUsedThisMonth || 0) / planLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.max(0, planLimit - (company?.documentsUsedThisMonth || 0))} documents remaining
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Skeleton className="h-10 w-80" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
