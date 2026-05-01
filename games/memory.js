/* Memory minigame.
   Registers itself onto window.GAMES so the lobby in index.html picks it up.

   Contract:
     mount(host, api) → { start, cleanup }
       - host: a DOM element to render into
       - api.end(reward): call when the round ends; reward = { q, a }
       - start(): begin a fresh round (called from the shell's Start button)
       - cleanup(): tear down listeners/timers (called when leaving the game)
*/
window.GAMES = window.GAMES || {};

window.GAMES.memory = {
  id: 'memory',
  name: 'Memory',
  icon: '🧠',
  desc: 'Match all pairs to earn quartz',
  reward: { q: 10, a: 0 },

  mount(host, api) {
    const SYMBOLS = ['🌸','🌟','🎀','💎','🦋','🍓','🌙','🌈'];
    const TOTAL_CARDS = SYMBOLS.length * 2;
    let state = null;
    let unflipTimeout = null;

    function buildBoard() {
      host.innerHTML = '';
      const board = document.createElement('div');
      board.className = 'memory-board';
      for (let i = 0; i < TOTAL_CARDS; i++) {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.textContent = '';
        card.onclick = () => onCardClick(i);
        board.appendChild(card);
      }
      host.appendChild(board);
    }

    function shuffleDeck() {
      const deck = [...SYMBOLS, ...SYMBOLS];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    }

    function start() {
      if (unflipTimeout) { clearTimeout(unflipTimeout); unflipTimeout = null; }
      const deck = shuffleDeck();
      // Begin with all cards face-up so the player can study them, locking
      // input. After the preview window, flip them face-down and unlock.
      state = {
        cards: deck.map(emoji => ({ emoji, revealed: true, matched: false })),
        firstFlipped: null,
        locking: true,
        matchedCount: 0,
      };
      render();
      unflipTimeout = setTimeout(() => {
        if (!state) return;
        state.cards.forEach(c => { if (!c.matched) c.revealed = false; });
        state.locking = false;
        unflipTimeout = null;
        render();
      }, 2000);
    }

    function render() {
      const els = host.querySelectorAll('.memory-card');
      els.forEach((el, idx) => {
        if (!state) {
          el.textContent = '';
          el.classList.remove('revealed', 'matched');
          return;
        }
        const c = state.cards[idx];
        if (c.matched) {
          el.textContent = c.emoji;
          el.classList.add('revealed', 'matched');
        } else if (c.revealed) {
          el.textContent = c.emoji;
          el.classList.add('revealed');
          el.classList.remove('matched');
        } else {
          el.textContent = '';
          el.classList.remove('revealed', 'matched');
        }
      });
    }

    function onCardClick(idx) {
      if (!state || state.locking) return;
      const c = state.cards[idx];
      if (c.matched || c.revealed) return;

      c.revealed = true;

      if (state.firstFlipped === null) {
        state.firstFlipped = idx;
        render();
        return;
      }

      const first = state.cards[state.firstFlipped];
      render();

      if (first.emoji === c.emoji) {
        first.matched = true;
        c.matched = true;
        state.matchedCount += 2;
        state.firstFlipped = null;
        render();
        if (state.matchedCount === state.cards.length) {
          const reward = window.GAMES.memory.reward;
          state = null;
          // brief pause so the player sees the last match before the popup
          setTimeout(() => api.end(reward), 350);
        }
      } else {
        state.locking = true;
        unflipTimeout = setTimeout(() => {
          first.revealed = false;
          c.revealed = false;
          state.firstFlipped = null;
          state.locking = false;
          unflipTimeout = null;
          render();
        }, 800);
      }
    }

    function cleanup() {
      if (unflipTimeout) { clearTimeout(unflipTimeout); unflipTimeout = null; }
      state = null;
      host.innerHTML = '';
    }

    buildBoard();
    return { start, cleanup };
  },
};
