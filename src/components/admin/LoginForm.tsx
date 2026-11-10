"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { admin } from "@/content/admin";
import { brand } from "@/content/site";
import { checkDemoCredentials, isSignedIn, signIn } from "./session";

const t = admin.login;
const schema = z.object({
  email: z.email(t.errors.email),
  password: z.string().min(1, t.errors.password),
});
type Values = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [wrong, setWrong] = useState(false);
  const { register, handleSubmit, setValue, formState } = useForm<Values>({ resolver: zodResolver(schema) });
  const { errors, isSubmitting } = formState;

  // Already signed in (demo flag present): go straight to the dashboard.
  useEffect(() => {
    if (isSignedIn()) router.replace("/admin");
  }, [router]);

  const onSubmit = (v: Values) => {
    if (!checkDemoCredentials(v.email, v.password)) return setWrong(true);
    signIn();
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next?.startsWith("/admin") ? next : "/admin");
  };

  const fill = () => {
    setValue("email", t.demoEmail, { shouldValidate: true });
    setValue("password", t.demoPassword, { shouldValidate: true });
    setWrong(false);
  };

  return (
    <div className="flex min-h-svh flex-col">
      <p role="note" className="bg-caramel px-4 py-2 text-center text-sm font-medium text-espresso">
        {admin.demoBanner}
      </p>
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between bg-espresso p-12 text-cream lg:flex">
          <p className="font-serif text-3xl tracking-[0.3em]">
            {brand.name}
            <span className="-ml-[0.2em] text-caramel">.</span>
          </p>
          <div>
            <p className="eyebrow text-caramel">{t.title}</p>
            <p className="mt-4 max-w-sm font-serif text-5xl leading-tight">{brand.tagline}</p>
          </div>
          <p className="text-sm text-cream/70">{brand.signature}</p>
        </div>

        {/* Form */}
        <main className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft aria-hidden className="size-4" /> {t.back}
            </Link>
            <h1 className="mt-6 font-serif text-5xl">{t.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.subtitle}</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="h-11"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email", { onChange: () => setWrong(false) })}
                />
                {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password", { onChange: () => setWrong(false) })}
                />
                {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <p role="alert" className="min-h-5 text-sm text-destructive">{wrong ? t.errors.wrong : ""}</p>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
                {t.submit}
              </Button>
            </form>

            {/* Demo credentials, shown on purpose. */}
            <section aria-labelledby="demo-creds" className="mt-8 rounded-lg border border-caramel/40 bg-accent p-5">
              <h2 id="demo-creds" className="flex items-center gap-2 font-medium">
                <Info aria-hidden className="size-4 text-caramel-deep" /> {t.demoTitle}
              </h2>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">{t.email}</dt>
                <dd className="font-mono">{t.demoEmail}</dd>
                <dt className="text-muted-foreground">{t.password}</dt>
                <dd className="font-mono">{t.demoPassword}</dd>
              </dl>
              <p className="mt-3 text-sm text-muted-foreground">{t.demoNote}</p>
              <Button type="button" variant="outline" className="mt-4 h-11" onClick={fill}>
                {t.fill}
              </Button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
