# Quick Test Reference Card

## 🚀 Quick Start

1. Clear browser storage: `localStorage.clear()`
2. Load test script in console (copy from `test-wallet-connection.js`)
3. Run: `healthCheck()`
4. Start monitoring: `monitorEvents()`

## 📋 Essential Tests (Quick Validation)

| # | Test | Expected Time | Pass/Fail |
|---|------|---------------|-----------|
| 1 | Connect wallet | < 5s | [ ] |
| 3 | Reload page | < 2s | [ ] |
| 5 | Change account | < 2s | [ ] |
| 8 | Disconnect | < 2s | [ ] |
| 9 | Check HBAR balance | < 3s | [ ] |
| 11 | Sign transaction | < 10s | [ ] |

## 🔧 Console Commands

```javascript
// Check session
checkSession()

// Monitor events
monitorEvents()

// Test speed
testConnectionSpeed()

// Health check
healthCheck()

// Generate report
getTestReport()

// Clear session
clearSession()
```

## ✅ Quick Validation Checklist

- [ ] Extension popup appears
- [ ] Account ID displayed (0.0.xxxxx)
- [ ] Network shows "testnet"
- [ ] Balance loads correctly
- [ ] Session persists after reload
- [ ] Disconnect works
- [ ] No console errors

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| No popup | Check extension enabled |
| Timeout | Check WalletConnect project ID |
| No balance | Wait 3s, check network |
| Session lost | Check localStorage |

## 📊 Performance Targets

- Connection: < 5 seconds ✅
- Balance fetch: < 3 seconds ✅
- Transaction sign: < 10 seconds ✅

## 🔗 Quick Links

- Full Guide: `MANUAL_TESTING_GUIDE.md`
- Checklist: `TESTING_CHECKLIST.md`
- Troubleshooting: `TROUBLESHOOTING.md`

---

**Print this card for quick reference during testing!**
