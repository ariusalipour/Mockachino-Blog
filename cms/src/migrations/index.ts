import * as migration_20261107_154315_initial from './20261107_154315_initial';

export const migrations = [
  {
    up: migration_20261107_154315_initial.up,
    down: migration_20261107_154315_initial.down,
    name: '20261107_154315_initial'
  },
];
