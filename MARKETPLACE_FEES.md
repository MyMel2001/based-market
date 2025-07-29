# 💰 Marketplace Fee System: 30% Standard Cut

## 🌟 Overview

The Based Marketplace implements a **30% marketplace fee** system where instance owners automatically receive a cut from every transaction. This standard industry rate supports infrastructure, development, and sustainability of the decentralized marketplace.

## 💸 How It Works

### Automatic Fee Splitting
Every transaction is automatically split:
- **70%** goes to the seller/developer
- **30%** goes to the instance owner
- **Transparent** fee breakdown shown to buyers

### Example Transaction
```
Product Price: 1.00 XMR
├── Developer receives: 0.70 XMR (70%)
├── Instance owner receives: 0.30 XMR (30%)
└── Total paid by buyer: 1.00 XMR
```

## 🔧 Technical Implementation

### Database Schema
```sql
-- Enhanced Transaction model with fee tracking
model Transaction {
  id                String    @id @default(cuid())
  buyerId           String
  productId         String
  amount            Decimal   @db.Decimal(10, 8) // Total amount
  
  -- Fee breakdown
  marketplaceFeeRate Decimal  @db.Decimal(5, 4) @default(0.3000) // 30.00%
  marketplaceFee    Decimal   @db.Decimal(10, 8) // Fee amount
  sellerAmount      Decimal   @db.Decimal(10, 8) // Amount after fees
  
  -- Payment addresses
  instanceOwnerAddress String? // Instance owner's Monero address
  sellerAddress     String?   // Seller's Monero address
  
  -- Monero details
  moneroTxHash      String?   // Transaction hash
  status            TransactionStatus @default(PENDING)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### Fee Calculation Service
```typescript
// Automatic fee calculation
const feeCalculation = feesService.calculateFees(totalAmount);
// Returns:
// {
//   totalAmount: 1.00,
//   marketplaceFee: 0.30,
//   sellerAmount: 0.70,
//   feeRate: 0.30
// }
```

### Split Payment Processing
```typescript
// Monero split payment
const destinations = [
  { address: sellerAddress, amount: "0.70" },
  { address: instanceOwnerAddress, amount: "0.30" }
];

await moneroService.sendSplitPayment(destinations);
```

## 🌐 ActivityPub Federation

Fee information is included in federated transactions:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "basedmarket": "https://basedmarket.org/ns#",
      "marketplaceFee": "basedmarket:marketplaceFee",
      "sellerAmount": "basedmarket:sellerAmount",
      "feeRate": "basedmarket:feeRate"
    }
  ],
  "type": "Purchase",
  "actor": "https://marketplace.com/ap/u/buyer123",
  "object": "https://marketplace.com/ap/o/product-456",
  "basedmarket:amount": 1.00,
  "basedmarket:marketplaceFee": 0.30,
  "basedmarket:sellerAmount": 0.70,
  "basedmarket:feeRate": 0.30,
  "basedmarket:instanceOwner": "4BxSHvcgTwu25WooY4BVmgdcKwZbdP..."
}
```

## ⚙️ Configuration

### Environment Variables
```env
# Fee configuration
MARKETPLACE_FEE_RATE=0.30  # 30% (0.00-1.00)
INSTANCE_OWNER_MONERO_ADDRESS=4BxSHvcgTwu25WooY4BVmgdcKwZbdP...

# Required for fee collection
MONERO_WALLET_RPC_URL=http://localhost:18083
MONERO_WALLET_PASSWORD=your-wallet-password
```

### Fee Rate Options
- `0.30` = 30% (recommended standard)
- `0.25` = 25% (competitive rate)
- `0.35` = 35% (premium service)
- `0.00` = 0% (free instance, no fees)

## 🖼️ Frontend Display

### Fee Breakdown Component
Buyers see transparent fee breakdown:

```tsx
<FeeBreakdown
  totalAmount={1.00}
  marketplaceFee={0.30}
  sellerAmount={0.70}
  feePercentage="30.0%"
/>
```

**Displays:**
```
💰 Payment Breakdown
You pay: 1.00000000 XMR
Developer receives: 0.70000000 XMR
Marketplace fee (30.0%): 0.30000000 XMR

ℹ️ Why do we charge a 30.0% fee?
This fee supports instance hosting, development, and 
maintenance of the decentralized marketplace infrastructure.
```

### Fee Information Banner
Homepage displays marketplace fee policy:

```
🏪 Marketplace Fee Information
Marketplace fee: 30.0% goes to instance owner for hosting and maintenance

Fee Rate: 30.0%    Purpose: Instance hosting & development
```

## 📊 API Endpoints

### Get Fee Information
```bash
GET /api/fees/info
```
```json
{
  "success": true,
  "data": {
    "feeRate": 0.30,
    "feePercentage": "30.0%",
    "description": "Marketplace fee: 30.0% goes to instance owner for hosting and maintenance",
    "isConfigured": true
  }
}
```

### Calculate Fees
```bash
POST /api/fees/calculate
Content-Type: application/json
{
  "amount": 1.50
}
```
```json
{
  "success": true,
  "data": {
    "totalAmount": 1.50,
    "marketplaceFee": 0.45,
    "sellerAmount": 1.05,
    "feeRate": 0.30,
    "breakdown": {
      "youPay": 1.50,
      "sellerReceives": 1.05,
      "marketplaceFee": 0.45,
      "feeDescription": "30.0% marketplace fee supports instance hosting and development"
    }
  }
}
```

