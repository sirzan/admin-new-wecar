import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({ meta: [{ title: "Sign in · Wecar Admin" }] }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (error) {
        toast.error("No pudimos iniciar sesión", {
          description: mapAuthError(error.message),
        });
        return;
      }

      await refresh();
      toast.success("Bienvenido");
      await navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error("Error inesperado", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const onResetPassword = async () => {
    const email = form.getValues("email").trim().toLowerCase();
    if (!email || !loginSchema.shape.email.safeParse(email).success) {
      form.setError("email", {
        type: "manual",
        message: "Ingresa tu email para enviar el enlace de recuperación",
      });
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success("Te enviamos un enlace de recuperación", {
        description: "Revisa tu bandeja de entrada.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error("No pudimos enviar el enlace", { description: message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background to-sidebar">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-[0_8px_24px_-8px_oklch(0.78_0.16_65/0.6)]">
            W
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Wecar Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicia sesión para gestionar la plataforma.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="admin@wecar.mx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Contraseña</FormLabel>
                      <button
                        type="button"
                        onClick={onResetPassword}
                        disabled={resetting}
                        className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetting ? "Enviando…" : "¿Olvidaste tu contraseña?"}
                      </button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-10" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Wecar Admin Panel · Acceso restringido
          <br />
          ¿Necesitas ayuda?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Contacta al superadmin
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Debes confirmar tu email antes de iniciar sesión.";
  }
  if (normalized.includes("user not found")) {
    return "No encontramos una cuenta con ese email.";
  }
  if (normalized.includes("too many requests")) {
    return "Demasiados intentos. Espera unos minutos.";
  }
  return message;
}
