// Shared Lucide icon wrapper.
// React.memo + imperative innerHTML so React never owns (or tries to reconcile)
// the <svg> that lucide.createIcons() swaps in for our <i data-lucide>.
const RWIcon = React.memo(function RWIcon({ name, size = 18, color }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = `<i data-lucide="${name}"></i>`;
    window.lucide.createIcons();
    const svg = el.querySelector("svg");
    if (svg) {
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.style.display = "block";
    }
  }, [name, size]);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{ display: "inline-flex", width: size, height: size, color: color || "inherit" }}
    />
  );
});
window.RWIcon = RWIcon;
