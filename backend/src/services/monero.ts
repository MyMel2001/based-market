import { MoneroWalletRpc, MoneroNetworkType } from 'monero-ts';
import { env } from '@/config/env';

class MoneroService {
  private wallet: MoneroWalletRpc | null = null;

  async initialize() {
    try {
      this.wallet = await MoneroWalletRpc.connectToWalletRpc({
        uri: env.MONERO_WALLET_RPC_URL,
        username: 'rpc',
        password: env.MONERO_WALLET_PASSWORD,
      });
      
      console.log('✅ Monero wallet connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Monero wallet:', error);
      throw new Error('Monero wallet connection failed');
    }
  }

  async createSubaddress(accountIndex: number = 0, label?: string) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const subaddress = await this.wallet.createSubaddress(accountIndex, label);
      return {
        address: subaddress.getAddress(),
        addressIndex: subaddress.getIndex(),
      };
    } catch (error) {
      console.error('Error creating subaddress:', error);
      throw new Error('Failed to create payment address');
    }
  }

  async getBalance(accountIndex: number = 0) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.wallet.getBalance(accountIndex);
      return {
        balance: balance.toString(),
        unlockedBalance: (await this.wallet.getUnlockedBalance(accountIndex)).toString(),
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  async getIncomingTransfers(accountIndex: number = 0) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const transfers = await this.wallet.getIncomingTransfers({
        accountIndex,
      });
      
      return transfers.map(transfer => ({
        txHash: transfer.getTx()?.getHash(),
        amount: transfer.getAmount().toString(),
        address: transfer.getAddress(),
        confirmations: transfer.getTx()?.getNumConfirmations() || 0,
        timestamp: transfer.getTx()?.getBlock()?.getTimestamp(),
      }));
    } catch (error) {
      console.error('Error getting incoming transfers:', error);
      throw new Error('Failed to get incoming transfers');
    }
  }

  async verifyPayment(txHash: string, expectedAmount: string, address: string) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const transfers = await this.getIncomingTransfers();
      const payment = transfers.find(transfer => 
        transfer.txHash === txHash &&
        transfer.address === address &&
        parseFloat(transfer.amount) >= parseFloat(expectedAmount) &&
        transfer.confirmations >= 3 // Require 3 confirmations
      );

      return !!payment;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async sendPayment(address: string, amount: string, accountIndex: number = 0) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const tx = await this.wallet.createTx({
        accountIndex,
        destinations: [{
          address,
          amount: BigInt(parseFloat(amount) * 1e12), // Convert XMR to atomic units
        }],
        relay: true,
      });

      return {
        txHash: tx.getHash(),
        fee: tx.getFee().toString(),
      };
    } catch (error) {
      console.error('Error sending payment:', error);
      throw new Error('Failed to send payment');
    }
  }

  async sendSplitPayment(
    destinations: Array<{ address: string; amount: string }>, 
    accountIndex: number = 0
  ) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const tx = await this.wallet.createTx({
        accountIndex,
        destinations: destinations.map(dest => ({
          address: dest.address,
          amount: BigInt(parseFloat(dest.amount) * 1e12), // Convert XMR to atomic units
        })),
        relay: true,
      });

      return {
        txHash: tx.getHash(),
        fee: tx.getFee().toString(),
        destinations: destinations.map(dest => ({
          address: dest.address,
          amount: dest.amount
        })),
      };
    } catch (error) {
      console.error('Error sending split payment:', error);
      throw new Error('Failed to send split payment');
    }
  }

  calculateFees(totalAmount: string, feeRate: number) {
    const total = parseFloat(totalAmount);
    const marketplaceFee = total * feeRate;
    const sellerAmount = total - marketplaceFee;
    
    return {
      totalAmount: total,
      marketplaceFee,
      sellerAmount,
      feeRate
    };
  }
}

export const moneroService = new MoneroService(); 