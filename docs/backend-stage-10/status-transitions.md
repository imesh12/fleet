# Planning Status Transitions

## Planned trip transitions

- `DRAFT -> PLANNED | READY | BLOCKED | CANCELED`
- `PLANNED -> READY | BLOCKED | CANCELED | DISPATCHED_PLACEHOLDER`
- `READY -> PLANNED | BLOCKED | CANCELED | DISPATCHED_PLACEHOLDER`
- `BLOCKED -> PLANNED | READY | CANCELED`
- `CANCELED -> none`
- `DISPATCHED_PLACEHOLDER -> none`

## Dispatch queue item transitions

- `DRAFT -> PLANNED | READY | BLOCKED | HELD | CANCELED`
- `PLANNED -> READY | BLOCKED | HELD | CANCELED | DISPATCHED_PLACEHOLDER`
- `READY -> BLOCKED | HELD | CANCELED | DISPATCHED_PLACEHOLDER`
- `BLOCKED -> PLANNED | READY | HELD | CANCELED`
- `HELD -> PLANNED | READY | BLOCKED | CANCELED`
- `CANCELED -> none`
- `DISPATCHED_PLACEHOLDER -> none`

## Notes

- `HELD` is queue-only
- `DISPATCHED_PLACEHOLDER` is planning-only and reserved for future runtime integration
- Canceled or dispatched-placeholder planned trips are locked against further planning edits
