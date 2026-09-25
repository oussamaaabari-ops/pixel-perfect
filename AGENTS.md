<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture

- Le moteur de calcul PV vit dans `src/lib/pv/` (types, calc, equipment, store, format) et reste pur, sans dépendance UI — pour pouvoir le tester et le réutiliser (API, export) indépendamment des pages.
- Les projets sont persistés en localStorage via `src/lib/pv/store.ts` (MVP sans backend) ; toute future migration backend passe par ce seul module.
- Rendement de référence : `Y_r [h] = H_POA [kWh/m²] / G_STC (1 kW/m²)` — ne pas diviser par 1000.
