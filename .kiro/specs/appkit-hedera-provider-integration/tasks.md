# Implementation Plan - AppKit with HederaProvider Integration

## Overview
This plan outlines the tasks to migrate from DAppConnector to HederaProvider + AppKit integration. The current implementation uses DAppConnector directly, and we need to replace it with HederaProvider and HederaAdapter while integrating Reown AppKit for the modal UI.

## Tasks

- [x] 1. Create AppKit configuration module





  - Create `src/lib/wallet/appkit-config.ts` with `initializeAppKit` function
  - Configure AppKit with theme variables for MazaoChain branding
  - Disable analytics, email, and social login features
  - Export configuration function that accepts adapters and universalProvider
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement HederaProvider initialization in HederaWalletService





  - Replace DAppConnector initialization with HederaProvider.init
  - Configure HederaProvider with projectId and application metadata
  - Cast HederaProvider result to UniversalProvider type for AppKit compatibility
  - Add error handling for initialization failures with WalletError
  - Store HederaProvider instance for adapter creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2_

- [x] 3. Create HederaAdapter instances for native and EVM namespaces





  - Create native adapter with 'hedera' namespace and Native.Mainnet/Testnet networks
  - Create EVM adapter with 'eip155' namespace and EVM.Mainnet/Testnet networks
  - Configure both adapters with WalletConnect projectId
  - Store adapter instances for AppKit initialization and transaction signing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.3_

- [x] 4. Initialize AppKit with HederaProvider and adapters





  - Call createAppKit with native and EVM adapters array
  - Provide UniversalProvider instance from HederaProvider
  - Configure networks array with all Hedera chain definitions
  - Set up theme mode and theme variables
  - Store AppKit instance for modal operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.4_

- [x] 5. Implement wallet connection using AppKit modal





  - Replace DAppConnector.openModal with AppKit modal opening
  - Extract account information from AppKit session after connection
  - Update connection state with accountId, network, and namespace
  - Handle wallet selection and namespace selection via AppKit UI
  - Implement session persistence via AppKit's built-in mechanism
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 9.5_

- [x] 6. Implement session management and event handling





  - Set up AppKit event listeners for account changes
  - Handle network change events and update connection state
  - Implement session deletion cleanup
  - Update React context on connection state changes
  - Remove DAppConnector session listeners
  - _Requirements: 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Implement transaction signing with HederaAdapter





  - Replace DAppSigner with HederaAdapter for transaction signing
  - Select appropriate adapter based on active namespace (hedera vs eip155)
  - Use adapter's signTransaction method for signing operations
  - Handle wallet approval and rejection with proper error codes
  - Return signed transaction result
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement message signing with HederaAdapter





  - Replace DAppConnector.signMessage with adapter-based signing
  - Format signerAccountId in correct format for the namespace
  - Use appropriate adapter's sign method
  - Handle signature validation and error cases
  - Return signature and signed message
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Implement disconnect functionality with AppKit





  - Call AppKit disconnect methods to clear session
  - Clear all adapter instances
  - Clear wallet context state and cached data
  - Close AppKit modal if open
  - Remove DAppConnector disconnect logic
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 10. Update error handling for HederaProvider and AppKit












  - Add error handling for HederaProvider.init failures
  - Handle AppKit connection rejection errors
  - Add network error handling specific to AppKit
  - Validate projectId and throw appropriate errors
  - Wrap unknown errors in WalletError with original error
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 11. Update wallet-service-factory.ts








  - Ensure factory returns the updated HederaWalletService
  - Maintain IWalletService interface contract
  - Verify singleton pattern for service instance
  - Ensure backward compatibility with existing code
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Update wallet integration tests





  - Mock HederaProvider.init method in tests
  - Mock HederaAdapter constructor
  - Mock createAppKit function
  - Verify adapter creation with correct namespaces
  - Update test assertions for AppKit-based implementation
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 13. Create architecture documentation






  - Document HederaProvider + AppKit architecture with diagrams
  - Explain roles of HederaProvider, HederaAdapter, and AppKit
  - Provide code examples for initialization and usage
  - Describe differences with DAppConnector approach
  - Include troubleshooting guide for common issues
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for MVP
- Each task builds incrementally on previous tasks
- All tasks reference specific requirements from requirements.md
- The implementation replaces DAppConnector with HederaProvider + AppKit
- Existing UI components (WalletConnection, useWallet) will continue to work with minimal changes
- AppKit provides the modal UI, replacing WalletConnectModal

## Implementation Order

1. Start with configuration (Task 1)
2. Initialize HederaProvider (Task 2)
3. Create adapters (Task 3)
4. Initialize AppKit (Task 4)
5. Implement connection flow (Task 5)
6. Add session management (Task 6)
7. Implement signing operations (Tasks 7-8)
8. Add disconnect logic (Task 9)
9. Update error handling (Task 10)
10. Update factory and tests (Tasks 11-12)
11. Optional: Documentation (Task 13)
