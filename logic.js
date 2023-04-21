// SPDX-License-Identifier: MIT
// Copyright © 2023 André "Oatspear" Santos

/*******************************************************************************
  Utility
*******************************************************************************/


function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const rand = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[rand];
    array[rand] = temp;
  }
  return array;
}


/*******************************************************************************
  Data Constants
*******************************************************************************/

function constStateSetup() { return 0; }
function constStateBattle() { return 1; }


/*******************************************************************************
  Skill Data
*******************************************************************************/



/*******************************************************************************
  Class Data
*******************************************************************************/



/*******************************************************************************
  Player Character Data
*******************************************************************************/



/*******************************************************************************
  Enemy Character Data
*******************************************************************************/



/*******************************************************************************
  Battle Events
*******************************************************************************/



/*******************************************************************************
  Battle Logic
*******************************************************************************/


function processPlayerSkill(game, player, skill, args) {
  // do something

  doEndOfTurnEffects(game);

  // Determine if game has ended
  if (isGameOver(game)) {
    if (game.enemy.currentHealth <= 0) {
      Rune.gameOver(gameOverOptionsWon(game, false));
    } else {
      Rune.gameOver(gameOverOptionsLost(game, false));
    }
  }

  advanceTurns(game);
}


function resolveSkill(game, user, skill, args) {
  switch (skill.data.mechanic) {
    default:
      throw Rune.invalidAction();
  }
}


function getPlayer(game, playerId) {
  for (const player of game.players) {
    if (player.playerId === playerId) {
      return player;
    }
  }
}


function doEndOfTurnEffects(game) {
  for (const player of game.players) {
    doEndOfTurnEffectsForCharacter(game, player);
  }
}


function doEndOfTurnEffectsForCharacter(game, character) {

}



function advanceTurns(game) {
  game.turns++;
}


function isGameOver(game) {
  for (const player of game.players) {
    if (player.currentHealth > 0) {
      return false;
    }
  }
  return true;
}

function gameOverOptionsLost(game, delayPopUp) {
  return gameOverOptions(game, "LOST", delayPopUp);
}

function gameOverOptionsWon(game, delayPopUp) {
  return gameOverOptions(game, "WON", delayPopUp);
}

function gameOverOptions(game, result, delayPopUp) {
  let players = {};
  for (const player of game.players) {
    players[player.playerId] = result;
  }
  return {
    players: players,
    delayPopUp: (delayPopUp || false)
  };
}

/*******************************************************************************
  Rune Setup
*******************************************************************************/

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 4,

  setup(players) {
    // players: array of string IDs
    const game = {
      state: constStateSetup(),
      enemy: null,
      players: [],
      currentTurn: null,
      events: [],
      enemyTarget: 0,
      turns: 0
    };

    for (const playerId of players) {
      const player = {};
      // const classData = game.availableHeroes.pop();
      // Object.assign(player, classData);
      // player.currentHealth = player.health;
      game.players.push(player);
    }

    // enterBattleState(game);

    return game;
  },

  actions: {
    // selectCharacter(payload, { game, playerId }) {
    //   if (game.state !== constStateSetup()) {
    //     throw Rune.invalidAction();
    //   }

    //   // Get the corresponding player
    //   const player = getPlayer(game, playerId);
    //   if (player == null) {
    //     throw Rune.invalidAction();
    //   }

    //   // Get the selected class data
    //   const classData = getClassById(payload.classId);
    //   Object.assign(player, classData);

    //   // Check if everyone is ready
    //   for (const character of game.players) {
    //     if (!character.classId) { return; }
    //   }

    //   // Transition to battle state
    //   enterBattleState(game);
    // },

    useSkill(payload, { game, playerId }) {
      if (game.state !== constStateBattle()) {
        throw Rune.invalidAction();
      }

      // Check if it's the player's turn
      const player = getPlayer(game, playerId);
      if (player == null || game.currentTurn !== player.id) {
        throw Rune.invalidAction();
      }
      // Check if the selected skill can be used
      const skill = player.skills[payload.skill];
      if (skill == null || skill.wait > 0) {
        throw Rune.invalidAction();
      }
      processPlayerSkill(game, player, skill, payload);
    }
  },
});
