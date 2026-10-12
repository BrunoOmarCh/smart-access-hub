import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button, ErrorMsg, Field, Input } from "@/components/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/registro")({
  head: () =>
    meta(
      "Solicitar acceso",
      "Crea tu cuenta de residente en SmartAccess; la administración la aprobará.",
    ),
  component: Registro,
});

function Registro() {
  const { registrarse } = useStore();
  const [f, setF] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    clave: "",
    telefono: "",
    documento: "",
    vivienda: "",
  });
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.clave.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    setError("");
    setEnviando(true);
    const r = await registrarse(f);
    setEnviando(false);
    if (r.ok) setListo(true);
    else setError(r.error ?? "No se pudo crear la cuenta.");
  };

  return (
    <div className="bg-canvas relative grid min-h-screen place-items-center overflow-hidden p-4">
      <div className="bg-primary/30 absolute -top-32 -left-32 size-[480px] rounded-full blur-[130px]" />
      <div className="bg-accent/30 absolute -right-32 bottom-0 size-[480px] rounded-full blur-[130px]" />
      {listo ? (
        <div className="glass relative w-full max-w-md space-y-4 rounded-3xl p-8 text-center">
          <CheckCircle2 className="text-success mx-auto size-12" />
          <h1 className="font-display text-ink text-2xl font-bold">Solicitud enviada</h1>
          <p className="text-muted-foreground text-sm">
            Te enviamos un correo para confirmar tu dirección. Después, tu cuenta está pendiente de
            aprobación: la administración revisará tus datos y te asignará tu vivienda.
          </p>
          <Link to="/" className="text-primary inline-block font-semibold hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form
          onSubmit={enviar}
          className="glass relative grid w-full max-w-xl gap-4 rounded-3xl p-8 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h1 className="font-display text-ink text-2xl font-bold">Solicitar acceso</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Completa tus datos. Solo pedimos lo necesario para identificarte.
            </p>
          </div>
          <Field label="Nombre">
            <Input required value={f.nombre} onChange={set("nombre")} />
          </Field>
          <Field label="Apellido">
            <Input required value={f.apellido} onChange={set("apellido")} />
          </Field>
          <Field label="Documento (DNI)">
            <Input required value={f.documento} onChange={set("documento")} />
          </Field>
          <Field label="Teléfono">
            <Input value={f.telefono} onChange={set("telefono")} />
          </Field>
          <Field label="Vivienda (ej. A-202)">
            <Input required value={f.vivienda} onChange={set("vivienda")} />
          </Field>
          <Field label="Correo electrónico">
            <Input type="email" required value={f.correo} onChange={set("correo")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Contraseña (mín. 8 caracteres)">
              <Input type="password" required value={f.clave} onChange={set("clave")} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <ErrorMsg>{error}</ErrorMsg>
          </div>
          <Button type="submit" disabled={enviando} className="py-2.5 sm:col-span-2">
            {enviando ? "Enviando…" : "Crear cuenta"}
          </Button>
          <p className="text-muted-foreground text-center text-sm sm:col-span-2">
            ¿Ya tienes cuenta?{" "}
            <Link to="/" className="text-primary font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
