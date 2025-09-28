// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MazaoTokenFactory
 * @dev Factory contract for creating and managing MazaoTokens representing tokenized crops
 * @notice This contract handles the creation, minting, and burning of crop-backed tokens
 * @notice CORRECTED VERSION - Proper balance tracking per token and ERC-20 compatibility
 */
contract MazaoTokenFactory {
    // Events
    event CropTokenCreated(
        uint256 indexed tokenId,
        address indexed farmer,
        uint256 estimatedValue,
        string cropType,
        uint256 harvestDate,
        string tokenSymbol
    );
    
    event TokensMinted(
        address indexed farmer,
        uint256 amount,
        uint256 tokenId
    );
    
    event TokensBurned(
        address indexed farmer,
        uint256 amount,
        uint256 tokenId
    );
    
    event TokenStatusUpdated(
        uint256 indexed tokenId,
        bool isActive
    );

    // Structs
    struct CropData {
        address farmer;
        uint256 estimatedValue;
        string cropType;
        uint256 harvestDate;
        bool isActive;
        uint256 totalSupply;
        uint256 createdAt;
        string tokenSymbol;
    }

    // State variables CORRECTED
    mapping(uint256 => CropData) public cropTokens;
    mapping(address => uint256[]) public farmerTokenIds;
    mapping(uint256 => mapping(address => uint256)) public farmerTokenBalances; // ✅ Balance par token
    mapping(uint256 => string) public tokenSymbols;
    mapping(address => uint256) public totalBalances; // ✅ Balance totale par farmer
    
    uint256 private _tokenIdCounter;
    address public owner;
    address public loanManager;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyLoanManager() {
        require(msg.sender == loanManager, "Only loan manager can call this function");
        _;
    }
    
    modifier validFarmer(address farmer) {
        require(farmer != address(0), "Invalid farmer address");
        _;
    }
    
    modifier tokenExists(uint256 tokenId) {
        require(cropTokens[tokenId].farmer != address(0), "Token does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        _tokenIdCounter = 1;
    }

    /**
     * @dev Get the next token ID that will be assigned
     * @return The next token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Set the loan manager contract address
     * @param _loanManager Address of the loan manager contract
     */
    function setLoanManager(address _loanManager) external onlyOwner {
        require(_loanManager != address(0), "Invalid loan manager address");
        loanManager = _loanManager;
    }

    /**
     * @dev Create a new crop token (CORRECTED)
     * @param farmer Address of the farmer
     * @param estimatedValue Estimated value of the crop in USDC
     * @param cropType Type of crop (e.g., "manioc", "cafe")
     * @param harvestDate Expected harvest date (timestamp)
     * @param tokenSymbol Symbol for this specific token
     * @return tokenId The ID of the created token
     */
    function createCropToken(
        address farmer,
        uint256 estimatedValue,
        string memory cropType,
        uint256 harvestDate,
        string memory tokenSymbol
    ) external onlyOwner validFarmer(farmer) returns (uint256 tokenId) {
        require(estimatedValue > 0, "Estimated value must be greater than 0");
        require(bytes(cropType).length > 0, "Crop type cannot be empty");
        require(bytes(tokenSymbol).length > 0, "Token symbol cannot be empty");
        require(harvestDate > block.timestamp, "Harvest date must be in the future");
        
        tokenId = _tokenIdCounter++;
        
        cropTokens[tokenId] = CropData({
            farmer: farmer,
            estimatedValue: estimatedValue,
            cropType: cropType,
            harvestDate: harvestDate,
            isActive: true,
            totalSupply: 0,
            createdAt: block.timestamp,
            tokenSymbol: tokenSymbol
        });
        
        farmerTokenIds[farmer].push(tokenId);
        tokenSymbols[tokenId] = tokenSymbol;
        
        emit CropTokenCreated(tokenId, farmer, estimatedValue, cropType, harvestDate, tokenSymbol);
        
        return tokenId;
    }

    /**
     * @dev Create a simple token for testing purposes
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param amount Initial amount
     * @param farmer Address of the farmer
     * @return tokenId The ID of the created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 amount,
        address farmer
    ) external onlyOwner validFarmer(farmer) returns (uint256 tokenId) {
        tokenId = _tokenIdCounter++;
        
        cropTokens[tokenId] = CropData({
            farmer: farmer,
            estimatedValue: amount,
            cropType: name,
            harvestDate: block.timestamp + 86400 * 90, // 90 days from now
            isActive: true,
            totalSupply: 0,
            createdAt: block.timestamp,
            tokenSymbol: symbol
        });
        
        farmerTokenIds[farmer].push(tokenId);
        tokenSymbols[tokenId] = symbol;
        
        emit CropTokenCreated(tokenId, farmer, amount, name, block.timestamp + 86400 * 90, symbol);
        
        return tokenId;
    }

    /**
     * @dev Mint tokens for a specific crop token (CORRECTED)
     * @param tokenId The ID of the crop token
     * @param amount Amount of tokens to mint
     * @param recipient Address to receive the tokens
     */
    function mintTokens(uint256 tokenId, uint256 amount, address recipient) 
        external 
        onlyOwner 
        tokenExists(tokenId) 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient address");
        require(cropTokens[tokenId].isActive, "Token is not active");
        
        CropData storage cropData = cropTokens[tokenId];
        
        cropData.totalSupply += amount;
        farmerTokenBalances[tokenId][recipient] += amount; // ✅ Balance par token
        totalBalances[recipient] += amount; // ✅ Balance totale
        
        emit TokensMinted(recipient, amount, tokenId);
    }

    /**
     * @dev Burn tokens for a specific crop token (CORRECTED)
     * @param tokenId The ID of the crop token
     * @param amount Amount of tokens to burn
     * @param from Address to burn tokens from
     */
    function burnTokens(uint256 tokenId, uint256 amount, address from) 
        external 
        tokenExists(tokenId) 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(from != address(0), "Invalid from address");
        
        CropData storage cropData = cropTokens[tokenId];
        
        require(
            msg.sender == owner || msg.sender == loanManager || msg.sender == from,
            "Unauthorized to burn tokens"
        );
        require(cropData.totalSupply >= amount, "Insufficient token supply");
        require(farmerTokenBalances[tokenId][from] >= amount, "Insufficient balance for this token");
        
        cropData.totalSupply -= amount;
        farmerTokenBalances[tokenId][from] -= amount; // ✅ Balance par token
        totalBalances[from] -= amount; // ✅ Balance totale
        
        emit TokensBurned(from, amount, tokenId);
    }

    /**
     * @dev Deactivate a crop token
     * @param tokenId The ID of the crop token to deactivate
     */
    function deactivateToken(uint256 tokenId) 
        external 
        onlyOwner 
        tokenExists(tokenId) 
    {
        cropTokens[tokenId].isActive = false;
        emit TokenStatusUpdated(tokenId, false);
    }

    /**
     * @dev Reactivate a crop token
     * @param tokenId The ID of the crop token to reactivate
     */
    function reactivateToken(uint256 tokenId) 
        external 
        onlyOwner 
        tokenExists(tokenId) 
    {
        cropTokens[tokenId].isActive = true;
        emit TokenStatusUpdated(tokenId, true);
    }

    /**
     * @dev Get farmer's token IDs
     * @param farmer Address of the farmer
     * @return Array of token IDs owned by the farmer
     */
    function getFarmerTokenIds(address farmer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return farmerTokenIds[farmer];
    }

    /**
     * @dev Get crop token details
     * @param tokenId The ID of the crop token
     * @return CropData struct containing token details
     */
    function getCropToken(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (CropData memory) 
    {
        return cropTokens[tokenId];
    }

    /**
     * @dev Get farmer's total token balance (CORRECTED)
     * @param farmer Address of the farmer
     * @return Total token balance across all tokens
     */
    function getFarmerBalance(address farmer) 
        external 
        view 
        returns (uint256) 
    {
        return totalBalances[farmer];
    }

    /**
     * @dev Get farmer's balance for a specific token (NEW FUNCTION)
     * @param farmer Address of the farmer
     * @param tokenId ID of the specific token
     * @return Balance for the specific token
     */
    function getFarmerBalanceForToken(address farmer, uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (uint256) 
    {
        return farmerTokenBalances[tokenId][farmer];
    }

    /**
     * @dev Get total number of tokens created
     * @return Current token counter
     */
    function getTotalTokensCreated() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    // ✅ NEW FUNCTIONS FOR LOAN MANAGER INTEGRATION

    /**
     * @dev Transfer tokens between addresses for a specific token (for LoanManager)
     * @param tokenId ID of the token to transfer
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     */
    function transferToken(uint256 tokenId, address from, address to, uint256 amount) 
        external 
        onlyLoanManager 
        tokenExists(tokenId) 
        returns (bool) 
    {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(amount > 0, "Amount must be greater than 0");
        require(farmerTokenBalances[tokenId][from] >= amount, "Insufficient balance");

        farmerTokenBalances[tokenId][from] -= amount;
        farmerTokenBalances[tokenId][to] += amount;
        
        // Update total balances
        totalBalances[from] -= amount;
        totalBalances[to] += amount;

        return true;
    }

    /**
     * @dev Lock tokens for collateral (placeholder for future implementation)
     * @param tokenId ID of the token to lock
     * @param farmer Address of the farmer
     * @param amount Amount to lock
     */
    function lockTokens(uint256 tokenId, address farmer, uint256 amount) 
        external 
        onlyLoanManager 
        tokenExists(tokenId) 
    {
        require(farmerTokenBalances[tokenId][farmer] >= amount, "Insufficient balance");
        // Implementation for locking logic would go here
        // For now, this is a placeholder
    }

    /**
     * @dev Unlock tokens from collateral (placeholder for future implementation)
     * @param tokenId ID of the token to unlock
     * @param farmer Address of the farmer
     * @param amount Amount to unlock
     */
    function unlockTokens(uint256 tokenId, address farmer, uint256 amount) 
        external 
        onlyLoanManager 
        tokenExists(tokenId) 
    {
        // Implementation for unlocking logic would go here
        // For now, this is a placeholder
    }

    /**
     * @dev Get token symbol for a specific token ID
     * @param tokenId ID of the token
     * @return Token symbol
     */
    function getTokenSymbol(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (string memory) 
    {
        return tokenSymbols[tokenId];
    }

    /**
     * @dev Get all token balances for a farmer
     * @param farmer Address of the farmer
     * @return tokenIds Array of token IDs
     * @return balances Array of corresponding balances
     */
    function getFarmerTokenBalances(address farmer) 
        external 
        view 
        returns (uint256[] memory tokenIds, uint256[] memory balances) 
    {
        uint256[] memory farmerTokens = farmerTokenIds[farmer];
        balances = new uint256[](farmerTokens.length);
        
        for (uint256 i = 0; i < farmerTokens.length; i++) {
            balances[i] = farmerTokenBalances[farmerTokens[i]][farmer];
        }
        
        return (farmerTokens, balances);
    }

    /**
     * @dev Update farmer balance (called by LoanManager for balance tracking)
     * @param farmer Address of the farmer
     * @param tokenId ID of the token
     * @param newBalance New balance amount
     */
    function updateFarmerBalance(address farmer, uint256 tokenId, uint256 newBalance) 
        external 
        onlyLoanManager 
        tokenExists(tokenId) 
    {
        uint256 oldBalance = farmerTokenBalances[tokenId][farmer];
        farmerTokenBalances[tokenId][farmer] = newBalance;
        
        // Update total balance
        totalBalances[farmer] = totalBalances[farmer] - oldBalance + newBalance;
    }

    /**
     * @dev Check if a farmer has sufficient balance for a specific token
     * @param farmer Address of the farmer
     * @param tokenId ID of the token
     * @param amount Amount to check
     * @return True if farmer has sufficient balance
     */
    function hasSufficientBalance(address farmer, uint256 tokenId, uint256 amount) 
        external 
        view 
        tokenExists(tokenId) 
        returns (bool) 
    {
        return farmerTokenBalances[tokenId][farmer] >= amount;
    }

    /**
     * @dev Get detailed token information including balances
     * @param tokenId ID of the token
     * @return cropData Token data
     * @return symbol Token symbol
     * @return farmerBalance Farmer's balance for this token
     */
    function getTokenDetails(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (CropData memory cropData, string memory symbol, uint256 farmerBalance) 
    {
        cropData = cropTokens[tokenId];
        symbol = tokenSymbols[tokenId];
        farmerBalance = farmerTokenBalances[tokenId][cropData.farmer];
        
        return (cropData, symbol, farmerBalance);
    }
}