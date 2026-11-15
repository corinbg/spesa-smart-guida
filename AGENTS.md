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

- Archive shopping items and the optional receipt total together through the database's transactional RPC to prevent partially saved shopping sessions.
- Share the checkout dialog between preparation and in-store pages so both entry points validate and save totals identically.
- Only the index route redirects to the default page; shared layouts must preserve direct links to content pages.
