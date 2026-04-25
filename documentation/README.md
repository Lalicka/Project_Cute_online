# Dress-Up Game — Documentation

A browser-based dress-up and idle game. Runs entirely from `index.html` with no build step or server required.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Running the Game](#running-the-game)
- [Scenes](#scenes)
- [Documentation Files](#documentation-files)

---

## Project Structure

```
dress/
├── index.html              # Entire game: HTML + CSS + JS in one file
├── config/
│   ├── clothes.js          # All items, categories, outfits, and prices
│   ├── player.js           # Player save state (currency, inventory, equipped)
│   └── music.js            # Track filenames per scene (room, store)
├── art/
│   ├── Skin1–5.png         # Skin base layers
│   ├── *.png               # Clothing and accessory layers (named by item ID)
│   └── UI/
│       ├── room.png        # Room scene background
│       ├── store.png       # Store scene background
│       ├── ame164.png      # Amethyst currency icon
│       ├── qua164.png      # Quartz currency icon
│       └── sun164.png      # Sun icon (UI)
├── fonts/
│   ├── MilkyNice.ttf       # Primary UI font (buttons, currency, player name)
│   └── Huglove.ttf         # Decorative font
├── music/
│   ├── room/               # Tracks for the Room scene
│   ├── store/              # Tracks for the Store scene
│   └── timer.wav           # Alert sound on timer completion
├── documentation/          # This folder
└── backup/                 # Old versions before Git. Not part of the running game.
```

---

## Running the Game

Open `index.html` directly in a browser. No server needed. All config files are loaded via
`<script>` tags on every launch, which means it works on `file://` without CORS issues.

- **`config/clothes.js`** — loaded every launch. Defines all items, categories, and outfits.
  The game cannot run without it.
- **`config/player.js`** — loaded every launch, but only used when there is no existing save
  in `localStorage`. It is the starting state for a brand-new player.
- **`config/music.js`** — loaded every launch. Lists track filenames per scene; missing or
  empty lists silently disable music for that scene.

Save data is stored in `localStorage` under keys prefixed `dg2_`. Once a save exists,
`player.js` is ignored and localStorage is authoritative.

---

## Scenes

| Scene | Description |
|-------|-------------|
| **Room** | Main idle screen. Music plays, timer is accessible. |
| **Store** | Buy new clothing items with Quartz or Amethyst. |
| **Closet** | Equip and arrange owned items; save outfits. |

Navigation buttons appear at the bottom of the left panel. From Room, buttons lead to Store and Closet. From Store or Closet, one button returns to Room.

---

## Documentation Files

| File | Contents |
|------|----------|
| [mechanics.md](mechanics.md) | Currency, timer, music player, save system |
| [configuration.md](configuration.md) | How to add items, outfits, and categories to config |
