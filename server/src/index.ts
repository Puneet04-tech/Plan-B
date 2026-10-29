import app from "./app";

const PORT = Number(process.env.PORT ?? 3000);

const server = app.listen(PORT, () => {
  console.log(`Plan B API listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

/**
 * Stop accepting new connections, let in-flight requests finish, then exit.
 * A second signal forces the exit so a stuck request cannot block a redeploy.
 */
function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received — shutting down gracefully`);
  server.close((error) => {
    if (error) {
      console.error("Error while closing the server:", error.message);
      process.exit(1);
    }
    console.log("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
