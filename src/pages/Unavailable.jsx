import { useEffect } from "react";
import { Wrench } from "lucide-react";

export default function Unavailable() {
  useEffect(() => {
    document.title = "WebStart | Indisponibilidade temporária";
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-4 py-10 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #34d399 1px, transparent 1px), linear-gradient(to bottom, #34d399 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <section className="relative w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <img src="/logo.svg" className="h-20" alt="WebStart Academy" />
        </div>

        <div className="rounded-2xl border-3 border-brand-800 bg-white p-7 text-brand-950 shadow-[6px_6px_0_0_#34d399] sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-3 border-brand-800 bg-brand-100 text-brand-800">
            <Wrench size={30} strokeWidth={2.5} aria-hidden="true" />
          </div>

          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-brand-600">
            Manutenção temporária
          </p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            Já voltamos a estar online.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-700 sm:text-lg">
            Os nossos serviços estão temporariamente indisponíveis. Estamos a
            trabalhar para resolver a situação o mais breve possível.
          </p>

          <div className="mt-8 border-t-3 border-brand-100 pt-5 text-sm font-bold text-brand-700">
            Obrigado pela compreensão.
          </div>

          <a
            href="/landing/"
            className="brutal-btn mt-6 inline-flex items-center justify-center rounded-lg border-3 border-brand-800 bg-brand-500 px-5 py-3 font-bold text-white shadow-[3px_3px_0_0_#064e3b] transition hover:-translate-x-px hover:-translate-y-px hover:bg-brand-600 hover:shadow-[4px_4px_0_0_#064e3b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Conhecer a WebStart
          </a>
        </div>
      </section>
    </main>
  );
}
