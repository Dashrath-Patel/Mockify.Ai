# Security Guide for Mockify AI

## 🔒 API Key Security

### ⚠️ CRITICAL: Exposed API Key Found

**IMMEDIATE ACTION REQUIRED:**

Your Gemini API key is currently exposed in `.env.local`. This is a **critical security risk**.

### Steps to Secure Your API Keys

#### 1. Revoke the Exposed Key (DO THIS FIRST)

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your API key: `AIzaSyBGZYkCD3ONR6F74IFXiXsSouqAYsAJLQ4`
3. Click on it and select **"Delete"** or **"Regenerate"**
4. Create a new API key

#### 2. Remove Sensitive Files from Git History

If `.env.local` was committed to git:

```bash
# Remove from current commit
git rm --cached .env.local

# Commit the removal
git commit -m "Remove exposed API keys"

# For complete removal from history (use with caution)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if absolutely necessary)
git push origin --force --all
```

#### 3. Verify .gitignore

Ensure `.gitignore` includes (already configured):

```gitignore
# env files
.env*
.env.local
.env.development.local
.env.test.local
.env.production.local
```

#### 4. Add API Key Restrictions in Google Cloud Console

1. **Go to**: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. **Select your API key**
3. **Add Application Restrictions:**
   - Select "HTTP referrers (web sites)" if using from web
   - Add your domain(s): `https://your-domain.com/*`
   - For development: Add `http://localhost:3000/*`

4. **Add API Restrictions:**
   - Click "Restrict key"
   - Select only: **"Generative Language API"** (Gemini)
   - Do NOT select "Don't restrict key"

5. **Set Usage Quotas:**
   - Set daily request limits
   - Set rate limits (requests per minute)
   - Enable billing alerts

#### 5. Environment Variables Best Practices

**✅ CORRECT - Server-side Only:**
```env
# These are NEVER exposed to the client
GEMINI_API_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
GROQ_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

**❌ WRONG - Client-side Exposed:**
```env
# NEVER use NEXT_PUBLIC_ prefix for API keys!
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here  # ⚠️ EXPOSED TO BROWSER!
NEXT_PUBLIC_OPENAI_API_KEY=your_key_here  # ⚠️ EXPOSED TO BROWSER!
```

**Why?** In Next.js, any environment variable starting with `NEXT_PUBLIC_` is embedded in the client-side JavaScript bundle and can be seen by anyone.

#### 6. Create a New .env.local (Never Commit This)

Create a new `.env.local` file with your NEW API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys (Server-side only)
GEMINI_API_KEY=your_NEW_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🛡️ Security Architecture

### Current Implementation (✅ Secure)

All Gemini API calls are made **server-side** through Next.js API routes:

1. **Embeddings Generation**: `/api/generate-questions`, `/api/upload`, `/api/search-materials`
2. **Content Generation**: `/lib/gemini.ts` (server-side only)
3. **Document Processing**: `/lib/syllabus-extraction.ts` (server-side only)

### How It Works

```
Client Browser → Next.js API Route → Gemini API (with secret key)
                 (Server-side)
```

The API key is **never** sent to the client's browser.

## 📋 Security Checklist

- [ ] Revoke the exposed API key
- [ ] Remove `.env.local` from git history
- [ ] Create new API key with restrictions
- [ ] Add HTTP referrer restrictions
- [ ] Add API restrictions (Generative Language API only)
- [ ] Set usage quotas and billing alerts
- [ ] Verify no `NEXT_PUBLIC_` prefixes on secret keys
- [ ] Test API calls still work after restrictions
- [ ] Monitor API usage for suspicious activity

## 🚨 What If My Key Was Compromised?

1. **Immediately revoke the key** in Google Cloud Console
2. **Check billing** for unexpected usage
3. **Review API logs** for suspicious activity
4. **Create new key** with proper restrictions
5. **Update your `.env.local`** with the new key
6. **Restart your development server**

## 📚 Additional Resources

- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Gemini API Security Guidelines](https://ai.google.dev/gemini-api/docs/api-key)

## 🔍 Regular Security Audits

Run these checks monthly:

```bash
# Check for exposed keys in code
grep -r "AIza" .
grep -r "NEXT_PUBLIC.*KEY" .

# Check git history for secrets
git log -p | grep -i "api.key\|password\|secret"

# Verify .env files are ignored
git check-ignore .env.local
```

## 💡 Pro Tips

1. **Use separate keys for development and production**
2. **Rotate API keys every 90 days**
3. **Set up monitoring and alerts for API usage**
4. **Use secret management services** (AWS Secrets Manager, Google Secret Manager) for production
5. **Never log API keys** in console.log or error messages

---

**Remember**: Security is not a one-time setup. Regularly review and update your security practices.
