// Lead-form behaviour for every <form data-lead-form>:
// - sets FormSubmit _next to an absolute thank-you URL on this origin
// - client validation: required / email / tel; toggles the Figma "Error" field state via
//   [data-field][data-state="error"] + aria-invalid, and focuses the first invalid control.
function validate(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  const v = (control.value || '').trim();
  if (control.required && !v) return false;
  if (!v) return true;
  if (control.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  if (control.type === 'tel') return v.replace(/\D/g, '').length >= 10;
  if (control instanceof HTMLInputElement && control.type === 'checkbox') return !control.required || control.checked;
  return true;
}
function setState(control: Element, ok: boolean) {
  const field = control.closest('[data-field]') as HTMLElement | null;
  control.setAttribute('aria-invalid', ok ? 'false' : 'true');
  if (field) field.dataset.state = ok ? 'default' : 'error';
}
export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-lead-form]').forEach((form) => {
    const next = form.querySelector<HTMLInputElement>('[data-next]');
    if (next) next.value = new URL(next.value, location.origin).href;
    const controls = () => [...form.querySelectorAll<HTMLInputElement>('input:not([type=hidden]):not([name=_honey]), textarea, select')];
    controls().forEach((c) => {
      c.addEventListener('blur', () => { if (c.value) setState(c, validate(c)); });
      c.addEventListener('input', () => { const f = c.closest('[data-field]') as HTMLElement | null; if (f?.dataset.state === 'error' && validate(c)) setState(c, true); });
    });
    form.addEventListener('submit', (e) => {
      let first: HTMLElement | null = null;
      for (const c of controls()) { const ok = validate(c); setState(c, ok); if (!ok && !first) first = c; }
      const summary = form.querySelector<HTMLElement>('[data-form-error]');
      if (first) { e.preventDefault(); if (summary) summary.hidden = false; first.focus(); return; }
      if (summary) summary.hidden = true;
      const btn = form.querySelector<HTMLButtonElement>('button[type=submit]');
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    });
  });
}
initForms();
