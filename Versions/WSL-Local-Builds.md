# WSL2 Android Local Build Setup

## Goal
Set up WSL2 on this Windows machine so Android APK/AAB builds run locally in ~4-6 min instead of ~25 min on EAS cloud. All commands below are to be executed by you unless noted otherwise.

## Context
- Project: `C:\Users\vondr\Documents\Projects\Half-lifr Caffine\caffeine-tracker`
- EAS profile for APK: `production-apk`
- EAS profile for Play Store AAB: `production`
- Target: after setup, user runs `eas build -p android --profile production-apk --local` from WSL Ubuntu and gets an APK in ~5 min

---

## Phase 1 — Install WSL2

Run in Windows PowerShell (elevated / as Administrator):

```powershell
wsl --install
```

This installs WSL2 + Ubuntu. It will prompt for a restart — tell the user to restart their PC and re-run you after.

After restart, Ubuntu opens automatically and asks for a Linux username and password. Tell the user to enter any simple username/password (e.g. `vondr` / `vondr`). Wait for Ubuntu to finish first-time setup before continuing.

Verify WSL2 is running:
```powershell
wsl --list --verbose
```
Expected output: a line showing `Ubuntu  Running  2`. If version shows `1` instead of `2`, run:
```powershell
wsl --set-version Ubuntu 2
```

---

## Phase 2 — Install build tools inside Ubuntu

All commands in this phase run inside WSL Ubuntu. Open Ubuntu via Start menu or run `wsl` in any terminal.

### 2a — Node.js 20 via nvm
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
```
Verify: output starts with `v20`.

### 2b — Java 17
```bash
sudo apt update && sudo apt install -y openjdk-17-jdk
java -version
```
Verify: output contains `openjdk 17`.

### 2c — Android SDK (command-line tools only)
```bash
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
curl -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip cmdline-tools.zip
mv cmdline-tools latest
rm cmdline-tools.zip
```

Add to `~/.bashrc`:
```bash
echo '' >> ~/.bashrc
echo '# Android SDK' >> ~/.bashrc
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

Accept licenses and install SDK components:
```bash
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

Verify:
```bash
sdkmanager --list_installed
```
Expected: shows `platform-tools`, `platforms;android-35`, `build-tools;35.0.0`.

### 2d — EAS CLI
```bash
npm install -g eas-cli
eas --version
```

---

## Phase 3 — Clone project into WSL filesystem

> Critical: the project MUST live inside the WSL filesystem (`~/`), not at `/mnt/c/...`. Builds from `/mnt/c/` are 10-20x slower due to filesystem bridging.

Check if the project has a git remote:
```bash
git -C /mnt/c/Users/vondr/Documents/Projects/Half-lifr\ Caffine/caffeine-tracker remote -v
```

**If a GitHub remote exists** — clone from GitHub:
```bash
git clone <remote-url> ~/caffeine-tracker
cd ~/caffeine-tracker
```

**If no remote exists** — copy from Windows filesystem:
```bash
cp -r /mnt/c/Users/vondr/Documents/Projects/Half-lifr\ Caffine/caffeine-tracker ~/caffeine-tracker
cd ~/caffeine-tracker
```

Install dependencies:
```bash
npm install
```

Log in to Expo (interactive — tell the user to enter their Expo credentials):
```bash
eas login
```
Verify login:
```bash
eas whoami
```

---

## Phase 4 — Test build

```bash
cd ~/caffeine-tracker
eas build -p android --profile production-apk --local
```

First run takes ~10-15 min (Gradle downloads). Subsequent runs take ~4-6 min.

When finished, copy APK to Windows Desktop:
```bash
cp ~/caffeine-tracker/*.apk /mnt/c/Users/vondr/Desktop/
```

Tell the user the APK is on their Desktop, ready to install.

---

## Phase 5 — Daily workflow script

Create a helper script at `~/build-apk.sh`:
```bash
cat > ~/build-apk.sh << 'EOF'
#!/bin/bash
set -e
cd ~/caffeine-tracker

echo "==> Pulling latest changes..."
git pull 2>/dev/null || echo "(skipped git pull — no remote or already up to date)"

echo "==> Building APK..."
eas build -p android --profile production-apk --local

echo "==> Copying APK to Desktop..."
cp *.apk /mnt/c/Users/vondr/Desktop/

echo "==> Done! APK is on your Windows Desktop."
EOF
chmod +x ~/build-apk.sh
```

After setup, user just opens Ubuntu and runs:
```bash
~/build-apk.sh
```

---

## Troubleshooting

**`ANDROID_HOME not set` or `sdkmanager not found`**
```bash
source ~/.bashrc
echo $ANDROID_HOME
```
If empty, re-run the `echo '...' >> ~/.bashrc` commands from Phase 2c.

**Gradle build fails**
```bash
cd ~/caffeine-tracker/android
./gradlew clean
cd ..
eas build -p android --profile production-apk --local
```

**Project files out of sync after editing on Windows (no git)**
```bash
rsync -av --exclude='node_modules' --exclude='.expo' \
  /mnt/c/Users/vondr/Documents/Projects/Half-lifr\ Caffine/caffeine-tracker/ \
  ~/caffeine-tracker/
npm install
```

**WSL runs out of memory during Gradle**
Create `C:\Users\vondr\.wslconfig` on Windows with:
```ini
[wsl2]
memory=8GB
processors=4
```
Then restart WSL: `wsl --shutdown` in PowerShell, reopen Ubuntu.
