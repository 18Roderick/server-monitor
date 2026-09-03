import { HttpApi } from '@effect/platform';

import { AuthGroup } from '@/Auth/Auth.api';
import { UsersGroup } from '@/Users/Users.api';
import { ServersGroup } from '@/Servers/Servers.api';
import { PingsGroup } from '@/Pings/Pings.api';
import { TaskGroup } from '@/Queue/Task.api';

export class Api extends HttpApi.make('PingServerApi')
  .add(AuthGroup)
  .add(UsersGroup)
  .add(ServersGroup)
  .add(PingsGroup)
  .add(TaskGroup) {}
