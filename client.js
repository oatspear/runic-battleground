// SPDX-License-Identifier: MIT
// Copyright © 2023 André "Oatspear" Santos

const { createApp } = Vue;


const DEFAULT_ANIM_DURATION = 1000;

const UIState = newEnum([
  "INIT",
  "BATTLE_SETUP",
  "CHOOSE_ACTION",
  "CHOOSE_TARGET",
  "SYNC",
  "ANIMATION",
  "AWAITING_PLAYER_ACTION"
]);


// function _sortById(a, b) {
//   if (a.id < b.id) { return -1; }
//   if (a.id > b.id) { return 1; }
//   return 0;
// }


function newAnimationSequence(game, playerId) {
  const events = [];
  if (game.events.length > 0) {
    Array.prototype.push.apply(events, game.events);
  }
  return {
    events: events,
    finalState: game,
    playerId: playerId
  };
}


function newClientSkill(skillInstance) {
  const meta = Skills[skillInstance.data.id];
  // NOTE: `skill.data` is shared! `Object.assign` is a shallow copy.
  const skill = Object.assign({}, skillInstance);
  return Object.assign(skill, meta);
}


function newClientEnemy(data, index) {
  return newClientPlayer(data, index);  // FIXME
}


function newClientPlayer(data, index, uiInfo) {
  if (data == null) {
    return { id: null, index: index };
  }
  const cls = Classes[data.classId];
  const skills = data.skills.map(newClientSkill);
  // for (const skill of data.skills) {
  //   // skills.push(newClientSkill(s.id));
  //   skills.push(newClientSkill(skill));
  // }
  let displayName = cls.name;
  let portrait = `assets/${cls.icon}.png`;
  if (uiInfo != null) {
    displayName = uiInfo.displayName || displayName;
    portrait = uiInfo.avatarUrl || portrait;
  }
  // uiInfo != null ? uiInfo.avatarUrl : "assets/avatar-placeholder.png"
  return {
    id: data.id,
    index: index,
    playerId: data.playerId,
    name: displayName,
    portrait: portrait,
    hasUIData: uiInfo != null,
    classData: cls,
    // speed: data.speed,
    power: data.power,
    health: data.health,
    currentHealth: data.currentHealth,
    skills: skills,
    animation: null,
    stunned: data.effects.stunned,
    shield: data.effects.shield,
    poison: data.effects.poison,
    healing: data.effects.healing,
    invulnerable: data.effects.invulnerable,
    healingModifier: data.effects.healingModifier,
    armorModifier: data.effects.armorModifier
  };
}


