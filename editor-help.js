// editor-help.js — the ⓘ Info system (docs/STORY_EDITOR_UX_PLAN.md → Info).
// Every explanation in the editors lives here, in one dictionary, in neutral wording
// ("the player", never she / her / a character's name). Editors place a small ⓘ next to
// a section title or field label with SideScrollHelp.button(id); tapping it opens a card
// under that row (inside the panel, so nothing is cut off at a panel edge). One card is
// open at a time; tapping ⓘ again, the card's ×, or anywhere else closes it.
// Labels and placeholders stay short; empty states keep one short inline line.
(() => {
  'use strict';

  const TEXTS = {
    // ---- Story tab: lists ----
    'list.sequences': { title: 'Sequences', text: 'Sequences placed in the world, in journey order. Tap one here, or its post in the view, to open it.' },
    'list.events': { title: 'Events', text: 'Reusable chains of steps, written with placeholders (Actor, Exit…) that each sequence fills in. Any sequence can run any event.' },
    'story.progress': { title: 'Story progress', text: 'Reset story (TEST bar, top right) clears flags, fired lines and what events changed, as for a new player.' },

    // ---- Sequence page ----
    'seq.template': { title: 'Template', text: 'This sequence is a placed copy of a template: changes to its components and logic change every placed copy. Make unique gives this one its own.' },
    'seq.components': { title: 'Components', text: 'What this sequence uses: characters, marks (spots to walk to), zones (where the player sets things off), objects (any asset: a note, the food, a chopping block) and barriers (invisible walls that hold the player back until a flag is set). Tap one to edit it.' },
    'seq.logic': { title: 'Logic', text: 'Each line says: when something happens, run an event, with the event’s placeholders filled from this sequence’s components.' },
    'seq.fill': { title: 'Fill in the event’s placeholders', text: 'Which of this sequence’s components each of the event’s placeholders means here.' },

    // ---- Components ----
    'comp.barrier': { title: 'Barrier', text: 'An invisible wall across the path: the player can’t walk past it while this holds, e.g. “While flag packed is not set”. In the editor it shows as a red dashed wall (faint when it isn’t blocking now).' },
    'comp.object': { title: 'Object', text: 'Events change it with an Object step: give the event an object placeholder and fill it with this object in a logic line.' },
    'comp.takeWhen': { title: 'Can be taken', text: 'For an asset the player can pick up or put on (Asset Lab → Interactions). Until the condition holds, Inspect still shows it but without Pick up, and adds the line below; without Inspect the player just thinks it.' },
    'comp.standing': { title: 'Standing animation', text: 'The action slot it plays while it stands. It loops until an event moves or animates it.' },
    'comp.blocks': { title: 'Blocks the player', text: 'Auto: it blocks while it stands on the path. A blocking character can’t be walked or jumped past.' },
    'comp.holds': { title: 'Holds', text: 'Props held from the start (a Prop step can change this while playing). Hand, place, angle and size are set per character in Character Lab → Props.' },

    // ---- Steps (timeline side sheet) ----
    'step.move': { title: 'Using', text: 'An action slot: each character plays its own animation for it.' },
    'step.control': { title: 'Control', text: 'Control always comes back to the player when the event ends.' },
    'step.camera.shot': { title: 'Camera shot', text: 'The camera holds the shot until the next Camera step; it goes back to the player when the event ends.' },
    'step.camera.keep': { title: 'Camera shot (kept)', text: 'The shot stays when the event ends: bring it back with a Camera “Back to the player” step, e.g. on a line When the player leaves a zone.' },
    'step.camera.back': { title: 'Camera back', text: 'Blends back to following the player.' },
    'step.wear': { title: 'Wear', text: 'The player shows the parts marked with this item (Character Lab → Skin → Worn item). Progress → Reset on this sequence takes it off again.' },
    'step.item': { title: 'Item', text: 'Progress → Reset on this sequence takes back what it gave and gives back what it took.' },
    'step.effect': { title: 'Effect on a character', text: 'The effect starts invisible and blends to each state in turn; it follows the character (a hidden character keeps moving, so the dust travels on), then disappears when the last state is done. Run this step at the same time as a Move step to catch a running animal. For a long, low animal widen the effect (Asset Lab → Shape) or raise the size.' },
    'step.effect.character': { title: 'Character effect', text: 'A character effect works on the character itself: it starts whole and blends through its states; if it ends fully dissolved (Gone, or Dissolve at 1) the character stays hidden. It keeps moving while it dissolves.' },
    'step.prop.give': { title: 'Hold it', text: 'The character takes it in hand, held as its grip in Character Lab → Props says (it follows the hand in every animation).' },
    'step.prop.take': { title: 'Put it away', text: 'The character stops holding it (it is put away).' },
    'step.prop.drop': { title: 'Drop it', text: 'It falls from the hand and lies on the ground there. Progress → Reset on this sequence puts it back.' },
    'step.object.show': { title: 'Appears', text: 'It appears. Set “Hidden at the start” on the object for things that appear later.' },
    'step.object.hide': { title: 'Disappears', text: 'It disappears (the note picked up, the food eaten). Progress → Reset on the sequence brings it back.' },
    'step.object.swap': { title: 'Changes to', text: 'It shows another asset in its place (a full plate → an empty one, a log → split logs).' },
    'step.look': { title: 'Look', text: 'Fog and colour change to the look and stay until another Look step changes them (kept when the game is reopened).' },
    'step.prompt': { title: 'Wait for Action', text: 'The event pauses here until the player presses Action, even while control is taken. The button lights up with this label.' },
    'step.screen': { title: 'Screen', text: 'A fade or letterbox bars still on when the event ends are cleared.' },
    'step.at': { title: 'Starts at', text: 'It starts at this time, whatever else is running.' },
    'step.at.prompt': { title: 'Starts at', text: 'The clock stops here until the player presses Action; everything after it waits.' },

    // ---- Event page ----
    'event.placeholders': { title: 'Placeholders', text: 'Placeholders stand for the characters, marks and objects this event acts on; you don’t choose real ones here. Give each a name (Actor, Exit…) and use it in the steps. Each sequence that runs this event fills them in with its own components, on its logic line.' },
    'event.timeline': { title: 'Timeline', text: 'The steps in time order. Tap one to open the timeline on it. Wait for Action stops the clock until it is pressed.' }
  };

  let open = null; // {id, btn, card}
  let wantOpen = null; // id to reopen after the panel re-renders

  function close() {
    if (!open) return;
    open.card.remove();
    open.btn.classList.remove('on');
    open.btn.setAttribute('aria-expanded', 'false');
    open = null;
  }
  // The row a card drops in under: a marked anchor, else the field / heading it sits in.
  const anchorOf = btn => btn.closest('[data-help-anchor]') || btn.closest('label, .sidescroll-story-field, h4') || btn.parentElement;

  function show(id, btn) {
    close();
    const entry = TEXTS[id];
    if (!entry || !btn.isConnected) return;
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'ss-help-x'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
    x.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); wantOpen = null; close(); });
    const head = document.createElement('div'); head.className = 'ss-help-head';
    const title = document.createElement('strong'); title.textContent = entry.title;
    head.append(title, x);
    const text = document.createElement('p'); text.textContent = entry.text;
    const card = document.createElement('div');
    card.className = 'ss-help-card'; card.setAttribute('role', 'note'); card.dataset.help = id;
    card.append(head, text);
    anchorOf(btn).after(card);
    btn.classList.add('on'); btn.setAttribute('aria-expanded', 'true');
    open = { id, btn, card };
    wantOpen = id;
  }

  function button(id) {
    const entry = TEXTS[id];
    if (!entry) { console.warn('[editor-help] no text for', id); return null; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ss-help-btn'; b.dataset.help = id;
    b.setAttribute('aria-label', `About: ${entry.title}`); b.setAttribute('aria-expanded', 'false');
    b.textContent = 'i';
    b.addEventListener('click', ev => {
      // Inside a <label>, don't let the tap reach its control.
      ev.preventDefault(); ev.stopPropagation();
      if (open && open.btn === b) { wantOpen = null; close(); } else show(id, b);
    });
    // The editors re-render whole panels after a change: a card that was open (and not
    // closed by the user) reopens under the new copy of its button.
    if (wantOpen === id) queueMicrotask(() => { if (b.isConnected && (!open || !open.card.isConnected)) show(id, b); });
    return b;
  }

  // A tap anywhere else closes the open card.
  document.addEventListener('pointerdown', ev => {
    if (!open) return;
    if (open.card.contains(ev.target) || open.btn.contains(ev.target)) return;
    wantOpen = null; close();
  }, true);

  window.SideScrollHelp = Object.freeze({
    button,
    close: () => { wantOpen = null; close(); },
    text: id => (TEXTS[id] ? { ...TEXTS[id] } : null),
    ids: () => Object.keys(TEXTS),
    openId: () => open?.id || null
  });
})();
