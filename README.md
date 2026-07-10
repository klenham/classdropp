# ClassDrop

A tiny real-time file-sharing site: anyone with the link can drop a file, and it
shows up for everyone else within ~2.5 seconds (polling), no login needed.

Built with Next.js + Vercel Blob storage — deploys to Vercel with zero backend
setup beyond clicking "Create Store" once.

## How it works
- Files upload **directly from the browser to Vercel Blob** (not through a
  server function), so there's no 4.5MB payload limit — files up to 200MB work.
- `/api/upload` only issues a short-lived upload token (see `handleUpload` in
  `src/app/api/upload/route.ts`).
- `/api/files` lists everything in the Blob store.
- The homepage polls `/api/files` every 2.5s and shows a toast when a new file
  lands, so it feels live during a demo.

## Deploy to Vercel (5 minutes)

1. **Push this project to a GitHub repo** (or use `vercel` CLI directly from
   this folder — see step 4).

2. **Import it on Vercel**: https://vercel.com/new -> select the repo -> Deploy.
   The first deploy will succeed even without storage configured (uploads just
   won't work yet).

3. **Add Blob storage**: in your Vercel project -> **Storage** tab -> **Create
   Database** -> **Blob** -> Create. Vercel automatically adds the
   `BLOB_READ_WRITE_TOKEN` environment variable to your project — no manual
   copy-pasting needed.

4. **Redeploy** so the new env var takes effect: Deployments tab -> ... on the
   latest deployment -> Redeploy. (Or just push a new commit.)

   Alternative to steps 1-4, from your terminal:
   ```bash
   npm i -g vercel
   vercel                # links + deploys the project
   # then in the Vercel dashboard: Storage -> Create Database -> Blob
   vercel --prod          # redeploy so the env var is picked up
   ```

5. Open the deployed URL, and share it with the class. Everyone visiting that
   URL and dropping a file will see it appear in everyone else's browser.

## Run locally (optional)
```bash
npm install
vercel env pull .env.local   # after you've created the Blob store on Vercel
npm run dev
```

## Notes for your demo
- No login/auth — anyone with the link can upload and download. Fine for a
  one-day class demo; don't reuse this for anything sensitive.
- Files are public once uploaded (anyone with the direct blob URL can access
  them), which is what makes "sharing" simple here.
- There's a `/api/delete` route wired up but no delete button in the UI by
  default — ask if you want a delete button added for live cleanup.
