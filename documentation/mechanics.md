# Game Mechanics

---

## Currency

There are two currencies.

| Currency | Icon | Earn by |
|----------|------|---------|
| **Quartz** | `art/UI/qua164.png` | Completing timer sessions |
| **Amethyst** | `art/UI/ame164.png` | Rare drops; can be set manually in `config/player.js` |

Quartz is the common currency used for most items. Amethyst is premium and used for a small
subset of items. Balances are stored as `q` and `a` in the save.

---

## Timer

A Pomodoro-style countdown timer in the Room scene.

**Presets:** 5 min, 10 min, 25 min. There is no custom duration input.

**Rewards:** When a session completes, Quartz is awarded and the bell sound (`music/timer.wav`) plays. The reward amount scales with session length.

| Preset | Quartz | Amethyst |
|--------|--------|----------|
| 5 min  | +2     | —        |
| 10 min | +5     | —        |
| 25 min | +10    | +1       |

**Behavior:**
- Navigation buttons are disabled while the timer is running.
- Timer state is **not** saved — reloading the page resets it to the last selected preset.
- The timer display uses a pill styled the same as the currency pills.
- The countdown is anchored to wall-clock time (`Date.now()`), not the `setInterval` tick count, so background-tab throttling can't slow it down. A `visibilitychange` listener also runs the tick the moment the tab returns to the foreground, so a session that finished while hidden fires its reward popup immediately on return.
- The alarm sound is scheduled on the **Web Audio API clock** (via `AudioBufferSourceNode.start(when)`), which is not throttled by background tabs. This means the bell rings on time even while the user is in another tab. The alarm buffer is pre-fetched and decoded on launch (`loadAlarmBuffer()`) so the first timer start is instant; if the fetch fails, the existing `<audio>` element acts as a fallback when `tickTimer()` detects completion.

---

## Daily Reward

Once per local calendar day, the player receives a bonus. The reward is a single roll:

- **2/3 chance** → +20 Quartz
- **1/3 chance** → +2 Amethyst

