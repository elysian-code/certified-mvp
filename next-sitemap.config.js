/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://certified-platform.vercel.app",
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  exclude: ["/dashboard/*", "/auth/*", "/api/*", "/verify/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/auth/", "/api/", "/admin/"],
      },
    ],
  },
}
