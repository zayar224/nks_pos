module.exports = {
  apps: [
    {
      name: "kernex-pos",
      script: "backend/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5200,
      },
      watch: false,
      max_restarts: 10,
      min_uptime: "5s",
      restart_delay: 5000,
      max_memory_restart: "500M",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_file: "logs/combined.log",
      time: true,
      ignore_watch: ["backend/uploads", "logs", "node_modules"],
    },
  ],
};