**Triggers** — the check (`checkDailyReward()`) is called at:
- The end of `main()`, gated on `S.name` being set (so brand-new players don't fire it behind the name-prompt modal).
- The start of every `showScene()` call.

Both call sites are idempotent — the function early-exits when `today <= lastDate`. A brand-new player (`lastDate: ''`) gets the reward on their first scene change after entering a name.

**Popup** — reuses the timer-reward popup component with the title "Daily reward!". A small jingle (`music/jingle.wav`) plays through the `#sfx` audio element, so its volume follows the notification slider (`dg2_pref_sfx`). If the file is missing the popup still appears; the audio just silently fails.

**Persistence** — the claim date (`YYYY-MM-DD`) is stored in the save data as `lastDate` and persists through Export/Import.

There is no anti-cheat: the player can change their system clock or edit `localStorage` to claim again. This is intentional — the game is single-player with no competitive integrity to defend.

---

## Music Player

Located in the left panel. Tracks switch automatically based on the active scene:

- **Room scene** → plays from the `room/` playlist (shuffled; "Project Cute.mp3" is the launch track when present)
- **Store scene** → plays from the `store/` playlist (shuffled)
- **Closet scene** → continues whatever was playing in the previous scene

Playlists are defined in `config/music.js` (loaded every launch). Each scene has an array of filenames; the game looks for those files in `music/<scene>/`. To add or remove tracks, drop the `.mp3` into the matching folder and edit `config/music.js`. If a list is empty, music for that scene is silently disabled.

Controls:
- **Play/Stop button** (music note icon) — toggles playback; icon animates while playing
- **Volume slider** — controls music volume
- **SFX slider** — controls the timer completion bell volume
- Clicking the bell icon (🔔) previews the timer sound at the current SFX volume

---

## Closet

The Closet panel has two modes accessed by tabs on the left side.

### Category Tabs

Each clothing category (`skin`, `face`, `hair`, `dress`, `top`, `pants`, `coat`, `shoes`, `acc`) has its own tab. Only owned items appear. Clicking an item toggles it on/off in the **draft** state.

The draft is a preview — changes are not committed until **Save** is pressed. Leaving the Closet without saving discards the draft.

### Album Tab (📖)

Shows all named outfits defined in `config/clothes.js → outfits`. Each outfit appears as a card:

- **Locked (grayed)** — the player does not yet own all items in the outfit.
- **Unlocked** — clicking the card equips the full outfit instantly.
  - Categories present in the outfit replace what is currently equipped.
  - Face, hair, and skin are only replaced if the outfit includes them.
  - All other categories are cleared if the outfit does not include them.

Progress text below each locked card shows how many items are owned out of the total.

---

## Store

Items are listed by category (same tabs as Closet). Items the player already owns are removed from the store. If the player owns everything in a category, the tab shows "You own everything in this category!".

Selecting an item shows its price in the footer. The **Buy** button is enabled only when the player can afford the item. On purchase, the item is added to the inventory and currency is deducted.

Store prices are defined per-item in `config/clothes.js` as `{ "q": N }` (Quartz) or `{ "a": N }` (Amethyst).

---

## Character Rendering

The character is displayed as a stack of `<img>` elements, each positioned absolutely within the scene. Layers are ordered by the `z` value defined on each item in `config/clothes.js`.

**Z-layer tiers (lowest → highest):**

| z | Layer |
|---|-------|
| 1 | Skin base |
| 2 | Under-clothing accessories (e.g. socks, bracelets worn under sleeves) |
| 3 | Shoes |
| 4 | Dress / Pants |
| 5 | Top |
| 6 | Coat |
| 7 | Face |
| 8 | Hair |
| 9–10 | Over-hair accessories |

When two items share the same `z`, the one appearing later in the `items` array renders on top (JS sort is stable).

---

## Save System

### localStorage

All state is saved to `localStorage` with the key prefix `dg2_`. Saved keys:

| Key | Stores |
|-----|--------|
| `dg2_q` | Quartz balance |
| `dg2_a` | Amethyst balance |
| `dg2_own` | Owned item IDs |
| `dg2_eq` | Equipped item IDs per category |
| `dg2_name` | Player name |
| `dg2_lastDate` | Last date the daily reward was claimed (`YYYY-MM-DD`) |

Timer state and current track position are **not** persisted — they reset on reload.

#### Device-local preferences

Three settings are stored separately as device-local preferences (prefix `dg2_pref_`). They are **not** part of the save data, so they are not included in Export/Import, do not appear in `player.js`, and persist across imports.

| Key | Stores |
|-----|--------|
| `dg2_pref_music` | Music play/paused state (`'1'` / `'0'`) |
| `dg2_pref_vol`   | Music volume slider value (0–1) |
| `dg2_pref_sfx`   | Notification (timer bell) volume slider value (0–1) |

Defaults: music plays, volume 0.15, sfx 0.5 (the values in the slider HTML).

`config/player.js` seeds the initial state the first time the game runs (no localStorage data
yet). After that, localStorage is authoritative.

**localStorage is scoped by origin.** On GitHub Pages this is `https://lalicka.github.io`
(path-independent). On `file://` it is effectively scoped per file path in Chromium browsers,
so moving the game folder typically gives the player a fresh save. Export/Import is the only
durable way to move a save across paths or browsers.

### Single-tab lock

On launch, the game uses `BroadcastChannel('project-cute')` to detect another tab already
running the game. If one is found, the new tab shows an "Already open" overlay and stops
initializing — preventing two tabs from racing on `localStorage` writes and silently losing
each other's saves. The owning tab listens for future probes for as long as it lives, and
releases the channel on `beforeunload`. Browsers without `BroadcastChannel` fall through
unprotected.

### Import / Export

The 💾 button next to the player name opens the Import/Export modal.

- **Export** — downloads the current save as a `player.js` file in the same format as
  `config/player.js`. This file can be used as a backup or to transfer saves between devices.
- **Import** — prompts for a confirmation, then replaces the current save with the contents
  of an uploaded `player.js` file. The page reloads after import.

---

## Player Name

On first launch, a name prompt appears (triggered when the name is empty). The name is saved
to `localStorage` (`dg2_name`) and displayed in the pill at the top of the left panel.

`config/player.js` does not include a `name` field — its absence defaults to `''`, which
correctly triggers the prompt for a new player. Exported save files do include the name, so
importing a save restores it.
