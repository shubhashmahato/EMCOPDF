# EMCOPDF - Advanced PDF Pages Editor (Offline Desktop App)

EMCOPDF is a highly advanced, fully featured local client-side PDF pages organizer, editor, and exporter. This application can run directly inside your web browser or be compiled into a standalone, offline desktop app (`.exe` for Windows, `.app`/`.dmg` for macOS) with no Node.js or server knowledge required on your machine!

---

## 🚀 Get the Desktop App (.exe) via GitHub (No Setup Required!)

We have configured a fully automated **GitHub Actions Workflow** for you. When you push this code to your own GitHub repository, GitHub will build the `.exe` file automatically on its servers, and you can download it directly.

### Step-by-Step Instructions:

1. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com/) and create a new repository (e.g., `emcopdf`).
2. **Upload/Push your code**:
   - Push all the files of this project to the `main` or `master` branch.
3. **Wait for the Build to Complete**:
   - On your GitHub repository page, click on the **Actions** tab at the top.
   - You will see a workflow running named **"Build Desktop App (.exe)"**.
   - Click on the workflow run (it takes about 2 to 3 minutes to build).
4. **Download the `.exe` file**:
   - Once completed, scroll down to the **Artifacts** section at the bottom of the build page.
   - Click on **`EMCOPDF-Desktop-Windows`** to download the ZIP file.
   - Extract the ZIP file to find your native `EMCOPDF Setup.exe` installer! Run it to install and open the app.

---

## 💻 Run or Build the App Locally (If you have Node.js)

If you have Node.js installed on your computer and want to run or package the app locally:

### 1. Run as a Desktop App (Development)
```bash
# Install dependencies
npm install

# Start the desktop application
npm run electron:start
```

### 2. Compile Your Own Windows `.exe` Installer Locally
```bash
# Packages the app into a standalone .exe inside "dist_electron/"
npm run electron:pack
```

---

## 🛠️ Project Structure
- `electron/main.cjs` - The main Electron process setup (controls the window, desktop environment, and integration).
- `electron/preload.cjs` - Secure bridge between the application and local system layers.
- `.github/workflows/build-electron.yml` - Automatic compilation workflow to produce ready-to-run `.exe` artifacts.
- `package.json` - Build commands and dependencies.

Enjoy your offline PDF companion!
