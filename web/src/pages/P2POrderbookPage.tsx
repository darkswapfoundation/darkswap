import React from 'react';
import P2POrderbook from '../components/P2POrderbook';
import { OrderbookProvider } from '../contexts/OrderbookContext';

/**
 * P2P Orderbook page
 * Displays the decentralized orderbook
 */
const P2POrderbookPage: React.FC = () => {
  return (
    <OrderbookProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Decentralized Orderbook</h1>
        <p className="mb-6">
          The decentralized orderbook allows you to create and view orders for trading Bitcoin, Runes, and Alkanes.
          Orders are synchronized between peers using WebRTC, ensuring a truly decentralized trading experience.
        </p>
        
        <P2POrderbook />
        
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">How the Decentralized Orderbook Works</h2>
          <p className="mb-4">
            The decentralized orderbook is a peer-to-peer system that allows users to create and view orders without
            relying on a central server. Orders are synchronized between peers using WebRTC, ensuring that all users
            have access to the same orderbook.
          </p>
          
          <h3 className="text-lg font-bold mt-6 mb-2">Creating Orders</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Click the "Create Order" button</li>
            <li>Select whether you want to buy or sell</li>
            <li>Choose the base asset (what you're trading)</li>
            <li>Choose the quote asset (what you're trading for)</li>
            <li>Enter the amounts for both assets</li>
            <li>Set an expiry time if desired</li>
            <li>Click "Create Order" to submit your order</li>
          </ol>
          
          <h3 className="text-lg font-bold mt-6 mb-2">Trading</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Browse the open orders in the orderbook</li>
            <li>Click on an order to view its details</li>
            <li>Click the "Trade" button to execute a trade</li>
            <li>Confirm the trade details</li>
            <li>The trade will be executed using the WebRTC P2P trading functionality</li>
          </ol>
          
          <h3 className="text-lg font-bold mt-6 mb-2">Managing Your Orders</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Click the "My Orders" tab to view your orders</li>
            <li>Click on an order to view its details</li>
            <li>Click the "Cancel" button to cancel an open order</li>
            <li>View the status and fills for your orders</li>
          </ol>
          
          <div className="mt-6 p-4 bg-yellow-900 bg-opacity-30 rounded-lg">
            <h4 className="text-yellow-500 font-bold mb-2">Note</h4>
            <p>
              The decentralized orderbook is synchronized between peers using WebRTC. For best results, ensure that
              you have a stable internet connection and that your browser supports WebRTC. Orders are stored locally
              and synchronized with peers when they connect.
            </p>
          </div>
        </div>
      </div>
    </OrderbookProvider>
  );
};

export default P2POrderbookPage;