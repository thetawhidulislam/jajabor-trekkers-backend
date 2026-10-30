# Jajabor Trekkers — Backend

Travel & outdoor companion API. Modular monolith: Node.js, Express, TypeScript, PostgreSQL, Prisma, Better Auth, Zod.

See `.github/copilot-instructions.md` for rules and `docs/PROMPT_PLAN.md` for the build order.

## Image uploads

Authenticated clients request a signed upload from `POST /api/v1/uploads/signature` with `{"folder":"avatars"}`; only admins may request the `destinations` folder. The response includes the Cloudinary cloud name, API key, timestamp, folder, and signature. The browser uploads the image directly to Cloudinary using those values and then saves the returned `secure_url` in the user's profile or destination. The backend never receives the image bytes. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable uploads; the endpoint returns 503 when they are unavailable.
