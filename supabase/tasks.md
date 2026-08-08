# Supabase Integration Task List

This document outlines the steps to fully integrate Supabase into the Trade Hub application, ensuring robust data handling for authentication, user profiles, journaling, and course progress.

## 1. Authentication & User Management
- [x] **Initialize Client**: `supabase/client.ts` is set up.
- [x] **Sign Up / Sign In**: Implemented in `LoginPage.tsx`.
- [ ] **Auth State Listener**:
    - Verify `onAuthStateChange` in `App.tsx` correctly handles `SIGNED_IN`, `SIGNED_OUT`, and `TOKEN_REFRESHED`.
    - Ensure user session persistence works across reloads.
- [ ] **User Profile Sync**:
    - **Fetch**: Create a function to `select()` from `profiles` table where `id` matches `auth.uid()`.
    - **Create**: Verify `handle_new_user` trigger automatically creates a profile on signup.
    - **Update**: Implement `update()` for `profiles` (e.g., changing `full_name` or `subscription_tier`).

## 2. Journal Entries (Data Operations)
- [ ] **Fetch Entries**:
    - Use `supabase.from('journal_entries').select('*').order('date', { ascending: false })`.
    - Implement pagination using `.range()` if entries become numerous.
- [ ] **Create Entry**:
    - Use `supabase.from('journal_entries').insert(entry)`.
    - Ensure `user_id` is automatically handled or passed securely.
- [ ] **Update Entry**:
    - Use `supabase.from('journal_entries').update(updates).eq('id', entryId)`.
- [ ] **Delete Entry**:
    - Use `supabase.from('journal_entries').delete().eq('id', entryId)`.
- [ ] **Filtering**:
    - Implement filters for `pair`, `status` (win/loss), or `date` using `.eq()`, `.gte()`, `.lte()`.

## 3. User Progress & Courses
- [ ] **Track Progress**:
    - Create `upsert()` logic for `user_progress` table when a user completes a module.
    - `supabase.from('user_progress').upsert({ user_id, course_id, completed: true })`.
- [ ] **Fetch Progress**:
    - Load all progress on app start: `supabase.from('user_progress').select('*')`.

## 4. Type Safety & Developer Experience
- [ ] **Generate Types**:
    - Run `npx supabase gen types typescript --project-id <PROJECT_ID> > supabase/types.ts` (requires Supabase CLI).
    - Alternatively, manually define interfaces in `types.ts` matching the SQL schema.
- [ ] **Error Handling**:
    - Wrap all Supabase calls in `try/catch` or check `{ error }` return value.
    - Display user-friendly error messages (using the `error.message` property).

## 5. Security & RLS (Verification)
- [ ] **Verify RLS Policies**:
    - Test that a user cannot fetch another user's journal entries.
    - Test that a user cannot update another user's profile.

## 6. Realtime (Optional/Future)
- [ ] **Live Updates**:
    - Subscribe to `journal_entries` to auto-update the UI if an entry is added from another device.
    - `supabase.channel('custom-all-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, (payload) => { ... }).subscribe()`

## Reference Implementation Snippets

### Fetching Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Adding a Journal Entry
```typescript
const { data, error } = await supabase
  .from('journal_entries')
  .insert([
    { 
      pair: 'EURUSD', 
      type: 'buy', 
      entry_price: 1.0500, 
      user_id: user.id 
    }
  ])
  .select();
```
