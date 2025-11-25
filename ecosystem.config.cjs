module.exports = {
  apps: [
    {
      name: "kernex_pos",
      script: "npm",
      args: "run start",
      cwd: "/home/kernex-kernexpos/htdocs/kernexpos.kernex.tech",
      watch: true, // Enable watching for backend
	  ignore_watch: ["backend/uploads", "logs"], // Ignore uploads and logs
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      env: {
        PORT: 5200,
        NODE_ENV: "production",
      },
    },
  ],
};
