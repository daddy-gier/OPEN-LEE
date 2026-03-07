# 🔑 **API KEYS FOR BEGINNERS — MAKE MORE AI MODELS WORK**

## **WHAT ARE API KEYS?**

Think of an API key as a "password" that lets OPEN-LEE talk to AI services online.

**Right now:** Your app works with 2 free local models
**With API keys:** Your app will have access to 4 more powerful cloud models

```
BEFORE (2 models):         AFTER (6 models):
├─ OpenClaw (local)        ├─ Claude (premium!)
└─ LudusAI (local)         ├─ ChatGPT (premium!)
                           ├─ Mistral (premium!)
                           ├─ Grok (premium!)
                           ├─ OpenClaw (local)
                           └─ LudusAI (local)
```

---

## ⚠️ **IMPORTANT: API KEYS ARE OPTIONAL**

- ✅ OPEN-LEE works fine without them
- ✅ You can always add them later
- ✅ Some require money (not free)
- ✅ This guide shows you HOW, but you don't have to do it

**If you want the free version to work, skip this guide!**

---

## 💰 **COST BREAKDOWN**

| Model | Cost | Quality |
|-------|------|---------|
| Claude | Free tier (limited) or paid | ⭐⭐⭐⭐⭐ Excellent |
| ChatGPT | Free tier or paid | ⭐⭐⭐⭐ Great |
| Mistral | Free tier | ⭐⭐⭐ Good |
| Grok | Paid | ⭐⭐⭐ Good |
| OpenClaw | FREE (local) | ⭐⭐⭐ Good |
| LudusAI | FREE (local) | ⭐⭐ Basic |

---

## 🚀 **STEP 1: GET CLAUDE API KEY (RECOMMENDED)**

Claude is the best. Anthropic offers a free trial.

### Do This:

1. Open browser, go to: `https://console.anthropic.com/login`
2. Click **"Create new account"** (if you don't have one)
3. Sign up with email
4. Go to: `https://console.anthropic.com/account/keys`
5. Click **"Create Key"**
6. Copy the key (it looks like: `sk-ant-v0x...`)
7. Keep this somewhere safe!

---

## 🚀 **STEP 2: GET CHATGPT API KEY**

ChatGPT is made by OpenAI. You need a paid account.

### Do This:

1. Go to: `https://platform.openai.com/login`
2. Sign in (or create account)
3. Go to: `https://platform.openai.com/account/api-keys`
4. Click **"Create new secret key"**
5. Copy it (looks like: `sk-...`)
6. Keep it safe!

⚠️ **Note:** This requires a payment method (credit card). You pay for usage.

---

## 🚀 **STEP 3: GET MISTRAL API KEY (FREE)**

Mistral offers free API access!

### Do This:

1. Go to: `https://console.mistral.ai/login`
2. Create account / sign in
3. Go to **API Keys** section
4. Click **"Create new key"**
5. Copy it
6. Keep it safe!

---

## 🚀 **STEP 4: GET GROK API KEY**

Grok is made by xAI. You need to:

1. Go to: `https://console.x.ai`
2. Sign up / log in
3. Create an API key
4. Copy it
5. Keep it safe!

⚠️ **Note:** Grok is paid. Check their pricing.

---

## 📁 **STEP 5: ADD KEYS TO OPEN-LEE**

### Where OPEN-LEE Looks for Keys:

Your app looks for a file called **`.env`** in the main folder.

### How to Create the .env File:

1. Open **Notepad** (search for "Notepad" in Start menu)
2. Copy this and paste it in Notepad:

```
ANTHROPIC_API_KEY=paste-your-claude-key-here
OPENAI_API_KEY=paste-your-chatgpt-key-here
MISTRAL_API_KEY=paste-your-mistral-key-here
GROK_API_KEY=paste-your-grok-key-here
OLLAMA_URL=http://localhost:11434
```

3. **Replace** the placeholder text with your actual keys:
   - Where it says `paste-your-claude-key-here`, paste your real Claude key
   - Where it says `paste-your-chatgpt-key-here`, paste your real ChatGPT key
   - And so on...

**Example (FAKE KEYS, DON'T USE):**
```
ANTHROPIC_API_KEY=sk-ant-v0xABCDEFGHIJKLMNOPQRST
OPENAI_API_KEY=sk-proj-1234567890ABCDEFGHIJK
MISTRAL_API_KEY=aA1bB2cC3dD4eE5fF6gG7hH8
GROK_API_KEY=grok_key_1234567890
OLLAMA_URL=http://localhost:11434
```

4. Go to **File** → **Save As**
5. **Important:** In the filename box, type: `.env` (just that, nothing else)
6. Make sure **"Save as type"** is set to **"All Files"** (not "Text Documents")
7. **Location:** Save it to your main OPEN-LEE folder
   ```
   C:\Users\Gierl\source\repos\ConsoleApp1\.env
   ```
8. Click **Save**

### ✅ Done! Now restart OPEN-LEE:

1. Close OPEN-LEE if it's open
2. Open it again
3. Try a query
4. ✅ Now you have access to all 6 models!

---

## ⚠️ **IMPORTANT SECURITY TIPS**

### 🔒 NEVER:
- ❌ Share your API keys with anyone
- ❌ Post them online
- ❌ Upload them to GitHub
- ❌ Put them in code you share

### ✅ DO:
- ✅ Keep them private
- ✅ Treat them like passwords
- ✅ If you accidentally share one, delete it immediately and create a new one
- ✅ Only other people on your computer should see the .env file

---

## 🧪 **TEST YOUR KEYS**

After adding your .env file:

1. Open OPEN-LEE
2. Type a question
3. Click EXECUTE
4. If all 6 models respond → ✅ Keys work!
5. If some don't respond → They might be invalid or the service is down

---

## 💳 **MANAGING COSTS**

If you use paid models (Claude, ChatGPT, Grok):

1. **Check your usage regularly**
   - Go to their website and log in
   - Look for "Usage" or "Billing" section
   - See how much you've spent

2. **Set spending limits**
   - Most services let you set a monthly limit
   - Do this to avoid surprises

3. **You only pay for what you use**
   - A few queries = very cheap (cents)
   - Many queries = could add up

---

## 🔄 **IF YOUR KEY STOPS WORKING**

### Reasons:
- Service is down (temporarily)
- You reached your usage limit
- Your key expired
- You accidentally deleted it

### Fix:
1. Create a new API key on the service's website
2. Replace the old one in your .env file
3. Save the file
4. Restart OPEN-LEE

---

## 📚 **WITHOUT API KEYS (Still Great!)**

You can still use OPEN-LEE with just:
- ✅ OpenClaw (local, free)
- ✅ LudusAI (local, free)

These are completely free and work perfectly!

---

## ❓ **FAQ**

### Q: Do I need all 6 models?
**A:** No! Even 2 models work great. Add more if you want.

### Q: Can I get free API keys?
**A:** Some have free tiers:
- Claude: Limited free tier
- ChatGPT: Limited free tier
- Mistral: Generous free tier!
- Grok: Paid only

### Q: What if I don't want to pay?
**A:** Just use the free local models. They work great!

### Q: Can I use OPEN-LEE without any API keys?
**A:** Yes! OpenClaw and LudusAI are free and local.

### Q: What if I lose my API key?
**A:** Create a new one. It only takes 30 seconds.

---

## ✅ **YOU'RE DONE!**

Now OPEN-LEE has access to multiple powerful AI models!

---

**Built with ❤️ for beginners | OPEN-LEE v3.1**
