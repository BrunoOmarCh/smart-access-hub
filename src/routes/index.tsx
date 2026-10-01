import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fingerprint, ScanFace, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, ErrorMsg, Field, Input } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Iniciar sesión", "Accede a SmartAccess, el control de acceso biométrico multimodal para condominios."),
  component: Login,
});

function Login() {
  const { usuario, iniciarSesion } = useStore();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (usuario) navigate({ to: "/panel" });
  }, [usuario, navigate]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const r = iniciarSesion(correo, clave);
    if (!r.ok) setError(r.error ?? "Error");
  };

  return (
    <div className="bg-canvas relative grid min-h-screen place-items-center overflow-hidden p-4">
      <div className="bg-primary/30 absolute -top-32 -left-32 size-[480px] rounded-full blur-[130px]" />
      <div className="bg-accent/30 absolute -right-32 bottom-0 size-[480px] rounded-full blur-[130px]" />
      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <div className="hidden flex-col justify-center p-6 lg:flex">
          <div className="bg-primary text-primary-foreground grid size-12 place-items-center rounded-2xl shadow-lg shadow-primary/30">
            <span className="font-display text-xl font-bold">S</span>
          </div>
          <h1 className="font-display text-ink mt-6 text-4xl font-bold leading-tight">
            Acceso inteligente para tu condominio.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md">
            Reconocimiento biométrico multimodal, invitados temporales y registro de eventos, con
            protección de datos desde el diseño.
          </p>
          <div className="mt-8 space-y-3">
            {[
              [ScanFace, "Reconocimiento facial", "Plantillas protegidas, sin imágenes"],
              [Fingerprint, "Huella dactilar", "Verificación complementaria"],
              [ShieldCheck, "Privacidad", "Datos mínimos y trazabilidad"],
            ].map(([I, t, d]) => {
              const Icono = I as typeof ShieldCheck;
              return (
                <div key={t as string} className="glass-soft flex items-center gap-3 rounded-2xl p-3">
                  <span className="bg-brand-soft text-primary grid size-9 place-items-center rounded-xl">
                    <Icono className="size-4" />
                  </span>
                  <div>
                    <p className="text-ink text-sm font-semibold">{t as string}</p>
                    <p className="text-muted-foreground text-xs">{d as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <form onSubmit={enviar} className="glass space-y-4 rounded-3xl p-8">
          <div>
            <h2 className="font-display text-ink text-2xl font-bold">Iniciar sesión</h2>
            <p className="text-muted-foreground mt-1 text-sm">Ingresa con tu cuenta de SmartAccess.</p>
          </div>
          <Field label="Correo electrónico">
            <Input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
          </Field>
          <Field label="Contraseña">
            <Input type="password" required value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••••" />
          </Field>
          <ErrorMsg>{error}</ErrorMsg>
          <Button type="submit" className="w-full py-2.5">Ingresar</Button>
          <div className="bg-neutral-soft space-y-2 rounded-2xl p-4 text-xs">
            <p className="text-ink font-semibold">Cuentas de demostración (clave: demo1234)</p>
            {["admin@smartaccess.demo", "residente@smartaccess.demo"].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => { setCorreo(c); setClave("demo1234"); }}
                className="text-primary block font-medium hover:underline"
              >
                {c}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