## 🔄 Transaction Flow

### 1. Product Purchase
```
Buyer initiates purchase of 1.00 XMR product
↓
System calculates: 0.70 XMR to seller, 0.30 XMR to instance
↓
Transaction record created with fee breakdown
↓
Payment address generated for buyer
```

### 2. Payment Processing
```
Buyer sends 1.00 XMR to payment address
↓
System verifies payment received
↓
Automatic split payment initiated:
├── 0.70 XMR → Seller's address
└── 0.30 XMR → Instance owner's address
```

### 3. Federation Broadcast
```
Purchase activity broadcasted to fediverse
↓
Other instances see transparent fee structure
↓
Cross-platform transaction visibility
```

## 💡 Benefits for Instance Owners

### Revenue Stream
- **Passive income** from every transaction
- **Scalable** with marketplace growth
- **Transparent** fee collection

### Infrastructure Support
- Covers hosting costs
- Enables continuous development
- Supports community features

### Competitive Advantage
- **Standard 30% rate** aligns with industry
- **Transparent fee structure** builds trust
- **Automated collection** reduces overhead

## 🛠️ Setup Instructions

### 1. Configure Fee Rate
```env
# Set desired fee percentage (30% recommended)
MARKETPLACE_FEE_RATE=0.30
```

### 2. Set Instance Owner Address
```env
# Your Monero address for fee collection
INSTANCE_OWNER_MONERO_ADDRESS=4BxSHvcgTwu25WooY4BVmgdcKwZbdP...
```

### 3. Deploy & Earn
```bash
# Start marketplace with fee system
docker-compose up -d

# Initialize database with fee schema
docker-compose exec backend npx prisma migrate dev

# Start earning from transactions!
```

## 📈 Monitoring & Analytics

### Fee Collection Tracking
```sql
-- Total fees collected
SELECT SUM(marketplaceFee) as total_fees_collected
FROM transactions 
WHERE status = 'COMPLETED';

-- Monthly fee revenue
SELECT 
  strftime('%Y-%m', createdAt) as month,
  SUM(marketplaceFee) as monthly_fees,
  COUNT(*) as transaction_count
FROM transactions 
WHERE status = 'COMPLETED'
GROUP BY month
ORDER BY month DESC;

-- Top revenue products
SELECT 
  p.title,
  SUM(t.marketplaceFee) as fees_generated,
  COUNT(t.id) as sale_count
FROM transactions t
JOIN products p ON t.productId = p.id
WHERE t.status = 'COMPLETED'
GROUP BY p.id
ORDER BY fees_generated DESC;
```

### QuickDB Metrics
```typescript
// Track fee collection metrics
await quickDBService.increment('metrics:fees:total_collected', feeAmount);
await quickDBService.increment('metrics:fees:transaction_count');
await quickDBService.set('metrics:fees:last_collection', Date.now());
```

## 🔐 Security Considerations

### Fee Validation
- **Rate limits** prevent fee manipulation
- **Database constraints** ensure valid fee rates
- **Monero address validation** prevents payment errors

### Transaction Integrity
- **Atomic operations** ensure consistent fee splits
- **Hash verification** confirms payment completion
- **Audit trails** track all fee transactions

### Configuration Security
- **Environment variables** protect sensitive data
- **Address validation** prevents typos
- **Rate bounds** prevent excessive fees

## 🚀 Advanced Features

### Dynamic Fee Rates
```typescript
// Future enhancement: Adjust fees based on volume
const feeRate = calculateDynamicFeeRate(monthlyVolume);
```

### Fee Sharing
```typescript
// Share fees with developers/contributors
const destinations = [
  { address: sellerAddress, amount: "0.70" },
  { address: instanceOwnerAddress, amount: "0.25" },
  { address: developerFundAddress, amount: "0.05" }
];
```

### Promotional Rates
```typescript
// Temporary fee reductions for promotions
const promotionalRate = isPromotionalPeriod() ? 0.20 : 0.30;
```

## 📋 Best Practices

### Instance Owners
1. **Set competitive rates** (25-35% standard)
2. **Communicate fee structure** clearly
3. **Reinvest in infrastructure** and features
4. **Monitor fee collection** regularly

### Developers
1. **Factor fees into pricing** strategy  
2. **Understand net revenue** calculations
3. **Consider multiple instances** for reach
4. **Optimize for value** over volume

### Buyers
1. **Understand fee breakdown** before purchase
2. **Support quality instances** you value
3. **Compare total costs** across instances

## 🔮 Future Enhancements

### Multi-tier Fee Structure
- **Volume discounts** for high-selling developers
- **Loyalty rewards** for repeat buyers
- **Premium features** for higher fees

### Fee Token System
- **Marketplace tokens** for fee payments
- **Staking rewards** for token holders
- **Governance voting** on fee rates

### Cross-Instance Fee Sharing
- **Federation fees** for cross-instance sales
- **Revenue sharing** between cooperating instances
- **Standardized fee protocols**

---

**The 30% marketplace fee creates sustainable economics for decentralized commerce while maintaining transparency and fair compensation for all participants!** 💰

*Standard rate ensures competitive positioning while supporting robust infrastructure and continued development.* 