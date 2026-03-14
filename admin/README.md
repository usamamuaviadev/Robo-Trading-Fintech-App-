# Admin Panel – Robo Advisor

## Static login & API integration

- **Login**: Static credentials only. Use **admin@robo.com** / **Admin@123** (must match backend `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- **API**: After login, the panel calls the robo-advisor backend for chatbot stats, chat sessions, affiliate rules, and market summary. Set the backend URL in `.env` (see below).

### Setup

1. Copy `.env.example` to `.env` and set:
   ```env
   VITE_API_BASE_URL=https://robo-backend-production.up.railway.app
   ```
   (Defaults to Railway production backend; override for local backend if needed.)

2. Ensure the **backend** is running and has in its `.env`:
   ```env
   ADMIN_EMAIL=admin@robo.com
   ADMIN_PASSWORD=Admin@123
   ```
   (Optional; these are the defaults.)

3. Run the admin panel:
   ```sh
   npm i && npm run dev
   ```

4. Open the app, log in with **admin@robo.com** / **Admin@123**. The dashboard will load data from the backend (chatbot stats, sessions, affiliate rules). Logout via the header icon.

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c8482de2-facb-4196-b245-968afb3e792c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c8482de2-facb-4196-b245-968afb3e792c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c8482de2-facb-4196-b245-968afb3e792c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
