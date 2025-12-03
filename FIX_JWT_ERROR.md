# Fix: "No JWT template exists with name: supabase"

This error occurs because Clerk doesn't know how to generate a token compatible with Supabase yet. You need to create a **JWT Template** in your Clerk Dashboard.

## Step 1: Get Supabase JWT Secret
1.  Log in to your **Supabase Dashboard**.
2.  Select your project (`filetransfer` / `myrthifravcxvcqlptcp`).
3.  Go to **Project Settings** (gear icon) > **API**.
4.  Scroll down to **JWT Settings**.
5.  Copy the **JWT Secret** (you might need to click "Reveal").

## Step 2: Create Clerk JWT Template
1.  Log in to your **Clerk Dashboard**.
2.  Go to **Configure** > **JWT Templates**.
3.  Click **New Template**.
4.  Select **Supabase** from the list.
5.  **Name:** Ensure the name is exactly `supabase`.
6.  **Signing Key:** This field is located right below the "Name" field.
    *   It might be labeled as **"Signing Key"**, **"Key"**, or **"Secret"**.
    *   It is a large text box where you can paste the long string you copied from Supabase.
    *   **Paste the Supabase JWT Secret here.**
7.  Click **Save**.

## Troubleshooting
### "Signature verification failed" or "No suitable key"
This error **ALWAYS** means the keys do not match.

**Try this "Clean Slate" approach:**
1.  **Clerk Dashboard:** Delete the existing `supabase` template.
2.  **Supabase Dashboard:** Go to Project Settings > API > JWT Settings.
    *   Check the Project ID in the URL. It should be `myrthifravcxvcqlptcp`.
    *   **Reveal** and **Copy** the JWT Secret.
3.  **Clerk Dashboard:** Create a **NEW** template.
    *   Select **Supabase**.
    *   Name: `supabase`.
    *   **Signing Key:** Paste the secret you just copied.
4.  Save and try again.
