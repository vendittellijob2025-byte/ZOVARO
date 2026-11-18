(() => {
  "use strict";
  const backdrop = document.getElementById("zovaroAiBackdrop");
  const close = document.getElementById("zovaroAiClose");
  if (!backdrop || !close) return;
  const hide = () => {
    backdrop.hidden = true;
    document.body.style.overflow = "";
  };
  close.addEventListener("click", hide);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !backdrop.hidden) hide();
  });
  backdrop.hidden = false;
})();
