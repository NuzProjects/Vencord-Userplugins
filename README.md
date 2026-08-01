# Nuz & Denji's Userplugins

A collection of custom Vencord userplugins created by **NuzFlameV2 and ItsDenji777**.

These plugins are designed to add useful quality-of-life improvements to Discord while remaining lightweight, configurable, and easy to install.

**Report all errors in [Issues](https://github.com/NuzProjects/Vencord-Userplugins-List/issues)**

---

## Installation

1. Clone or download this repository.
2. Copy the desired plugin folder into:

**If you are using Equicord, it is the same; the folder will just be called Equicord.**

```text
Vencord/src/userplugins/
```

3. Rebuild Vencord:

```bash
pnpm build
pnpm inject
```

4. Restart Discord.
5. Enable the plugin in:

```text
User Settings → Vencord → Plugins
```

---

## Plugins

### Hide Chat Icons

Hide any button in Discord's message composer.

#### Features

- Hide Discord's built-in chat buttons
- Hide buttons added by other Vencord plugins
- Gift and Apps hidden by default
- Configure everything directly from Vencord Settings

#### Discord Buttons

- Gift
- Apps / Activities
- GIF
- Stickers
- Emoji
- Upload
- Voice Message
- Poll

---

### mathCount

Generate extremely long randomized math expressions for Discord counting servers.
*This requires the counting setup to have math enabled!*

#### Features

- `/count` slash command
- Chat-bar calculator button
- Solves previous counting equations
- Supports:
  - `+`
  - `-`
  - `*`
  - `/`
  - `^`
  - Parentheses
- Automatically detects Nitro
- Different maximum lengths for Nitro and non-Nitro users
- Prevents double counting
- Highly configurable generator
- Randomized expression generation

#### Settings

- Increment amount
- Maximum equation length
- Nitro message length
- Search depth
- Generator limits
- Randomization settings

---

## There will be more plugins coming soon!
---

## Compatibility

These plugins are intended for recent versions of **Vencord** and **Discord Desktop**.
***This also supports all modifications of Vencord such as Equicord***

Discord occasionally changes its interface, so updates may be required after major Discord releases.

---

## License

All plugins in this repository are licensed under the **GNU General Public License v3.0 or later (GPL-3.0-or-later)**

---
Updated `July 25, 2026`

Created with 💙💜 by **NuzFlameV2 and ItsDenji777**
