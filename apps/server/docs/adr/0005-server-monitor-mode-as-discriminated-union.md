# Server Monitor Mode as a discriminated union

`CreateServerInput`/`UpdateServerInput` modeled `url` and `ip` as two independent optional fields, with `worker_type` derived by a ternary (`input.ip ? 'server' : 'url'`). This let both be supplied at once (no rejection), and on update it created a one-way ratchet: sending `ip` flipped `worker_type` to `'server'`, but sending only `url` afterward never flipped it back, since the update omits the key entirely rather than clearing it.

We're replacing this with a tagged union input (`{ mode: 'url', url } | { mode: 'ip', ip }`) so a Server's Monitor Mode (see `CONTEXT.md`) is structurally exclusive rather than validated after the fact, on both create and update. We considered leaving the schema as-is and only enforcing exclusivity in the frontend form, but rejected it: the ambiguity and the ratchet bug would still be reachable by any other API client, and the two-independent-optionals shape doesn't extend cleanly if a third Monitor Mode is added later.

## Consequences

Any existing direct API consumer that sent both `url` and `ip`, or relied on updating one after the other to flip modes, needs to switch to the tagged payload shape.