const app = createApp({
  data() {
    return {
      playerId: undefined,
      currentTurn: 0,
      players: [],
      ui: {
        state: UIState.INIT,
        isAnimating: false,
        animationQueue: [],
        globalAnimation: ""
      }
    };
  },

  computed: {
    isSetupState() {
      return this.ui.state === UIState.BATTLE_SETUP;
    },

    isBattleState() {
      return this.ui.state != UIState.INIT && this.ui.state != UIState.BATTLE_SETUP;
    },

    isObserverMode() {
      if (this.playerId == null) { return true; }
      const state = this.ui.state;
      if (state === UIState.CHOOSE_ACTION) { return false; }
      if (state === UIState.CHOOSE_TARGET) { return false; }
      return true;
    }
  },

  methods: {
    onSetupDone(game, playerId, players) {
      // assert(this.ui.state === UIState.INIT, `UI state: ${this.ui.state}`);
      this.ui.playerData = players;
      this.setGameState(game, playerId);
      this.ui.globalAnimation = "anim-battle-start";
      window.setTimeout(() => { this.setActionUIState(); }, 2000);
      // this.enterChooseCharacterUIState();
    },

    setActionUIState() {
      const character = this.controlledCharacter;
      if (character != null) {
        this.enterChooseActionState();
      } else {
        this.enterAwaitPlayerState();
      }
      this.ui.globalAnimation = "";
    },

    setGameState(game, playerId) {
      // Hard reset of the current game state
      console.log("setGameState()");
      this.playerId = playerId;
      this.ui.state = "battle";
      this.enemies = [newClientEnemy(game.enemy, 0)];
      this.setPlayerStates(game.players);
      this.resetCharacterMap();
      this.currentTurn = game.currentTurn;
      this.eventQueue = game.events;
    },

    setPlayerStates(players) {
      this.players = [];
      for (let i = 0; i < players.length; ++i) {
        const ui = this.ui.playerData[players[i].playerId];
        this.players.push(newClientPlayer(players[i], i, ui));
      }
      this.ui.compact = this.players.length > 2;
    },

    animateNewGameState(game, playerId) {
      console.log("animateNewGameState()");
      this.ui.animationQueue.push(newAnimationSequence(game, playerId));
      if (!this.ui.isAnimating) {
        window.setTimeout(() => { this.doNextAnimation(); }, 0);
      }
    },

    doNextAnimation() {
      if (this.ui.isAnimating) { return false; }
      if (this.ui.animationQueue.length === 0) {
        // No more animations. Reset UI state.
        this.setActionUIState();
        return false;
      }
      const sequence = this.ui.animationQueue[0];
      console.log("begin animation sequence", sequence);
      if (this.ui.state != UIState.ANIMATION) {
        this.enterAnimationState();
      }
      if (sequence.events.length === 0) {
        // Reached the end of this animation sequence
        this.ui.animationQueue.splice(0, 1);
        this.setGameState(sequence.finalState, sequence.playerId);
        window.setTimeout(() => { this.doNextAnimation(); }, 0);
      } else {
        // Animate the next event
        const event = sequence.events.splice(0, 1)[0];
        this.animateEvent(event);
      }
      return true;
    },

    animateEvent(event) {
      console.log("animateEvent:", event);
      this.ui.isAnimating = true;

      if (event.type === "skill") {
        this.history.splice(0, 1);
        this.history.push(event);
        this.ui.actingCharacter = event.user;
      } else if (event.multitarget) {
        // TODO
        // for (const character of this.players) {
        //   character.animation = event;
        // }
      } else {
        const i = event.target;
        if (i != null) {
          const character = i >= 0 ? this.players[i] : this.enemies[-i - 1];
          character.animation = event;
        } else {
          // FIXME e.g. notification-type event or death
        }
      }
      window.setTimeout(() => {
        this.stopEventAnimation();
        window.setTimeout(() => {
          this.doNextAnimation();
        }, 0);
      }, DEFAULT_ANIM_DURATION);
    },

    stopEventAnimation() {
      this.ui.isAnimating = false;
      for (const character of this.enemies) {
        character.animation = null;
      }
      for (const character of this.players) {
        character.animation = null;
      }
    },

    onUseSkill() {
      assert(this.ui.state === UIState.CHOOSE_TARGET, `UI state: ${this.ui.state}`);
      const i = this.ui.footer.selectedSkill;
      const t = this.ui.footer.selectedTarget;
      assert(i != null);
      assert(t != null);

      // refresh UI
      this.enterSyncState();

      // call logic action
      console.log(this.playerId, "selected skill", i);
      Rune.actions.useSkill({ skill: i, target: t });
    },

    enterChooseActionState() {
      this.ui.state = UIState.CHOOSE_ACTION;
      this.ui.targetMode = null;
      this.ui.selectedEnemy = null;
      this.ui.selectedPlayer = null;
      const character = this.controlledCharacter;
      this.ui.actingCharacter = null;
      this.ui.footer.display = true;
      this.ui.footer.observer = false;
      this.ui.footer.characterData = character;
      this.ui.footer.selectedSkill = null;
      this.ui.footer.selectedTarget = null;
      this.ui.footer.skills = character.skills;
      this.ui.footer.itemName = "";
      this.ui.footer.itemDescription = "Choose a skill.";
    },

    enterSyncState() {
      this.ui.state = UIState.SYNC;
      this.ui.targetMode = null;
      this.ui.selectedEnemy = null;
      this.ui.selectedPlayer = null;
      const character = this.controlledCharacter;
      // this.ui.actingCharacter = character.id;
      this.ui.footer.display = true;
      this.ui.footer.observer = true;
      this.ui.footer.characterData = character;
      this.ui.footer.selectedSkill = null;
      this.ui.footer.selectedTarget = null;
      // this.ui.footer.skills = character.skills;
      this.ui.footer.itemName = "Syncing";
      this.ui.footer.itemDescription = "...";
    },

    enterAwaitPlayerState() {
      this.ui.state = UIState.AWAITING_PLAYER_ACTION;
      this.ui.targetMode = null;
      this.ui.selectedEnemy = null;
      this.ui.selectedPlayer = null;
      const character = this.activeCharacter;
      this.ui.actingCharacter = character.id;
      this.ui.footer.display = this.playerId != null;
      this.ui.footer.observer = true;
      this.ui.footer.characterData = character;
      this.ui.footer.selectedSkill = null;
      this.ui.footer.selectedTarget = null;
      this.ui.footer.skills = [];
      this.ui.footer.itemName = character.name;
      this.ui.footer.itemDescription = `(${character.classData.name}) is thinking...`;
    },

    enterAnimationState() {
      this.ui.state = UIState.ANIMATION;
      this.ui.targetMode = null;
      this.ui.selectedEnemy = null;
      this.ui.selectedPlayer = null;
      const character = this.activeCharacter;
      this.ui.actingCharacter = character.id;
      this.ui.footer.display = this.playerId != null;
      this.ui.footer.observer = true;
      this.ui.footer.characterData = character;
      this.ui.footer.selectedSkill = null;
      this.ui.footer.selectedTarget = null;
      // this.ui.footer.skills = [];
      this.ui.footer.itemName = character.name;
      this.ui.footer.itemDescription = "'s turn.";
    }

    // refreshSlides() {
    //   const slidesContainer = document.getElementById("slides-container");
    //   const slide = document.querySelector(".slide");
    //   const slideWidth = slide.clientWidth;
    //   slidesContainer.scrollLeft = this.currentTurn * slideWidth;
    // }
  },

  mounted() {
    initRuneClient(this);
  }
});

app.component("BattleSetup", BattleSetup);

app.mount("#app");

/*******************************************************************************
  Rune Setup
*******************************************************************************/

function initRuneClient(vueApp) {
  Rune.initClient({
    visualUpdate: ({
      newGame,
      oldGame,
      yourPlayerId,
      players,
      action,
      event,
      rollbacks,
    }) => {
      // Update interface based on game state from logic.js.
      // The `visualUpdate` function must be synchronous.
      // It may trigger async functions if needed, but cannot `await` them.
      console.log("visualUpdate()");
      // console.log("yourPlayerId:", yourPlayerId);
      // console.log("action:", action);
      // console.log("event:", event);
      // console.log("new game state:", newGame);
      // console.log("rollbacks:", rollbacks);
      if (action == null) {
        // Not a partial update. Might be a post-setup call, for example.
        // if (event != null) {
        //   if (event.event === "playerJoined" || event.event === "playerLeft") {}
        // }
        vueApp.onSetupDone(newGame, yourPlayerId, players);
      } else {
        vueApp.animateNewGameState(newGame, yourPlayerId);
      }
    },
  });
}
