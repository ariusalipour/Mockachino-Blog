import * as migration_20261107_154315_initial from './20261107_154315_initial';
import * as migration_20261107_163043_add_richtext from './20261107_163043_add_richtext';

export const migrations = [
  {
    up: migration_20261107_154315_initial.up,
    down: migration_20261107_154315_initial.down,
    name: '20261107_154315_initial',
  },
  {
    up: migration_20261107_163043_add_richtext.up,
    down: migration_20261107_163043_add_richtext.down,
    name: '20261107_163043_add_richtext'
  },
];
