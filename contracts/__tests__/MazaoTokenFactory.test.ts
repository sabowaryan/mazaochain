import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for MazaoTokenFactory smart contract
 * Tests all contract functions and edge cases
 */

// Mock contract interface for testing
interface MockMazaoTokenFactory {
  owner: string;
  loanManager: string;
  farmerTokenBalances: Map<string, number>;
  cropTokens: Map<number, CropData>;
  farmerTokenIds: Map<string, number[]>;
  tokenIdCounter: number;
}

interface CropData {
  farmer: string;
  estimatedValue: number;
  cropType: string;
  harvestDate: number;
  isActive: boolean;
  totalSupply: number;
  createdAt: number;
}

class MockMazaoTokenFactoryContract implements MockMazaoTokenFactory {
  owner: string;
  loanManager: string = '';
  farmerTokenBalances: Map<string, number> = new Map();
  cropTokens: Map<number, CropData> = new Map();
  farmerTokenIds: Map<string, number[]> = new Map();
  tokenIdCounter: number = 1;

  constructor(owner: string) {
    this.owner = owner;
  }

  setLoanManager(loanManager: string, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (loanManager === '0x0') {
      throw new Error('Invalid loan manager address');
    }
    this.loanManager = loanManager;
  }

  createCropToken(
    farmer: string,
    estimatedValue: number,
    cropType: string,
    harvestDate: number,
    caller: string
  ): number {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (farmer === '0x0') {
      throw new Error('Invalid farmer address');
    }
    if (estimatedValue <= 0) {
      throw new Error('Estimated value must be greater than 0');
    }
    if (!cropType || cropType.length === 0) {
      throw new Error('Crop type cannot be empty');
    }
    if (harvestDate <= Date.now()) {
      throw new Error('Harvest date must be in the future');
    }

    const tokenId = this.tokenIdCounter++;
    
    this.cropTokens.set(tokenId, {
      farmer,
      estimatedValue,
      cropType,
      harvestDate,
      isActive: true,
      totalSupply: 0,
      createdAt: Date.now()
    });

    if (!this.farmerTokenIds.has(farmer)) {
      this.farmerTokenIds.set(farmer, []);
    }
    this.farmerTokenIds.get(farmer)!.push(tokenId);

    return tokenId;
  }

