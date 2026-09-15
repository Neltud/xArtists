# LIA executor — workstream (not a status label)

## Reality

- Decision pipeline / board may run in **paper**
- Live signing is a **separate** implementation task
- Flag: `LIA_LIVE_TRADING` must remain **0** until executor is real

## Definition of done

1. No `pass` / empty body on the final execute step  
2. Typed inputs (wallet, mode, risk) enforced  
3. Guardian / balance checks before any TX  
4. Paper mode still default  
5. Live mode requires explicit env + human ops note in `DEPLOYMENT_LOG.md`  
6. ContrarianBrain / GSN **only** if actually called from the graph — else keep `docs/STATUS_GSN_CONTRARIAN.md`

## Relation to GrokyversX

GrokyversX = optional **host** trader (PEM on operator).  
It does **not** replace LIA product identity or SC marketplace.
