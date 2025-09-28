# Requirements Document

## Introduction

MazaoChain is a decentralized lending platform that enables small farmers in the Democratic Republic of Congo (DRC) to use their future tokenized crops as collateral to obtain instant micro-credits in stablecoins. The MVP focuses on manioc or coffee crops, supporting 10 farmers, 1 partner cooperative, and initial institutional lenders, with the primary interface in Lingala.

## Requirements

### Requirement 1

**User Story:** As a platform user (farmer, cooperative, or lender), I want to register with role-based access and wallet integration, so that I can participate in the decentralized lending ecosystem according to my role.

#### Acceptance Criteria

1. WHEN a user visits the registration page THEN the system SHALL display a form in Lingala with email, password, and role selection fields
2. WHEN a user submits valid registration information THEN the system SHALL create an account via Supabase Auth with the specified role (Agriculteur, Coopérative, Prêteur)
3. WHEN a user completes registration THEN the system SHALL require HashPack wallet connection for blockchain interactions
4. WHEN a farmer registers THEN the system SHALL require cooperative validation before profile activation
5. WHEN a cooperative or lender registers THEN the system SHALL activate their account immediately
6. IF a farmer's profile is not validated by a cooperative THEN the system SHALL restrict access to lending features
7. WHEN any user connects their HashPack wallet THEN the system SHALL associate the wallet address with their profile

### Requirement 2

**User Story:** As a farmer, I want to input my crop information and get an automated valuation, so that I can understand how much collateral value my future harvest represents.

#### Acceptance Criteria

1. WHEN a farmer enters crop data (superficie, type, historical yield) THEN the system SHALL calculate estimated value using the formula: superficie × rendement × prix référence
2. WHEN the calculation is complete THEN the system SHALL generate a PDF evaluation report
3. WHEN a farmer views their evaluation THEN the system SHALL display the calculation breakdown in Lingala
4. WHEN multiple evaluations exist THEN the system SHALL maintain a historical record of all evaluations
5. IF crop data is incomplete THEN the system SHALL prevent evaluation calculation and display validation errors

### Requirement 3

**User Story:** As a farmer, I want my crop evaluation to be automatically tokenized on Hedera, so that I can use these tokens as collateral for loans.

#### Acceptance Criteria

1. WHEN a crop evaluation is approved THEN the system SHALL mint MazaoTokens via Hedera Token Service (HTS)
2. WHEN tokens are minted THEN the system SHALL automatically associate them with the farmer's HashPack wallet
3. WHEN tokenization is complete THEN the system SHALL update the farmer's portfolio balance
4. WHEN a farmer views their portfolio THEN the system SHALL display all MazaoTokens with their current values
5. IF tokenization fails THEN the system SHALL log the error and notify the farmer

### Requirement 4

**User Story:** As a farmer, I want to request a collateralized loan using my MazaoTokens, so that I can access immediate funding for my agricultural needs.

#### Acceptance Criteria

1. WHEN a farmer initiates a loan request THEN the system SHALL require 200% collateral coverage
2. WHEN loan parameters are set THEN the system SHALL calculate the maximum loan amount based on available collateral
3. WHEN a loan request is submitted THEN the system SHALL require manual approval from the partner cooperative
4. WHEN a loan is approved THEN the system SHALL automatically disburse USDC to the farmer's wallet
5. IF insufficient collateral exists THEN the system SHALL prevent loan creation and display an error message
6. WHEN a loan is active THEN the system SHALL display loan details and repayment schedule

### Requirement 5

**User Story:** As a farmer, I want to repay my loan and retrieve my collateral, so that I can complete the lending cycle and regain control of my tokenized crops.

#### Acceptance Criteria

1. WHEN a farmer accesses the repayment interface THEN the system SHALL display outstanding loan balance and due dates
2. WHEN a farmer initiates repayment THEN the system SHALL accept USDC payments
3. WHEN full repayment is confirmed THEN the system SHALL automatically release the collateral tokens
4. WHEN repayment is complete THEN the system SHALL generate a transaction receipt
5. IF partial repayment is made THEN the system SHALL update the outstanding balance and adjust collateral requirements
6. WHEN repayment history is requested THEN the system SHALL display all past transactions

### Requirement 6

**User Story:** As a cooperative administrator, I want to validate farmer profiles and approve loan requests, so that I can ensure the quality and legitimacy of platform participants.

#### Acceptance Criteria

1. WHEN a farmer registers THEN the system SHALL notify the cooperative of pending validation
2. WHEN a cooperative reviews a profile THEN the system SHALL provide farmer details and crop information
3. WHEN a cooperative approves a profile THEN the system SHALL activate the farmer's lending capabilities
4. WHEN a loan request is submitted THEN the system SHALL route it to the cooperative for manual approval
5. IF a cooperative rejects a request THEN the system SHALL notify the farmer with rejection reasons

### Requirement 7

**User Story:** As an institutional lender, I want to view available loan opportunities and provide funding, so that I can participate in the agricultural lending market.

#### Acceptance Criteria

1. WHEN a lender accesses the platform THEN the system SHALL display available loan opportunities with risk assessments
2. WHEN a lender selects a loan to fund THEN the system SHALL show detailed farmer and crop information
3. WHEN a lender commits funds THEN the system SHALL escrow the USDC until loan approval
4. WHEN a loan is repaid THEN the system SHALL automatically distribute principal and interest to the lender
5. IF a loan defaults THEN the system SHALL initiate collateral liquidation and distribute proceeds to the lender

### Requirement 8

**User Story:** As a platform user, I want the interface to be responsive and accessible on mobile devices, so that I can access the platform from anywhere using my smartphone.

#### Acceptance Criteria

1. WHEN accessing the platform on mobile THEN the system SHALL display a responsive PWA interface
2. WHEN performing any action THEN the system SHALL respond within 2 seconds
3. WHEN executing Hedera transactions THEN the system SHALL complete them within 5 seconds
4. WHEN the platform is accessed THEN the system SHALL maintain 99% uptime
5. IF the user's device supports it THEN the system SHALL offer PWA installation

### Requirement 9

**User Story:** As a platform user, I want comprehensive security measures in place, so that my funds and personal information are protected.

#### Acceptance Criteria

1. WHEN users authenticate THEN the system SHALL use JWT tokens via Supabase Auth
2. WHEN any transaction is submitted THEN the system SHALL validate it server-side
3. WHEN smart contracts are deployed THEN the system SHALL ensure they have been audited
4. WHEN handling private keys THEN the system SHALL never expose them on the client side
5. IF a security vulnerability is detected THEN the system SHALL have zero critical vulnerabilities in production