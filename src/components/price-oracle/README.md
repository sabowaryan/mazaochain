# Price Oracle System

The Price Oracle system provides manual price management and tracking for crop market prices in the MazaoChain platform. This system will eventually be enhanced with Chainlink oracle integration for automated price feeds.

## Features

### 1. Manual Price Management
- **Price Updates**: Admin and cooperative users can manually update crop prices
- **Price Validation**: Business rules prevent extreme price changes
- **Source Tracking**: Track the source of price updates (manual, external API, future Chainlink)

### 2. Price History & Trends
- **Historical Tracking**: Automatic archiving of price changes
- **Trend Analysis**: Calculate price trends and percentage changes
- **Visual Indicators**: Display trend direction (up/down/stable) with percentage changes

### 3. Notifications
- **Stakeholder Alerts**: Notify farmers, cooperatives, and lenders of price changes
- **Change Tracking**: Track significant price movements and alert users

### 4. Integration with Crop Evaluation
- **Automatic Price Fetching**: Crop evaluations can use current market prices
- **Fallback Mechanism**: Default prices when oracle prices are unavailable

## Components

### PriceManagement
Main component for updating crop prices. Features:
- Current price display for all crop types
- Price update form with validation
- Market price reference display
- Future Chainlink integration notice

### PriceTrends
Component for displaying price trends and history. Features:
- Trend overview with visual indicators
- Expandable price history charts
- Market insights summary

### PriceDisplay
Reusable component for showing current prices. Features:
- Current price display
- Optional trend indicators
- Last update timestamp
- Loading states

## Services

### PriceOracleService
Core service handling all price operations:

```typescript
// Get current prices
const prices = await priceOracleService.getCurrentPrices()

// Update a price
await priceOracleService.updatePrice('manioc', 0.6, userId, 'Market report')

// Get price trends
const trend = await priceOracleService.getPriceTrend('manioc')

// Validate price updates
const validation = priceOracleService.validatePriceUpdate('manioc', 0.5, 0.6)
```

## Database Schema

### crop_prices
- Current active prices for each crop type
- Source tracking (manual, chainlink, external_api)
- Update history with user attribution

### price_history
- Historical price data for trend analysis
- Automatic archiving on price updates
- Source and timestamp tracking

### price_notifications
- Price change notifications
- Percentage change calculations
- Notification delivery tracking

## Hooks

### usePriceOracle
React hook providing price oracle functionality:

```typescript
const {
  prices,           // Current prices array
  trends,           // Price trends array
  loading,          // Loading state
  error,            // Error state
  updatePrice,      // Update price function
  getCurrentPrice,  // Get price for specific crop
  getTrend,         // Get trend for specific crop
  canUpdatePrices   // Permission check
} = usePriceOracle()
```

## Usage Examples

### Display Current Price
```tsx
<PriceDisplay 
  cropType="manioc" 
  showTrend={true} 
  showLastUpdate={true} 
/>
```

### Price Management (Admin/Cooperative)
```tsx
<PriceManagement />
```

### Price Trends Dashboard
```tsx
<PriceTrends />
```

### Integration with Crop Evaluation
```tsx
// In crop evaluation form
const { getCurrentPrice } = usePriceOracle()
const currentPrice = getCurrentPrice('manioc')

// Use current market price as default
const defaultPrice = currentPrice?.price || DEFAULT_PRICES.manioc
```

## Future Enhancements

### Chainlink Oracle Integration
The system is designed to support future Chainlink oracle integration:

1. **Automated Price Feeds**: Replace manual updates with automated oracle data
2. **Price Deviation Alerts**: Alert when manual prices deviate significantly from oracle prices
3. **Multi-Source Validation**: Compare prices from multiple sources
4. **Decentralized Price Discovery**: Reduce reliance on manual price updates

### Enhanced Analytics
- Price volatility calculations
- Market trend predictions
- Seasonal price pattern analysis
- Regional price variations

## Security Considerations

1. **Access Control**: Only admin and cooperative users can update prices
2. **Price Validation**: Business rules prevent extreme price changes
3. **Audit Trail**: Complete history of price updates with user attribution
4. **Notification System**: Stakeholders are notified of significant price changes

## Testing

The price oracle system includes comprehensive tests:
- Unit tests for service methods
- Integration tests for database operations
- Component tests for UI interactions
- End-to-end tests for complete workflows

Run tests with:
```bash
npm run test src/lib/services/__tests__/price-oracle.test.ts
```