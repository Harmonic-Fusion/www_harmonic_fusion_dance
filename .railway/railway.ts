import {
  defineRailway,
  github,
  image,
  project,
  service,
  volume,
} from "railway/iac";

export default defineRailway(() => {
  const remark42Data = volume("remark42-data", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "us-west2",
    sizeMB: 1024,
  });

  const www_harmonic_fusion_dance = service("www_harmonic_fusion_dance", {
    source: github("Harmonic-Fusion/www_harmonic_fusion_dance", {
      branch: "main",
      checkSuites: false,
    }),
    healthcheck: "/",
    healthcheckTimeout: 100,
    replicas: { "us-west2": 1 },
    networking: { privateNetworkEndpoint: "wwwharmonicfusiondance" },
    // TODO: add "www.harmonicfusion.dance" here once it's added as a custom
    // domain in the Railway dashboard, then re-run `railway config pull`.
    domains: ["harmonicfusion.dance"],
  });

  // Env vars are unmanaged (set in Railway / secret manager). SECRET is required.
  const remark42Comments = service("remark42-comments", {
    source: image("umputun/remark42:latest"),
    healthcheck: "/api/ping",
    healthcheckTimeout: 30,
    replicas: { "us-west2": 1 },
    domains: ["comments.harmonicfusion.dance"],
    volumeMounts: { "/srv/var": remark42Data },
  });

  return project("Harmonic Fusion Website", {
    variables: { managed: false },
    resources: [www_harmonic_fusion_dance, remark42Comments, remark42Data],
  });
});
