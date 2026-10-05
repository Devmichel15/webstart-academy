import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useProgress } from "../../hooks/useProgress.js";
import { updateOwnProfile } from "../../services/userService.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { toUserMessage } from "../../utils/errors.js";
import {
  NAME_MAX,
  NAME_MIN,
  isIncompleteProfileName,
  validateProfileName,
} from "../../utils/profileValidation.js";
import {
  clearDismissal,
  isInCooldown,
  persistDismissedAt,
  readDismissedAt,
} from "../../utils/incompleteProfilePrompt.js";

/**
 * Modal lateral que pede o nome quando o cadastro está incompleto.
 *
 * Montado uma vez em `AppLayout`, por isso decide sozinho se se abre. Só se
 * avalia uma vez por sessão para nunca reabrir a cada navegação ou clique; para
 * voltar a aparecer é preciso passar o cooldown de "Mais tarde" ou, simplesmente,
 * gravar o nome.
 */
export function IncompleteProfileDrawer() {
  const { user } = useAuth();
  const { name: profileName, profileLoaded } = useProgress();
  const { showSuccess, showError } = useToast();

  const [dismissedAt, setDismissedAt] = useState(() => readDismissedAt(window.localStorage));
  const [isOpen, setIsOpen] = useState(false);
  // Latch: só se avalia uma vez por sessão. Volta a armar quando o nome fica
  // completo, para que um utilizador que apague o nome volte a ser avisado.
  const [prompted, setPrompted] = useState(false);
  const [wasIncomplete, setWasIncomplete] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);

  const incomplete = isIncompleteProfileName(profileName);

  const shouldPrompt =
    !prompted && profileLoaded && Boolean(user) && incomplete && !isInCooldown(dismissedAt);

  // Ajuste de estado durante o render — o padrão que o React documenta para
  // "isto passou a ser verdade por causa das props". Um `useEffect` aqui
  // custava um render em cascata inteiro só para abrir o painel.
  if (wasIncomplete !== incomplete) {
    setWasIncomplete(incomplete);
    if (!incomplete) setPrompted(false);
  }
  if (shouldPrompt) {
    setPrompted(true);
    setIsOpen(true);
  }

  const dismiss = useCallback(() => {
    const at = Date.now();
    persistDismissedAt(window.localStorage, at);
    setDismissedAt(at);
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && !saving) {
        dismiss();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          "a[href], button:not([disabled]), input:not([disabled])",
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [dismiss, saving],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    document.body.classList.add("drawer-open");
    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      drawerRef.current?.querySelector("input:not([disabled])")?.focus();
    });

    return () => {
      document.body.classList.remove("drawer-open");
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateProfileName(value);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await updateOwnProfile(user.id, { name: validation.value });
      clearDismissal(window.localStorage);
      setDismissedAt(null);
      setIsOpen(false);
      setValue("");
      showSuccess("Nome guardado. Já apareces com o teu nome na classificação!");
    } catch (err) {
      console.error("[IncompleteProfileDrawer] save error:", err);
      showError(toUserMessage(err, "Não foi possível guardar o teu nome."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !saving && dismiss()}
            aria-hidden="true"
          />

          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="incomplete-profile-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l border-strong bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-strong px-5 py-4">
              <div>
                <h2 id="incomplete-profile-title" className="text-lg font-black text-primary">
                  Falta-te um nome
                </h2>
                <p className="mt-1 text-sm text-secondary">O teu cadastro não está completo.</p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-transparent transition hover:border-strong hover:bg-surface-hover"
                aria-label="Fechar"
              >
                <X size={20} className="text-primary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="mb-5 flex items-start gap-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  O teu nome é o que aparece na <strong>classificação semanal</strong>. Sem ele
                  mostras-te como <strong>Aluno anónimo</strong> e não dá para te ligarem.
                </p>
              </div>

              <label className="mb-1 block">
                <span className="mb-1 block text-sm font-bold text-primary">Como te chamas? *</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError("");
                  }}
                  minLength={NAME_MIN}
                  maxLength={NAME_MAX}
                  placeholder="O teu nome"
                  className="w-full rounded-lg border-3 border-brand-800 bg-white px-3 py-2 text-base text-black dark:border-brand-400 dark:bg-brand-950 dark:text-primary"
                />
              </label>
              {error ? (
                <p className="mt-1 text-xs font-bold text-red-500">{error}</p>
              ) : (
                <span className="mt-1 block text-right text-xs text-secondary">
                  {value.trim().length}/{NAME_MAX}
                </span>
              )}

              <div className="mt-auto flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={saving}
                  className="brutal-btn inline-flex items-center justify-center gap-2 rounded-lg bg-transparent px-4 py-2 font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mais tarde
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="brutal-btn inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
