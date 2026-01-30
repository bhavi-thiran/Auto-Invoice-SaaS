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
  ExternalLink,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { Company, SubscriptionPlan } from "@shared/schema";
import { planLimits, planPrices } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().min(1, "Phone number is required for WhatsApp invoicing"),
  email: z.string().email().optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [isUploading, setIsUploading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { uploadFile } = useUpload();

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
    },
    values: company ? {
      name: company.name || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadFile(file);
      if (response?.objectPath) {
        await apiRequest("PATCH", "/api/company", { logoUrl: response.objectPath });
        queryClient.invalidateQueries({ queryKey: ["/api/company"] });
        toast({
          title: "Logo uploaded",
          description: "Your company logo has been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === "starter") return;
    
    setCheckoutLoading(plan);
    try {
      const plansResponse = await fetch("/api/stripe/plans");
      const { plans } = await plansResponse.json();
      
      const planData = plans.find((p: any) => 
        p.product_metadata?.plan === plan
      );
      
      if (!planData?.price_id) {
        toast({
          title: "Plan not available",
          description: "This subscription plan is not yet configured.",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("POST", "/api/stripe/checkout", {
        priceId: planData.price_id,
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription portal.",
        variant: "destructive",
      });
    }
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
                      <AvatarImage src={company?.logoUrl ? (company.logoUrl.startsWith("/") ? company.logoUrl : company.logoUrl) : undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {company?.name?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium mb-1">Company Logo</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your logo will appear on all generated documents.
                      </p>
                      <Button variant="outline" size="sm" type="button" disabled={isUploading} asChild>
                        <label className="cursor-pointer">
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={isUploading}
                            data-testid="input-logo-upload"
                          />
                        </label>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 10MB
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
                          <FormLabel>Phone Number (WhatsApp) *</FormLabel>
                          <FormControl>
                            <Input placeholder="+60123456789" {...field} data-testid="input-company-phone" />
                          </FormControl>
                          <FormDescription>
                            Use this number to send invoice requests via WhatsApp
                          </FormDescription>
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
                WhatsApp Invoice Generation
              </CardTitle>
              <CardDescription>
                Generate invoices instantly by sending a WhatsApp message to AutoInvoice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  How to Generate Invoices via WhatsApp
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li><strong>Make sure your phone number is saved</strong> in Company settings</li>
                  <li><strong>Send a WhatsApp message</strong> to our AutoInvoice number</li>
                  <li><strong>Include invoice details</strong> in your message</li>
                  <li><strong>Receive your PDF</strong> automatically via WhatsApp</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Your Registered Phone Number</h4>
                  {company?.phone ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {company.phone}
                      </Badge>
                      <Check className="h-4 w-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Ready to use</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Please add your phone number in Company settings first</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Message Format Examples:</h4>
                <div className="space-y-2 text-sm font-mono bg-background rounded p-3 border">
                  <p className="text-muted-foreground"># Simple invoice:</p>
                  <p>Customer: John Smith</p>
                  <p>Product A - 2 x RM 50</p>
                  <p>Service B - 1 x RM 100</p>
                  <p>Tax: 6%</p>
                  <p className="text-muted-foreground mt-3"># For quotation, add "quotation":</p>
                  <p>Quotation for Jane Doe</p>
                  <p>Item 1 - 3 x RM 25</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>We identify you by your phone number. Make sure to message us from the same number registered in your account.</p>
              </div>
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
                      variant={isCurrentPlan ? "secondary" : "default"}
                      className="w-full"
                      disabled={isCurrentPlan || checkoutLoading !== null}
                      onClick={() => isCurrentPlan ? (company?.stripeCustomerId ? handleManageSubscription() : null) : handleUpgrade(plan)}
                      data-testid={`button-plan-${plan}`}
                    >
                      {checkoutLoading === plan ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : isCurrentPlan ? (
                        company?.stripeCustomerId ? (
                          <>
                            Manage
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </>
                        ) : "Current Plan"
                      ) : (
                        "Upgrade"
                      )}
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
