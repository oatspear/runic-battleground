// SPDX-License-Identifier: MIT
// Copyright © 2023 André "Oatspear" Santos

const BattleZone = {
  template: "#vue-battle-zone",
  props: {},
  data() {},
  methods: {
    onEnemySelected(character) {
      this.$emit("selected-enemy", character);
    },

    onPlayerSelected(character) {
      this.$emit("selected-player", character);
    }
  }
};


const BattleArmySlot = {
  template: "#vue-battle-army-slot",
  props: {},
  data() {},
  methods: {
    onSelected() {
      // this.$emit("selected-player", character);
    }
  }
};
