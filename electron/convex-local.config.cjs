// Shared config for the bundled, offline Convex local backend.
// Read by both the build-time seed script (scripts/seed-backend.mjs) and the
// Electron main process (electron/main.cjs). The instance secret is fixed so a
// seed deployed at build time stays valid for the backend spawned at runtime.
//
// This is NOT a cloud credential. The backend binds to 127.0.0.1 only, has no
// network exposure, and grants nothing remotely — it is the local equivalent of
// a dev deployment secret for a single-user, offline-first desktop app.
module.exports = {
  instanceName: "anonymous-agent",
  instanceSecret:
    "37ebe5d58ca135f4c966eb6763b9ae78e588b4e59d1a4372fc868c01b2ae503f",
  cloudPort: 3210,
  sitePort: 3211,
  // Folder name (under app userData) where the live deployment lives at runtime.
  dataDirName: "convex-data",
};
