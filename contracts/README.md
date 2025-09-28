# MazaoChain Smart Contracts

This directory contains the smart contracts for the MazaoChain decentralized lending platform, built on the Hedera network.

## Overview

MazaoChain enables small farmers in the Democratic Republic of Congo (DRC) to tokenize their future crops and use them as collateral for micro-credits in stablecoins. The system consists of two main smart contracts:

1. **MazaoTokenFactory** - Manages the creation and lifecycle of crop-backed tokens
2. **LoanManager** - Handles collateralized lending with 200% collateral requirements

## Contracts

### MazaoTokenFactory.sol

The token factory contract is responsible for:
- Creating crop tokens representing future harvests
- Minting tokens based on crop evaluations
- Managing token balances and ownership
- Burning tokens when used as collateral or upon harvest

#### Key Features:
- **Crop Token Creation**: Creates unique tokens for each crop evaluation
- **Token Minting**: Mints tokens based on approved crop valuations
- **Balance Management**: Tracks farmer token balances
- **Access Control**: Owner and loan manager permissions
- **Token Lifecycle**: Activate/deactivate tokens as needed

#### Main Functions:
```solidity
function createCropToken(address farmer, uint256 estimatedValue, string memory cropType, uint256 harvestDate) external returns (uint256 tokenId)
function mintTokens(uint256 tokenId, uint256 amount) external
function burnTokens(uint256 tokenId, uint256 amount) external
function getFarmerBalance(address farmer) external view returns (uint256)
```

### LoanManager.sol

The loan manager contract handles:
- Creating loan requests with collateral requirements
- Enforcing 200% collateralization ratio
- Managing loan approval and disbursement
- Processing loan repayments
- Handling collateral liquidation

#### Key Features:
- **200% Collateral Ratio**: Enforces overcollateralization for security
- **Loan Lifecycle Management**: From request to repayment or liquidation
- **Interest Calculations**: Automatic interest computation
- **Collateral Locking**: Secure collateral management during active loans
- **Liquidation Process**: Automated collateral liquidation for defaults

#### Main Functions:
```solidity
function createLoan(uint256 loanAmount, uint256 collateralTokenId, uint256 collateralAmount, uint256 interestRate, uint256 loanDuration) external returns (uint256 loanId)
function approveLoan(uint256 loanId) external payable
function repayLoan(uint256 loanId) external payable
function liquidateCollateral(uint256 loanId) external
function checkCollateralRatio(uint256 loanAmount, uint256 collateralValue) public pure returns (bool)
```

## Configuration

The contracts use configurable parameters defined in `config.ts`:

- **COLLATERAL_RATIO**: 200% (2:1 collateral to loan ratio)
- **Interest Rate Limits**: 0.1% to 50% annually
- **Loan Duration**: 1 day to 2 years
- **Supported Crops**: Manioc and Coffee initially

## Deployment

### Prerequisites

1. **Hedera Account**: Set up a Hedera testnet/mainnet account
2. **Environment Variables**: Configure the following:
   ```bash
   HEDERA_ACCOUNT_ID=0.0.xxxxx
   HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
   HEDERA_NETWORK=testnet
   ```

### Deploy Contracts

```bash
# Install dependencies
npm install

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet (production)
npm run deploy:mainnet
```

### Deployment Script

The deployment script (`scripts/deploy-contracts.ts`) will:
1. Deploy MazaoTokenFactory contract
2. Deploy LoanManager contract with token factory address
3. Configure contract relationships
4. Save deployment addresses to `deployment-info.json`

## Testing

### Run Contract Tests

```bash
# Run all contract tests
npm run test:contracts

# Run specific test suites
npm run test:token-factory
npm run test:loan-manager
npm run test:integration
```

### Test Coverage

The test suite covers:
- **Token Factory Tests**: Token creation, minting, burning, balance queries
- **Loan Manager Tests**: Loan creation, approval, repayment, liquidation
- **Integration Tests**: Cross-contract functionality
- **Edge Cases**: Error conditions and validation

### Test Configuration

Set the following environment variables for testing:
```bash
TOKEN_FACTORY_CONTRACT_ID=0.0.xxxxx
LOAN_MANAGER_CONTRACT_ID=0.0.xxxxx
```

## Security Considerations

### Access Control
- **Owner Permissions**: Contract deployment and configuration
- **Loan Manager Permissions**: Token burning for collateral
- **Farmer Permissions**: Token operations for owned tokens

### Validation
- **Collateral Ratio**: Enforced 200% overcollateralization
- **Input Validation**: All parameters validated before execution
- **Address Validation**: Zero address checks for all address parameters
- **Amount Validation**: Positive amount requirements

### Error Handling
- **Revert on Failure**: All operations revert on invalid conditions
- **Clear Error Messages**: Descriptive error messages for debugging
- **State Consistency**: Atomic operations to maintain contract state

## Gas Optimization

The contracts are optimized for Hedera's gas model:
- **Efficient Storage**: Minimal storage operations
- **Batch Operations**: Combined operations where possible
- **View Functions**: Gas-free queries for data retrieval

## Integration with Frontend

### Contract ABIs
After compilation, ABIs will be available in the `build/` directory for frontend integration.

### Event Monitoring
The contracts emit events for all major operations:
- `CropTokenCreated`
- `TokensMinted`
- `LoanCreated`
- `LoanApproved`
- `LoanRepaid`
- `CollateralLiquidated`

### Frontend Integration Example
```typescript
import { ContractExecuteTransaction, ContractCallQuery } from "@hashgraph/sdk";

// Create a loan
const createLoanTx = new ContractExecuteTransaction()
  .setContractId(loanManagerId)
  .setGas(100000)
  .setFunction("createLoan", new ContractFunctionParameters()
    .addUint256(loanAmount)
    .addUint256(collateralTokenId)
    .addUint256(collateralAmount)
    .addUint256(interestRate)
    .addUint256(loanDuration)
  );
```

## Monitoring and Maintenance

### Contract Upgrades
The contracts include ownership transfer functions for future upgrades:
```solidity
function transferOwnership(address newOwner) external onlyOwner
```

### Emergency Controls
Emergency pause functionality is included for security incidents:
```solidity
function emergencyPause() external onlyOwner
```

### Monitoring
Monitor contract events and transactions using:
- **Hedera Mirror Node API**: For transaction history
- **HashScan Explorer**: For contract verification
- **Custom Monitoring**: Event-based monitoring systems

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limits in deployment/execution
2. **Invalid Addresses**: Ensure all addresses are valid Hedera account IDs
3. **Collateral Ratio**: Verify 200% collateral coverage before loan creation
4. **Network Configuration**: Ensure correct network (testnet/mainnet) configuration

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=mazaochain:contracts
```

## Contributing

When contributing to the smart contracts:

1. **Testing**: Ensure all tests pass before submitting
2. **Security**: Follow security best practices
3. **Documentation**: Update documentation for any changes
4. **Gas Optimization**: Consider gas costs in implementations

## License

MIT License - see LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Note**: These contracts are designed for the Hedera network and may require modifications for other blockchain platforms.