  mintTokens(tokenId: number, amount: number, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (!this.cropTokens.has(tokenId)) {
      throw new Error('Token does not exist');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const cropData = this.cropTokens.get(tokenId)!;
    if (!cropData.isActive) {
      throw new Error('Token is not active');
    }

    cropData.totalSupply += amount;
    const currentBalance = this.farmerTokenBalances.get(cropData.farmer) || 0;
    this.farmerTokenBalances.set(cropData.farmer, currentBalance + amount);
  }

  burnTokens(tokenId: number, amount: number, caller: string): void {
    if (!this.cropTokens.has(tokenId)) {
      throw new Error('Token does not exist');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const cropData = this.cropTokens.get(tokenId)!;
    const isAuthorized = caller === this.owner || 
                        caller === this.loanManager || 
                        caller === cropData.farmer;
    
    if (!isAuthorized) {
      throw new Error('Unauthorized to burn tokens');
    }
    if (cropData.totalSupply < amount) {
      throw new Error('Insufficient token supply');
    }

    const farmerBalance = this.farmerTokenBalances.get(cropData.farmer) || 0;
    if (farmerBalance < amount) {
      throw new Error('Insufficient farmer balance');
    }

    cropData.totalSupply -= amount;
    this.farmerTokenBalances.set(cropData.farmer, farmerBalance - amount);
  }

  deactivateToken(tokenId: number, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (!this.cropTokens.has(tokenId)) {
      throw new Error('Token does not exist');
    }
    this.cropTokens.get(tokenId)!.isActive = false;
  }

  reactivateToken(tokenId: number, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (!this.cropTokens.has(tokenId)) {
      throw new Error('Token does not exist');
    }
    this.cropTokens.get(tokenId)!.isActive = true;
  }

  getFarmerTokenIds(farmer: string): number[] {
    return this.farmerTokenIds.get(farmer) || [];
  }

  getCropToken(tokenId: number): CropData {
    if (!this.cropTokens.has(tokenId)) {
      throw new Error('Token does not exist');
    }
    return this.cropTokens.get(tokenId)!;
  }

  getFarmerBalance(farmer: string): number {
    return this.farmerTokenBalances.get(farmer) || 0;
  }

  getTotalTokensCreated(): number {
    return this.tokenIdCounter - 1;
  }

  transferOwnership(newOwner: string, caller: string): void {
    if (caller !== this.owner) {
      throw new Error('Only owner can call this function');
    }
    if (newOwner === '0x0') {
      throw new Error('New owner cannot be zero address');
    }
    this.owner = newOwner;
  }
}

describe('MazaoTokenFactory Contract Tests', () => {
  let contract: MockMazaoTokenFactoryContract;
  let owner: string;
  let farmer: string;
  let loanManager: string;

  beforeEach(() => {
    owner = '0x1234567890123456789012345678901234567890';
    farmer = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    loanManager = '0x9876543210987654321098765432109876543210';
    contract = new MockMazaoTokenFactoryContract(owner);
  });

  describe('Constructor and Initial State', () => {
    it('should set the correct owner', () => {
      expect(contract.owner).toBe(owner);
    });

    it('should initialize token counter to 1', () => {
      expect(contract.tokenIdCounter).toBe(1);
    });

    it('should have empty initial state', () => {
      expect(contract.farmerTokenBalances.size).toBe(0);
      expect(contract.cropTokens.size).toBe(0);
      expect(contract.farmerTokenIds.size).toBe(0);
    });
  });

  describe('setLoanManager', () => {
    it('should set loan manager when called by owner', () => {
      contract.setLoanManager(loanManager, owner);
      expect(contract.loanManager).toBe(loanManager);
    });

    it('should revert when called by non-owner', () => {
      expect(() => {
        contract.setLoanManager(loanManager, farmer);
      }).toThrow('Only owner can call this function');
    });

    it('should revert with invalid loan manager address', () => {
      expect(() => {
        contract.setLoanManager('0x0', owner);
      }).toThrow('Invalid loan manager address');
    });
  });

  describe('createCropToken', () => {
    const validParams = {
      farmer,
      estimatedValue: 1000,
      cropType: 'manioc',
      harvestDate: Date.now() + 86400000 // 1 day from now
    };

    it('should create a crop token with valid parameters', () => {
      const tokenId = contract.createCropToken(
        validParams.farmer,
        validParams.estimatedValue,
        validParams.cropType,
        validParams.harvestDate,
        owner
      );

      expect(tokenId).toBe(1);
      expect(contract.cropTokens.has(tokenId)).toBe(true);
      
      const cropData = contract.getCropToken(tokenId);
      expect(cropData.farmer).toBe(validParams.farmer);
      expect(cropData.estimatedValue).toBe(validParams.estimatedValue);
      expect(cropData.cropType).toBe(validParams.cropType);
      expect(cropData.isActive).toBe(true);
      expect(cropData.totalSupply).toBe(0);
    });

    it('should increment token counter', () => {
      contract.createCropToken(
        validParams.farmer,
        validParams.estimatedValue,
        validParams.cropType,
        validParams.harvestDate,
        owner
      );
      expect(contract.tokenIdCounter).toBe(2);
    });

    it('should add token ID to farmer\'s token list', () => {
      const tokenId = contract.createCropToken(
        validParams.farmer,
        validParams.estimatedValue,
        validParams.cropType,
        validParams.harvestDate,
        owner
      );
      
      const farmerTokens = contract.getFarmerTokenIds(validParams.farmer);
      expect(farmerTokens).toContain(tokenId);
    });

    it('should revert when called by non-owner', () => {
      expect(() => {
        contract.createCropToken(
          validParams.farmer,
          validParams.estimatedValue,
          validParams.cropType,
          validParams.harvestDate,
          farmer
        );
      }).toThrow('Only owner can call this function');
    });

    it('should revert with invalid farmer address', () => {
      expect(() => {
        contract.createCropToken(
          '0x0',
          validParams.estimatedValue,
          validParams.cropType,
          validParams.harvestDate,
          owner
        );
      }).toThrow('Invalid farmer address');
    });

    it('should revert with zero estimated value', () => {
      expect(() => {
        contract.createCropToken(
          validParams.farmer,
          0,
          validParams.cropType,
          validParams.harvestDate,
          owner
        );
      }).toThrow('Estimated value must be greater than 0');
    });

    it('should revert with empty crop type', () => {
      expect(() => {
        contract.createCropToken(
          validParams.farmer,
          validParams.estimatedValue,
          '',
          validParams.harvestDate,
          owner
        );
      }).toThrow('Crop type cannot be empty');
    });

    it('should revert with past harvest date', () => {
      expect(() => {
        contract.createCropToken(
          validParams.farmer,
          validParams.estimatedValue,
          validParams.cropType,
          Date.now() - 86400000, // 1 day ago
          owner
        );
      }).toThrow('Harvest date must be in the future');
    });
  });

  describe('mintTokens', () => {
    let tokenId: number;

    beforeEach(() => {
      tokenId = contract.createCropToken(
        farmer,
        1000,
        'manioc',
        Date.now() + 86400000,
        owner
      );
    });

    it('should mint tokens successfully', () => {
      contract.mintTokens(tokenId, 500, owner);
      
      expect(contract.getFarmerBalance(farmer)).toBe(500);
      expect(contract.getCropToken(tokenId).totalSupply).toBe(500);
    });

    it('should accumulate minted tokens', () => {
      contract.mintTokens(tokenId, 300, owner);
      contract.mintTokens(tokenId, 200, owner);
      
      expect(contract.getFarmerBalance(farmer)).toBe(500);
      expect(contract.getCropToken(tokenId).totalSupply).toBe(500);
    });

    it('should revert when called by non-owner', () => {
      expect(() => {
        contract.mintTokens(tokenId, 500, farmer);
      }).toThrow('Only owner can call this function');
    });

    it('should revert for non-existent token', () => {
      expect(() => {
        contract.mintTokens(999, 500, owner);
      }).toThrow('Token does not exist');
    });

    it('should revert with zero amount', () => {
      expect(() => {
        contract.mintTokens(tokenId, 0, owner);
      }).toThrow('Amount must be greater than 0');
    });

    it('should revert for inactive token', () => {
      contract.deactivateToken(tokenId, owner);
      expect(() => {
        contract.mintTokens(tokenId, 500, owner);
      }).toThrow('Token is not active');
    });
  });

  describe('burnTokens', () => {
    let tokenId: number;

    beforeEach(() => {
      tokenId = contract.createCropToken(
        farmer,
        1000,
        'manioc',
        Date.now() + 86400000,
        owner
      );
      contract.mintTokens(tokenId, 1000, owner);
      contract.setLoanManager(loanManager, owner);
    });

    it('should burn tokens when called by owner', () => {
      contract.burnTokens(tokenId, 300, owner);
      
      expect(contract.getFarmerBalance(farmer)).toBe(700);
      expect(contract.getCropToken(tokenId).totalSupply).toBe(700);
    });

    it('should burn tokens when called by loan manager', () => {
      contract.burnTokens(tokenId, 300, loanManager);
      
      expect(contract.getFarmerBalance(farmer)).toBe(700);
      expect(contract.getCropToken(tokenId).totalSupply).toBe(700);
    });

    it('should burn tokens when called by farmer', () => {
      contract.burnTokens(tokenId, 300, farmer);
      
      expect(contract.getFarmerBalance(farmer)).toBe(700);
      expect(contract.getCropToken(tokenId).totalSupply).toBe(700);
    });

    it('should revert when called by unauthorized address', () => {
      const unauthorized = '0x1111111111111111111111111111111111111111';
      expect(() => {
        contract.burnTokens(tokenId, 300, unauthorized);
      }).toThrow('Unauthorized to burn tokens');
    });

    it('should revert for non-existent token', () => {
      expect(() => {
        contract.burnTokens(999, 300, owner);
      }).toThrow('Token does not exist');
    });

    it('should revert with zero amount', () => {
      expect(() => {
        contract.burnTokens(tokenId, 0, owner);
      }).toThrow('Amount must be greater than 0');
    });

    it('should revert with insufficient token supply', () => {
      expect(() => {
        contract.burnTokens(tokenId, 1500, owner);
      }).toThrow('Insufficient token supply');
    });

    it('should revert with insufficient farmer balance', () => {
      // Create another farmer with different balance
      const anotherFarmer = '0x2222222222222222222222222222222222222222';
      const anotherTokenId = contract.createCropToken(
        anotherFarmer,
        500,
        'cafe',
        Date.now() + 86400000,
        owner
      );
      contract.mintTokens(anotherTokenId, 200, owner); // Mint enough tokens for supply
      
      // Set farmer balance lower than what we're trying to burn
      contract.farmerTokenBalances.set(anotherFarmer, 100);
      
      expect(() => {
        contract.burnTokens(anotherTokenId, 150, owner);
      }).toThrow('Insufficient farmer balance');
    });
  });

  describe('Token Status Management', () => {
    let tokenId: number;

    beforeEach(() => {
      tokenId = contract.createCropToken(
        farmer,
        1000,
        'manioc',
        Date.now() + 86400000,
        owner
      );
    });

    describe('deactivateToken', () => {
      it('should deactivate token when called by owner', () => {
        contract.deactivateToken(tokenId, owner);
        expect(contract.getCropToken(tokenId).isActive).toBe(false);
      });

      it('should revert when called by non-owner', () => {
        expect(() => {
          contract.deactivateToken(tokenId, farmer);
        }).toThrow('Only owner can call this function');
      });

      it('should revert for non-existent token', () => {
        expect(() => {
          contract.deactivateToken(999, owner);
        }).toThrow('Token does not exist');
      });
    });

    describe('reactivateToken', () => {
      beforeEach(() => {
        contract.deactivateToken(tokenId, owner);
      });

      it('should reactivate token when called by owner', () => {
        contract.reactivateToken(tokenId, owner);
        expect(contract.getCropToken(tokenId).isActive).toBe(true);
      });

      it('should revert when called by non-owner', () => {
        expect(() => {
          contract.reactivateToken(tokenId, farmer);
        }).toThrow('Only owner can call this function');
      });

      it('should revert for non-existent token', () => {
        expect(() => {
          contract.reactivateToken(999, owner);
        }).toThrow('Token does not exist');
      });
    });
  });

  describe('View Functions', () => {
    let tokenId1: number;
    let tokenId2: number;

    beforeEach(() => {
      tokenId1 = contract.createCropToken(
        farmer,
        1000,
        'manioc',
        Date.now() + 86400000,
        owner
      );
      tokenId2 = contract.createCropToken(
        farmer,
        2000,
        'cafe',
        Date.now() + 172800000,
        owner
      );
      contract.mintTokens(tokenId1, 500, owner);
      contract.mintTokens(tokenId2, 300, owner);
    });

    describe('getFarmerTokenIds', () => {
      it('should return all token IDs for a farmer', () => {
        const tokenIds = contract.getFarmerTokenIds(farmer);
        expect(tokenIds).toEqual([tokenId1, tokenId2]);
      });

      it('should return empty array for farmer with no tokens', () => {
        const newFarmer = '0x3333333333333333333333333333333333333333';
        const tokenIds = contract.getFarmerTokenIds(newFarmer);
        expect(tokenIds).toEqual([]);
      });
    });

    describe('getCropToken', () => {
      it('should return correct crop token data', () => {
        const cropData = contract.getCropToken(tokenId1);
        expect(cropData.farmer).toBe(farmer);
        expect(cropData.estimatedValue).toBe(1000);
        expect(cropData.cropType).toBe('manioc');
        expect(cropData.isActive).toBe(true);
        expect(cropData.totalSupply).toBe(500);
      });

      it('should revert for non-existent token', () => {
        expect(() => {
          contract.getCropToken(999);
        }).toThrow('Token does not exist');
      });
    });

    describe('getFarmerBalance', () => {
      it('should return correct farmer balance', () => {
        expect(contract.getFarmerBalance(farmer)).toBe(800); // 500 + 300
      });

      it('should return zero for farmer with no tokens', () => {
        const newFarmer = '0x3333333333333333333333333333333333333333';
        expect(contract.getFarmerBalance(newFarmer)).toBe(0);
      });
    });

    describe('getTotalTokensCreated', () => {
      it('should return correct total tokens created', () => {
        expect(contract.getTotalTokensCreated()).toBe(2);
      });
    });
  });

  describe('transferOwnership', () => {
    const newOwner = '0x4444444444444444444444444444444444444444';

    it('should transfer ownership when called by current owner', () => {
      contract.transferOwnership(newOwner, owner);
      expect(contract.owner).toBe(newOwner);
    });

    it('should revert when called by non-owner', () => {
      expect(() => {
        contract.transferOwnership(newOwner, farmer);
      }).toThrow('Only owner can call this function');
    });

    it('should revert with zero address', () => {
      expect(() => {
        contract.transferOwnership('0x0', owner);
      }).toThrow('New owner cannot be zero address');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle multiple farmers correctly', () => {
      const farmer1 = '0x1111111111111111111111111111111111111111';
      const farmer2 = '0x2222222222222222222222222222222222222222';
      
      const token1 = contract.createCropToken(farmer1, 1000, 'manioc', Date.now() + 86400000, owner);
      const token2 = contract.createCropToken(farmer2, 2000, 'cafe', Date.now() + 86400000, owner);
      
      contract.mintTokens(token1, 500, owner);
      contract.mintTokens(token2, 300, owner);
      
      expect(contract.getFarmerBalance(farmer1)).toBe(500);
      expect(contract.getFarmerBalance(farmer2)).toBe(300);
      expect(contract.getFarmerTokenIds(farmer1)).toEqual([token1]);
      expect(contract.getFarmerTokenIds(farmer2)).toEqual([token2]);
    });

    it('should maintain correct state after multiple operations', () => {
      const tokenId = contract.createCropToken(farmer, 1000, 'manioc', Date.now() + 86400000, owner);
      
      contract.mintTokens(tokenId, 1000, owner);
      contract.burnTokens(tokenId, 300, owner);
      contract.mintTokens(tokenId, 200, owner);
      contract.burnTokens(tokenId, 100, owner);
      
      expect(contract.getFarmerBalance(farmer)).toBe(800);
      expect(contract.getCropToken(tokenId).totalSupply).toBe(800);
    });

    it('should handle token deactivation and reactivation correctly', () => {
      const tokenId = contract.createCropToken(farmer, 1000, 'manioc', Date.now() + 86400000, owner);
      contract.mintTokens(tokenId, 500, owner);
      
      contract.deactivateToken(tokenId, owner);
      expect(() => {
        contract.mintTokens(tokenId, 100, owner);
      }).toThrow('Token is not active');
      
      contract.reactivateToken(tokenId, owner);
      contract.mintTokens(tokenId, 100, owner);
      expect(contract.getFarmerBalance(farmer)).toBe(600);
    });
  });
});