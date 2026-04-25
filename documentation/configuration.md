# Configuration Reference

All game content is defined in two files: `config/clothes.js` and `config/player.js`.
Both files assign to `window.*` globals so they load correctly on `file://` without CORS issues.

---

## config/clothes.js

### `categories`

Defines the tabs shown in Closet and Store.

```js
{ "id": "acc", "label": "Acc", "multi": true }
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Internal identifier. Must match `cat` on items. |
| `label` | string | Display name (used in tooltips). |
| `multi` | boolean | `true` = multiple items in this category can be equipped at once. `false` = equipping one replaces the previous. |

Current categories in order: `skin`, `face`, `hair`, `dress`, `top`, `pants`, `coat`, `shoes`, `acc`.

Only `acc` has `multi: true`.

---

### `items`

Each item is one entry in the `items` array.

```js
{ "id": "Dress_Amy", "cat": "dress", "outfit": "Amy", "z": 4, "price": { "q": 18 } }
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier. Must match the PNG filename: `art/<id>.png`. |
| `cat` | string | Category this item belongs to. Must match a `categories` entry `id`. |
| `outfit` | string | The named outfit this item is part of (used by the Album). |
| `z` | number | Render layer — see Z-layer tiers in [mechanics.md](mechanics.md). |
| `price` | object | `{ "q": N }` for Quartz, `{ "a": N }` for Amethyst. Use `{ "q": 0 }` for free items. |

**Adding a new item:**

1. Add the PNG to `art/` named exactly as the `id` (e.g. `art/Top_NewItem.png`).
2. Add the entry to the `items` array with the correct `cat`, `z`, and `price`.
3. If the item belongs to an outfit, add its `id` to the matching entry in `outfits`.
4. If it should be available from the start, add its `id` to both `starters` in `clothes.js` and to `owned` in `player.js`.

---

### `outfits`

Maps outfit names to arrays of item IDs. Drives the Album tab in Closet.

```js
"Amy": ["Hair_Amy", "Dress_Amy", "Shoes_Amy"]
```

- Keys must match the `outfit` field used on items.
- The Album card for an outfit is locked until the player owns every item in the array.
- Clicking an unlocked card equips all listed items. Face, hair, and skin are preserved if not listed.

**Adding a new outfit:**

1. Define all its items in the `items` array with the same `outfit` string.
2. Add an entry to `outfits` listing all item IDs that form the complete look.

---

### `starters`

Array of item IDs that represent the starter set.

```js
"starters": ["Skin1","Skin2","Skin3","Skin4","Skin5","Face_Pajama","Hair_Pajama","Top_Pajama","Pants_Pajama"]
```

This array is **not** just documentation — the code uses it actively in three places:

- **No player config** — `applyDefaultState()` uses `starters` as the initial owned set and
  auto-equips the first face, hair, and skin found in it.
- **Player config present** — `applyPlayerConfig()` uses `starters` as a fallback for `owned`
  if the config omits it, and auto-equips a starter face/skin if either slot is empty.
- **After localStorage load** — `loadState()` ensures starters are always in `owned` (handles
  saves predating new starter items) and recovers a fallback face/skin if either slot is empty.

Removing `starters` from the config would break these fallbacks. Items that should be owned
from the start must be listed here **and** in `owned` in `player.js`.

---

## config/player.js

This file is the **initial save state**. It is loaded on every launch but only applied when
there is no existing save in `localStorage` — i.e. a brand-new player. After the first save,
`localStorage` takes over and this file is ignored. It is also the format produced by the
Export feature.

```js
window.PLAYER_CONFIG = {
  "q": 0,           // Quartz balance
  "a": 0,           // Amethyst balance
  "owned": [        // Array of owned item IDs
    "Skin1", "Skin2", "Skin3", "Skin4", "Skin5",
    "Face_Pajama", "Hair_Pajama", "Top_Pajama", "Pants_Pajama"
  ],
  "equipped": {     // One array per category; contains equipped item ID(s)
    "skin": ["Skin1"],
    "face": ["Face_Pajama"],
    "hair": ["Hair_Pajama"],
    "dress": [],
    "top": ["Top_Pajama"],
    "pants": ["Pants_Pajama"],
    "coat": [],
    "shoes": [],
    "acc": []
  }
};
```

There is no `name` field — its absence defaults to `''`, which triggers the name prompt on
first launch. The name is then saved to `localStorage` and included in future exports.

### Editing for testing

To give a player all items or a large currency balance for testing, edit `player.js`, then
**clear localStorage** (DevTools → Application → Local Storage → delete all `dg2_*` keys)
before reloading, so the file's values are picked up again.

Alternatively, use the in-game **Export** to get the current save, edit it, and **Import** it back.
