// SPDX-License-Identifier: MIT
// Copyright © 2023 André "Oatspear" Santos

const RANDOM_PLAYER_ID1 = "randomPlayerId1";
const RANDOM_PLAYER_ID2 = "randomPlayerId2";
const RANDOM_PLAYER_ID3 = "randomPlayerId3";
const RANDOM_PLAYER_ID4 = "randomPlayerId4";

const Rune = {
  players: {
    "randomPlayerId1": {
      displayName: "Oatspear",
      playerId: RANDOM_PLAYER_ID1
    },
    "randomPlayerId2": {
      displayName: "Oatspear",
      playerId: RANDOM_PLAYER_ID2
    },
    "randomPlayerId3": {
      displayName: "Oatspear",
      playerId: RANDOM_PLAYER_ID3
    },
    "randomPlayerId4": {
      displayName: "Oatspear",
      playerId: RANDOM_PLAYER_ID4
    }
  },
  game: {},
  actions: {},
  visualUpdate: null,

  internal: {
    order: null,
    currentTurn: null
  },

  initLogic(params) {
    console.log("Rune.initLogic()");
    console.log("minPlayers:", params.minPlayers);
    console.log("maxPlayers:", params.maxPlayers);
    console.log("setup:", params.setup);
    console.log("actions:", params.actions);

    this.internal.order = Object.keys(this.players).slice(0, params.minPlayers);
    this.internal.currentTurn = this.internal.order[0];
    this.game = params.setup(this.internal.order);

    const self = this;
    for (const key of Object.keys(params.actions)) {
      this.actions[key] = (function (k) {
        const cb = params.actions[k];
        return function (payload) {
          const players = self.players;
          const oldGame = self.game;
          const newGame = JSON.parse(JSON.stringify(oldGame));
          const context = { game: newGame, playerId: self.internal.currentTurn };
          console.time("action");
          cb(payload, context);
          console.timeEnd("action");
          self.game = newGame;
          self.internal.currentTurn = newGame.players[newGame.currentTurn].playerId;
          window.setTimeout(function () {
            console.time("visualUpdate");
            self.visualUpdate({
              newGame: newGame,
              oldGame: oldGame,
              yourPlayerId: self.internal.currentTurn,
              players: players,
              action: {
                action: k,
                params: payload,
                playerId: self.internal.currentTurn
              },
              event: undefined,
              rollbacks: []
            });
            console.timeEnd("visualUpdate");
          }, 0);
        };
      })(key);
      console.log(`Rune.actions.${key} =`, this.actions[key]);
    }

    // temporary, until initClient is called
    this.visualUpdate = function () {
      self.visualUpdate({
        newGame: self.game,
        oldGame: self.game,
        yourPlayerId: self.internal.currentTurn,
        players: self.players,
        action: undefined,
        event: {event: "stateSync"},
        rollbacks: []
      });
    };
  },

  initClient(params) {
    console.log("Rune.initClient()");
    console.log("visualUpdate:", params.visualUpdate);
    const callback = this.visualUpdate;
    this.visualUpdate = params.visualUpdate;
    callback();
  },

  invalidAction() {
    return new Error();
  },

  gameOver() {
    alert("Game Over!");
    throw new Error();
  }
};
