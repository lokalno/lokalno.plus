/** Runs before React so stale cached bundles still pick up a new server version. */
export default function VersionRefreshScript() {
  const script = `
(function () {
  try {
    var key = ${JSON.stringify("lokalno-app-version")};
    function checkVersion() {
      fetch("/api/health", { cache: "no-store", credentials: "same-origin" })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          var server = data && data.upload;
          if (!server) return;
          var stored = localStorage.getItem(key);
          if (stored && stored !== server) {
            localStorage.setItem(key, server);
            var url = new URL(location.href);
            url.searchParams.set("_v", server);
            url.searchParams.set("_t", String(Date.now()));
            location.replace(url.toString());
          } else if (!stored) {
            localStorage.setItem(key, server);
          }
        })
        .catch(function () {});
    }
    if ("requestIdleCallback" in window) {
      requestIdleCallback(checkVersion, { timeout: 8000 });
    } else {
      setTimeout(checkVersion, 3000);
    }
  } catch (e) {}
})();
`.trim();

  return (
    <script
      id="lokalno-version-refresh"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
