# Kinó Café backend

1. Crea un bucket Cloudflare R2 e usalo per settare le env `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
2. Registrati su MailJet e setta le env `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`, `MJ_FROM_EMAIL`, `MJ_FROM_NAME`.
3. Supabase o un qualunque altro servizio di database Postgres, imposta `DATABASE_URL` e `DIRECT_URL`.
4. `NODE_ENV`, `JWT_SECRET`, `COOKIE_SECRET`, `R2_SIGNATURES_FOLDER`.
5. `pnpm install`, `pnpx prisma migrate deploy`, `pnpm dev` e via.
6. Per prod: `pnpm build` e `pnpm start`.
