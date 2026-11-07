import * as migration_20261107_154315_initial from './20261107_154315_initial';
import * as migration_20261107_163043_add_richtext from './20261107_163043_add_richtext';
import * as migration_20261107_184639_add_scheduled_publishing from './20261107_184639_add_scheduled_publishing';
import * as migration_20261107_212118_add_courses from './20261107_212118_add_courses';

export const migrations = [
  {
    up: migration_20261107_154315_initial.up,
    down: migration_20261107_154315_initial.down,
    name: '20261107_154315_initial',
  },
  {
    up: migration_20261107_163043_add_richtext.up,
    down: migration_20261107_163043_add_richtext.down,
    name: '20261107_163043_add_richtext',
  },
  {
    up: migration_20261107_184639_add_scheduled_publishing.up,
    down: migration_20261107_184639_add_scheduled_publishing.down,
    name: '20261107_184639_add_scheduled_publishing',
  },
  {
    up: migration_20261107_212118_add_courses.up,
    down: migration_20261107_212118_add_courses.down,
    name: '20261107_212118_add_courses'
  },
];
