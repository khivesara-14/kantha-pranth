KANTHA PRANTH - JAIN UPDATE
===========================
1. Unzip this into the ROOT of your kantha-pranth repo (it overwrites
   public/kantha-pranth-emblem.svg with the new Jain emblem).
2. From the repo root run:  node apply-jain-changes.js
   It swaps the 3 Unsplash photos for Jain photos, changes the greeting to
   "Jai Jinendra", puts the emblem in the hero, adds the photo credit and
   prints OK / CHECK for each step. Fix any CHECK lines by hand.
3. git diff, then commit and push. Vercel redeploys automatically.
No terminal? Open the repo in GitHub Codespaces (Code > Codespaces), run the
command there, then commit from the Source Control panel.
Or skip the script: upload only public/kantha-pranth-emblem.svg through
GitHub (Add file > Upload files) to get the new logo everywhere.
