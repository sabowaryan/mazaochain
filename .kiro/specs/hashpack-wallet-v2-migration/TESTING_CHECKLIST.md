# HashPack Wallet v2 - Testing Checklist

**Date**: _______________  
**Tester**: _______________  
**Environment**: [ ] Local [ ] Staging [ ] Production  
**Network**: [ ] Testnet [ ] Mainnet

---

## Pre-Test Setup

- [ ] HashPack Chrome extension installed and configured
- [ ] HashPack mobile app installed (for mobile tests)
- [ ] Test account has HBAR balance
- [ ] Application is running
- [ ] Browser DevTools open
- [ ] Environment variables verified
- [ ] Browser storage cleared

---

## Core Functionality Tests

### Connection Tests

- [ ] **Test 1**: First connection with Chrome extension
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 2**: Connection with mobile via WalletConnect
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 3**: Session restoration after page reload
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 4**: Session restoration after browser restart
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

### Event Handling Tests

- [ ] **Test 5**: Account change detection
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 6**: Network change handling (testnet ↔ mainnet)
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

### Disconnection Tests

- [ ] **Test 7**: Disconnect from HashPack
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 8**: Disconnect from application
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

### Balance Tests

- [ ] **Test 9**: HBAR balance retrieval
  - Result: [ ] Pass [ ] Fail
  - Balance displayed: _________ HBAR
  - Matches HashPack: [ ] Yes [ ] No

- [ ] **Test 10**: Token balance retrieval
  - Result: [ ] Pass [ ] Fail
  - Tokens displayed: _________________________________

### Transaction Tests

- [ ] **Test 11**: Native Hedera transaction signing
  - Result: [ ] Pass [ ] Fail
  - Transaction ID: _________________________________

- [ ] **Test 12**: Transaction rejection handling
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 13**: Message signing
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

### Error Handling Tests

- [ ] **Test 14**: Connection timeout handling
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 15**: Session expiry handling
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 16**: Multiple browser tabs
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

- [ ] **Test 17**: Error recovery
  - Result: [ ] Pass [ ] Fail
  - Notes: _________________________________

---

## Performance Tests

- [ ] **Test 18**: Connection speed
  - Time to connect: _________ seconds
  - Acceptable: [ ] Yes [ ] No (< 5 seconds)

- [ ] **Test 19**: Balance fetch speed
  - Time to fetch: _________ seconds
  - Acceptable: [ ] Yes [ ] No (< 3 seconds)

---

## Browser Compatibility

- [ ] Chrome (latest) - Result: [ ] Pass [ ] Fail
- [ ] Firefox (latest) - Result: [ ] Pass [ ] Fail
- [ ] Edge (latest) - Result: [ ] Pass [ ] Fail
- [ ] Brave (latest) - Result: [ ] Pass [ ] Fail
- [ ] Safari - Result: [ ] Pass [ ] Fail [ ] N/A

---

## Mobile Compatibility

- [ ] Android Chrome - Result: [ ] Pass [ ] Fail [ ] N/A
- [ ] iOS Safari - Result: [ ] Pass [ ] Fail [ ] N/A
- [ ] HashPack Mobile - Result: [ ] Pass [ ] Fail [ ] N/A

---

## Summary

**Total Tests Executed**: _____  
**Passed**: _____  
**Failed**: _____  
**Pass Rate**: _____%

### Critical Issues
```
1. 
2. 
3. 
```

### Minor Issues
```
1. 
2. 
3. 
```

### Recommendations
```
1. 
2. 
3. 
```

---

## Final Approval

**Status**: [ ] Approved [ ] Needs Fixes [ ] Blocked

**Approver**: _____________________  
**Date**: _____________________  
**Signature**: _____________________
